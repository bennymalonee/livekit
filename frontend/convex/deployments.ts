import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getUserIdFromIdentity, requireRole } from "./rbac";

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = getUserIdFromIdentity(identity);
    return ctx.db
      .query("deployments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
  },
});

export const create = mutation({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("success"),
      v.literal("failed")
    ),
    livekitUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = getUserIdFromIdentity(identity);
    const now = Date.now();
    const id = await ctx.db.insert("deployments", {
      userId,
      status: args.status,
      livekitUrl: args.livekitUrl,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.auditLog.record, {
      userId,
      action: "deploy.create",
      resourceType: "deployment",
      resourceId: id,
      details: JSON.stringify({ status: args.status }),
    });
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    deploymentId: v.id("deployments"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("success"),
      v.literal("failed")
    ),
    livekitUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = getUserIdFromIdentity(identity);
    const deployment = await ctx.db.get(args.deploymentId);
    if (!deployment || deployment.userId !== userId) {
      throw new Error("Deployment not found");
    }
    await ctx.db.patch(args.deploymentId, {
      status: args.status,
      ...(args.livekitUrl !== undefined && { livekitUrl: args.livekitUrl }),
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.auditLog.record, {
      userId,
      action: "deploy.updateStatus",
      resourceType: "deployment",
      resourceId: args.deploymentId,
      details: JSON.stringify({ status: args.status }),
    });
  },
});
