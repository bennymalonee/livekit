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

async function requireAuth(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
}

async function requireCoolifyRole(
  ctx: { runQuery: (fn: any) => Promise<string> },
  allowedRoles: ("admin" | "operator")[]
) {
  const role = await ctx.runQuery(api.rbac.getMyRole);
  if (!role || !allowedRoles.includes(role as "admin" | "operator")) throw new Error("Forbidden");
}

/**
 * List all applications from Coolify.
 * GET /api/v1/applications
 * Returns [] when Coolify is not configured or user lacks permission (avoids server error in UI).
 */
export const listApplications = action({
  args: {},
  handler: async (ctx): Promise<CoolifyApplication[]> => {
    try {
      await requireAuth(ctx);
      await requireCoolifyRole(ctx, ["admin", "operator"]);
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
    } catch {
      return [];
    }
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
    await requireAuth(ctx);
    await requireCoolifyRole(ctx, ["admin", "operator"]);
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
    await requireAuth(ctx);
    await requireCoolifyRole(ctx, ["admin", "operator"]);
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
 * Returns { ok, error? } so the client can show a message instead of a generic Server Error.
 */
export const syncApplicationsToNodes = action({
  args: {},
  handler: async (ctx): Promise<{ ok: boolean; error?: string }> => {
    try {
      await requireAuth(ctx);
      await requireCoolifyRole(ctx, ["admin"]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
    const identity = await ctx.auth.getUserIdentity();
    let baseUrl: string;
    let token: string;
    try {
      const config = getCoolifyConfig();
      baseUrl = config.baseUrl;
      token = config.token;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Coolify not configured";
      return { ok: false, error: msg };
    }
    try {
      await ctx.runAction(internal.coolify_internal.syncApplicationsToNodes, {});
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
    const { getUserIdFromIdentityOrNull } = await import("./rbac");
    const userId = getUserIdFromIdentityOrNull(identity);
    if (userId) {
      try {
        await ctx.runMutation(internal.auditLog.record, {
          userId,
          action: "nodes.sync",
          resourceType: "coolify",
          details: JSON.stringify({ source: "syncApplicationsToNodes" }),
        });
      } catch {
        // non-fatal
      }
    }
    return { ok: true };
  },
});

/**
 * Fetch recent application logs from Coolify.
 * Returns { logs, error? } so the client can show a clear message instead of a generic Server Error.
 * GET /api/v1/applications/{uuid}/logs?lines=100 (or Coolify v4 equivalent)
 */
export const getApplicationLogs = action({
  args: {
    applicationUuid: v.string(),
    lines: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ logs: string; error?: string }> => {
    try {
      try {
        await requireAuth(ctx);
        await requireCoolifyRole(ctx, ["admin", "operator"]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { logs: "", error: msg };
      }

      const uuid = (args.applicationUuid ?? "").trim();
      if (!uuid) {
        return {
          logs: "",
          error:
            "Application UUID not set. Set NEXT_PUBLIC_COOLIFY_DASHBOARD_APP_UUID or NEXT_PUBLIC_COOLIFY_LIVEKIT_STACK_APP_UUID in your app environment.",
        };
      }

      let baseUrl: string;
      let token: string;
      try {
        const config = getCoolifyConfig();
        baseUrl = config.baseUrl;
        token = config.token;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Coolify not configured";
        return { logs: "", error: msg };
      }

      const lines = args.lines ?? 100;
      const res = await fetch(
        `${baseUrl}/api/v1/applications/${encodeURIComponent(uuid)}/logs?lines=${lines}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const text = await res.text();
      if (!res.ok) {
        return {
          logs: "",
          error: `Coolify API error (${res.status}): ${text.slice(0, 200)}${text.length > 200 ? "…" : ""}`,
        };
      }
      let data: { logs?: string };
      try {
        data = JSON.parse(text) as { logs?: string };
      } catch {
        return { logs: text || "", error: undefined };
      }
      return { logs: typeof data.logs === "string" ? data.logs : text || "" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { logs: "", error: msg };
    }
  },
});
