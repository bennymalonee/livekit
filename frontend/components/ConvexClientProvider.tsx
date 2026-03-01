"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!convex) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0B0D] text-gray-200 p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-white">Configuration required</h1>
          <p className="text-sm text-slate-400">
            Set <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-200">NEXT_PUBLIC_CONVEX_URL</code> in your
            deployment environment (e.g. Coolify → Dashboard app → Environment variables).
          </p>
          <p className="text-xs text-slate-500">
            Value should be your Convex deployment URL (e.g. https://your-deployment.convex.cloud).
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
