import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const limit = args.limit ?? 50;

    return ctx.db
      .query("diagnosticsEvents")
      .withIndex("by_createdAt", (q) => q)
      .order("desc")
      .take(limit);
  },
});

export const recordEvent = mutation({
  args: {
    nodeId: v.optional(v.id("nodes")),
    level: v.string(),
    code: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const createdAt = Date.now();
    await ctx.db.insert("diagnosticsEvents", {
      nodeId: args.nodeId,
      level: args.level,
      code: args.code,
      message: args.message,
      createdAt,
    });
  },
});

