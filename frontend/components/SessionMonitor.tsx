"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getLiveKitWebhookUrl } from "@/lib/livekit-webhook-url";

const TIME_RANGES: { label: string; sinceMs?: number; value: string }[] = [
  { label: "All", sinceMs: undefined, value: "all" },
  { label: "Last 1h", sinceMs: 60 * 60 * 1000, value: "3600000" },
  { label: "Last 24h", sinceMs: 24 * 60 * 60 * 1000, value: "86400000" },
  { label: "Last 7d", sinceMs: 7 * 24 * 60 * 60 * 1000, value: "604800000" },
];

export function SessionMonitor() {
  const [roomFilter, setRoomFilter] = useState("");
  const [timeRange, setTimeRange] = useState<number | undefined>(undefined);

  const activeSessions = useQuery(api.sessions.listActive, {
    roomName: roomFilter.trim() || undefined,
    sinceMs: timeRange,
  });
  const totals = useQuery(api.sessions.getTotals, {
    roomName: roomFilter.trim() || undefined,
    sinceMs: timeRange ?? 24 * 60 * 60 * 1000,
  });
  const nodes = useQuery(api.nodes.listNodes);
  const analyticsOverview = useQuery(api.analytics.getOverview, {});

  const activeNodesCount =
    nodes && nodes.length > 0
      ? nodes.filter((n: { status: string }) => n.status === "online").length
      : null;

  const serverLoadPercent =
    nodes && nodes.length > 0
      ? Math.round(
          nodes.reduce((sum: number, n: { memoryLoad: number; cpuLoad: number }) => sum + n.memoryLoad + n.cpuLoad, 0) /
            (nodes.length * 2)
        )
      : null;

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const rows =
    activeSessions && activeSessions.length > 0
      ? activeSessions.map((s: { _id: string; roomName: string; participantCount: number; region?: string; bitrateMbps?: number; source?: string; icon?: string; qualityScore?: number; status?: string }) => ({
          id: s.roomName,
          source: `${s.source}-${s.region}`,
          icon: s.icon,
          participants: s.participantCount.toLocaleString(),
          bitrate: `${(s.bitrateMbps ?? 0).toFixed(1)} Mbps`,
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

  const webhookUrl = getLiveKitWebhookUrl();
  const [copied, setCopied] = useState(false);
  const copyWebhook = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        {webhookUrl && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live data: LiveKit webhook</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Point your LiveKit server webhook to this Convex HTTP URL so room/participant events populate Sessions:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 text-xs font-mono bg-slate-200 dark:bg-slate-800 px-3 py-2 rounded-lg truncate">
                {webhookUrl}
              </code>
              <button
                type="button"
                onClick={copyWebhook}
                className="shrink-0 px-3 py-2 rounded-lg bg-dash-primary text-white text-xs font-semibold hover:opacity-90"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              In LiveKit server config or LiveKit Cloud, set this as the webhook URL. Events: room_started, room_finished, participant_joined, participant_left.
            </p>
          </div>
        )}
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
            <div className="px-4" title={serverLoadPercent == null ? "Sync nodes from Coolify for real load" : undefined}>
              <span className="text-xs text-slate-400 block uppercase">Server Load</span>
              <span className="text-sm font-bold">{serverLoadPercent != null ? `${serverLoadPercent}%` : "—"}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
          <section className="col-span-12 lg:col-span-8 bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="font-space-grotesk font-semibold uppercase tracking-wider">
                  Active Rooms
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Filter by room..."
                    value={roomFilter}
                    onChange={(e) => setRoomFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 min-w-[140px]"
                  />
                  <select
                    value={timeRange === undefined ? "all" : String(timeRange)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTimeRange(v === "all" ? undefined : Number(v));
                    }}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 min-w-[100px]"
                  >
                    {TIME_RANGES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end items-center gap-2">
                {rows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const header = "Room ID,Source,Participants,Bitrate,Quality,Status\n";
                      const body = rows
                        .map(
                          (r: { id: string; source: string; participants: string; bitrate: string; quality?: number; status?: string }) =>
                            `"${r.id}","${r.source}",${r.participants},"${r.bitrate}",${r.quality ?? ""},"${r.status ?? ""}"`
                        )
                        .join("\n");
                      const blob = new Blob([header + body], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `sessions-${new Date().toISOString().slice(0, 10)}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg text-white text-xs font-bold uppercase tracking-widest"
                  >
                    Export CSV
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
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm text-center">
                  <span className="material-icons-outlined text-4xl mb-2">videocam_off</span>
                  <p>No active sessions. Configure the LiveKit webhook to your Convex deployment to see live rooms and participants.</p>
                  <Link href="/deploy" className="mt-3 text-dash-primary text-xs font-semibold hover:underline">Deploy LiveKit</Link>
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
                  {rows.map((row: { id: string; source: string; participants: string; bitrate: string; quality?: number; status?: string; icon?: string; statusClass: string }) => (
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
                                className={(row.quality ?? 0) >= 90 ? "text-dash-primary" : "text-dash-primary/70"}
                                cx="24"
                                cy="24"
                                fill="none"
                                r="20"
                                stroke="currentColor"
                                strokeDasharray="125.6"
                                strokeDashoffset={125.6 - ((row.quality ?? 0) / 100) * 125.6}
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
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800" title="Derived from session/quality data when available">
                <div className="flex justify-between items-center text-xs uppercase tracking-widest font-bold text-slate-400">
                  <span>Efficiency</span>
                  <span className="text-slate-500">—</span>
                </div>
                <div className="h-1 bg-slate-100 dark:bg-[#1E2025] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-slate-300 dark:bg-slate-600 w-0" />
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
                <div className="bg-slate-50 dark:bg-[#1E2025] p-3 rounded-xl border border-slate-200 dark:border-slate-800" title="When available from LiveKit">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">
                    Packet Loss
                  </span>
                  <span className="text-sm font-bold text-slate-500">—</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#1E2025] p-3 rounded-xl border border-slate-200 dark:border-slate-800" title="When available from LiveKit">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Latency</span>
                  <span className="text-sm font-bold text-slate-500">—</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="flex items-center gap-12 bg-white dark:bg-card-dark px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex-wrap">
          <Link
            href="/analytics"
            className="flex items-center gap-3 rounded-lg px-2 py-1 -mx-2 -my-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
            title={analyticsOverview?.totalEgressGbps != null ? "View traffic details in Analytics" : "Live egress appears when sessions are active and the analytics sync has run"}
          >
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Global Outgress:
            </span>
            <span className="text-sm font-bold text-dash-primary group-hover:underline">
              {analyticsOverview?.totalEgressGbps != null ? `${analyticsOverview.totalEgressGbps.toFixed(1)} GB/s` : "—"}
            </span>
          </Link>
          <Link
            href="/nodes"
            className="flex items-center gap-3 rounded-lg px-2 py-1 -mx-2 -my-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
            title={activeNodesCount !== null ? "View nodes" : "Sync nodes from Coolify in Deploy or Nodes"}
          >
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Active Nodes:
            </span>
            <span className="text-sm font-bold text-dash-primary group-hover:underline">
              {activeNodesCount !== null ? activeNodesCount : "—"}
            </span>
          </Link>
          <Link
            href="/diagnostics"
            className="flex items-center gap-3 rounded-lg px-2 py-1 -mx-2 -my-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
            title="Real uptime when available from nodes or Coolify; open Diagnostics"
          >
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Total Uptime:
            </span>
            <span className="text-sm font-bold text-dash-primary group-hover:underline">
              —
            </span>
          </Link>
          <Link
            href="/deploy"
            className="ml-auto flex items-center gap-2 rounded-lg px-2 py-1 -mr-2 -my-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
            title="Sync cluster from Coolify"
          >
            <div className={`w-2 h-2 rounded-full ${nodes && nodes.length > 0 ? "bg-emerald-500" : "bg-dash-primary animate-ping"}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest dark:text-slate-400 group-hover:underline">
              {nodes && nodes.length > 0 ? "Cluster synced" : "Sync from Coolify"}
            </span>
          </Link>
        </footer>
      </main>
    </div>
  );
}
