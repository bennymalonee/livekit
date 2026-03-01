import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Internal: upsert a node (no auth). Used by Coolify sync cron and by public sync after auth.
 */
export const upsertNodeInternal = internalMutation({
  args: {
    name: v.string(),
    region: v.string(),
    status: v.string(),
    cpuLoad: v.number(),
    memoryLoad: v.number(),
    activeRooms: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nodes")
      .withIndex("by_region", (q) => q.eq("region", args.region))
      .filter((q) => q.eq(q.field("name"), args.name))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        cpuLoad: args.cpuLoad,
        memoryLoad: args.memoryLoad,
        activeRooms: args.activeRooms,
        lastHeartbeatAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("nodes", {
      name: args.name,
      region: args.region,
      status: args.status,
      cpuLoad: args.cpuLoad,
      memoryLoad: args.memoryLoad,
      activeRooms: args.activeRooms,
      lastHeartbeatAt: now,
      createdAt: now,
    });
  },
});
