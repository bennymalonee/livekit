import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Sync Coolify applications to Convex nodes every 15 minutes.
 * Requires COOLIFY_BASE_URL and COOLIFY_API_TOKEN in Convex env.
 */
crons.interval(
  "sync nodes from Coolify",
  { minutes: 15 },
  api.coolify.syncApplicationsToNodes,
  {}
);

/**
 * Derive traffic metrics from active sessions every 15 minutes.
 * Writes to trafficMetrics so Analytics page shows live data without manual seed.
 */
crons.interval(
  "sync traffic from sessions",
  { minutes: 15 },
  internal.analytics_internal.syncTrafficFromSessions,
  {}
);

/**
 * Prune trafficMetrics older than 7 days to prevent unbounded growth.
 */
crons.interval(
  "prune traffic metrics",
  { hours: 24 },
  internal.analytics_internal.pruneTrafficMetrics,
  {}
);

/**
 * Save daily overview snapshot for dashboard trend %.
 */
crons.interval(
  "save daily snapshot",
  { hours: 24 },
  internal.dashboard_internal.saveDailySnapshot,
  {}
);

export default crons;
