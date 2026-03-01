"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { AccessToken, WebhookReceiver } from "livekit-server-sdk";

/** Default TTL for self-hosted: short-lived tokens so removed participants cannot reuse (token revocation is Cloud-only). */
const DEFAULT_TTL_SECONDS = 30 * 60; // 30 minutes

/**
 * Generate a LiveKit access token for a room.
 * Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Convex env.
 * Uses a shorter default TTL for self-hosted; pass ttlSeconds to override (e.g. 3600 for 1h in dev).
 */
export const generateToken = action({
  args: {
    roomName: v.string(),
    participantName: v.optional(v.string()),
    ttlSeconds: v.optional(v.number()),
    metadata: v.optional(v.string()),
    attributes: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) {
      throw new Error("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in Convex environment variables.");
    }
    const ttl = args.ttlSeconds ?? DEFAULT_TTL_SECONDS;
    const at = new AccessToken(apiKey, apiSecret, {
      identity: args.participantName ?? `user-${Date.now()}`,
      ttl: `${ttl}s`,
    });
    if (args.metadata != null) at.metadata = args.metadata;
    if (args.attributes != null && Object.keys(args.attributes).length > 0) at.attributes = args.attributes;
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

/**
 * Verify LiveKit webhook body and extract event fields. Uses WebhookReceiver when
 * LIVEKIT_API_KEY/SECRET are set; otherwise parses JSON without verification.
 * Called from http.ts (which cannot use "use node").
 */
export const verifyWebhookPayload = action({
  args: {
    body: v.string(),
    authHeader: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (apiKey && apiSecret) {
      const receiver = new WebhookReceiver(apiKey, apiSecret);
      const event = await receiver.receive(args.body, args.authHeader ?? undefined);
      const room = event.room as { name?: string; numParticipants?: number; num_participants?: number } | undefined;
      return {
        event: event.event ?? "",
        roomName: room?.name ?? "",
        participantCount: room?.numParticipants ?? (room as any)?.num_participants,
      };
    }
    let payload: { event?: string; room?: { name?: string; num_participants?: number } | string; num_participants?: number };
    try {
      payload = JSON.parse(args.body);
    } catch {
      throw new Error("BAD_REQUEST");
    }
    const room = payload?.room;
    const roomName = typeof room === "object" && room !== null && "name" in room ? room.name ?? "" : String(room ?? "");
    const participantCount = typeof room === "object" && room !== null && "num_participants" in room ? room.num_participants : payload?.num_participants;
    return {
      event: payload?.event ?? "",
      roomName,
      participantCount,
    };
  },
});
