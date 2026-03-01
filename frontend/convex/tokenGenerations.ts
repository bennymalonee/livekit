import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserIdFromIdentity, requireRole } from "./rbac";

/**
 * Record a token generation for audit. Does not store the token.
 * Called from the Vault UI after each successful generateToken (single or multi-room).
 */
export const recordTokenGeneration = mutation({
  args: {
    roomName: v.string(),
    canPublish: v.boolean(),
    canSubscribe: v.boolean(),
    canPublishData: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "operator"]);
    const identity = await ctx.auth.getUserIdentity();
    const now = Date.now();
    await ctx.db.insert("tokenGenerations", {
      roomName: args.roomName,
      canPublish: args.canPublish,
      canSubscribe: args.canSubscribe,
      canPublishData: args.canPublishData,
      createdAt: now,
      ...(identity && { createdByUserId: getUserIdFromIdentity(identity) }),
    });
  },
});
