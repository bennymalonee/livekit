import { NextResponse } from "next/server";

const APP_VERSION = process.env.APP_VERSION ?? "0.1.0";

/**
 * GET /api/health - Health check for Coolify or load balancers.
 * Returns 200 with { status: "ok", version }. Set APP_VERSION in env for build/release version.
 * No secrets in response.
 */
export async function GET() {
  return NextResponse.json({ status: "ok", version: APP_VERSION });
}
