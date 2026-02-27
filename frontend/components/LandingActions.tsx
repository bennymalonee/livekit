"use client";

import { useAuthToken } from "@convex-dev/auth/react";
import Link from "next/link";

export function LandingActions() {
  const token = useAuthToken();
  const isAuthenticated = token !== null && token !== undefined;

  if (isAuthenticated) {
    return (
      <section className="border-b border-zinc-800 bg-zinc-900/30 px-4 py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
          >
            Dashboard
          </Link>
          <Link
            href="/deploy"
            className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
          >
            Deploy LiveKit
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-zinc-800 bg-zinc-900/30 px-4 py-4">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
        >
          Get started
        </Link>
      </div>
    </section>
  );
}
