import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const SUB_DIVIDER = "|";

function getUserId(identity: { subject: string }): Id<"users"> {
  const [userId] = identity.subject.split(SUB_DIVIDER);
  return userId as Id<"users">;
}

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = getUserId(identity);
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = getUserId(identity);
    const now = Date.now();
    return ctx.db.insert("deployments", {
      userId,
      status: args.status,
      livekitUrl: args.livekitUrl,
      createdAt: now,
      updatedAt: now,
    });
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = getUserId(identity);
    const deployment = await ctx.db.get(args.deploymentId);
    if (!deployment || deployment.userId !== userId) {
      throw new Error("Deployment not found");
    }
    await ctx.db.patch(args.deploymentId, {
      status: args.status,
      ...(args.livekitUrl !== undefined && { livekitUrl: args.livekitUrl }),
      updatedAt: Date.now(),
    });
  },
});
