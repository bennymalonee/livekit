import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_TOKEN_GENERATIONS_PER_HOUR = 30;

/**
 * Internal: check and increment token generation rate limit for a user.
 * Called from livekit.generateToken action. Throws if over limit.
 */
export const checkAndIncrementTokenGen = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;

    const existing = await ctx.db
      .query("tokenRateLimit")
      .withIndex("by_user_window", (q) =>
        q.eq("userId", args.userId).eq("windowStart", windowStart)
      )
      .unique();

    if (existing) {
      if (existing.count >= MAX_TOKEN_GENERATIONS_PER_HOUR) {
        throw new Error(
          "Too many token generations. Please try again later."
        );
      }
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
      return;
    }

    await ctx.db.insert("tokenRateLimit", {
      userId: args.userId,
      windowStart,
      count: 1,
    });
  },
});

/**
 * Internal: delete rate limit rows older than 24 hours. Called by cron.
 */
export const pruneTokenRateLimit = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const old = await ctx.db
      .query("tokenRateLimit")
      .filter((q) => q.lt(q.field("windowStart"), cutoff))
      .collect();
    for (const row of old) {
      await ctx.db.delete(row._id);
    }
  },
});
