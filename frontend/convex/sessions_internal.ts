import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Ingests LiveKit webhook events into sessions table.
 * Called from Convex HTTP action POST /livekit-webhook (after optional signature verification).
 *
 * Handled: room_started, room_finished, participant_joined, participant_left.
 * Ignored (no persistence): participant_connection_aborted, track_published, track_unpublished,
 * egress_started, egress_updated, egress_ended, ingress_started, ingress_ended.
 */
export const ingestWebhookEvent = internalMutation({
  args: {
    event: v.string(),
    roomName: v.string(),
    participantCount: v.optional(v.number()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const now = args.timestamp * 1000 || Date.now();
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_room", (q) => q.eq("roomName", args.roomName))
      .first();

    if (args.event === "room_started" || args.event === "room_finished") {
      const count = args.participantCount ?? 0;
      if (existing) {
        await ctx.db.patch(existing._id, {
          participantCount: count,
          ...(args.event === "room_finished" ? { endedAt: now } : {}),
        });
      } else if (args.event === "room_started") {
        await ctx.db.insert("sessions", {
          roomName: args.roomName,
          source: "LiveKit",
          region: "default",
          icon: "videocam",
          participantCount: count,
          bitrateMbps: 0,
          qualityScore: 80,
          status: "Optimal",
          startedAt: now,
        });
      }
      return;
    }

    if ((args.event === "participant_joined" || args.event === "participant_left") && existing) {
      const count = args.participantCount ?? Math.max(0, existing.participantCount + (args.event === "participant_joined" ? 1 : -1));
      await ctx.db.patch(existing._id, { participantCount: count });
    }
  },
});
