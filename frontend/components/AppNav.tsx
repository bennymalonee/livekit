"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { useAuthToken, useAuthActions } from "@convex-dev/auth/react";
import { APP_NAV_STRUCTURE } from "@/lib/app-nav";

/** Routes where the hamburger (dashboard nav) is shown. Hidden on landing (/) so landing has only its own nav. */
const SHOW_HAMBURGER_PATHNAMES = [
  "/login",
  "/signup",
  "/dashboard",
  "/deploy",
  "/analytics",
  "/sessions",
  "/nodes",
  "/modules",
  "/vault",
  "/terminal",
  "/diagnostics",
];

function pathnameShowsHamburger(pathname: string): boolean {
  if (pathname === "/") return false;
  return SHOW_HAMBURGER_PATHNAMES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function AppNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const token = useAuthToken();
  const { signOut } = useAuthActions();
  const isAuthenticated = token != null;

  const close = useCallback(() => setOpen(false), []);

  function handleSignOut() {
    close();
    void signOut();
  }

  if (!pathnameShowsHamburger(pathname ?? "")) {
    return null;
  }

  return (
    <>
      {/* Hamburger button - fixed top-left */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed top-4 left-4 z-[100] w-11 h-11 rounded-lg bg-surface-dark border border-white/10 hover:border-primary/50 hover:bg-white/5 flex flex-col items-center justify-center gap-1.5 transition-colors shadow-lg"
        aria-label="Open menu"
      >
        <span className="w-5 h-0.5 bg-gray-300 rounded-full" />
        <span className="w-5 h-0.5 bg-gray-300 rounded-full" />
        <span className="w-5 h-0.5 bg-gray-300 rounded-full" />
      </button>

      {/* Overlay when sidebar open */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
          onClick={close}
        />
      )}

      {/* Sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 z-[95] h-full w-72 max-w-[85vw] bg-surface-dark border-r border-white/10 shadow-2xl transition-transform duration-200 ease-out flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-primary text-2xl">bolt</span>
            <span className="font-display font-bold text-lg tracking-widest text-white">
              LIVKIT
            </span>
          </div>
          <button
            type="button"
            onClick={close}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {APP_NAV_STRUCTURE.map((group) => {
            const links = group.links.filter((link) => {
              const showWhenAuth = !("requireAuth" in link && link.requireAuth) || isAuthenticated;
              const hideWhenAuth = ("guestOnly" in link && link.guestOnly) && isAuthenticated;
              return showWhenAuth && !hideWhenAuth;
            });
            if (links.length === 0) return null;
            return (
              <div key={group.section}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-2">
                  {group.section}
                </p>
                <ul className="space-y-0.5">
                  {links.map((link) => {
                    const isSignOut = "signOut" in link && link.signOut;
                    const isActive = !isSignOut && pathname === link.path;
                    const baseClass = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                      isActive
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-gray-300 hover:bg-white/5 hover:text-white border border-transparent"
                    }`;
                    return (
                      <li key={link.path}>
                        {isSignOut ? (
                          <button
                            type="button"
                            onClick={handleSignOut}
                            className={baseClass}
                          >
                            <span className="material-icons-round text-xl opacity-90">
                              {link.icon}
                            </span>
                            {link.label}
                          </button>
                        ) : (
                          <Link
                            href={link.path}
                            onClick={close}
                            className={baseClass}
                          >
                            <span className="material-icons-round text-xl opacity-90">
                              {link.icon}
                            </span>
                            {link.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 text-[10px] text-slate-500 uppercase tracking-widest">
          LivKit Enterprise
        </div>
      </aside>
    </>
  );
}
