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

export default crons;
