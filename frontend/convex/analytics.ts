import { query } from "./_generated/server";

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        totalEgressGbps: 0,
        regions: [],
        uptimeHours: 0,
        networkLoadLabel: "UNKNOWN",
      };
    }

    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // last hour
    const since = now - windowMs;

    const metrics = await ctx.db
      .query("trafficMetrics")
      .withIndex("by_metric_region", (q) => q.gt("windowStart", since))
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

