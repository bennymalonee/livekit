"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { AccessToken } from "livekit-server-sdk";

/**
 * Generate a LiveKit access token for a room.
 * Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Convex env.
 */
export const generateToken = action({
  args: {
    roomName: v.string(),
    participantName: v.optional(v.string()),
    ttlSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) {
      throw new Error("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in Convex environment variables.");
    }
    const at = new AccessToken(apiKey, apiSecret, {
      identity: args.participantName ?? `user-${Date.now()}`,
      ttl: args.ttlSeconds ? `${args.ttlSeconds}s` : "1h",
    });
    at.addGrant({
      roomJoin: true,
      room: args.roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const token = await at.toJwt();
    return { token };
  },
});
