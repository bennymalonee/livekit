"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

export default function DeployPage() {
  const deployments = useQuery(api.deployments.listByUser);
  const createDeployment = useMutation(api.deployments.create);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const livekitUrl =
    process.env.NEXT_PUBLIC_LIVEKIT_URL || "https://your-livekit-url.example.com";

  async function handleDeploy() {
    setError(null);
    setLoading(true);
    try {
      await createDeployment({ status: "pending" });
      const res = await fetch("/api/deploy", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Deploy failed (${res.status})`);
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deploy failed");
    } finally {
      setLoading(false);
    }
  }

  const latest = deployments?.[0];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-2xl mx-auto">
        <nav className="mb-8">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-zinc-200 text-sm"
          >
            ← Dashboard
          </Link>
        </nav>
        <h1 className="text-2xl font-semibold mb-2">Deploy LiveKit to VPS</h1>
        <p className="text-zinc-400 mb-6">
          Trigger a deployment of the LiveKit stack on your VPS via Coolify.
        </p>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
          <button
            onClick={handleDeploy}
            disabled={loading}
            className="w-full rounded-md bg-amber-600 px-4 py-3 font-medium text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            {loading ? "Triggering deploy…" : "Deploy LiveKit to VPS"}
          </button>

          {error && (
            <div className="rounded-md bg-red-950/50 border border-red-800 text-red-200 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <h2 className="text-sm font-medium text-zinc-400 mb-2">
              LiveKit URL
            </h2>
            <p className="text-zinc-200 font-mono text-sm break-all">
              {latest?.livekitUrl || livekitUrl}
            </p>
            {latest?.livekitUrl && (
              <a
                href={latest.livekitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500 hover:underline text-sm mt-1 inline-block"
              >
                Open LiveKit →
              </a>
            )}
          </div>

          <div>
            <h2 className="text-sm font-medium text-zinc-400 mb-2">
              Recent deployments
            </h2>
            {deployments === undefined ? (
              <p className="text-zinc-500 text-sm">Loading…</p>
            ) : deployments.length === 0 ? (
              <p className="text-zinc-500 text-sm">
                No deployments yet. Click the button above to trigger one.
              </p>
            ) : (
              <ul className="space-y-2">
                {deployments.map((d) => (
                  <li
                    key={d._id}
                    className="flex items-center justify-between text-sm py-2 border-b border-zinc-800 last:border-0"
                  >
                    <span className="text-zinc-300">
                      {new Date(d.createdAt).toLocaleString()}
                    </span>
                    <span
                      className={`font-medium ${
                        d.status === "success"
                          ? "text-green-400"
                          : d.status === "failed"
                            ? "text-red-400"
                            : d.status === "running"
                              ? "text-amber-400"
                              : "text-zinc-400"
                      }`}
                    >
                      {d.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-zinc-500 text-xs">
            Configure the Coolify deploy webhook in your Coolify project and set{" "}
            <code className="bg-zinc-800 px-1 rounded">
              COOLIFY_DEPLOY_WEBHOOK_URL
            </code>{" "}
            in the dashboard environment to enable one-click deploy.
          </p>
        </div>
      </div>
    </main>
  );
}
