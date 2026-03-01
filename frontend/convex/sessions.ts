import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./rbac";

export const listActive = query({
  args: {
    roomName: v.optional(v.string()),
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    const now = Date.now();
    const graceWindowMs = 5 * 60 * 1000;

    let sessions;
    if (args.roomName && args.roomName.trim()) {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_room", (q) => q.eq("roomName", args.roomName!.trim()))
        .order("desc")
        .take(100);
    } else {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_startedAt", (q) => q)
        .order("desc")
        .take(100);
    }

    let filtered = sessions.filter((s) => !s.endedAt || s.endedAt > now - graceWindowMs);
    if (args.sinceMs != null && args.sinceMs > 0) {
      const since = now - args.sinceMs;
      filtered = filtered.filter((s) => s.startedAt >= since);
    }
    return filtered.slice(0, 50);
  },
});

export const getTotals = query({
  args: {
    roomName: v.optional(v.string()),
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    const now = Date.now();
    const windowMs = args.sinceMs ?? 24 * 60 * 60 * 1000; // default last 24h
    const since = now - windowMs;

    let recent;
    if (args.roomName && args.roomName.trim()) {
      const byRoom = await ctx.db
        .query("sessions")
        .withIndex("by_room", (q) => q.eq("roomName", args.roomName!.trim()))
        .order("desc")
        .take(500);
      recent = byRoom.filter((s) => s.startedAt >= since);
    } else {
      recent = await ctx.db
        .query("sessions")
        .withIndex("by_startedAt", (q) => q.gt("startedAt", since))
        .order("desc")
        .take(500);
    }

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

/** For API key–scoped HTTP route only. No auth; caller must validate key and scope. */
export const listSessionsForApi = query({
  args: {
    roomName: v.optional(v.string()),
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const graceWindowMs = 5 * 60 * 1000;
    let sessions;
    if (args.roomName && args.roomName.trim()) {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_room", (q) => q.eq("roomName", args.roomName!.trim()))
        .order("desc")
        .take(100);
    } else {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_startedAt", (q) => q)
        .order("desc")
        .take(100);
    }
    let filtered = sessions.filter((s) => !s.endedAt || s.endedAt > now - graceWindowMs);
    if (args.sinceMs != null && args.sinceMs > 0) {
      const since = now - args.sinceMs;
      filtered = filtered.filter((s) => s.startedAt >= since);
    }
    return filtered.slice(0, 50);
  },
});

