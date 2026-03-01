import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Inserts a diagnostics event without requiring auth.
 * Used by cron/sync flows (e.g. node sync from Coolify).
 */
export const recordEventInternal = internalMutation({
  args: {
    nodeId: v.optional(v.id("nodes")),
    level: v.string(),
    code: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("diagnosticsEvents", {
      nodeId: args.nodeId,
      level: args.level,
      code: args.code,
      message: args.message,
      createdAt: Date.now(),
    });
  },
});

/**
 * Record node health summary for Diagnostics timeline. Called by cron.
 * If any nodes exist and some are offline, logs a warning; otherwise info.
 */
export const recordNodeHealthInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const nodes = await ctx.db.query("nodes").take(100);
    const online = nodes.filter((n) => n.status === "online").length;
    const offline = nodes.length - online;
    const level = offline > 0 && nodes.length > 0 ? "warning" : "info";
    const code = offline > 0 ? "node_offline" : "node_health";
    const message =
      nodes.length === 0
        ? "No nodes synced. Sync from Coolify on Nodes or Deploy."
        : `${online} of ${nodes.length} nodes online${offline > 0 ? ` (${offline} offline)` : ""}.`;
    await ctx.db.insert("diagnosticsEvents", {
      level,
      code,
      message,
      createdAt: Date.now(),
    });
  },
});
