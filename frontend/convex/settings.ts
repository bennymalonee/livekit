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
  handler: async (
    ctx
  ): Promise<{
    ok: boolean;
    error?: string;
  }> => {
    const role = await ctx.runQuery(api.rbac.getMyRole);
    if (!role || role !== "admin") {
      return {
        ok: false,
        error:
          "You must be an admin to trigger a deploy. Ask an administrator to update your role.",
      };
    }

    const identity = await ctx.auth.getUserIdentity();
    const settings = await ctx.runQuery(api.settings.getDeploySettings, {});
    const webhookUrl = settings?.webhookUrl?.trim();

    // Guard against a very common configuration mix-up:
    // the "Coolify deploy webhook" field must not contain the LiveKit
    // event endpoint (`/livekit-webhook`).
    const looksLikeLivekitWebhook =
      typeof webhookUrl === "string" &&
      /\/livekit-webhook(?:\/|$|\?)/i.test(webhookUrl);
    if (looksLikeLivekitWebhook) {
      return {
        ok: false,
        error:
          "Invalid deploy webhook URL: the provided webhookUrl looks like the LiveKit event endpoint (/livekit-webhook). Paste the Coolify *Deploy/Webhook* URL for your `livekit_main` app instead.",
      };
    }

    if (!webhookUrl) {
      return {
        ok: false,
        error:
          "Coolify webhook not configured. Set it in Deploy settings, or rely on the /api/deploy fallback route.",
      };
    }

    const isCoolifyApiDeployUrl = /\/api\/v1\/deploy(?:\/|$|\?)/i.test(webhookUrl);
    const method = isCoolifyApiDeployUrl ? "GET" : "POST";
    const headers: Record<string, string> = {};
    if (isCoolifyApiDeployUrl) {
      const token = process.env.COOLIFY_API_TOKEN?.trim();
      if (!token) {
        return {
          ok: false,
          error:
            "This looks like a Coolify API deploy URL and requires COOLIFY_API_TOKEN in Convex environment variables.",
        };
      }
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const res = await fetch(webhookUrl, { method, headers });
      if (!res.ok) {
        const text = await res.text();
        return {
          ok: false,
          error: `Coolify deploy trigger failed: ${res.status} ${text}`,
        };
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error triggering deploy";
      return {
        ok: false,
        error: `Failed to trigger deploy: ${message}`,
      };
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
      message: isCoolifyApiDeployUrl
        ? "Deploy triggered via Coolify API URL"
        : "Deploy triggered via Coolify webhook",
    });
    return { ok: true };
  },
});
