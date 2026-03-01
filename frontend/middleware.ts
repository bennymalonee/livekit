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
  "/agents(.*)",
]);

const isHttpApp =
  typeof process.env.NEXT_PUBLIC_APP_URL === "string" &&
  process.env.NEXT_PUBLIC_APP_URL.startsWith("http://");

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
    cookieConfig: {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      ...(isHttpApp && { secure: false }), // allow cookie over HTTP when app URL is http
    },
    verbose: false, // avoid "Unexpected missing refreshToken cookie" log spam when proxy/cookie domain differs
  }
);

/**
 * Resolve the public host and protocol so cookie domain and request URL match the app's public origin.
 * Order: X-Forwarded-Host / X-Forwarded-Proto, Origin, Referer, NEXT_PUBLIC_APP_URL (when behind proxy), request.url.
 * Set NEXT_PUBLIC_APP_URL in Coolify so auth cookies use the right domain when the proxy does not send forwarded headers.
 */
function getCanonicalOrigin(request: NextRequest): string | null {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  if (forwardedHost) {
    const proto = forwardedProto === "https" ? "https" : "http";
    return `${proto}://${forwardedHost}`;
  }
  try {
    const o = request.headers.get("origin");
    if (o) return new URL(o).origin;
  } catch {}
  try {
    const r = request.headers.get("referer");
    if (r) return new URL(r).origin;
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
      return new URL(process.env.NEXT_PUBLIC_APP_URL).origin;
    } catch {}
  }
  return null;
}

function withNormalizedHost(request: NextRequest): NextRequest {
  const canonicalOrigin = getCanonicalOrigin(request);
  if (!canonicalOrigin) return request;
  try {
    const requestUrl = new URL(request.url);
    const currentOrigin = `${requestUrl.protocol}//${requestUrl.host}`;
    if (canonicalOrigin === currentOrigin) return request;
  } catch {
    return request;
  }
  const headers = new Headers(request.headers);
  headers.set("host", new URL(canonicalOrigin).host);
  const path = request.nextUrl.pathname + request.nextUrl.search;
  const publicUrl = canonicalOrigin + path;
  return new NextRequest(publicUrl, {
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
