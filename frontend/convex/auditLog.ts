import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireRole } from "./rbac";

/** Record an audit event. Call from mutations/actions after performing an auditable action. Do not log secrets or tokens. */
export const record = internalMutation({
  args: {
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLog", {
      userId: args.userId,
      organizationId: args.organizationId,
      action: args.action,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      details: args.details,
      createdAt: Date.now(),
    });
  },
});

/** List recent audit log entries. Admin only. */
export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const limit = Math.min(args.limit ?? 100, 500);
    const entries = await ctx.db
      .query("auditLog")
      .withIndex("by_createdAt", (q) => q)
      .order("desc")
      .take(limit);
    return entries;
  },
});
