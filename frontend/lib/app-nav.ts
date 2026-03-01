/**
 * Single source of truth for app navigation (hamburger menu).
 * - requireAuth: true → only shown when the user is logged in.
 * - guestOnly: true → only shown when the user is NOT logged in (e.g. Sign in / Sign up).
 * - roles: only show when user has one of these roles (admin | operator | viewer). Omit = all authenticated.
 */
export type AppRole = "admin" | "operator" | "viewer";

export const APP_NAV_STRUCTURE = [
  {
    section: "Overview",
    links: [
      { label: "Dashboard", path: "/dashboard", icon: "hub", requireAuth: true },
      { label: "Deploy LiveKit", path: "/deploy", icon: "rocket_launch", requireAuth: true, roles: ["admin"] as const },
    ],
  },
  {
    section: "Monitor",
    links: [
      { label: "Sessions", path: "/sessions", icon: "sensors", requireAuth: true },
      { label: "Analytics", path: "/analytics", icon: "bar_chart", requireAuth: true },
    ],
  },
  {
    section: "Infrastructure",
    links: [
      { label: "Modules", path: "/modules", icon: "view_module", requireAuth: true, roles: ["admin", "operator", "viewer"] as const },
      { label: "Diagnostics", path: "/diagnostics", icon: "bolt", requireAuth: true },
      { label: "Nodes", path: "/nodes", icon: "dns", requireAuth: true },
    ],
  },
  {
    section: "Security & Tools",
    links: [
      { label: "Vault", path: "/vault", icon: "shield", requireAuth: true, roles: ["admin"] as const },
      { label: "Audit Log", path: "/audit", icon: "history", requireAuth: true, roles: ["admin"] as const },
      { label: "API Keys", path: "/api-keys", icon: "key", requireAuth: true, roles: ["admin", "operator"] as const },
      { label: "Agents", path: "/agents", icon: "smart_toy", requireAuth: true, roles: ["admin", "operator"] as const },
      { label: "Terminal", path: "/terminal", icon: "terminal", requireAuth: true, roles: ["admin", "operator"] as const },
    ],
  },
  {
    section: "Account",
    links: [
      { label: "Sign in", path: "/login", icon: "login", guestOnly: true },
      { label: "Sign up", path: "/signup", icon: "person_add", guestOnly: true },
      { label: "Sign out", path: "#signout", icon: "logout", requireAuth: true, signOut: true },
    ],
  },
] as const;
