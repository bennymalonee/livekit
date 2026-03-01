import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Coolify API helpers. Set COOLIFY_BASE_URL and COOLIFY_API_TOKEN in Convex env.
 * Used by Deploy page (Phase 1) and Nodes sync (Phase 2).
 */

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

export type CoolifyApplication = {
  uuid: string;
  name: string;
  status?: string;
  fqdn?: string;
};

/**
 * List all applications from Coolify.
 * GET /api/v1/applications
 */
export const listApplications = action({
  args: {},
  handler: async (): Promise<CoolifyApplication[]> => {
    const { baseUrl, token } = getCoolifyConfig();
    const res = await fetch(`${baseUrl}/api/v1/applications`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Coolify API listApplications failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as Array<{ uuid?: string; name?: string; status?: string; fqdn?: string }>;
    if (!Array.isArray(data)) return [];
    return data.map((app) => ({
      uuid: app.uuid ?? "",
      name: app.name ?? "Unnamed",
      status: app.status,
      fqdn: app.fqdn,
    }));
  },
});

export type CoolifyEnvVar = {
  key: string;
  /** Masked for security when returning to client (e.g. "***") */
  valueMasked: boolean;
};

/**
 * List env var keys for an application (keys only, no secret values).
 * GET /api/v1/applications/{uuid}/envs
 */
export const getApplicationEnvs = action({
  args: { applicationUuid: v.string() },
  handler: async (ctx, args): Promise<CoolifyEnvVar[]> => {
    const { baseUrl, token } = getCoolifyConfig();
    const res = await fetch(
      `${baseUrl}/api/v1/applications/${encodeURIComponent(args.applicationUuid)}/envs`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Coolify API getApplicationEnvs failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as Array<{ key?: string }>;
    if (!Array.isArray(data)) return [];
    return data.map((env) => ({
      key: env.key ?? "",
      valueMasked: true,
    }));
  },
});

/**
 * Get env vars for an application and return key-value map (for server-side use only, e.g. prefill LiveKit URL).
 * Returns only non-sensitive keys by convention (e.g. NEXT_PUBLIC_*, LIVEKIT_* URL) or all keys with values masked.
 * This version returns a map of key -> value for keys that look like public/URL config so we can prefill LiveKit URL.
 */
export const getApplicationEnvsForPrefill = action({
  args: { applicationUuid: v.string() },
  handler: async (ctx, args): Promise<Record<string, string>> => {
    const { baseUrl, token } = getCoolifyConfig();
    const res = await fetch(
      `${baseUrl}/api/v1/applications/${encodeURIComponent(args.applicationUuid)}/envs`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Coolify API getApplicationEnvs failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as Array<{ key?: string; value?: string; real_value?: string }>;
    if (!Array.isArray(data)) return {};
    const out: Record<string, string> = {};
    const publicPrefixes = ["NEXT_PUBLIC_", "LIVEKIT_", "PUBLIC_"];
    for (const env of data) {
      const key = env.key ?? "";
      const val = env.real_value ?? env.value ?? "";
      if (!key) continue;
      if (publicPrefixes.some((p) => key.startsWith(p)) && val) {
        out[key] = val;
      }
    }
    return out;
  },
});

function mapCoolifyStatusToNode(status: string | undefined): string {
  if (!status) return "offline";
  const s = status.toLowerCase();
  if (s === "running") return "online";
  if (s === "stopped" || s === "exited" || s === "crashed") return "offline";
  return "degraded";
}

/**
 * Fetch Coolify applications and upsert them into Convex nodes table.
 * Used by Nodes page "Sync from Coolify" and optionally by a cron.
 */
export const syncApplicationsToNodes = action({
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
      await ctx.runMutation(api.nodes.upsertNode, {
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

/**
 * Fetch recent application logs from Coolify.
 * GET /api/v1/applications/{uuid}/logs?lines=100
 */
export const getApplicationLogs = action({
  args: {
    applicationUuid: v.string(),
    lines: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ logs: string }> => {
    const { baseUrl, token } = getCoolifyConfig();
    const lines = args.lines ?? 100;
    const res = await fetch(
      `${baseUrl}/api/v1/applications/${encodeURIComponent(args.applicationUuid)}/logs?lines=${lines}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Coolify API getApplicationLogs failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { logs?: string };
    return { logs: typeof data.logs === "string" ? data.logs : "" };
  },
});
