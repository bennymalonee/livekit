import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";
import { getUserIdFromIdentity, requireRole } from "./rbac";

const DEPLOY_KEY = "deploy";

export type DeploySettings = {
  webhookUrl?: string;
  livekitUrl?: string;
};

export const getDeploySettings = query({
  args: {},
  handler: async (ctx): Promise<DeploySettings> => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", DEPLOY_KEY))
      .unique();
    if (!row) return {};
    try {
      return JSON.parse(row.value) as DeploySettings;
    } catch {
      return {};
    }
  },
});

export const setDeploySettings = mutation({
  args: {
    webhookUrl: v.optional(v.string()),
    livekitUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", DEPLOY_KEY))
      .unique();
    const next: DeploySettings = existing
      ? { ...(JSON.parse(existing.value) as DeploySettings) }
      : {};
    if (args.webhookUrl !== undefined) {
      next.webhookUrl = args.webhookUrl === "" ? undefined : args.webhookUrl;
    }
    if (args.livekitUrl !== undefined) {
      next.livekitUrl = args.livekitUrl === "" ? undefined : args.livekitUrl;
    }
    const value = JSON.stringify(next);
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity ? getUserIdFromIdentity(identity) : null;
    if (existing) {
      await ctx.db.patch(existing._id, { value });
    } else {
      await ctx.db.insert("settings", { key: DEPLOY_KEY, value });
    }
    if (userId) {
      await ctx.scheduler.runAfter(0, internal.auditLog.record, {
        userId,
        action: "settings.setDeploySettings",
        resourceType: "settings",
        resourceId: DEPLOY_KEY,
      });
    }
  },
});

export const triggerDeploy = action({
  args: {},
  handler: async (ctx) => {
    const role = await ctx.runQuery(api.rbac.getMyRole);
    if (!role || role !== "admin") throw new Error("Forbidden");
    const identity = await ctx.auth.getUserIdentity();
    const settings = await ctx.runQuery(api.settings.getDeploySettings, {});
    const webhookUrl = settings?.webhookUrl;
    if (!webhookUrl) {
      throw new Error("Coolify webhook not configured. Set it in Deploy settings.");
    }
    const res = await fetch(webhookUrl, { method: "POST" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Webhook failed: ${res.status} ${text}`);
    }
    if (identity) {
      const { getUserIdFromIdentity } = await import("./rbac");
      await ctx.runMutation(internal.auditLog.record, {
        userId: getUserIdFromIdentity(identity),
        action: "deploy.trigger",
        resourceType: "settings",
        resourceId: DEPLOY_KEY,
      });
    }
    await ctx.runMutation(internal.diagnostics_internal.recordEventInternal, {
      level: "info",
      code: "deploy.trigger",
      message: "Deploy triggered via Coolify webhook",
    });
    return { ok: true };
  },
});
