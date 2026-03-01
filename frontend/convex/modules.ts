import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getUserIdFromIdentity, requireRole } from "./rbac";

export const listModules = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    return ctx.db.query("modules").collect();
  },
});

export const setModuleEnabled = mutation({
  args: {
    key: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const existing = await ctx.db
      .query("modules")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    const identity = await ctx.auth.getUserIdentity();
    const userId = identity ? getUserIdFromIdentity(identity) : null;
    if (existing) {
      await ctx.db.patch(existing._id, { enabled: args.enabled });
      if (userId) {
        await ctx.scheduler.runAfter(0, internal.auditLog.record, {
          userId,
          action: "modules.setEnabled",
          resourceType: "module",
          resourceId: existing._id,
          details: JSON.stringify({ key: args.key, enabled: args.enabled }),
        });
      }
      return existing._id;
    }
    const id = await ctx.db.insert("modules", {
      key: args.key,
      label: args.key,
      enabled: args.enabled,
      config: undefined,
    });
    if (userId) {
      await ctx.scheduler.runAfter(0, internal.auditLog.record, {
        userId,
        action: "modules.create",
        resourceType: "module",
        resourceId: id,
        details: JSON.stringify({ key: args.key, enabled: args.enabled }),
      });
    }
    return id;
  },
});

export const updateModuleConfig = mutation({
  args: {
    key: v.string(),
    config: v.string(), // JSON string
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const existing = await ctx.db
      .query("modules")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (!existing) {
      throw new Error("Module not found");
    }
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity ? getUserIdFromIdentity(identity) : null;
    await ctx.db.patch(existing._id, { config: args.config });
    if (userId) {
      await ctx.scheduler.runAfter(0, internal.auditLog.record, {
        userId,
        action: "modules.updateConfig",
        resourceType: "module",
        resourceId: existing._id,
        details: JSON.stringify({ key: args.key }),
      });
    }
  },
});

const DEFAULT_MODULES = [
  { key: "livekit", label: "LiveKit", enabled: true },
  { key: "turn", label: "TURN", enabled: true },
  { key: "recording", label: "Recording", enabled: false },
];

/** Seed default stack modules (livekit, turn, recording). Idempotent. */
export const seedModules = mutation({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"]);
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity ? getUserIdFromIdentity(identity) : null;
    let inserted = 0;
    for (const mod of DEFAULT_MODULES) {
      const existing = await ctx.db
        .query("modules")
        .withIndex("by_key", (q) => q.eq("key", mod.key))
        .unique();
      if (!existing) {
        await ctx.db.insert("modules", {
          key: mod.key,
          label: mod.label,
          enabled: mod.enabled,
        });
        inserted += 1;
      }
    }
    if (userId && inserted > 0) {
      await ctx.scheduler.runAfter(0, internal.auditLog.record, {
        userId,
        action: "modules.seed",
        resourceType: "module",
        details: JSON.stringify({ inserted }),
      });
    }
    return { inserted };
  },
});

