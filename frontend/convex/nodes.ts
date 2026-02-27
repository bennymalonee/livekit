import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listNodes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return ctx.db
      .query("nodes")
      .withIndex("by_region", (q) => q)
      .order("desc")
      .take(100);
  },
});

export const upsertNode = mutation({
  args: {
    name: v.string(),
    region: v.string(),
    status: v.string(),
    cpuLoad: v.number(),
    memoryLoad: v.number(),
    activeRooms: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

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
      createdAt: now,
      lastHeartbeatAt: now,
    });
  },
});

