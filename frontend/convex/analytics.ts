import { mutation, query } from "./_generated/server";
import { requireRole } from "./rbac";

export const getOverview = query({
  args: {
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    const now = Date.now();
    const windowMs = args.sinceMs ?? 60 * 60 * 1000; // default last hour
    const since = now - windowMs;

    const metrics = await ctx.db
      .query("trafficMetrics")
      .withIndex("by_metric_region", (q) => q.eq("metric", "egress_bps"))
      .filter((q) => q.gt(q.field("windowStart"), since))
      .take(500);

    const byRegion = new Map<
      string,
      {
        region: string;
        egressGbps: number;
      }
    >();

    for (const m of metrics) {
      if (m.metric !== "egress_bps") continue;
      const current = byRegion.get(m.region) ?? { region: m.region, egressGbps: 0 };
      // Convert bps → Gbps for display.
      const gbps = m.value / 1_000_000_000;
      current.egressGbps += gbps;
      byRegion.set(m.region, current);
    }

    const regions = Array.from(byRegion.values()).sort(
      (a, b) => b.egressGbps - a.egressGbps
    );
    const totalEgressGbps = regions.reduce((sum, r) => sum + r.egressGbps, 0);

    let networkLoadLabel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN" = "UNKNOWN";
    if (totalEgressGbps > 0 && totalEgressGbps < 10) {
      networkLoadLabel = "LOW";
    } else if (totalEgressGbps >= 10 && totalEgressGbps < 40) {
      networkLoadLabel = "MEDIUM";
    } else if (totalEgressGbps >= 40) {
      networkLoadLabel = "HIGH";
    }

    // Real uptime: time since oldest session start in window (or 0 if no sessions).
    const sessionsInWindow = await ctx.db
      .query("sessions")
      .withIndex("by_startedAt", (q) => q.gt("startedAt", since))
      .take(500);
    const oldestStart =
      sessionsInWindow.length > 0
        ? Math.min(...sessionsInWindow.map((s) => s.startedAt))
        : null;
    const uptimeHours =
      oldestStart != null
        ? Math.round((now - oldestStart) / (60 * 60 * 1000) * 100) / 100
        : 0;

    return {
      totalEgressGbps,
      regions,
      uptimeHours,
      networkLoadLabel,
    };
  },
});

/** For API key–scoped HTTP route only. No auth; caller must validate key and scope. */
export const getOverviewForApi = query({
  args: { sinceMs: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowMs = args.sinceMs ?? 60 * 60 * 1000;
    const since = now - windowMs;
    const metrics = await ctx.db
      .query("trafficMetrics")
      .withIndex("by_metric_region", (q) => q.eq("metric", "egress_bps"))
      .filter((q) => q.gt(q.field("windowStart"), since))
      .take(500);
    const byRegion = new Map<string, { region: string; egressGbps: number }>();
    for (const m of metrics) {
      if (m.metric !== "egress_bps") continue;
      const current = byRegion.get(m.region) ?? { region: m.region, egressGbps: 0 };
      current.egressGbps += m.value / 1_000_000_000;
      byRegion.set(m.region, current);
    }
    const regions = Array.from(byRegion.values()).sort((a, b) => b.egressGbps - a.egressGbps);
    const totalEgressGbps = regions.reduce((sum, r) => sum + r.egressGbps, 0);
    let networkLoadLabel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN" = "UNKNOWN";
    if (totalEgressGbps > 0 && totalEgressGbps < 10) networkLoadLabel = "LOW";
    else if (totalEgressGbps >= 10 && totalEgressGbps < 40) networkLoadLabel = "MEDIUM";
    else if (totalEgressGbps >= 40) networkLoadLabel = "HIGH";
    const sessionsInWindow = await ctx.db
      .query("sessions")
      .withIndex("by_startedAt", (q) => q.gt("startedAt", since))
      .take(500);
    const oldestStart =
      sessionsInWindow.length > 0
        ? Math.min(...sessionsInWindow.map((s) => s.startedAt))
        : null;
    const uptimeHours =
      oldestStart != null
        ? Math.round((now - oldestStart) / (60 * 60 * 1000) * 100) / 100
        : 0;
    return {
      totalEgressGbps,
      regions,
      uptimeHours,
      networkLoadLabel,
    };
  },
});

