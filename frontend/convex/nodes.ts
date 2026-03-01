import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentOrganizationIdForContext } from "./organizations";
import { requireRole } from "./rbac";

export const listNodes = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    const orgId = await getCurrentOrganizationIdForContext(ctx);
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_region", (q) => q)
      .order("desc")
      .take(500);
    if (orgId == null) return nodes.slice(0, 100);
    return nodes.filter((n) => n.organizationId === undefined || n.organizationId === orgId).slice(0, 100);
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
    await requireRole(ctx, ["admin"]);
    const orgId = await getCurrentOrganizationIdForContext(ctx);
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
      organizationId: orgId ?? undefined,
    });
  },
});

