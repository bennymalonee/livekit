"use client";

import Link from "next/link";

const items = [
  { label: "INFRASTRUCTURE", href: "#infrastructure" },
  { label: "SOLUTIONS", href: "#solutions" },
  { label: "NETWORK", href: "#network" },
  { label: "PRICING", href: "#pricing" },
] as const;

export function LandingNavLinks() {
  return (
    <section className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6">
        {items.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="text-sm font-medium uppercase tracking-wide text-zinc-400 hover:text-zinc-200"
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
