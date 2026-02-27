import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";

/**
 * GET /api/auth-status - Returns whether the current request has valid auth.
 * Used by the login page to poll after sign-in before redirecting.
 */
export async function GET() {
  try {
    const authenticated = await isAuthenticatedNextjs();
    return NextResponse.json({ ok: true, authenticated });
  } catch {
    return NextResponse.json({ ok: true, authenticated: false });
  }
}
