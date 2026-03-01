import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserIdFromIdentity, requireRole } from "./rbac";

export const listCommands = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "operator"]);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const limit = args.limit ?? 50;

    return ctx.db
      .query("terminalCommands")
      .withIndex("by_user_createdAt", (q) =>
        q.eq("userId", getUserIdFromIdentity(identity))
      )
      .order("desc")
      .take(limit);
  },
});

export const recordCommand = mutation({
  args: {
    command: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "operator"]);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const now = Date.now();
    const id = await ctx.db.insert("terminalCommands", {
      userId: getUserIdFromIdentity(identity),
      command: args.command,
      status: "pending",
      exitCode: undefined,
      output: undefined,
      createdAt: now,
      completedAt: undefined,
    });

    return id;
  },
});

export const updateCommandResult = mutation({
  args: {
    id: v.id("terminalCommands"),
    status: v.union(
      v.literal("running"),
      v.literal("success"),
      v.literal("failed")
    ),
    exitCode: v.optional(v.number()),
    output: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "operator"]);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== getUserIdFromIdentity(identity)) {
      throw new Error("Command not found");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      exitCode: args.exitCode,
      output: args.output,
      completedAt: Date.now(),
    });
  },
});

