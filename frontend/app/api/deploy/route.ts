import { NextResponse } from "next/server";

/**
 * POST /api/deploy - Triggers Coolify deploy webhook for LiveKit Stack.
 * Requires COOLIFY_DEPLOY_WEBHOOK_URL to be set in the environment.
 */
export async function POST() {
  const webhookUrl = process.env.COOLIFY_DEPLOY_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "Coolify webhook not configured (COOLIFY_DEPLOY_WEBHOOK_URL)" },
      { status: 503 }
    );
  }

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
