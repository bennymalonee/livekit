"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const DASHBOARD_APP_UUID = process.env.NEXT_PUBLIC_COOLIFY_DASHBOARD_APP_UUID ?? "";
const LIVEKIT_STACK_UUID = process.env.NEXT_PUBLIC_COOLIFY_LIVEKIT_STACK_APP_UUID ?? "";

export function EdgeDiagnostics() {
  const nodes = useQuery(api.nodes.listNodes);
  const analytics = useQuery(api.analytics.getOverview);
  const diagnosticsEvents = useQuery(api.diagnostics.listRecent, { limit: 30 });
  const getApplicationLogs = useAction(api.coolify.getApplicationLogs);
  const [coolifyLogs, setCoolifyLogs] = useState<{ dashboard?: string; livekit?: string }>({});
  const [coolifyLoading, setCoolifyLoading] = useState<"dashboard" | "livekit" | null>(null);
  const [coolifyError, setCoolifyError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const activeNodes =
    nodes && nodes.length > 0
      ? nodes.filter((n) => n.status === "online").length
      : null;

  const totalEgressTbps =
    analytics && analytics.totalEgressGbps > 0
      ? analytics.totalEgressGbps
      : null;

  const rawRegionBars =
    analytics && analytics.regions.length > 0
      ? analytics.regions.slice(0, 4).map((r) => {
          const maxGbps = Math.max(
            ...analytics!.regions.slice(0, 4).map((x) => x.egressGbps),
            1
          );
          const pct = maxGbps > 0 ? (r.egressGbps / maxGbps) * 100 : 0;
          const w =
            pct >= 75 ? "w-3/4" : pct >= 50 ? "w-2/3" : pct >= 25 ? "w-1/2" : pct > 0 ? "w-1/4" : "w-0";
          return {
            label: r.region.toUpperCase().replace(/-/g, "-"),
            w,
            inactive: r.egressGbps <= 0,
          };
        })
      : [
          { label: "US-EAST-1", w: "w-3/4", inactive: false },
          { label: "EU-WEST-1", w: "w-1/4", inactive: false },
          { label: "AP-SOUTH-2", w: "w-0", inactive: true },
          { label: "SA-EAST-1", w: "w-0", inactive: true },
        ];

  const regionBars = [
    ...rawRegionBars,
    ...Array.from({ length: Math.max(0, 4 - rawRegionBars.length) }, (_, i) => ({
      label: `REGION-${rawRegionBars.length + i + 1}`,
      w: "w-0" as const,
      inactive: true,
    })),
  ];

  return (
    <div
      className="text-slate-300 font-sans min-h-screen pt-2 pl-16 sm:pl-20"
      style={{
        backgroundColor: "#0B0C0E",
        backgroundImage: "radial-gradient(rgba(255, 107, 0, 0.05) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }}
    >
      <header className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#0B0C0E]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-dash-primary rounded flex items-center justify-center">
            <span className="material-icons-outlined text-white text-xl">bolt</span>
          </div>
          <span className="font-space-grotesk font-bold text-xl tracking-wider text-white">
            EDGE CORE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <span className="material-icons-outlined text-xl">notifications</span>
          </button>
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <span className="material-icons-outlined text-xl">settings</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-dash-primary/20 border border-dash-primary/40 flex items-center justify-center overflow-hidden">
            <span className="material-icons-outlined text-dash-primary">person</span>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#16171B] border border-white/5 rounded-2xl p-8 relative overflow-hidden min-h-[500px]">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="font-space-grotesk text-4xl font-bold text-white tracking-tight">
                  GLOBAL EDGE
                  <br />
                  TRAFFIC
                </h1>
                <p className="text-slate-500 mt-2 text-sm uppercase tracking-widest">
                  Live Infrastructure Topology
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 flex gap-6">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                    Active Nodes
                  </p>
                  <p className="text-xl font-space-grotesk font-bold text-white">
                    {activeNodes !== null ? activeNodes.toLocaleString() : "0"}
                  </p>
                </div>
                <div className="border-l border-white/10 h-full" />
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                    Total Egress
                  </p>
                  <p className="text-xl font-space-grotesk font-bold text-dash-primary">
                    {(totalEgressTbps ?? 0).toFixed(0)} GB/s
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none mt-20">
              <svg fill="none" height="400" viewBox="0 0 800 400" width="800">
                <defs>
                  <linearGradient
                    id="paint0_linear"
                    x1="50"
                    x2="600"
                    y1="200"
                    y2="50"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#FF6B00" />
                    <stop offset="1" stopColor="#FF6B00" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient
                    id="paint1_linear"
                    x1="50"
                    x2="600"
                    y1="200"
                    y2="150"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#FF6B00" />
                    <stop offset="1" stopColor="#FF6B00" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient
                    id="paint2_linear"
                    x1="50"
                    x2="600"
                    y1="200"
                    y2="250"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#475569" />
                    <stop offset="1" stopColor="#475569" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient
                    id="paint3_linear"
                    x1="50"
                    x2="600"
                    y1="200"
                    y2="350"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#475569" />
                    <stop offset="1" stopColor="#475569" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  className="energy-path"
                  d="M50 200 C 200 200, 300 50, 600 50"
                  stroke="url(#paint0_linear)"
                  strokeWidth={2}
                  fill="none"
                />
                <path
                  className="energy-path"
                  d="M50 200 C 200 200, 300 150, 600 150"
                  stroke="url(#paint1_linear)"
                  strokeWidth={2}
                  style={{ animationDelay: "1s" }}
                  fill="none"
                />
                <path
                  className="energy-path"
                  d="M50 200 C 200 200, 300 250, 600 250"
                  stroke="url(#paint2_linear)"
                  strokeWidth={2}
                  style={{ animationDelay: "2s" }}
                  fill="none"
                />
                <path
                  className="energy-path"
                  d="M50 200 C 200 200, 300 350, 600 350"
                  stroke="url(#paint3_linear)"
                  strokeWidth={2}
                  style={{ animationDelay: "0.5s" }}
                  fill="none"
                />
                <circle cx="600" cy="50" fill="#FF6B00" r="4" />
                <circle cx="600" cy="150" fill="#FF6B00" r="4" />
                <circle cx="600" cy="250" fill="#475569" r="4" />
                <circle cx="600" cy="350" fill="#475569" r="4" />
              </svg>
            </div>
            <div className="relative z-10 flex flex-col justify-center h-64 ml-auto w-48 space-y-12 mr-10">
              {regionBars.map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-3 rounded-full border relative overflow-hidden ${
                      r.inactive ? "bg-white/5 border-white/10" : "bg-dash-primary/20 border-dash-primary/50"
                    }`}
                  >
                    {!r.inactive && (
                      <div
                        className={`absolute inset-y-0 left-0 ${r.w} bg-dash-primary shadow-[0_0_15px_rgba(255,107,0,0.4)]`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-bold ${r.inactive ? "text-slate-500" : "text-white"}`}
                  >
                    {r.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute bottom-8 left-8 flex gap-12">
              <div>
                <p className="text-white font-space-grotesk text-2xl font-bold">
                  12<span className="text-xs ml-1 text-slate-400">MS</span>
                </p>
                <p className="text-[10px] text-slate-500 tracking-tighter uppercase">
                  Avg Latency
                </p>
              </div>
              <div className="border-l border-white/10 pl-12">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-6 flex items-end gap-[2px]">
                    <div className="w-1 bg-dash-primary h-2" />
                    <div className="w-1 bg-dash-primary h-4" />
                    <div className="w-1 bg-dash-primary/40 h-3" />
                    <div className="w-1 bg-dash-primary h-5" />
                    <div className="w-1 bg-dash-primary h-3" />
                  </div>
                  <span className="text-white font-bold text-xs">STABLE</span>
                </div>
                <p className="text-[10px] text-slate-500 tracking-tighter uppercase mt-1">
                  Connectivity Status
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#16171B] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
            <div
              className="relative flex-1 bg-cover bg-center min-h-[300px]"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000')",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#16171B] via-[#16171B]/40 to-transparent" />
              <div className="relative p-8 pt-12">
                <div className="bg-dash-primary/20 backdrop-blur-md border border-dash-primary/30 rounded px-2 py-1 inline-block mb-4">
                  <span className="text-[10px] font-bold text-dash-primary tracking-[0.2em] uppercase">
                    Edge Unit X-01
                  </span>
                </div>
                <h2 className="font-space-grotesk text-5xl font-bold text-white">PROMETHEUS</h2>
              </div>
              <div className="absolute bottom-8 left-0 right-0 px-8 flex flex-col items-center">
                <div className="w-32 h-32 relative flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      fill="transparent"
                      r="56"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth={8}
                    />
                    <circle
                      className="shadow-[0_0_15px_rgba(255,107,0,0.4)]"
                      cx="64"
                      cy="64"
                      fill="transparent"
                      r="56"
                      stroke="#FF6B00"
                      strokeDasharray="351.85"
                      strokeDashoffset="88"
                      strokeLinecap="round"
                      strokeWidth={8}
                    />
                  </svg>
                  <div className="flex flex-col items-center justify-center bg-[#16171B]/80 w-24 h-24 rounded-full border border-white/10">
                    <span className="material-icons-outlined text-dash-primary text-3xl">
                      power_settings_new
                    </span>
                    <span className="text-[10px] font-bold text-white mt-1">ON</span>
                  </div>
                </div>
                <div className="mt-6 flex gap-4">
                  <button
                    type="button"
                    className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded text-[10px] font-bold text-white tracking-widest transition-all cursor-not-allowed opacity-75"
                    title="Server control is in Coolify."
                  >
                    STANDBY
                  </button>
                  <button
                    type="button"
                    className="bg-dash-primary/70 px-4 py-2 rounded text-[10px] font-bold text-white tracking-widest cursor-not-allowed opacity-75"
                    title="Server control is in Coolify."
                  >
                    REBOOT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#16171B] border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-space-grotesk text-sm font-bold tracking-[0.2em] text-white/50 uppercase">
                Region Diagnostics
              </h3>
              <span className="material-icons-outlined text-slate-500 text-sm">info</span>
            </div>
            <div className="grid grid-cols-2 gap-y-6">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                  Compute Mode
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">X-STREAM</span>
                  <span className="material-icons-outlined text-dash-primary text-xs">bolt</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                  Uptime
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">142D 12H</span>
                  <span className="material-icons-outlined text-slate-500 text-xs">schedule</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                  Avg Load
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">42%</span>
                  <span className="material-icons-outlined text-slate-500 text-xs">analytics</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                  Internal Temp
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">34°C</span>
                  <span className="material-icons-outlined text-slate-500 text-xs">thermostat</span>
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <Link
                href="/terminal"
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded text-[10px] font-bold text-white tracking-widest transition-all uppercase flex items-center justify-center"
              >
                Detailed Logs
              </Link>
              <button
                type="button"
                className="bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded transition-all"
                title="Settings"
              >
                <span className="material-icons-outlined text-sm">settings</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-2 bg-[#16171B] border border-white/5 rounded-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-space-grotesk text-sm font-bold tracking-[0.2em] text-white/50 uppercase">
                Diagnostics events
              </h3>
              {diagnosticsEvents && diagnosticsEvents.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const header = "createdAt,level,code,message\n";
                    const rows = diagnosticsEvents.map(
                      (ev) =>
                        `${new Date(ev.createdAt).toISOString()},${ev.level},${ev.code ?? ""},"${(ev.message ?? "").replace(/"/g, '""')}"`
                    ).join("\n");
                    const csv = header + rows;
                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `diagnostics-${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-dash-primary hover:text-orange-400 text-[10px] font-bold uppercase tracking-widest"
                >
                  Export CSV
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto max-h-64 space-y-2 font-mono text-xs">
              {diagnosticsEvents === undefined ? (
                <p className="text-slate-500">Loading…</p>
              ) : diagnosticsEvents.length === 0 ? (
                <p className="text-slate-500">No events yet. Sync nodes or trigger deploys to see events.</p>
              ) : (
                diagnosticsEvents.map((ev) => (
                  <div
                    key={ev._id}
                    className={`p-2 rounded border border-white/5 ${
                      ev.level === "error"
                        ? "text-red-400 border-red-500/30"
                        : ev.level === "warning"
                          ? "text-amber-400 border-amber-500/30"
                          : "text-slate-300"
                    }`}
                  >
                    <span className="text-slate-500 mr-2">
                      {new Date(ev.createdAt).toLocaleTimeString()}
                    </span>
                    {ev.code && <span className="text-slate-500 mr-2">[{ev.code}]</span>}
                    {ev.message}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="col-span-full bg-[#16171B] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="font-space-grotesk text-sm font-bold tracking-[0.2em] text-white/50 uppercase">
              Coolify logs
            </h3>
            <p className="text-slate-500 text-xs">
              Load recent logs from Coolify (requires COOLIFY_BASE_URL and COOLIFY_API_TOKEN in Convex).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Dashboard app</span>
                  <button
                    type="button"
                    onClick={async () => {
                      setCoolifyError(null);
                      setCoolifyLoading("dashboard");
                      try {
                        const { logs } = await getApplicationLogs({
                          applicationUuid: DASHBOARD_APP_UUID,
                          lines: 50,
                        });
                        setCoolifyLogs((p) => ({ ...p, dashboard: logs }));
                      } catch (e) {
                        setCoolifyError(e instanceof Error ? e.message : "Failed to load logs");
                      } finally {
                        setCoolifyLoading(null);
                      }
                    }}
                    disabled={coolifyLoading !== null}
                    className="bg-dash-primary/20 hover:bg-dash-primary/30 text-dash-primary px-3 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-50"
                  >
                    {coolifyLoading === "dashboard" ? "Loading…" : "Load"}
                  </button>
                </div>
                <pre className="bg-black/40 border border-white/5 rounded p-3 text-[10px] text-slate-400 overflow-x-auto overflow-y-auto max-h-40 whitespace-pre-wrap">
                  {coolifyLogs.dashboard ?? "—"}
                </pre>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">LiveKit Stack</span>
                  <button
                    type="button"
                    onClick={async () => {
                      setCoolifyError(null);
                      setCoolifyLoading("livekit");
                      try {
                        const { logs } = await getApplicationLogs({
                          applicationUuid: LIVEKIT_STACK_UUID,
                          lines: 50,
                        });
                        setCoolifyLogs((p) => ({ ...p, livekit: logs }));
                      } catch (e) {
                        setCoolifyError(e instanceof Error ? e.message : "Failed to load logs");
                      } finally {
                        setCoolifyLoading(null);
                      }
                    }}
                    disabled={coolifyLoading !== null}
                    className="bg-dash-primary/20 hover:bg-dash-primary/30 text-dash-primary px-3 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-50"
                  >
                    {coolifyLoading === "livekit" ? "Loading…" : "Load"}
                  </button>
                </div>
                <pre className="bg-black/40 border border-white/5 rounded p-3 text-[10px] text-slate-400 overflow-x-auto overflow-y-auto max-h-40 whitespace-pre-wrap">
                  {coolifyLogs.livekit ?? "—"}
                </pre>
              </div>
            </div>
            {coolifyError && (
              <p className="text-red-400 text-xs">{coolifyError}</p>
            )}
          </div>

          <div className="bg-[#16171B] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <span className="material-icons-outlined text-dash-primary/30 text-6xl rotate-12">
                sensors
              </span>
            </div>
            <div className="mb-6">
              <h3 className="font-space-grotesk text-sm font-bold tracking-[0.2em] text-white/50 uppercase">
                Network Throughput
              </h3>
            </div>
            <div className="flex items-center gap-6 mt-10">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-current text-white/5"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth={2}
                  />
                  <path
                    className="stroke-current text-dash-primary shadow-[0_0_15px_rgba(255,107,0,0.4)]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeDasharray="85, 100"
                    strokeLinecap="round"
                    strokeWidth={3}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">85%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white uppercase tracking-tighter">
                  Peak Bandwidth
                </p>
                <p className="text-2xl font-space-grotesk font-bold text-dash-primary">
                  1.2 Gbps
                </p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Optimized
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-8 bg-black/40 border border-white/5 rounded-lg p-3 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">
                  Flash Mode
                </span>
                <span className="text-xs font-bold text-white">AUTO-OPTIMIZE</span>
              </div>
              <div className="w-12 h-6 bg-dash-primary rounded-full relative p-1 cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full ml-auto" />
              </div>
            </div>
          </div>

          <div className="bg-[#16171B] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-space-grotesk text-sm font-bold tracking-[0.2em] text-white/50 uppercase">
                  CPU Core Load
                </h3>
              </div>
              <div className="flex items-center justify-center py-4">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 w-full relative">
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { h: "h-3/4", opacity: "bg-dash-primary/40" },
                      { h: "h-full", opacity: "bg-dash-primary shadow-[0_0_15px_rgba(255,107,0,0.4)]" },
                      { h: "h-1/2", opacity: "bg-dash-primary/20" },
                      { h: "h-4/5", opacity: "bg-dash-primary/60" },
                    ].map((bar, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-24 w-full bg-white/5 rounded flex items-end">
                          <div
                            className={`w-full ${bar.h} ${bar.opacity} rounded-b`}
                          />
                        </div>
                        <p className="text-[8px] text-center text-slate-500 font-bold">
                          C-{i + 1}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#16171B]/90 px-3 py-1 border border-dash-primary/40 rounded shadow-xl backdrop-blur-sm">
                    <span className="text-xs font-bold text-dash-primary">78.4% AVG</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold tracking-widest mt-4">
              <span>DC 12V / AC 220V</span>
              <Link
                href="/terminal"
                className="bg-white/5 hover:bg-white/10 px-3 py-1 rounded text-white border border-white/5 transition-all flex items-center gap-1"
              >
                DETAILS <span className="material-icons-outlined text-xs">chevron_right</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-[#16171B] border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Global Mesh Health: Optimal
              </span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="material-icons-outlined text-slate-500 text-sm">storage</span>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Primary DB: Synced
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="group bg-white/5 hover:bg-dash-primary transition-all duration-300 border border-white/10 hover:border-dash-primary px-6 py-2 rounded text-[10px] font-bold text-white tracking-[0.2em] flex items-center gap-2"
            >
              <span className="material-icons-outlined text-sm group-hover:rotate-180 transition-transform">
                refresh
              </span>
              Back to dashboard
            </Link>
            <Link
              href="/deploy"
              className="bg-dash-primary hover:bg-orange-600 transition-all px-8 py-2 rounded text-[10px] font-bold text-white tracking-[0.2em] shadow-lg shadow-orange-900/30 flex items-center gap-2"
            >
              <span className="material-icons-outlined text-sm">add_circle_outline</span>
              DEPLOY NEW
            </Link>
          </div>
        </div>
      </main>
      <div className="fixed top-0 right-0 w-96 h-96 bg-dash-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-0 left-0 w-64 h-64 bg-dash-primary/5 rounded-full blur-[100px] -z-10" />
    </div>
  );
}
