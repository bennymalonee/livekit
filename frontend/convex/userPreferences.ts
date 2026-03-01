import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserIdFromIdentity, getUserIdFromIdentityOrNull } from "./rbac";

export const getMyPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = getUserIdFromIdentityOrNull(identity);
    if (!userId) return null;
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!prefs?.preferences) return null;
    try {
      return JSON.parse(prefs.preferences) as {
        theme?: "light" | "dark";
        dateRange?: "24h" | "7d" | "30d";
      };
    } catch {
      return null;
    }
  },
});

export const setPreferences = mutation({
  args: {
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    dateRange: v.optional(
      v.union(v.literal("24h"), v.literal("7d"), v.literal("30d"))
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = getUserIdFromIdentity(identity);
    const now = Date.now();
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const current: Record<string, string> = prefs?.preferences
      ? (JSON.parse(prefs.preferences) as Record<string, string>)
      : {};
    if (args.theme !== undefined) current.theme = args.theme;
    if (args.dateRange !== undefined) current.dateRange = args.dateRange;
    const nextJson = JSON.stringify(current);
    if (prefs) {
      await ctx.db.patch(prefs._id, {
        preferences: nextJson,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userPreferences", {
        userId,
        preferences: nextJson,
        updatedAt: now,
      });
    }
  },
});
