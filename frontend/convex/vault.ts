import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentOrganizationIdForContext } from "./organizations";
import { getUserIdFromIdentity, requireRole } from "./rbac";

export const listKeys = query({
  args: {},
  handler: async (ctx) => {
    try {
      await requireRole(ctx, ["admin"]);
      const orgId = await getCurrentOrganizationIdForContext(ctx);
      const rows = await ctx.db.query("vaultKeys").order("desc").take(500);
      const filtered = orgId == null ? rows : rows.filter((r) => r.organizationId === undefined || r.organizationId === orgId);
      return filtered.slice(0, 100).map((row) => ({
        _id: row._id,
        name: row.name,
        description: row.description,
        createdAt: row.createdAt,
        lastUsedAt: row.lastUsedAt,
      }));
    } catch {
      return [];
    }
  },
});

export const createKey = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    encryptedValue: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const orgId = await getCurrentOrganizationIdForContext(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("vaultKeys")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (existing) {
      throw new Error("A key with this name already exists");
    }

    const id = await ctx.db.insert("vaultKeys", {
      name: args.name,
      description: args.description,
      encryptedValue: args.encryptedValue,
      createdByUserId: getUserIdFromIdentity(identity),
      createdAt: now,
      lastUsedAt: undefined,
      organizationId: orgId ?? undefined,
    });
    await ctx.scheduler.runAfter(0, internal.auditLog.record, {
      userId: getUserIdFromIdentity(identity),
      action: "vault.create",
      resourceType: "vaultKey",
      resourceId: id,
      details: JSON.stringify({ name: args.name }),
    });
    return id;
  },
});

export const deleteKey = mutation({
  args: {
    id: v.id("vaultKeys"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const key = await ctx.db.get(args.id);
    if (!key) {
      return;
    }
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity ? getUserIdFromIdentity(identity) : undefined;
    await ctx.db.delete(args.id);
    if (userId) {
      await ctx.scheduler.runAfter(0, internal.auditLog.record, {
        userId,
        action: "vault.delete",
        resourceType: "vaultKey",
        resourceId: args.id,
        details: JSON.stringify({ name: key.name }),
      });
    }
  },
});

