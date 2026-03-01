import { query } from "./_generated/server";
import { requireRole } from "./rbac";

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    const now = Date.now();
    const activeSessions = await ctx.db
      .query("sessions")
      .filter((q) =>
        q.or(
          q.eq(q.field("endedAt"), undefined),
          q.gt(q.field("endedAt"), now - 5 * 60 * 1000)
        )
      )
      .take(200);

    const concurrentUsers = activeSessions.reduce(
      (sum, s) => sum + s.participantCount,
      0
    );

    const nodes = await ctx.db.query("nodes").take(200);
    const activeNodes = nodes.filter((n) => n.status === "online").length;

    // System health: % of nodes online. When no nodes, null (UI shows —).
    let systemHealthPercent: number | null = null;
    if (nodes.length > 0) {
      const degraded =
        nodes.filter((n) => n.status !== "online").length / nodes.length;
      systemHealthPercent = Math.round((1 - degraded) * 10000) / 100;
    }

    // Total projects: live count of synced nodes (Coolify apps). No mock.
    const totalProjects = nodes.length;

    return {
      totalProjects,
      concurrentUsers,
      systemHealthPercent,
      activeNodes,
    };
  },
});

/** Returns overview plus trend % vs previous day (from dailySnapshot). */
export const getOverviewWithTrend = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    const now = Date.now();
    const activeSessions = await ctx.db
      .query("sessions")
      .filter((q) =>
        q.or(
          q.eq(q.field("endedAt"), undefined),
          q.gt(q.field("endedAt"), now - 5 * 60 * 1000)
        )
      )
      .take(200);

    const concurrentUsers = activeSessions.reduce(
      (sum, s) => sum + s.participantCount,
      0
    );

    const nodes = await ctx.db.query("nodes").take(200);
    const activeNodes = nodes.filter((n) => n.status === "online").length;

    let systemHealthPercent: number | null = null;
    if (nodes.length > 0) {
      const degraded =
        nodes.filter((n) => n.status !== "online").length / nodes.length;
      systemHealthPercent = Math.round((1 - degraded) * 10000) / 100;
    }

    // Total projects: live count of synced nodes (Coolify apps).
    const totalProjects = nodes.length;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const prev = await ctx.db
      .query("dailySnapshot")
      .withIndex("by_date", (q) => q.eq("date", yesterday))
      .first();

    let trendProjects: number | null = null;
    let trendConcurrent: number | null = null;
    if (prev) {
      trendProjects =
        prev.totalProjects > 0
          ? Math.round(
              ((totalProjects - prev.totalProjects) / prev.totalProjects) * 100
            )
          : totalProjects > 0 ? 100 : 0;
      trendConcurrent =
        prev.concurrentUsers > 0
          ? Math.round(
              ((concurrentUsers - prev.concurrentUsers) /
                prev.concurrentUsers) *
                100
            )
          : concurrentUsers > 0 ? 100 : 0;
    }

    return {
      totalProjects,
      concurrentUsers,
      systemHealthPercent,
      activeNodes,
      trendProjects,
      trendConcurrent,
    };
  },
});

