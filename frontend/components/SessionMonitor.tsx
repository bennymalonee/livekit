"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function SessionMonitor() {
  const activeSessions = useQuery(api.sessions.listActive);
  const totals = useQuery(api.sessions.getTotals);
  const nodes = useQuery(api.nodes.listNodes);
  const seedDemoSessions = useMutation(api.sessions.seedDemoSessions);
  const [seeding, setSeeding] = useState(false);

  const activeNodesCount =
    nodes && nodes.length > 0
      ? nodes.filter((n) => n.status === "online").length
      : null;

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const rows =
    activeSessions && activeSessions.length > 0
      ? activeSessions.map((s) => ({
          id: s.roomName,
          source: `${s.source}-${s.region}`,
          icon: s.icon,
          participants: s.participantCount.toLocaleString(),
          bitrate: `${s.bitrateMbps.toFixed(1)} Mbps`,
          quality: s.qualityScore,
          status: s.status,
          statusClass:
            s.status === "Optimal"
              ? "bg-green-500/10 text-green-500"
              : s.status === "Congested"
                ? "bg-yellow-500/10 text-yellow-500"
                : "bg-slate-500/10 text-slate-300",
        }))
      : [];

  const totalDurationMs = totals?.totalDurationMs ?? 0;
  const hours = Math.floor(totalDurationMs / (60 * 60 * 1000));
  const minutes = Math.floor((totalDurationMs % (60 * 60 * 1000)) / (60 * 1000));

  return (
    <div className="bg-background-light dark:bg-[#121418] text-slate-800 dark:text-slate-200 min-h-screen flex flex-col font-sans">
      <nav className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-card-dark">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">
          Quick links
        </span>
        {[
          { path: "/dashboard", icon: "hub", label: "Dashboard" },
          { path: "/deploy", icon: "rocket_launch", label: "Deploy" },
          { path: "/nodes", icon: "dns", label: "Nodes" },
          { path: "/analytics", icon: "bar_chart", label: "Analytics" },
          { path: "/diagnostics", icon: "bolt", label: "Diagnostics" },
          { path: "/modules", icon: "view_module", label: "Modules" },
          { path: "/vault", icon: "shield", label: "Vault" },
          { path: "/terminal", icon: "terminal", label: "Terminal" },
        ].map(({ path, icon, label }) => (
          <Link
            key={path}
            href={path}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors"
          >
            <span className="material-icons-round text-base">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      <main className="flex-1 flex flex-col p-6 lg:p-10 gap-8 overflow-hidden">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-space-grotesk font-bold dark:text-white uppercase tracking-tight">
              Real-time <span className="text-dash-primary">Monitor</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-widest uppercase mt-1">
              Active rooms and session totals
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-card-dark p-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 px-4 border-r border-slate-200 dark:border-slate-800">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider">System Live</span>
            </div>
            <div className="px-4">
              <span className="text-xs text-slate-400 block uppercase">Server Load</span>
              <span className="text-sm font-bold">24.8%</span>
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
          <section className="col-span-12 lg:col-span-8 bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-space-grotesk font-semibold uppercase tracking-wider">
                Active Rooms
              </h3>
              <div className="flex items-center gap-2">
                {rows.length === 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      setSeeding(true);
                      try {
                        await seedDemoSessions();
                      } finally {
                        setSeeding(false);
                      }
                    }}
                    disabled={seeding}
                    className="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    {seeding ? "Seeding…" : "Seed demo data"}
                  </button>
                )}
                <Link
                  href="/deploy"
                  className="bg-dash-primary px-4 py-2 rounded-lg text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  + New Instance
                </Link>
              </div>
            </div>
              <div className="flex-1 overflow-y-auto p-6">
              {rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm">
                  <span className="material-icons-outlined text-4xl mb-2">videocam_off</span>
                  <p>No active sessions. Connect LiveKit or seed demo data.</p>
                </div>
              ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                    <th className="pb-4 font-normal">Room ID / Source</th>
                    <th className="pb-4 font-normal text-center">Participants</th>
                    <th className="pb-4 font-normal text-center">Bitrate</th>
                    <th className="pb-4 font-normal text-center">Quality</th>
                    <th className="pb-4 font-normal text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((row) => (
                    <tr key={row.id} className="orange-divider relative">
                      <td className="py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-slate-100 dark:bg-[#1E2025] flex items-center justify-center text-dash-primary">
                            <span className="material-icons-outlined">{row.icon}</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold dark:text-white">{row.id}</div>
                            <div className="text-xs text-slate-400">{row.source}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 text-center">
                        <span className="text-2xl font-space-grotesk font-bold text-dash-primary text-glow">
                          {row.participants}
                        </span>
                      </td>
                      <td className="py-6 text-center">
                        <span className="text-sm font-mono dark:text-slate-300">
                          {row.bitrate}
                        </span>
                      </td>
                      <td className="py-6">
                        <div className="flex justify-center">
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <svg
                              className="w-12 h-12 -rotate-90"
                              viewBox="0 0 48 48"
                            >
                              <circle
                                className="text-slate-200 dark:text-slate-800"
                                cx="24"
                                cy="24"
                                fill="none"
                                r="20"
                                stroke="currentColor"
                                strokeWidth={3}
                              />
                              <circle
                                className={row.quality >= 90 ? "text-dash-primary" : "text-dash-primary/70"}
                                cx="24"
                                cy="24"
                                fill="none"
                                r="20"
                                stroke="currentColor"
                                strokeDasharray="125.6"
                                strokeDashoffset={125.6 - (row.quality / 100) * 125.6}
                                strokeWidth={3}
                              />
                            </svg>
                            <span className="absolute text-[10px] font-bold">{row.quality}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 text-right">
                        <span
                          className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${row.statusClass}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </section>

          <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-4">
                  Total Session Time
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-space-grotesk font-bold dark:text-white">
                    {hours.toString().padStart(2, "0")}
                  </span>
                  <span className="text-xl text-slate-400 font-space-grotesk">HR</span>
                  <span className="text-5xl font-space-grotesk font-bold dark:text-white ml-2">
                    {minutes.toString().padStart(2, "0")}
                  </span>
                  <span className="text-xl text-slate-400 font-space-grotesk">M</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs uppercase tracking-widest font-bold text-slate-400">
                  <span>Efficiency</span>
                  <span className="text-dash-primary">98.2%</span>
                </div>
                <div className="h-1 bg-slate-100 dark:bg-[#1E2025] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-dash-primary w-[98%] shadow-[0_0_15px_rgba(255,107,0,0.3)]" />
                </div>
              </div>
            </div>
            <div className="flex-1 bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                  Real-time Signal
                </h3>
                <div className="flex items-center gap-1 text-dash-primary">
                  <span className="material-icons-outlined text-sm">wifi_tethering</span>
                  <span className="text-[10px] font-bold uppercase">Active</span>
                </div>
              </div>
              <div className="flex-1 flex items-end justify-between gap-1 h-32">
                {[
                  40, 60, 80, 50, 90, 30, 70, 100, 85, 45, 35, 65, 55, 40, 75, 95, 50, 30,
                ].map((h, i) => (
                  <div
                    key={i}
                    className="waveform-bar w-1 bg-dash-primary rounded-full flex-1"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 0.1}s`,
                      opacity: 0.2 + (i % 5) * 0.2,
                    }}
                  />
                ))}
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-[#1E2025] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">
                    Packet Loss
                  </span>
                  <span className="text-sm font-bold">0.02%</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#1E2025] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Latency</span>
                  <span className="text-sm font-bold">14ms</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="flex items-center gap-12 bg-white dark:bg-card-dark px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Global Outgress:
            </span>
            <span className="text-sm font-bold text-dash-primary">24.5 GB/s</span>
            <span className="text-[9px] text-slate-500 uppercase">(demo)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Active Nodes:
            </span>
            <span className="text-sm font-bold text-dash-primary">
              {activeNodesCount !== null ? activeNodesCount : "—"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Total Uptime:
            </span>
            <span className="text-sm font-bold text-dash-primary">99.998%</span>
            <span className="text-[9px] text-slate-500 uppercase">(demo)</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-dash-primary animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-widest dark:text-slate-400">
              Cluster Syncing...
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
