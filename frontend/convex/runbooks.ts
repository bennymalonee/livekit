import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./rbac";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    return ctx.db
      .query("runbooks")
      .withIndex("by_updatedAt", (q) => q)
      .order("desc")
      .take(50);
  },
});

export const get = query({
  args: { id: v.id("runbooks") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    return ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    stepsMarkdown: v.string(),
    deployLink: v.optional(v.string()),
    nodeId: v.optional(v.id("nodes")),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "operator"]);
    const now = Date.now();
    return ctx.db.insert("runbooks", {
      title: args.title,
      stepsMarkdown: args.stepsMarkdown,
      deployLink: args.deployLink,
      nodeId: args.nodeId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("runbooks"),
    title: v.optional(v.string()),
    stepsMarkdown: v.optional(v.string()),
    deployLink: v.optional(v.string()),
    nodeId: v.optional(v.id("nodes")),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "operator"]);
    const now = Date.now();
    const patch: { title?: string; stepsMarkdown?: string; deployLink?: string; nodeId?: Id<"nodes">; updatedAt: number } = { updatedAt: now };
    if (args.title !== undefined) patch.title = args.title;
    if (args.stepsMarkdown !== undefined) patch.stepsMarkdown = args.stepsMarkdown;
    if (args.deployLink !== undefined) patch.deployLink = args.deployLink;
    if (args.nodeId !== undefined) patch.nodeId = args.nodeId;
    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("runbooks") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "operator"]);
    await ctx.db.delete(args.id);
    return args.id;
  },
});
