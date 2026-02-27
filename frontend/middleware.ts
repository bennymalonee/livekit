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
 * Normalize Host from request URL so cookie names match behind proxies (Coolify, etc.).
 * Auth cookies use __Host- prefix when not localhost; the name depends on the Host header.
 */
function withNormalizedHost(request: NextRequest): NextRequest {
  const url = new URL(request.url);
  const hostFromUrl = url.host;
  const hostFromHeader = request.headers.get("host") ?? "";
  if (!hostFromUrl || hostFromUrl === hostFromHeader) return request;
  const headers = new Headers(request.headers);
  headers.set("host", hostFromUrl);
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
