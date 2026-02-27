import { query } from "./_generated/server";

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        totalProjects: 0,
        concurrentUsers: 0,
        systemHealthPercent: 0,
        activeNodes: 0,
      };
    }

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

    let systemHealthPercent = 100;
    if (nodes.length > 0) {
      const degraded =
        nodes.filter((n) => n.status !== "online").length / nodes.length;
      systemHealthPercent = Math.round((1 - degraded) * 10000) / 100;
    }

    // Projects: approximate as number of distinct owners with sessions.
    const projectIds = new Set<string>();
    for (const s of activeSessions) {
      if (s.ownerUserId) {
        projectIds.add(s.ownerUserId as string);
      }
    }

    return {
      totalProjects: projectIds.size,
      concurrentUsers,
      systemHealthPercent,
      activeNodes,
    };
  },
});

