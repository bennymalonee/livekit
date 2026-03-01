import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

function getCoolifyConfig(): { baseUrl: string; token: string } {
  const baseUrl = process.env.COOLIFY_BASE_URL?.replace(/\/$/, "");
  const token = process.env.COOLIFY_API_TOKEN;
  if (!baseUrl || !token) {
    throw new Error(
      "Coolify not configured. Set COOLIFY_BASE_URL and COOLIFY_API_TOKEN in Convex environment variables."
    );
  }
  return { baseUrl, token };
}

function mapCoolifyStatusToNode(status: string | undefined): string {
  if (!status) return "offline";
  const s = status.toLowerCase();
  if (s === "running") return "online";
  if (s === "stopped" || s === "exited" || s === "crashed") return "offline";
  return "degraded";
}

/**
 * Internal: sync Coolify applications to nodes table. Used by cron and by public syncApplicationsToNodes (after auth).
 */
export const syncApplicationsToNodes = internalAction({
  args: {},
  handler: async (ctx) => {
    const { baseUrl, token } = getCoolifyConfig();
    const res = await fetch(`${baseUrl}/api/v1/applications`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Coolify API listApplications failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as Array<{ uuid?: string; name?: string; status?: string }>;
    if (!Array.isArray(data)) return { synced: 0 };

    const region = "default";
    let synced = 0;
    for (const app of data) {
      const name = app.name ?? app.uuid ?? "Unnamed";
      const status = mapCoolifyStatusToNode(app.status);
      await ctx.runMutation(internal.nodes_internal.upsertNodeInternal, {
        name,
        region,
        status,
        cpuLoad: 0,
        memoryLoad: 0,
        activeRooms: 0,
      });
      synced += 1;
    }
    await ctx.runMutation(internal.diagnostics_internal.recordEventInternal, {
      level: "info",
      message: `Synced ${synced} nodes from Coolify`,
    });
    return { synced };
  },
});
