import { describe, it, expect } from "vitest";
import { APP_NAV_STRUCTURE, ROLE_ROUTE_RULES, type AppRole } from "./app-nav";

describe("app-nav", () => {
  it("ROLE_ROUTE_RULES has pathPrefix and roles array", () => {
    expect(ROLE_ROUTE_RULES.length).toBeGreaterThan(0);
    for (const rule of ROLE_ROUTE_RULES) {
      expect(rule.pathPrefix).toMatch(/^\/[a-z-]+/);
      expect(Array.isArray(rule.roles)).toBe(true);
      expect(rule.roles.length).toBeGreaterThan(0);
      for (const r of rule.roles) {
        expect(["admin", "operator", "viewer"]).toContain(r);
      }
    }
  });

  it("every ROLE_ROUTE_RULES path exists in APP_NAV_STRUCTURE with matching roles", () => {
    const navPaths = new Map<string, readonly AppRole[]>();
    for (const section of APP_NAV_STRUCTURE) {
      for (const link of section.links) {
        if ("path" in link && typeof link.path === "string" && link.path.startsWith("/") && "roles" in link && link.roles) {
          navPaths.set(link.path, link.roles);
        }
      }
    }
    for (const rule of ROLE_ROUTE_RULES) {
      const navRoles = navPaths.get(rule.pathPrefix);
      expect(navRoles).toBeDefined();
      expect([...rule.roles].sort().join(",")).toBe([...navRoles!].sort().join(","));
    }
  });
});
