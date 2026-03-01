"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useEffect } from "react";

export function GlobalStreamDashboard() {
  const { signOut } = useAuthActions();
  const overview = useQuery(api.dashboard.getOverview);
  const sessionTotals = useQuery(api.sessions.getTotals);
  const analyticsOverview = useQuery(api.analytics.getOverview);
  const nodes = useQuery(api.nodes.listNodes);

  const streamRegions =
    analyticsOverview?.regions?.slice(0, 4).map((r) => ({
      label: r.region.toUpperCase().replace(/-/g, "-"),
      egressGbps: r.egressGbps,
      active: r.egressGbps > 0,
    })) ?? [];

  const capacityPercent =
    nodes != null && nodes.length > 0
      ? Math.round(
          nodes.reduce((sum, n) => sum + n.memoryLoad, 0) / nodes.length
        )
      : null;

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const preferDark = stored === "dark" || (!stored && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", preferDark);
  }, []);

  function toggleDark() {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      // ignore
    }
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans min-h-screen transition-colors duration-300 pt-2 pl-16 sm:pl-20">
      <header className="flex items-center justify-between px-8 py-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-dash-primary rounded-lg flex items-center justify-center">
            <span className="material-icons-round text-white text-xl">hub</span>
          </div>
          <span className="text-xl font-bold tracking-tight">GLOBAL STREAM</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleDark}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            <span className="material-icons-round">dark_mode</span>
          </button>
          <Link
            href="/terminal"
            className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 p-1 px-2 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            aria-label="View logs and notifications"
          >
            <span className="material-icons-round text-sm">notifications</span>
            <div className="w-2 h-2 bg-dash-primary rounded-full" />
          </Link>
          <Link
            href="/vault"
            className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden border-2 border-dash-primary/20 flex items-center justify-center hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors"
            aria-label="Account and keys"
          >
            <span className="material-icons-round text-slate-500">person</span>
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <nav className="max-w-[1600px] mx-auto px-8 py-3 flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">
          Quick links
        </span>
        {[
          { path: "/deploy", icon: "rocket_launch", label: "Deploy" },
          { path: "/nodes", icon: "dns", label: "Nodes" },
          { path: "/sessions", icon: "sensors", label: "Sessions" },
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

      <main className="max-w-[1600px] mx-auto px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
              Total Projects
            </p>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold">
                {overview ? overview.totalProjects.toLocaleString() : "—"}
              </span>
            </div>
          </div>
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
              Concurrent Users
            </p>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold">
                {overview ? overview.concurrentUsers.toLocaleString() : "—"}
              </span>
            </div>
          </div>
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
              System Health
            </p>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-dash-primary">
                {overview ? `${overview.systemHealthPercent.toFixed(2)}%` : "—"}
              </span>
              <span className="text-slate-500 text-sm font-medium mb-1">STABLE</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="bg-card-light dark:bg-card-dark rounded-3xl border border-slate-200 dark:border-slate-800 p-8 min-h-[500px] relative overflow-hidden bg-mesh">
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h2 className="text-4xl font-bold tracking-tight mb-2">
                    STREAM
                    <br />
                    FLOW
                  </h2>
                </div>
                <Link
                  href="/deploy"
                  className="bg-slate-200 dark:bg-slate-800/50 hover:bg-dash-primary hover:text-white transition-all px-4 py-2 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-2"
                >
                  ADD NODE <span className="material-icons-round text-sm">add</span>
                </Link>
              </div>
              <div className="mt-12 relative h-64">
                <svg className="w-full h-full" viewBox="0 0 800 300">
                  <defs>
                    <linearGradient id="orange-grad-dash" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="rgba(255,107,0,0)" />
                      <stop offset="50%" stopColor="rgba(255,107,0,1)" />
                      <stop offset="100%" stopColor="rgba(255,107,0,0)" />
                    </linearGradient>
                  </defs>
                  <path
                    className="text-slate-200 dark:text-slate-800"
                    d="M 0 150 Q 200 150 400 150"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={6}
                  />
                  <path
                    className="text-slate-200 dark:text-slate-800"
                    d="M 400 150 Q 500 150 700 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                  <path
                    className="text-slate-200 dark:text-slate-800"
                    d="M 400 150 Q 500 150 700 110"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                  <path
                    className="text-slate-200 dark:text-slate-800"
                    d="M 400 150 Q 500 150 700 190"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                  <path
                    className="text-slate-200 dark:text-slate-800"
                    d="M 400 150 Q 500 150 700 260"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                  <path
                    className="glow-orange stream-path"
                    d="M 0 150 Q 200 150 400 150"
                    fill="none"
                    stroke="url(#orange-grad-dash)"
                    strokeWidth={6}
                  />
                  <path
                    className="glow-orange stream-path"
                    d="M 400 150 Q 500 150 700 40"
                    fill="none"
                    stroke="url(#orange-grad-dash)"
                    strokeWidth={4}
                    style={{ animationDelay: "1s" }}
                  />
                  <path
                    className="glow-orange stream-path"
                    d="M 400 150 Q 500 150 700 190"
                    fill="none"
                    stroke="url(#orange-grad-dash)"
                    strokeWidth={4}
                    style={{ animationDelay: "2s" }}
                  />
                </svg>
                <div className="absolute right-0 top-0 h-full flex flex-col justify-between py-2 text-right">
                  {streamRegions.length > 0 ? (
                    streamRegions.map((r) => (
                      <div key={r.label} className="flex items-center gap-4 justify-end">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold">{r.label}</p>
                          <p className="text-sm font-mono font-bold">
                            {r.egressGbps.toFixed(1)} GB/s
                          </p>
                        </div>
                        <div
                          className={`w-6 h-2 rounded-full ${
                            r.active
                              ? "bg-dash-primary shadow-[0_0_10px_rgba(255,107,0,0.5)]"
                              : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        />
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center gap-4 justify-end">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold">—</p>
                          <p className="text-sm font-mono font-bold text-slate-500">
                            No data
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/analytics"
                        className="text-[10px] text-dash-primary font-bold hover:underline"
                      >
                        View traffic in Analytics
                      </Link>
                    </>
                  )}
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-16 h-16 rounded-full bg-dash-primary flex items-center justify-center shadow-[0_0_30px_rgba(255,107,0,0.4)] animate-pulse">
                    <span className="material-icons-round text-white text-3xl">bolt</span>
                  </div>
                </div>
              </div>
              <div className="mt-20 flex gap-12 items-center">
                <div title="Latency from LiveKit when available">
                  <p className="text-3xl font-bold">
                    — <span className="text-sm font-normal text-slate-500">MS</span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                    NETWORK LATENCY
                  </p>
                </div>
                <div>
                  <div className="flex items-end gap-1 h-10">
                    {(() => {
                      const values =
                        analyticsOverview?.regions?.slice(0, 5).map((r) => r.egressGbps) ?? [];
                      const max = Math.max(1, ...values);
                      const heights = Array.from({ length: 5 }, (_, i) =>
                        values[i] != null ? (values[i] / max) * 8 + 2 : 2
                      );
                      return heights.map((h, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-full ${
                            values[i] != null && values[i] > 0
                              ? "bg-dash-primary"
                              : "bg-slate-300 dark:bg-slate-700"
                          }`}
                          style={{ height: `${h}px` }}
                        />
                      ));
                    })()}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-1 uppercase">
                    Traffic Load
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card-light dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-bold tracking-widest uppercase mb-6 text-slate-400">
                  Details
                </h3>
                <div className="grid grid-cols-2 gap-y-4 text-xs">
                  <div>
                    <p className="text-slate-400 mb-1">Mode</p>
                    <p className="font-bold flex items-center gap-1">
                      X-STREAM{" "}
                      <span className="material-icons-round text-[10px] text-dash-primary">
                        bolt
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Uptime</p>
                    <p className="font-bold flex items-center gap-1">
                      {analyticsOverview != null && analyticsOverview.uptimeHours > 0
                        ? analyticsOverview.uptimeHours >= 24
                          ? "1 D"
                          : `${analyticsOverview.uptimeHours} H`
                        : "—"}{" "}
                      <span className="material-icons-round text-[10px]">schedule</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Frequency</p>
                    <p className="font-bold flex items-center gap-1" title="Config in LiveKit">
                      60 HZ{" "}
                      <span className="material-icons-round text-[10px]">sensors</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Temp</p>
                    <p className="font-bold flex items-center gap-1" title="Hardware metric when available">
                      —{" "}
                      <span className="material-icons-round text-[10px]">thermostat</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Sessions (24h)</p>
                    <p className="font-bold flex items-center gap-1">
                      {sessionTotals != null ? sessionTotals.totalSessions.toLocaleString() : "—"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-card-light dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="relative z-10">
                  <p className="text-[10px] font-mono font-bold text-slate-400">
                    {analyticsOverview?.networkLoadLabel ?? "UNKNOWN"} LOAD
                  </p>
                </div>
                <div className="flex items-center justify-center my-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border-2 border-dash-primary/30">
                      <span className="material-icons-round text-dash-primary animate-ping absolute opacity-50">
                        wifi
                      </span>
                      <span className="material-icons-round text-dash-primary">wifi</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center z-10">
                  <p className="text-[10px] font-bold text-slate-400">FIBER LINK</p>
                  <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">
                    <span className="text-[10px] font-bold">
                      {(overview?.activeNodes ?? 0) > 0 || streamRegions.length > 0 ? "ON" : "OFF"}
                    </span>
                    <div
                      className={`w-4 h-2 rounded-full ${
                        (overview?.activeNodes ?? 0) > 0 || streamRegions.length > 0
                          ? "bg-dash-primary"
                          : "bg-slate-400 dark:bg-slate-600"
                      }`}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-card-light dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="bg-slate-50 dark:bg-[#12151a] rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-4xl font-mono font-bold">
                    {analyticsOverview != null && analyticsOverview.totalEgressGbps > 0
                      ? analyticsOverview.totalEgressGbps.toFixed(1)
                      : "—"}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">
                    Throughput Gbit/s
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold mt-4">
                  <p>
                    TX{" "}
                    {analyticsOverview != null && analyticsOverview.totalEgressGbps > 0
                      ? `${analyticsOverview.totalEgressGbps.toFixed(1)}G`
                      : "—"}{" "}
                    / <span title="Ingress not tracked">RX —</span>
                  </p>
                  <Link href="/analytics" className="text-dash-primary hover:underline">
                    DETAILS
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-card-light dark:bg-card-dark rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
              <div className="relative h-[300px] w-full bg-slate-200 dark:bg-slate-900 flex items-center justify-center">
                <img
                  alt="High-fidelity server hardware render"
                  className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfZaDnEsy6iMLQCmvHP5kpRHpDbtNaR9paM0_jdZkbYDW1qcAWMC0hNYDubcsrzEEADjzRjXC-mpr9Bhh2rXvY-9N2rt_FjcZxAJqS4w5tEJE785arFo0mIjlGNVxKCIOloIl9DjsOnjNXqaNZtKK02ElP3ruB9jk6L8xWN21EMQKtOG7cxKD14PjvlqyxJYDg-ihrQ6whSDMfqrQYWdSFXDDADStsEqkdtoJRZmFDl4CfJzt-2jDDDbi8SxnLWwKoMohaGg0klY5T"
                />
                <div className="relative z-10 text-center">
                  <h2 className="text-5xl font-bold tracking-tighter text-slate-900 dark:text-white drop-shadow-lg">
                    ZEUS-X
                  </h2>
                  <div className="mt-4 bg-dash-primary text-white text-[10px] font-bold px-3 py-1 rounded-full inline-block">
                    X-BOOST MODE ACTIVE
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center justify-center gap-12 mb-12">
                  <span className="text-[10px] font-bold text-slate-400">POWER</span>
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        className="text-slate-200 dark:text-slate-800"
                        cx="40"
                        cy="40"
                        fill="transparent"
                        r="36"
                        stroke="currentColor"
                        strokeWidth={2}
                      />
                      <circle
                        className="text-dash-primary glow-orange"
                        cx="40"
                        cy="40"
                        fill="transparent"
                        r="36"
                        stroke="currentColor"
                        strokeDasharray="226"
                        strokeDashoffset="60"
                        strokeWidth={4}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        type="button"
                        className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-default"
                        title="Power control is managed in Coolify."
                      >
                        <span className="material-icons-round text-dash-primary">
                          power_settings_new
                        </span>
                      </button>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    ON / <span className="opacity-30">OFF</span>
                  </span>
                </div>
                <div className="text-center">
                  <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-8">
                    Capacity Utilization
                  </h3>
                  <div
                    className="relative flex items-center justify-center"
                    title={capacityPercent == null ? "Add nodes in Coolify" : undefined}
                  >
                    <svg className="w-64 h-32" viewBox="0 0 200 100">
                      <path
                        className="text-slate-200 dark:text-slate-800"
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth={12}
                      />
                      <path
                        className="text-dash-primary"
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth={12}
                        strokeDasharray="126"
                        strokeDashoffset={
                          capacityPercent != null
                            ? 126 * (1 - capacityPercent / 100)
                            : 126
                        }
                      />
                    </svg>
                    <div className="absolute bottom-0 text-center">
                      <span className="material-icons-round text-dash-primary mb-1">memory</span>
                      <p className="text-4xl font-bold font-mono">
                        {capacityPercent != null ? `${capacityPercent}%` : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 px-12">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4">
                  <div title="Hardware metrics when available">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Power Draw</p>
                    <p className="font-mono text-sm">5A / 220V</p>
                  </div>
                  <div className="text-right" title="Hardware metrics when available">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Input Stream</p>
                    <p className="font-mono text-sm">200 KWH</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
