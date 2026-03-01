import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

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

export default crons;
