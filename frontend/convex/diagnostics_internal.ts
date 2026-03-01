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
