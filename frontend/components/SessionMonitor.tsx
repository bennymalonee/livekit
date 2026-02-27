"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const FALLBACK_ROWS = [
  {
    id: "STREAM_0982_HD",
    source: "AWS-US-EAST-1",
    icon: "videocam",
    participants: "1,204",
    bitrate: "4.8 Mbps",
    quality: 90,
    status: "Optimal",
    statusClass: "bg-green-500/10 text-green-500",
  },
  {
    id: "LIVE_STAGE_PRO",
    source: "GC-EUROPE-W1",
    icon: "podcasts",
    participants: "842",
    bitrate: "2.1 Mbps",
    quality: 68,
    status: "Congested",
    statusClass: "bg-yellow-500/10 text-yellow-500",
  },
  {
    id: "DEV_CONF_MAIN",
    source: "AZURE-US-WEST",
    icon: "groups",
    participants: "2,490",
    bitrate: "8.4 Mbps",
    quality: 95,
    status: "Optimal",
    statusClass: "bg-green-500/10 text-green-500",
  },
];

export function SessionMonitor() {
  const activeSessions = useQuery(api.sessions.listActive);
  const totals = useQuery(api.sessions.getTotals);

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
      : FALLBACK_ROWS;

  const totalDurationMs = totals?.totalDurationMs ?? 0;
  const hours = Math.floor(totalDurationMs / (60 * 60 * 1000));
  const minutes = Math.floor((totalDurationMs % (60 * 60 * 1000)) / (60 * 1000));

  return (
    <div className="bg-background-light dark:bg-[#121418] text-slate-800 dark:text-slate-200 min-h-screen flex font-sans pt-2 pl-16 sm:pl-20">
      <aside className="w-20 lg:w-24 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-8 gap-10 bg-white dark:bg-card-dark">
        <div className="text-dash-primary">
          <span className="material-icons-outlined text-4xl">bolt</span>
        </div>
        <div className="flex flex-col gap-8" aria-label="Page context">
          <span className="text-dash-primary relative cursor-default">
            <span className="material-icons-outlined">sensors</span>
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-dash-primary rounded-full shadow-[0_0_15px_rgba(255,107,0,0.3)]" />
          </span>
        </div>
        <div className="mt-auto">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
            <span className="material-icons-outlined text-slate-500">person</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col p-6 lg:p-10 gap-8 overflow-hidden">
        <header className="flex justify-between items-end">
          <div>
            <h2 className="text-slate-400 text-sm font-medium tracking-widest uppercase mb-1">
              Infrastructure
            </h2>
            <h1 className="text-4xl font-space-grotesk font-bold dark:text-white uppercase tracking-tight">
              Real-time <span className="text-dash-primary">Monitor</span>
            </h1>
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
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-space-grotesk font-semibold uppercase tracking-wider">
                Active Rooms
              </h3>
              <Link
                href="/deploy"
                className="bg-dash-primary px-4 py-2 rounded-lg text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                + New Instance
              </Link>
            </div>
              <div className="flex-1 overflow-y-auto p-6">
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
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Active Nodes:
            </span>
            <span className="text-sm font-bold text-dash-primary">128</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Total Uptime:
            </span>
            <span className="text-sm font-bold text-dash-primary">99.998%</span>
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
