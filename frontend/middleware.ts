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

const authMiddleware = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isAuthPage(request) && (await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/dashboard");
  }
  if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
});

/**
 * Normalize Host so the auth proxy CORS check passes (Origin must match Host; else 403).
 * Behind a proxy, Host may be internal; use X-Forwarded-Host or Origin so Host matches
 * what the browser sent.
 */
function withNormalizedHost(request: NextRequest): NextRequest {
  const currentHost = request.headers.get("host") ?? "";
  let canonicalHost =
    request.headers.get("x-forwarded-host")?.split(",")[0].trim() ||
    (() => {
      try {
        const o = request.headers.get("origin");
        return o ? new URL(o).host : "";
      } catch {
        return "";
      }
    })() ||
    (() => {
      try {
        return new URL(request.url).host;
      } catch {
        return "";
      }
    })();
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
