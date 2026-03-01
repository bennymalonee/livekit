"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function TrafficAnalytics() {
  const analytics = useQuery(api.analytics.getOverview);
  const nodes = useQuery(api.nodes.listNodes);
  const seedDemoMetrics = useMutation(api.analytics.seedDemoMetrics);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const totalEgressLabel = analytics
    ? `${analytics.totalEgressGbps.toFixed(1)} GBPS`
    : "0 GBPS";

  const regions =
    analytics && analytics.regions.length > 0 ? analytics.regions : [];
  const hasData = regions.length > 0;

  const capacityPercent =
    nodes != null && nodes.length > 0
      ? Math.round(
          nodes.reduce((sum: number, n: { memoryLoad: number }) => sum + n.memoryLoad, 0) / nodes.length
        )
      : null;

  return (
    <div className="bg-background-light dark:bg-[#0F172A] min-h-screen flex flex-col font-sans">
      <nav className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/5 dark:bg-slate-900/50">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">
          Quick links
        </span>
        {[
          { path: "/dashboard", icon: "hub", label: "Dashboard" },
          { path: "/deploy", icon: "rocket_launch", label: "Deploy" },
          { path: "/nodes", icon: "dns", label: "Nodes" },
          { path: "/sessions", icon: "sensors", label: "Sessions" },
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

      <div className="flex-1 p-4 md:p-8 pt-6 pl-4 sm:pl-6">
      <div className="max-w-[1440px] mx-auto space-y-6">
        <header className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="material-icons-outlined text-white text-xl">bolt</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tighter font-mono dark:text-white text-slate-900 uppercase">
              Analytics
            </h1>
          </div>
          <span className="hidden md:inline text-slate-400 font-mono text-xs tracking-widest uppercase">
            Traffic &amp; throughput
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/modules"
              className="p-2 rounded-full glass-panel dark:text-slate-400 text-slate-600 hover:text-primary transition-colors"
              aria-label="Modules"
            >
              <span className="material-icons-outlined">apps</span>
            </Link>
            <Link
              href="/terminal"
              className="p-2 rounded-full glass-panel dark:text-slate-400 text-slate-600 hover:text-primary relative transition-colors"
              aria-label="Logs and notifications"
            >
              <span className="material-icons-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 glass-panel rounded-3xl p-8 relative overflow-hidden grid-pattern-dash">
            <div className="flex justify-between items-start mb-12 flex-wrap gap-2">
              <div>
                <h2 className="text-4xl font-light font-mono dark:text-white text-slate-900 leading-tight uppercase">
                  Traffic <br />
                  <span className="font-bold">Flow</span>
                </h2>
              </div>
              {!hasData && (
                <button
                  type="button"
                  onClick={async () => {
                    setSeeding(true);
                    try {
                      await seedDemoMetrics();
                    } finally {
                      setSeeding(false);
                    }
                  }}
                  disabled={seeding}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/50 rounded-full font-mono text-[10px] tracking-widest uppercase text-primary disabled:opacity-50"
                >
                  {seeding ? "Seeding…" : "Seed demo data"}
                </button>
              )}
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 dark:bg-slate-700/30 border border-slate-600/30 rounded-full font-mono text-[10px] tracking-widest uppercase cursor-help opacity-75"
                title="Port configuration is managed in Coolify / LiveKit stack."
              >
                Add Port <span className="material-icons-outlined text-sm">add</span>
              </button>
            </div>
            <div className="relative h-64 w-full flex items-center">
              <div className="flex-1 flex items-center relative h-full">
                <div className="w-48 h-16 bg-gradient-to-r from-primary to-orange-400 rounded-lg flex items-center justify-between px-4 z-10 shadow-lg shadow-primary/20">
                  <div className="font-mono">
                    <p className="text-[10px] text-white/70 uppercase">Egress</p>
                    <p className="text-lg font-bold text-white">{totalEgressLabel}</p>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary">
                    <span className="material-icons-outlined">bolt</span>
                  </div>
                </div>
                <svg className="absolute left-40 w-full h-full" style={{ zIndex: 1 }}>
                  <defs>
                    <linearGradient id="orange-grad-ana" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="#F97316" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#F97316" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="amber-grad-ana" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <path
                    className="flow-line glow-orange"
                    d="M 0 128 Q 100 128, 400 30"
                    fill="none"
                    stroke="url(#orange-grad-ana)"
                    strokeWidth={6}
                  />
                  <path
                    d="M 0 128 Q 150 128, 400 90"
                    fill="none"
                    stroke="rgba(249,115,22,0.3)"
                    strokeWidth={2}
                  />
                  <path
                    d="M 0 128 Q 150 128, 400 128"
                    fill="none"
                    stroke="rgba(249,115,22,0.3)"
                    strokeWidth={2}
                  />
                  <path
                    d="M 0 128 Q 150 128, 400 180"
                    fill="none"
                    stroke="url(#amber-grad-ana)"
                    strokeWidth={4}
                  />
                  <path
                    d="M 0 128 Q 150 128, 400 230"
                    fill="none"
                    stroke="rgba(249,115,22,0.15)"
                    strokeWidth={2}
                  />
                </svg>
              </div>
                <div className="absolute right-0 flex flex-col justify-between h-full py-4 text-right space-y-4">
                  {hasData ? regions.map((r: { region: string; egressGbps: number }) => {
                    const active = r.egressGbps > 0;
                    return (
                      <div key={r.region} className="flex items-center gap-4">
                        <div className="font-mono">
                          <p className="text-[9px] text-slate-500 uppercase">{r.region}</p>
                          <p className="text-xs font-bold dark:text-white">
                            {r.egressGbps.toFixed(0)} GBPS
                          </p>
                        </div>
                        <div
                          className={`w-10 h-4 rounded-full relative ${
                            active
                              ? "bg-primary/20 border border-primary/50"
                              : "bg-slate-800/50 border border-slate-700"
                          }`}
                        >
                          {active && <div className="absolute inset-1 bg-primary rounded-full" />}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-slate-500 text-sm font-mono">
                      No traffic data. Seed demo data to preview.
                    </div>
                  )}
                </div>
            </div>
            <div className="mt-8 flex gap-12 items-end flex-wrap">
              <div>
                <p className="font-mono text-3xl dark:text-white text-slate-900">
                  {analytics ? analytics.uptimeHours : 0}
                  <span className="text-sm font-normal text-slate-500 ml-1">HRS</span>
                </p>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                  Uptime Duration
                </p>
              </div>
              <Link
                href="/dashboard"
                className="text-primary hover:underline font-mono text-xs uppercase tracking-widest"
              >
                View dashboard →
              </Link>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
                  Network Load
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono dark:text-slate-300">
                    {analytics?.networkLoadLabel ?? "UNKNOWN"} LOAD
                  </span>
                  <div className="w-24 h-4 overflow-hidden relative">
                    <svg className="absolute inset-0" viewBox="0 0 100 20">
                      <path
                        d="M0 10 Q 10 0, 20 10 T 40 10 T 60 10 T 80 10 T 100 10"
                        fill="none"
                        stroke="#F97316"
                        strokeWidth={2}
                      />
                      <circle className="glow-orange" cx="20" cy="10" fill="#F97316" r="3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 glass-panel rounded-3xl overflow-hidden flex flex-col">
            <div className="relative h-64">
              <img
                alt="Server infrastructure"
                className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcwGvbUnjvgukiH_fGW_Upubp8bx95_zjsSUqES1-KdgbtgOULJrZpGofyXxDA_RJBgB2AYHi5cdfpeWbounNZpNQO7z0iaRdMONktr7pBL7KmQgIakxH4q_Rz2xCa9Sn9S14bd7nrVD7O7BnxiOlr0lTtOL-wSToEJULAWOAbcaweAjm1jOctnvTXa0bvwdOPIKH3rIOUVaspckpa9jl-1PKjid7lzghKVS_ylrIRwa0KeR3P3YfXcAgILZOaBgHohCc-yQLoP8py"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-panel-dark to-transparent" />
              <div className="absolute inset-0 p-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <h3 className="font-mono text-3xl font-bold dark:text-white uppercase tracking-tighter">
                    Zeus-X
                  </h3>
                  <span className="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold font-mono text-white border border-white/20">
                    X-BOOST MODE
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-700/50 flex items-center justify-center mb-2 relative">
                    <span className="material-icons-outlined text-3xl text-primary">
                      power_settings_new
                    </span>
                    <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
                  </div>
                  <div className="flex gap-4 text-[10px] font-mono font-bold">
                    <span className="text-slate-500">POWER</span>
                    <span className="text-primary">ON</span>
                    <span className="text-slate-500">OFF</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 p-8 flex flex-col justify-center space-y-8">
              <div className="text-center">
                <h4 className="text-[11px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-4">
                  Capacity (nodes)
                </h4>
                <div
                  className="relative w-48 h-24 mx-auto"
                  title={capacityPercent == null ? "Add nodes in Coolify" : undefined}
                >
                  <svg className="w-full h-full" viewBox="0 0 100 50">
                    <path
                      d="M 10 45 A 40 40 0 0 1 90 45"
                      fill="none"
                      stroke="#334155"
                      strokeLinecap="round"
                      strokeWidth={6}
                    />
                    <path
                      className="glow-orange"
                      d="M 10 45 A 40 40 0 0 1 90 45"
                      fill="none"
                      stroke="#F97316"
                      strokeLinecap="round"
                      strokeWidth={6}
                      strokeDasharray="126"
                      strokeDashoffset={
                        capacityPercent != null
                          ? 126 * (1 - capacityPercent / 100)
                          : 126
                      }
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-end">
                    <span className="material-icons-outlined text-primary text-xs mb-1">
                      flash_on
                    </span>
                    <span className="text-3xl font-bold font-mono dark:text-white" title={capacityPercent == null ? "Add nodes in Coolify or sync from Coolify" : undefined}>
                      {capacityPercent != null ? `${capacityPercent}%` : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between px-8 mt-2 text-[10px] font-mono text-slate-500">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono">
                <div className="flex flex-col" title="Hardware metrics when available">
                  <span className="text-slate-500 uppercase">Power Output</span>
                  <span className="dark:text-white font-bold">5A / 220V</span>
                </div>
                <div className="flex flex-col text-right" title="Hardware metrics when available">
                  <span className="text-slate-500 uppercase">Input Throughput</span>
                  <span className="dark:text-white font-bold">200 KWH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
