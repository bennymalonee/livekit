import { mutation, query } from "./_generated/server";
import { requireRole } from "./rbac";

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // last hour
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

    // Uptime is a higher-level metric; for now, approximate based on data presence.
    const uptimeHours = metrics.length > 0 ? 24 : 0;

    return {
      totalEgressGbps,
      regions,
      uptimeHours,
      networkLoadLabel,
    };
  },
});

/** Seed demo traffic metrics for development/dashboard preview. */
export const seedDemoMetrics = mutation({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"]);
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const windowMs = 15 * 60 * 1000; // 15-min windows
    const regions = [
      { region: "EU-West-1", gbps: 32 },
      { region: "US-East-2", gbps: 0 },
      { region: "US-West-1", gbps: 2 },
      { region: "AP-South-1", gbps: 8 },
    ];

    for (let i = 0; i < 4; i++) {
      const windowStart = now - (i + 1) * hour;
      const windowEnd = windowStart + windowMs;
      for (const { region, gbps } of regions) {
        const valueBps = gbps * 1_000_000_000;
        await ctx.db.insert("trafficMetrics", {
          metric: "egress_bps",
          region,
          windowStart,
          windowEnd,
          value: valueBps,
          unit: "bps",
        });
      }
    }
    return { inserted: 4 * regions.length };
  },
});

