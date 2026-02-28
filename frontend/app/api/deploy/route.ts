import { NextResponse } from "next/server";

/**
 * POST /api/deploy - Triggers Coolify deploy for LiveKit Stack.
 * Either set COOLIFY_DEPLOY_WEBHOOK_URL (POST webhook from Coolify UI), or
 * set COOLIFY_BASE_URL + LIVEKIT_STACK_APP_UUID + COOLIFY_API_TOKEN to use the Coolify deploy API.
 */
export async function POST() {
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
