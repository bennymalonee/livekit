"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ProjectInfrastructureModules() {
  const nodes = useQuery(api.nodes.listNodes);
  const dashboard = useQuery(api.dashboard.getOverview);
  const analytics = useQuery(api.analytics.getOverview);

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
          <button
            type="button"
            className="flex items-center gap-2 bg-dash-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold tracking-wider uppercase text-sm transition-all active:scale-95"
          >
            <span className="material-icons-round">add_box</span>
            Deploy New Project
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="glass-panel p-6 rounded-2xl">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
              Active Nodes
            </p>
            <p className="text-3xl font-display font-bold text-white">
              {activeNodes ?? 42}
              <span className="text-dash-primary text-sm ml-1">/ 50</span>
            </p>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
              Total Throughput
            </p>
            <p className="text-3xl font-display font-bold text-white">
              {(totalThroughputTbps ?? 8.4).toFixed(1)}
              <span className="text-dash-primary text-sm ml-1"> TB/S</span>
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
              {(healthIndex ?? 99.9).toFixed(1)}%
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          <div className="glass-panel rounded-[2rem] p-8 relative overflow-hidden transition-all duration-300">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-dash-primary shadow-[0_0_10px_rgba(255,107,0,0.6)] animate-pulse" />
                  <h3 className="font-display text-xl font-bold text-white tracking-wide uppercase">
                    Zeus-X Alpha
                  </h3>
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-widest">
                  PRIMARY EDGE CLUSTER
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ONLINE
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Handles mission-critical low-latency workloads across EU-West and US-East regions.
            </p>
            <div className="flex items-end justify-between text-xs text-slate-400">
              <div>
                <p className="uppercase tracking-widest mb-1">Throughput</p>
                <p className="font-mono text-sm text-white">3.2 TB/s</p>
              </div>
              <div>
                <p className="uppercase tracking-widest mb-1">Latency</p>
                <p className="font-mono text-sm text-white">9 ms</p>
              </div>
              <div>
                <p className="uppercase tracking-widest mb-1">Nodes</p>
                <p className="font-mono text-sm text-white">12</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-8 relative overflow-hidden transition-all duration-300">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
                  <h3 className="font-display text-xl font-bold text-white tracking-wide uppercase">
                    Apollo Edge
                  </h3>
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-widest">
                  BURST WORKLOAD CLUSTER
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                DEGRADED
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Optimized for traffic spikes and overflow routing with automatic autoscaling.
            </p>
            <div className="flex items-end justify-between text-xs text-slate-400">
              <div>
                <p className="uppercase tracking-widest mb-1">Throughput</p>
                <p className="font-mono text-sm text-white">1.1 TB/s</p>
              </div>
              <div>
                <p className="uppercase tracking-widest mb-1">Latency</p>
                <p className="font-mono text-sm text-white">18 ms</p>
              </div>
              <div>
                <p className="uppercase tracking-widest mb-1">Nodes</p>
                <p className="font-mono text-sm text-white">8</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-8 relative overflow-hidden transition-all duration-300">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <h3 className="font-display text-xl font-bold text-white tracking-wide uppercase">
                    Archive Nebula
                  </h3>
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-widest">
                  COLD STORAGE CLUSTER
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-slate-700/40 text-slate-300 border border-slate-500/50">
                IDLE
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Long-term retention for compliance and analytics workloads, optimized for cost.
            </p>
            <div className="flex items-end justify-between text-xs text-slate-400">
              <div>
                <p className="uppercase tracking-widest mb-1">Capacity</p>
                <p className="font-mono text-sm text-white">48 PB</p>
              </div>
              <div>
                <p className="uppercase tracking-widest mb-1">Utilization</p>
                <p className="font-mono text-sm text-white">32%</p>
              </div>
              <div>
                <p className="uppercase tracking-widest mb-1">Regions</p>
                <p className="font-mono text-sm text-white">4</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

