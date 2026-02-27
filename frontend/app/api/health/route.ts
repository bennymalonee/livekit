import { NextResponse } from "next/server";

/**
 * GET /api/health - Health check for Coolify or load balancers.
 * Returns 200 with { status: "ok" }. No secrets in response.
 */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
