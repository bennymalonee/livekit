"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { AccessToken, WebhookReceiver, AgentDispatchClient } from "livekit-server-sdk";

/** Default TTL for self-hosted: short-lived tokens so removed participants cannot reuse (token revocation is Cloud-only). */
const DEFAULT_TTL_SECONDS = 30 * 60; // 30 minutes

const MAX_ROOM_NAME_LENGTH = 256;
const MAX_PARTICIPANT_NAME_LENGTH = 256;

/** Agent name used when dispatching from the dashboard; must match the worker's agentName. */
export const DISPATCH_AGENT_NAME = "livkit-voice-agent";

/**
 * Generate a LiveKit access token for a room.
 * Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Convex env.
 * Requires authentication. Uses a shorter default TTL for self-hosted; pass ttlSeconds to override (e.g. 3600 for 1h in dev).
 */
export const generateToken = action({
  args: {
    roomName: v.string(),
    participantName: v.optional(v.string()),
    ttlSeconds: v.optional(v.number()),
    canPublish: v.optional(v.boolean()),
    canSubscribe: v.optional(v.boolean()),
    canPublishData: v.optional(v.boolean()),
    metadata: v.optional(v.string()),
    attributes: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    await ctx.runMutation(internal.rateLimit_internal.checkAndIncrementTokenGen, {
      userId: identity.subject,
    });

    const roomName = (args.roomName ?? "").trim();
    if (!roomName || roomName.length > MAX_ROOM_NAME_LENGTH) {
      throw new Error("Invalid room name");
    }
    const participantName = args.participantName?.trim();
    if (participantName != null && participantName.length > MAX_PARTICIPANT_NAME_LENGTH) {
      throw new Error("Participant name too long");
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) {
      throw new Error("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in Convex environment variables.");
    }
    const ttl = args.ttlSeconds ?? DEFAULT_TTL_SECONDS;
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName ?? `user-${Date.now()}`,
      ttl: `${ttl}s`,
    });
    if (args.metadata != null) at.metadata = args.metadata;
    if (args.attributes != null && Object.keys(args.attributes).length > 0) at.attributes = args.attributes;
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: args.canPublish ?? true,
      canSubscribe: args.canSubscribe ?? true,
      canPublishData: args.canPublishData ?? true,
    });
    const token = await at.toJwt();
    return { token };
  },
});

/**
 * Dispatch the voice agent to a room. Requires the agent worker to be running and registered as DISPATCH_AGENT_NAME.
 * Set LIVEKIT_URL (e.g. wss://... or https://...), LIVEKIT_API_KEY, LIVEKIT_API_SECRET in Convex env.
 */
export const dispatchAgentToRoom = action({
  args: {
    roomName: v.string(),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const room = (args.roomName ?? "").trim();
    if (!room || room.length > MAX_ROOM_NAME_LENGTH) {
      throw new Error("Invalid room name");
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const url = process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !url) {
      throw new Error(
        "Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in Convex environment variables."
      );
    }

    const host = url.replace(/^wss:\/\//i, "https://").replace(/^ws:\/\//i, "http://");
    const client = new AgentDispatchClient(host, apiKey, apiSecret);
    await client.createDispatch(room, DISPATCH_AGENT_NAME, {
      metadata: args.metadata ?? undefined,
    });
    return { ok: true };
  },
});

/**
 * Check that LiveKit env is set so the UI can show "Ready" or a message to set keys.
 * Requires authentication.
 */
export const checkConfig = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (apiKey && apiSecret && apiKey.length > 0 && apiSecret.length > 0) {
      return { ok: true as const };
    }
    return {
      ok: false as const,
      message: "Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Convex environment variables.",
    };
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
