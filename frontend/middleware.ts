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
    cookieConfig: { maxAge: 60 * 60 * 24 * 7 }, // 7 days
    verbose: false, // avoid "Unexpected missing refreshToken cookie" log spam when proxy/cookie domain differs
  }
);

/**
 * Resolve the public host so cookie names and CORS match (set and read use same Host).
 * Order: X-Forwarded-Host, Origin, Referer, NEXT_PUBLIC_APP_URL (when behind proxy), request.url.
 * Set NEXT_PUBLIC_APP_URL in Coolify (e.g. http://your-app.31.97.34.56.sslip.io) so auth cookies use the right domain when the proxy does not send X-Forwarded-Host.
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
  const requestHost = (() => {
    try {
      return new URL(request.url).host;
    } catch {
      return "";
    }
  })();
  const isLikelyInternal =
    !requestHost ||
    requestHost.startsWith("localhost") ||
    requestHost.startsWith("127.") ||
    requestHost.startsWith("10.") ||
    requestHost.startsWith("172.") ||
    requestHost.startsWith("192.168.");
  if (isLikelyInternal && process.env.NEXT_PUBLIC_APP_URL) {
    try {
      return new URL(process.env.NEXT_PUBLIC_APP_URL).host;
    } catch {}
  }
  return requestHost;
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
  // Skip auth for health check so Coolify/lb always get 200 without hitting Convex
  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }
  const normalized = withNormalizedHost(request);
  return authMiddleware(normalized, event as any);
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
