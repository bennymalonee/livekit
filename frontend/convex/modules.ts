import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listModules = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return ctx.db.query("modules").collect();
  },
});

export const setModuleEnabled = mutation({
  args: {
    key: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("modules")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { enabled: args.enabled });
      return existing._id;
    }

    return ctx.db.insert("modules", {
      key: args.key,
      label: args.key,
      enabled: args.enabled,
      config: undefined,
    });
  },
});

export const updateModuleConfig = mutation({
  args: {
    key: v.string(),
    config: v.string(), // JSON string
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("modules")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (!existing) {
      throw new Error("Module not found");
    }

    await ctx.db.patch(existing._id, { config: args.config });
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

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
    return { inserted };
  },
});

