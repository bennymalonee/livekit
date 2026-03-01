import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

const WINDOW_MS = 60_000; // 60 seconds
const MAX_PER_WINDOW = 5;

/**
 * Check and increment deploy rate limit for a client (e.g. IP).
 * Returns { allowed: true } if under limit, { allowed: false } if over limit.
 * Caller should run this first; if allowed, proceed with deploy.
 */
export const checkAndIncrement = internalMutation({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;

    const existing = await ctx.db
      .query("deployRateLimit")
      .withIndex("by_client_window", (q) =>
        q.eq("clientId", args.clientId).eq("windowStart", windowStart)
      )
      .unique();

    if (existing) {
      if (existing.count >= MAX_PER_WINDOW) {
        return { allowed: false };
      }
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
      return { allowed: true };
    }

    await ctx.db.insert("deployRateLimit", {
      clientId: args.clientId,
      windowStart,
      count: 1,
    });
    return { allowed: true };
  },
});

/**
 * Prune deploy rate limit rows older than 2 minutes. Called by cron.
 */
export const prune = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 2 * WINDOW_MS;
    const old = await ctx.db
      .query("deployRateLimit")
      .filter((q) => q.lt(q.field("windowStart"), cutoff))
      .collect();
    for (const row of old) {
      await ctx.db.delete(row._id);
    }
  },
});
