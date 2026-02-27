import { v } from "convex/values";
import { query } from "./_generated/server";

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        totalSessions: 0,
        totalDurationMs: 0,
        activeSessions: 0,
      };
    }

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

