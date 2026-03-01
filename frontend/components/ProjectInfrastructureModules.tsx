"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { CoolifyApplication } from "@/convex/coolify";

export function ProjectInfrastructureModules() {
  const router = useRouter();
  const nodes = useQuery(api.nodes.listNodes);
  const myRole = useQuery(api.rbac.getMyRole);
  const dashboard = useQuery(api.dashboard.getOverview);
  const analytics = useQuery(api.analytics.getOverview, {});
  const modules = useQuery(api.modules.listModules);
  const setModuleEnabled = useMutation(api.modules.setModuleEnabled);
  const seedModules = useMutation(api.modules.seedModules);
  const listCoolifyApps = useAction(api.coolify.listApplications);
  const [seeding, setSeeding] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [coolifyApps, setCoolifyApps] = useState<CoolifyApplication[] | null>(null);

  const fetchCoolifyApps = useCallback(() => {
    listCoolifyApps()
      .then(setCoolifyApps)
      .catch(() => setCoolifyApps([]));
  }, [listCoolifyApps]);

  useEffect(() => {
    fetchCoolifyApps();
  }, [fetchCoolifyApps]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const totalNodes = nodes?.length ?? 0;
  const activeNodes =
    nodes && nodes.length > 0
      ? nodes.filter((n: { status: string }) => n.status === "online").length
      : 0;

  const totalThroughputGbps =
    analytics && typeof analytics.totalEgressGbps === "number"
      ? analytics.totalEgressGbps
      : null;

  const healthIndex =
    dashboard && dashboard.systemHealthPercent != null
      ? dashboard.systemHealthPercent
      : null;

  const isAdmin = myRole === "admin";
  const canEditModules = isAdmin;

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
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 min-h-screen font-sans flex flex-col">
      <nav className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">
          Quick links
        </span>
        {quickLinks.map(({ path, icon, label }) => (
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
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-white/5 glass-panel px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-dash-primary text-3xl">bolt</span>
            <span className="font-display font-bold tracking-widest text-xl text-slate-900 dark:text-white uppercase">
              Phoenix · Infrastructure
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/terminal"
              className="p-2 rounded-lg bg-slate-200 dark:bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Logs and notifications"
            >
              <span className="material-icons-round text-xl">notifications</span>
            </Link>
            <div className="h-8 w-8 rounded-full bg-dash-primary/10 border border-dash-primary flex items-center justify-center">
              <span className="text-xs font-bold text-dash-primary">JD</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-6 md:p-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold dark:text-white mb-2 tracking-tight uppercase">
              Infrastructure Modules
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Real-time edge streaming node management
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                fetchCoolifyApps();
                router.refresh();
              }}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
              title="Refresh Coolify apps and data"
            >
              <span className="material-icons-round text-lg">refresh</span>
              Refresh
            </button>
            {modules?.length === 0 && canEditModules && (
              <button
                type="button"
                onClick={async () => {
                  setSeeding(true);
                  try {
                    await seedModules();
                  } finally {
                    setSeeding(false);
                  }
                }}
                disabled={seeding}
                className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-xl font-bold tracking-wider uppercase text-sm transition-all disabled:opacity-50"
              >
                {seeding ? "Creating…" : "Create default modules"}
              </button>
            )}
            <Link
              href="/nodes"
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
            >
              <span className="material-icons-round text-lg">sync</span>
              Sync from Coolify
            </Link>
            <Link
              href="/deploy"
              className="flex items-center gap-2 bg-dash-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold tracking-wider uppercase text-sm transition-all active:scale-95"
            >
              <span className="material-icons-round">add_box</span>
              Deploy New Project
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="glass-panel p-6 rounded-2xl" title={totalNodes === 0 ? "Sync from Coolify on Nodes to load" : undefined}>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
              Active Nodes
            </p>
            <p className="text-3xl font-display font-bold text-white">
              {totalNodes === 0 ? "—" : `${activeNodes} / ${totalNodes}`}
            </p>
            {totalNodes === 0 && (
              <Link href="/nodes" className="text-xs text-dash-primary hover:underline mt-1 inline-block">Sync from Coolify →</Link>
            )}
          </div>
          <div className="glass-panel p-6 rounded-2xl" title={totalThroughputGbps == null ? "From sessions/traffic" : undefined}>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
              Total Throughput
            </p>
            <p className="text-3xl font-display font-bold text-white">
              {totalThroughputGbps != null ? totalThroughputGbps.toFixed(2) : "—"}
              <span className="text-dash-primary text-sm ml-1"> GB/s</span>
            </p>
          </div>
          <div className="glass-panel p-6 rounded-2xl" title="Live metric when available from infrastructure">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
              Global Latency
            </p>
            <p className="text-3xl font-display font-bold text-white">
              —<span className="text-slate-500 text-sm ml-1">ms</span>
            </p>
          </div>
          <div className="glass-panel p-6 rounded-2xl" title={healthIndex == null ? "Based on synced nodes" : undefined}>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
              Health Index
            </p>
            <p className="text-3xl font-display font-bold text-emerald-500">
              {healthIndex != null ? `${healthIndex.toFixed(1)}%` : "—"}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {modules === undefined ? (
            <p className="text-slate-500">Loading modules…</p>
          ) : modules.length === 0 ? (
            <div className="col-span-full glass-panel rounded-[2rem] p-8 text-center">
              <p className="text-slate-500 mb-4">
                No modules yet. {canEditModules ? "Create default module labels (LiveKit, TURN, Recording) to track your stack, or sync nodes from Coolify." : "Sync nodes from Coolify or ask an admin to create default modules."}
              </p>
              {canEditModules && (
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      setSeeding(true);
                      try {
                        await seedModules();
                      } finally {
                        setSeeding(false);
                      }
                    }}
                    disabled={seeding}
                    className="bg-dash-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold uppercase text-sm disabled:opacity-50"
                  >
                    {seeding ? "Creating…" : "Create default modules"}
                  </button>
                  <Link
                    href="/nodes"
                    className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-sm inline-flex items-center gap-2"
                  >
                    <span className="material-icons-round text-lg">sync</span>
                    Sync from Coolify
                  </Link>
                </div>
              )}
            </div>
          ) : (
            modules.map((mod: { _id: string; key: string; label: string; enabled: boolean; config?: string }) => {
              const coolifyApp = mod.key === "livekit" && coolifyApps && coolifyApps.length > 0
                ? coolifyApps.find((a) => a.name.toLowerCase().includes("livekit"))
                : null;
              return (
              <div key={mod._id} className="glass-panel rounded-[2rem] p-8 relative overflow-hidden transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          mod.enabled
                            ? "bg-dash-primary shadow-[0_0_10px_rgba(255,107,0,0.6)] animate-pulse"
                            : "bg-slate-500"
                        }`}
                      />
                      <h3 className="font-display text-xl font-bold text-white tracking-wide uppercase">
                        {mod.label}
                      </h3>
                      {coolifyApp && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            coolifyApp.status === "running"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-slate-600 text-slate-400"
                          }`}
                          title={`Coolify: ${coolifyApp.status ?? "—"}`}
                        >
                          Coolify: {coolifyApp.status ?? "—"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">
                      {mod.key}
                    </p>
                  </div>
                  <label
                    className={`relative inline-flex items-center ${canEditModules ? "cursor-pointer" : "cursor-not-allowed opacity-80"}`}
                    title={!canEditModules ? "Admin only" : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={mod.enabled}
                      disabled={!canEditModules || togglingKey === mod.key}
                      onChange={async () => {
                        if (!canEditModules) return;
                        setTogglingKey(mod.key);
                        try {
                          await setModuleEnabled({ key: mod.key, enabled: !mod.enabled });
                        } finally {
                          setTogglingKey(null);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-dash-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dash-primary peer-disabled:opacity-60" />
                    <span className="ml-2 text-xs font-mono text-slate-400">
                      {togglingKey === mod.key ? "…" : mod.enabled ? "ON" : "OFF"}
                    </span>
                  </label>
                </div>
                <p className="text-sm text-slate-400">
                  {mod.key === "livekit"
                    ? "Real-time video/audio infrastructure."
                    : mod.key === "turn"
                      ? "TURN relay for NAT traversal."
                      : mod.key === "recording"
                        ? "Session recording and egress."
                        : "Stack module."}
                </p>
                {mod.config && (
                  <p className="text-xs text-slate-500 mt-2 font-mono truncate" title={mod.config}>
                    Config: {mod.config}
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-3">
                  <Link
                    href="/diagnostics"
                    className="text-xs font-medium text-dash-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span className="material-icons-round text-sm">bolt</span>
                    Diagnostics
                  </Link>
                  <Link
                    href="/nodes"
                    className="text-xs font-medium text-slate-400 hover:text-white inline-flex items-center gap-1"
                  >
                    <span className="material-icons-round text-sm">dns</span>
                    Nodes
                  </Link>
                  <Link
                    href="/sessions"
                    className="text-xs font-medium text-slate-400 hover:text-white inline-flex items-center gap-1"
                  >
                    <span className="material-icons-round text-sm">sensors</span>
                    Sessions
                  </Link>
                </div>
              </div>
            );
            })
          )}
        </section>
      </main>
    </div>
  );
}

