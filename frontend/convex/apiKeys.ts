import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getUserIdFromIdentity, requireRole } from "./rbac";

/** Internal: store an API key hash. Called from createApiKey action. */
export const insertApiKey = internalMutation({
  args: {
    keyHash: v.string(),
    name: v.string(),
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
    scopes: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("apiKeys", {
      keyHash: args.keyHash,
      name: args.name,
      userId: args.userId,
      organizationId: args.organizationId,
      scopes: args.scopes,
      createdAt: Date.now(),
    });
    return id;
  },
});

/** List API keys for the current user (no key or hash returned). */
export const listApiKeys = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "operator"]);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = getUserIdFromIdentity(identity);
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    return keys.map((k) => ({
      _id: k._id,
      name: k.name,
      scopes: k.scopes,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    }));
  },
});

/** Revoke (delete) an API key. Owner or admin. */
export const revokeApiKey = mutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "operator"]);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = getUserIdFromIdentity(identity);
    const key = await ctx.db.get(args.id);
    if (!key) throw new Error("API key not found");
    if (key.userId !== userId) await requireRole(ctx, ["admin"]);
    await ctx.db.delete(args.id);
  },
});

export const findByHashInternal = internalQuery({
  args: { keyHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", args.keyHash))
      .unique();
  },
});

export const touchLastUsed = internalMutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastUsedAt: Date.now() });
  },
});
