"use client";

import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { ROLE_ROUTE_RULES, type AppRole } from "@/lib/app-nav";

/**
 * Redirects to /dashboard when the user is authenticated but their role is not allowed for the current route.
 * Complements middleware (auth-only) and nav link visibility; prevents direct URL access to forbidden pages.
 */
export function RoleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useQuery(api.rbac.getMyRole) ?? null;

  useEffect(() => {
    if (pathname == null) return;
    const rule = ROLE_ROUTE_RULES.find((r) => pathname === r.pathPrefix || pathname.startsWith(r.pathPrefix + "/"));
    if (!rule) return;
    // Still loading role
    if (role === undefined) return;
    // No role or role not in allowed list -> redirect to dashboard
    if (role === null || !(rule.roles as readonly AppRole[]).includes(role)) {
      router.replace("/dashboard");
    }
  }, [pathname, role, router]);

  return <>{children}</>;
}
