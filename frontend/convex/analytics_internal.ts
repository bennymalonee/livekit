import { internalMutation } from "./_generated/server";

const RETENTION_DAYS = 7;
const MAX_DELETE_PER_RUN = 500;

/**
 * Deletes trafficMetrics older than RETENTION_DAYS. Called by cron daily.
 */
export const pruneTrafficMetrics = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const rows = await ctx.db
      .query("trafficMetrics")
      .filter((q) => q.lt(q.field("windowStart"), cutoff))
      .take(MAX_DELETE_PER_RUN);
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return { deleted: rows.length };
  },
});

/**
 * Derives traffic metrics from current sessions and writes to trafficMetrics.
 * Called by cron every 15 min so Analytics shows live data without manual seed.
 */
export const syncTrafficFromSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const windowStart = Math.floor(now / windowMs) * windowMs - windowMs;
    const windowEnd = windowStart + windowMs;

    const graceWindowMs = 5 * 60 * 1000;
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_startedAt", (q) => q)
      .order("desc")
      .take(200);

    const active = sessions.filter(
      (s) => !s.endedAt || (s.endedAt && s.endedAt > now - graceWindowMs)
    );

    const byRegion = new Map<string, number>();

    for (const s of active) {
      const region = s.region || "default";
      const egressBps =
        (s.bitrateMbps ?? 0) * (s.participantCount ?? 0) * 1_000_000;
      const current = byRegion.get(region) ?? 0;
      byRegion.set(region, current + egressBps);
    }

    const regions = Array.from(byRegion.keys());
    if (regions.length === 0) {
      return { inserted: 0 };
    }

    for (const region of regions) {
      const value = byRegion.get(region) ?? 0;
      await ctx.db.insert("trafficMetrics", {
        metric: "egress_bps",
        region,
        windowStart,
        windowEnd,
        value,
        unit: "bps",
      });
    }

    return { inserted: regions.length };
  },
});
