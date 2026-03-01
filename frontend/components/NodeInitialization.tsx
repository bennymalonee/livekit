"use client";

import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";

export function NodeInitialization() {
  const nodes = useQuery(api.nodes.listNodes);
  const myRole = useQuery(api.rbac.getMyRole);
  const myUserId = useQuery(api.rbac.getMyUserId);
  const syncFromCoolify = useAction(api.coolify.syncApplicationsToNodes);
  const bootstrapSetRole = useMutation(api.rbac.bootstrapSetRole);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapMessage, setBootstrapMessage] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  async function handleSync() {
    setSyncError(null);
    setSyncing(true);
    try {
      const result = await syncFromCoolify();
      if (result && !result.ok && result.error) {
        setSyncError(result.error);
      }
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const quickLinks = [
    { path: "/dashboard", icon: "hub", label: "Dashboard" },
    { path: "/deploy", icon: "rocket_launch", label: "Deploy" },
    { path: "/nodes", icon: "dns", label: "Nodes" },
    { path: "/sessions", icon: "sensors", label: "Sessions" },
    { path: "/analytics", icon: "bar_chart", label: "Analytics" },
    { path: "/diagnostics", icon: "bolt", label: "Diagnostics" },
    { path: "/modules", icon: "view_module", label: "Modules" },
    { path: "/vault", icon: "shield", label: "Vault" },
    { path: "/terminal", icon: "terminal", label: "Terminal" },
  ];

  return (
    <div className="font-body bg-background-light dark:bg-[#0A0B0D] text-slate-800 dark:text-slate-200 transition-colors duration-300 overflow-hidden min-h-screen flex flex-col">
      <nav className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-white/10 bg-white/5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">
          Quick links
        </span>
        {quickLinks.map(({ path, icon, label }) => (
          <Link
            key={path}
            href={path}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white text-xs font-medium transition-colors"
          >
            <span className="material-icons-round text-base">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 pt-4 pl-6 sm:pl-8">
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
            <div className="space-y-2">
              <p className="text-red-400 text-sm">{syncError}</p>
              {myRole === "viewer" && myUserId && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-sm">
                  <p className="text-amber-200 mb-2">No admin or operator role yet. If you’re the first user, you can make yourself admin:</p>
                  <button
                    type="button"
                    onClick={async () => {
                      setBootstrapMessage(null);
                      setBootstrapLoading(true);
                      try {
                        await bootstrapSetRole({ userId: myUserId, role: "admin" });
                        setBootstrapMessage("You are now admin. Refreshing…");
                        setSyncError(null);
                        window.location.reload();
                      } catch (e) {
                        setBootstrapMessage(e instanceof Error ? e.message : "Bootstrap failed");
                      } finally {
                        setBootstrapLoading(false);
                      }
                    }}
                    disabled={bootstrapLoading}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-medium px-3 py-1.5 rounded disabled:opacity-50"
                  >
                    {bootstrapLoading ? "Please wait…" : "Make me admin"}
                  </button>
                  {bootstrapMessage && (
                    <p className="mt-2 text-amber-200 text-xs">{bootstrapMessage}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {nodes === undefined ? (
            <p className="text-slate-500 text-sm">Loading nodes…</p>
          ) : nodes.length === 0 ? (
            <div className="space-y-2">
              <p className="text-slate-500 text-sm">
                No nodes yet. Click &quot;Sync from Coolify&quot; to pull applications from Coolify.
              </p>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Convex env required for Sync:</p>
                <p>Set in Convex Dashboard → Project → Environment variables:</p>
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li><code className="text-slate-300">COOLIFY_BASE_URL</code> — e.g. <code className="text-slate-300">http://YOUR_VPS_IP:8000</code></li>
                  <li><code className="text-slate-300">COOLIFY_API_TOKEN</code> — from Coolify → Keys &amp; Tokens</li>
                </ul>
              </div>
            </div>
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
                  {nodes.map((node: { _id: string; name: string; region: string; status: string; cpuLoad: number; memoryLoad: number; activeRooms: number; lastHeartbeatAt?: number }) => (
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
                      <td className="p-3 text-slate-500 font-mono text-xs" title={!node.lastHeartbeatAt ? "Value when available from Coolify" : undefined}>
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
