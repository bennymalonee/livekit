import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth-status - Returns whether the current request has valid auth.
 * Used by the login page to poll after sign-in before redirecting.
 * ?debug=1 adds requestHost and forwardedHost for troubleshooting cookie/origin issues.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const debug = url.searchParams.get("debug") === "1";

  try {
    const authenticated = await isAuthenticatedNextjs();
    const body: { ok: boolean; authenticated: boolean; requestHost?: string; forwardedHost?: string } = {
      ok: true,
      authenticated,
    };
    if (debug) {
      body.requestHost = request.headers.get("host") ?? undefined;
      body.forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? undefined;
    }
    return NextResponse.json(body);
  } catch (err) {
    const body: {
      ok: boolean;
      authenticated: boolean;
      error?: string;
      requestHost?: string;
      forwardedHost?: string;
    } = { ok: true, authenticated: false };
    if (err instanceof Error) body.error = err.message;
    if (debug) {
      body.requestHost = request.headers.get("host") ?? undefined;
      body.forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? undefined;
    }
    return NextResponse.json(body);
  }
}
