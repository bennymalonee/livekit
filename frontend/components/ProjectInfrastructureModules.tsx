"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ProjectInfrastructureModules() {
  const nodes = useQuery(api.nodes.listNodes);
  const dashboard = useQuery(api.dashboard.getOverview);
  const analytics = useQuery(api.analytics.getOverview);
  const modules = useQuery(api.modules.listModules);
  const setModuleEnabled = useMutation(api.modules.setModuleEnabled);
  const seedModules = useMutation(api.modules.seedModules);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const activeNodes =
    nodes && nodes.length > 0
      ? nodes.filter((n) => n.status === "online").length
      : null;

  const totalThroughputTbps =
    analytics && analytics.totalEgressGbps > 0
      ? analytics.totalEgressGbps
      : null;

  const healthIndex =
    dashboard && dashboard.systemHealthPercent > 0
      ? dashboard.systemHealthPercent
      : null;

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 min-h-screen font-sans pt-2 pl-16 sm:pl-20">
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-white/5 glass-panel px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-dash-primary text-3xl">bolt</span>
            <span className="font-display font-bold tracking-widest text-xl text-slate-900 dark:text-white uppercase">
              Phoenix · Infrastructure
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-2 rounded-lg bg-slate-200 dark:bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="material-icons-round text-xl">notifications</span>
            </button>
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
          <div className="flex items-center gap-2">
            {modules?.length === 0 && (
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
                {seeding ? "Seeding…" : "Seed default modules"}
              </button>
            )}
            <button
              type="button"
              className="flex items-center gap-2 bg-dash-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold tracking-wider uppercase text-sm transition-all active:scale-95"
            >
              <span className="material-icons-round">add_box</span>
              Deploy New Project
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="glass-panel p-6 rounded-2xl">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
              Active Nodes
            </p>
            <p className="text-3xl font-display font-bold text-white">
              {activeNodes ?? 0}
              <span className="text-dash-primary text-sm ml-1">/ 50</span>
            </p>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
              Total Throughput
            </p>
            <p className="text-3xl font-display font-bold text-white">
              {(totalThroughputTbps ?? 0).toFixed(1)}
              <span className="text-dash-primary text-sm ml-1"> GB/S</span>
            </p>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
              Global Latency
            </p>
            <p className="text-3xl font-display font-bold text-white">
              12<span className="text-dash-primary text-sm ml-1"> MS</span>
            </p>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
              Health Index
            </p>
            <p className="text-3xl font-display font-bold text-emerald-500">
              {(healthIndex ?? 0).toFixed(1)}%
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {modules === undefined ? (
            <p className="text-slate-500">Loading modules…</p>
          ) : modules.length === 0 ? (
            <div className="col-span-full glass-panel rounded-[2rem] p-8 text-center">
              <p className="text-slate-500 mb-4">No modules defined. Seed default modules (LiveKit, TURN, Recording) to get started.</p>
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
                {seeding ? "Seeding…" : "Seed default modules"}
              </button>
            </div>
          ) : (
            modules.map((mod) => (
              <div key={mod._id} className="glass-panel rounded-[2rem] p-8 relative overflow-hidden transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
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
                    </div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">
                      {mod.key}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mod.enabled}
                      onChange={async () => {
                        await setModuleEnabled({ key: mod.key, enabled: !mod.enabled });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-dash-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dash-primary" />
                    <span className="ml-2 text-xs font-mono text-slate-400">
                      {mod.enabled ? "ON" : "OFF"}
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
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

