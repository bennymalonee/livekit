import { v } from "convex/values";
import { api } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";

const DEPLOY_KEY = "deploy";

export type DeploySettings = {
  webhookUrl?: string;
  livekitUrl?: string;
};

export const getDeploySettings = query({
  args: {},
  handler: async (ctx): Promise<DeploySettings> => {
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
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
    if (existing) {
      await ctx.db.patch(existing._id, { value });
    } else {
      await ctx.db.insert("settings", { key: DEPLOY_KEY, value });
    }
  },
});

export const triggerDeploy = action({
  args: {},
  handler: async (ctx) => {
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
    return { ok: true };
  },
});
