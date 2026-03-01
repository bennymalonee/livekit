import { internalMutation } from "./_generated/server";

/**
 * Saves today's overview snapshot to dailySnapshot for trend computation.
 * Called by cron once per day.
 */
export const saveDailySnapshot = internalMutation({
  args: {},
  handler: async (ctx) => {
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

    const projectIds = new Set<string>();
    for (const s of activeSessions) {
      if (s.ownerUserId) {
        projectIds.add(s.ownerUserId as string);
      }
    }

    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const existing = await ctx.db
      .query("dailySnapshot")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();
    const row = {
      date,
      totalProjects: projectIds.size,
      concurrentUsers,
      systemHealthPercent,
      activeNodes,
    };
    if (existing) {
      await ctx.db.patch(existing._id, row);
    } else {
      await ctx.db.insert("dailySnapshot", row);
    }
    return { date };
  },
});
