import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isAuthPage = createRouteMatcher(["/login", "/signup"]);
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/deploy(.*)",
  "/analytics(.*)",
  "/sessions(.*)",
  "/nodes(.*)",
  "/modules(.*)",
  "/vault(.*)",
  "/terminal(.*)",
  "/diagnostics(.*)",
]);

const authMiddleware = convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    if (isAuthPage(request) && (await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, "/dashboard");
    }
    if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, "/login");
    }
  },
  {
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
    // Persist cookie so it survives refresh; server can read it for middleware
    cookieConfig: { maxAge: 60 * 60 * 24 * 7 }, // 7 days
  }
);

/**
 * Resolve the public host so cookie names and CORS match (set and read use same Host).
 * Order: X-Forwarded-Host, Origin, Referer (for GET/link clicks), request.url.
 */
function getCanonicalHost(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
  if (forwarded) return forwarded;
  try {
    const o = request.headers.get("origin");
    if (o) return new URL(o).host;
  } catch {}
  try {
    const r = request.headers.get("referer");
    if (r) return new URL(r).host;
  } catch {}
  try {
    return new URL(request.url).host;
  } catch {}
  return "";
}

function withNormalizedHost(request: NextRequest): NextRequest {
  const currentHost = request.headers.get("host") ?? "";
  const canonicalHost = getCanonicalHost(request);
  if (!canonicalHost || canonicalHost === currentHost) return request;
  const headers = new Headers(request.headers);
  headers.set("host", canonicalHost);
  return new NextRequest(request.url, {
    method: request.method,
    headers,
    body: request.body,
  });
}

export default async function middleware(
  request: NextRequest,
  event: { request: NextRequest }
) {
  const normalized = withNormalizedHost(request);
  return authMiddleware(normalized, event as any);
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
