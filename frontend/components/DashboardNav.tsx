"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { STITCH_SCREENS } from "@/lib/stitch-screens";

const navStyle = {
  padding: "1rem",
  background: "#0f231d",
  color: "#fff",
  display: "flex",
  gap: "1rem",
  flexWrap: "wrap" as const,
  alignItems: "center",
};
const activeStyle = { color: "#01a875" };
const linkStyle = { color: "#ccc" };

export function DashboardNav() {
  const pathname = usePathname();
  const { signOut } = useAuthActions();

  return (
    <nav style={navStyle}>
      {STITCH_SCREENS.map((s) => (
        <Link
          key={s.id}
          href={s.path}
          style={pathname === s.path ? activeStyle : linkStyle}
        >
          {s.name}
        </Link>
      ))}
      <Link
        href="/deploy"
        style={pathname === "/deploy" ? activeStyle : linkStyle}
      >
        Deploy
      </Link>
      <span style={{ marginLeft: "auto" }}>
        <button
          type="button"
          onClick={() => void signOut()}
          style={{
            background: "transparent",
            color: "#ccc",
            border: "1px solid #555",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Sign out
        </button>
      </span>
    </nav>
  );
}
