"use client";

import Link from "next/link";
import { useAction, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";

export function NodeInitialization() {
  const nodes = useQuery(api.nodes.listNodes);
  const syncFromCoolify = useAction(api.coolify.syncApplicationsToNodes);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  async function handleSync() {
    setSyncError(null);
    setSyncing(true);
    try {
      await syncFromCoolify();
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="font-body bg-background-light dark:bg-[#0A0B0D] text-slate-800 dark:text-slate-200 transition-colors duration-300 overflow-hidden min-h-screen pt-4 pl-16 sm:pl-20">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
              Nodes
            </h1>
            <p className="text-slate-400 font-mono text-sm mt-1">
              Coolify applications synced as infrastructure nodes
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-slate-500 hover:text-white transition-colors p-2"
          >
            <span className="material-icons-round">close</span>
          </Link>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-dash-primary hover:bg-orange-600 text-white font-display font-semibold px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {syncing ? "Syncing…" : "Sync from Coolify"}
              <span className="material-icons-round text-lg">sync</span>
            </button>
            <Link
              href="/deploy"
              className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
            >
              Deploy LiveKit
              <span className="material-icons-round text-sm">arrow_forward</span>
            </Link>
          </div>
          {syncError && (
            <p className="text-red-400 text-sm">{syncError}</p>
          )}

          {nodes === undefined ? (
            <p className="text-slate-500 text-sm">Loading nodes…</p>
          ) : nodes.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No nodes yet. Click &quot;Sync from Coolify&quot; to pull applications (requires COOLIFY_BASE_URL and COOLIFY_API_TOKEN in Convex).
            </p>
          ) : (
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-3 font-mono text-slate-500 uppercase text-xs">Name</th>
                    <th className="p-3 font-mono text-slate-500 uppercase text-xs">Region</th>
                    <th className="p-3 font-mono text-slate-500 uppercase text-xs">Status</th>
                    <th className="p-3 font-mono text-slate-500 uppercase text-xs">Last heartbeat</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((node) => (
                    <tr key={node._id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 text-white font-medium">{node.name}</td>
                      <td className="p-3 text-slate-400">{node.region}</td>
                      <td className="p-3">
                        <span
                          className={
                            node.status === "online"
                              ? "text-green-400"
                              : node.status === "offline"
                                ? "text-amber-400"
                                : "text-slate-400"
                          }
                        >
                          {node.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-xs">
                        {node.lastHeartbeatAt
                          ? new Date(node.lastHeartbeatAt).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
