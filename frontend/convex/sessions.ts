import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./rbac";

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    const now = Date.now();
    // Active sessions = not ended, or ended very recently (grace window).
    const graceWindowMs = 5 * 60 * 1000;

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_startedAt", (q) => q)
      .order("desc")
      .take(50);

    return sessions.filter((s) => !s.endedAt || s.endedAt > now - graceWindowMs);
  },
});

export const getTotals = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    const now = Date.now();
    const windowMs = 24 * 60 * 60 * 1000; // last 24h
    const since = now - windowMs;

    const recent = await ctx.db
      .query("sessions")
      .withIndex("by_startedAt", (q) => q.gt("startedAt", since))
      .order("desc")
      .take(500);

    let totalDurationMs = 0;
    let activeSessions = 0;

    for (const s of recent) {
      const end = s.endedAt ?? now;
      totalDurationMs += Math.max(0, end - s.startedAt);
      if (!s.endedAt) {
        activeSessions += 1;
      }
    }

    return {
      totalSessions: recent.length,
      totalDurationMs,
      activeSessions,
    };
  },
});

/** Seed demo sessions for development/dashboard preview. */
export const seedDemoSessions = mutation({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"]);
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const demo = [
      {
        roomName: "STREAM_0982_HD",
        source: "AWS",
        region: "US-EAST-1",
        icon: "videocam",
        participantCount: 1204,
        bitrateMbps: 4.8,
        qualityScore: 90,
        status: "Optimal",
        startedAt: now - 2 * hour,
        endedAt: undefined as number | undefined,
      },
      {
        roomName: "LIVE_STAGE_PRO",
        source: "GC",
        region: "EUROPE-W1",
        icon: "podcasts",
        participantCount: 842,
        bitrateMbps: 2.1,
        qualityScore: 68,
        status: "Congested",
        startedAt: now - 1 * hour,
        endedAt: now - 30 * 60 * 1000,
      },
      {
        roomName: "DEV_CONF_MAIN",
        source: "AZURE",
        region: "US-WEST",
        icon: "groups",
        participantCount: 2490,
        bitrateMbps: 8.4,
        qualityScore: 95,
        status: "Optimal",
        startedAt: now - 45 * 60 * 1000,
        endedAt: undefined,
      },
    ];

    for (const s of demo) {
      await ctx.db.insert("sessions", {
        ...s,
        endedAt: s.endedAt,
      });
    }
    return { inserted: demo.length };
  },
});

