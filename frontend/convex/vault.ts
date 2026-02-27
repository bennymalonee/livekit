import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listKeys = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return ctx.db
      .query("vaultKeys")
      .order("desc")
      .take(100)
      .then((rows) =>
        rows.map((row) => ({
          _id: row._id,
          name: row.name,
          description: row.description,
          createdAt: row.createdAt,
          lastUsedAt: row.lastUsedAt,
        }))
      );
  },
});

export const createKey = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    encryptedValue: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    const existing = await ctx.db
      .query("vaultKeys")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (existing) {
      throw new Error("A key with this name already exists");
    }

    return ctx.db.insert("vaultKeys", {
      name: args.name,
      description: args.description,
      encryptedValue: args.encryptedValue,
      createdByUserId: identity.subject as any,
      createdAt: now,
      lastUsedAt: undefined,
    });
  },
});

export const deleteKey = mutation({
  args: {
    id: v.id("vaultKeys"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const key = await ctx.db.get(args.id);
    if (!key) {
      return;
    }

    await ctx.db.delete(args.id);
  },
});

