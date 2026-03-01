import { NextRequest, NextResponse } from "next/server";

/** In-memory rate limit fallback when Convex rate limit is not used (e.g. CONVEX_SITE_URL unset). Max 5 per IP per 60s. */
const deployAttempts = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function getClientId(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimitedInMemory(clientId: string): boolean {
  const now = Date.now();
  let times = deployAttempts.get(clientId) ?? [];
  times = times.filter((t) => now - t < WINDOW_MS);
  if (times.length >= MAX_PER_WINDOW) return true;
  times.push(now);
  deployAttempts.set(clientId, times);
  return false;
}

/** Convex HTTP base URL for deploy-rate-limit route. Set CONVEX_SITE_URL or derive from NEXT_PUBLIC_CONVEX_URL. */
function getConvexSiteUrl(): string | null {
  const explicit = process.env.CONVEX_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (convexUrl?.includes(".cloud")) return convexUrl.replace(".cloud", ".site").replace(/\/$/, "");
  return null;
}

/** Check deploy rate limit via Convex when CONVEX_SITE_URL (or derived) is set. Returns { allowed } or null if Convex not configured. */
async function checkConvexDeployRateLimit(clientId: string): Promise<{ allowed: boolean } | null> {
  const base = getConvexSiteUrl();
  if (!base) return null;
  const secret = process.env.DEPLOY_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers["X-Deploy-Secret"] = secret;
  try {
    const res = await fetch(`${base}/deploy-rate-limit`, {
      method: "POST",
      headers,
      body: JSON.stringify({ clientId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) return { allowed: false };
    if (res.ok && typeof data?.allowed === "boolean") return { allowed: data.allowed };
  } catch {
    // Fall through to in-memory
  }
  return null;
}

/**
 * POST /api/deploy - Triggers Coolify deploy for LiveKit Stack.
 * The in-app Deploy button uses Convex action settings.triggerDeploy when configured; this route is for external/CI or fallback.
 * Either set COOLIFY_DEPLOY_WEBHOOK_URL (POST webhook from Coolify UI), or
 * set COOLIFY_BASE_URL + LIVEKIT_STACK_APP_UUID + COOLIFY_API_TOKEN to use the Coolify deploy API.
 * If DEPLOY_SECRET is set, requests must include Authorization: Bearer <DEPLOY_SECRET> or X-Deploy-Secret: <DEPLOY_SECRET>.
 */
export async function POST(request: NextRequest) {
  const deploySecret = process.env.DEPLOY_SECRET;
  if (deploySecret && deploySecret.length > 0) {
    const authHeader = request.headers.get("Authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const headerSecret = request.headers.get("X-Deploy-Secret")?.trim() ?? bearer;
    if (headerSecret !== deploySecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const clientId = getClientId(request);
  const convexLimit = await checkConvexDeployRateLimit(clientId);
  if (convexLimit !== null) {
    if (!convexLimit.allowed) {
      return NextResponse.json(
        { error: "Too many deploy requests. Try again in a minute." },
        { status: 429 }
      );
    }
  } else if (isRateLimitedInMemory(clientId)) {
    return NextResponse.json(
      { error: "Too many deploy requests. Try again in a minute." },
      { status: 429 }
    );
  }

  const webhookUrl = process.env.COOLIFY_DEPLOY_WEBHOOK_URL;
  const baseUrl = process.env.COOLIFY_BASE_URL?.replace(/\/$/, "");
  const appUuid = process.env.LIVEKIT_STACK_APP_UUID;
  const apiToken = process.env.COOLIFY_API_TOKEN;

  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { error: `Coolify webhook failed: ${res.status} ${text}` },
          { status: 502 }
        );
      }
      return NextResponse.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json(
        { error: `Failed to trigger deploy: ${message}` },
        { status: 502 }
      );
    }
  }

  if (baseUrl && appUuid && apiToken) {
    try {
      const res = await fetch(
        `${baseUrl}/api/v1/deploy?uuid=${encodeURIComponent(appUuid)}`,
        { method: "GET", headers: { Authorization: `Bearer ${apiToken}` } }
      );
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { error: `Coolify deploy API failed: ${res.status} ${text}` },
          { status: 502 }
        );
      }
      return NextResponse.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json(
        { error: `Failed to trigger deploy: ${message}` },
        { status: 502 }
      );
    }
  }

  return NextResponse.json(
    {
      error:
        "Coolify not configured. Set COOLIFY_DEPLOY_WEBHOOK_URL, or COOLIFY_BASE_URL + LIVEKIT_STACK_APP_UUID + COOLIFY_API_TOKEN.",
    },
    { status: 503 }
  );
}
