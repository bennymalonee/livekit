"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const LIVEKIT_STACK_UUID = process.env.NEXT_PUBLIC_COOLIFY_LIVEKIT_STACK_APP_UUID ?? "";

type StatusFilter = "all" | "success" | "failed" | "pending";

export function TerminalStreamer() {
  const [command, setCommand] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const commands = useQuery(api.terminal.listCommands, { limit: 50 });
  const recordCommand = useMutation(api.terminal.recordCommand);
  const getApplicationLogs = useAction(api.coolify.getApplicationLogs);
  const [coolifyLogs, setCoolifyLogs] = useState<string>("");
  const [coolifyLoading, setCoolifyLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const loadCoolifyLogs = useCallback(async () => {
    setCoolifyLoading(true);
    try {
      if (!LIVEKIT_STACK_UUID.trim()) {
        setCoolifyLogs("[Not configured] Set NEXT_PUBLIC_COOLIFY_LIVEKIT_STACK_APP_UUID to load LiveKit Stack logs.");
        return;
      }
      const result = await getApplicationLogs({
        applicationUuid: LIVEKIT_STACK_UUID,
        lines: 80,
      });
      if (result.error) {
        setCoolifyLogs(result.error);
      } else {
        setCoolifyLogs(result.logs || "(empty)");
      }
    } catch {
      setCoolifyLogs("Failed to load. Check Convex env (COOLIFY_BASE_URL, COOLIFY_API_TOKEN).");
    } finally {
      setCoolifyLoading(false);
    }
  }, [getApplicationLogs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = command.trim();
    if (!value) return;
    setCommand("");
    try {
      await recordCommand({ command: value });
    } catch {
      // ignore errors here
    }
  }

  const allLogLines =
    commands && commands.length > 0
      ? commands
          .slice()
          .reverse()
          .map((c: { _id: string; createdAt: number; status: string; command?: string; output?: string }) => ({
            id: c._id,
            time: new Date(c.createdAt).toISOString().slice(11, 19),
            level: c.status.toUpperCase(),
            status: c.status as "pending" | "running" | "success" | "failed",
            msg: c.command + (c.output ? `\n${c.output}` : ""),
            levelClass:
              c.status === "failed"
                ? "text-red-500 font-bold"
                : c.status === "success"
                  ? "text-green-400"
                  : "text-primary",
          }))
      : [];

  const logLines =
    statusFilter === "all"
      ? allLogLines
      : allLogLines.filter((line: { status: string }) => line.status === statusFilter);

  const totalCommands = commands?.length ?? 0;
  const successCount = commands?.filter((c: { status: string }) => c.status === "success").length ?? 0;
  const failedCount = commands?.filter((c: { status: string }) => c.status === "failed").length ?? 0;
  const pendingCount = commands?.filter((c: { status: string }) => c.status === "pending" || c.status === "running").length ?? 0;

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
    <div className="bg-background-light dark:bg-[#0a0a0a] text-slate-800 dark:text-slate-300 font-sans min-h-screen overflow-hidden flex flex-col">
      <nav className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-white/10 bg-white/5 shrink-0">
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
      <div className="flex-1 flex flex-col min-h-0 p-4 gap-4 pl-6 sm:pl-8">
        <header className="flex items-center justify-between px-6 py-2 glass-panel rounded-xl">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-1.5 rounded-lg shadow-[0_0_12px_rgba(249,115,22,0.4)]">
              <span className="material-icons-round text-white text-xl leading-none">terminal</span>
            </div>
            <h1 className="font-display text-sm tracking-[0.2em] font-bold text-slate-900 dark:text-white uppercase">
              Terminal Diagnostic Streamer
            </h1>
          </div>
          <span className="hidden md:inline text-xs font-bold tracking-widest text-slate-400 uppercase">
            Terminal
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-2 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors"
            >
              <span className="material-icons-round text-lg">grid_view</span>
            </button>
            <button
              type="button"
              className="p-2 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors relative"
            >
              <span className="material-icons-round text-lg">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-slate-200 dark:border-zinc-800" />
            </button>
          </div>
        </header>

        <main className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 min-h-0">
            <div className="flex-1 glass-panel rounded-2xl relative overflow-hidden flex flex-col">
              <div className="scanline" />
              <div className="p-6 pb-2 flex justify-between items-end border-b border-white/5">
                <div>
                  <h2 className="font-display text-2xl tracking-tighter text-slate-900 dark:text-white">
                    COMMAND HISTORY
                  </h2>
                  <p className="text-[10px] text-primary tracking-[0.3em] font-bold uppercase mt-1">
                    {commands === undefined ? "Loading…" : `${totalCommands} command${totalCommands !== 1 ? "s" : ""} in Convex`}
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                      Status Filter
                    </span>
                    <div className="flex gap-1.5">
                      {(["all", "success", "failed", "pending"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setStatusFilter(f)}
                          className={`w-10 h-3 rounded-full transition-colors ${
                            statusFilter === f ? "indicator-on bg-primary" : "bg-[#27272a] hover:bg-zinc-700"
                          }`}
                          title={f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                      Convex
                    </span>
                    <div className="flex items-center gap-2 bg-zinc-900/50 dark:bg-zinc-950/50 px-3 py-1 rounded-full border border-white/5">
                      <span className="text-[10px] font-bold">{commands !== undefined ? "Connected" : "—"}</span>
                      <div className={`w-2 h-2 rounded-full ${commands !== undefined ? "bg-green-500 animate-pulse" : "bg-slate-600"}`} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-6 font-mono text-sm overflow-y-auto space-y-1 bg-[#0d0d0d]/50">
                {logLines.length === 0 ? (
                  <p className="text-slate-600 text-sm">No command history yet. Run a command in the panel to the right to store it in Convex.</p>
                ) : (
                  logLines.map((line: { id: string; time: string; level: string; status: string; msg: string; levelClass: string }) => (
                    <div key={line.id} className="flex gap-4 text-slate-500 flex-wrap">
                      <span className="w-24 shrink-0">[{line.time}]</span>
                      <span className={`shrink-0 ${line.levelClass}`}>{line.level}</span>
                      <span className="dark:text-zinc-400 whitespace-pre-wrap break-all">{line.msg}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 bg-zinc-900/40 border-t border-white/5 flex items-center justify-between text-[10px] tracking-widest font-bold flex-wrap gap-2">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">STATUS:</span>
                    <span className={commands !== undefined ? "text-green-400" : "text-slate-500"}>{commands !== undefined ? "ACTIVE" : "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">TOTAL:</span>
                    <span className="text-white">{totalCommands}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">SUCCESS:</span>
                    <span className="text-green-400">{successCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">FAILED:</span>
                    <span className="text-red-400">{failedCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">PENDING:</span>
                    <span className="text-primary">{pendingCount}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: "terminal", label: "Commands", value: String(totalCommands), unit: "stored" },
                { icon: "check_circle", label: "Success", value: String(successCount), unit: "" },
                { icon: "cancel", label: "Failed", value: String(failedCount), unit: "" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="glass-panel p-4 rounded-2xl flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-icons-round text-primary">{card.icon}</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                      {card.label}
                    </p>
                    <p className="text-xl font-display font-bold text-slate-900 dark:text-white">
                      {card.value}
                      {card.unit ? <span className="text-xs text-slate-500 ml-1">{card.unit}</span> : null}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h3 className="font-display text-lg tracking-tight text-slate-900 dark:text-white">
                    COMMAND USAGE
                  </h3>
                  <p className="text-[10px] text-primary tracking-widest font-bold uppercase">
                    From Convex history
                  </p>
                </div>
                <span className="material-icons-round text-slate-500">terminal</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center relative py-8">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="text-zinc-800"
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="45"
                      stroke="currentColor"
                      strokeDasharray="283"
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      strokeWidth={8}
                    />
                    <circle
                      className="text-primary drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="45"
                      stroke="url(#term-grad)"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * Math.min(100, totalCommands * 2)) / 100}
                      strokeLinecap="round"
                      strokeWidth={8}
                    />
                    <defs>
                      <linearGradient id="term-grad" x1="0%" x2="100%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#fdba74" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-display font-bold text-white tracking-tighter">
                      {Math.min(100, totalCommands * 2)}%
                    </span>
                    <span className="text-[10px] text-slate-500 tracking-widest font-bold">
                      {totalCommands > 0 ? "ACTIVE" : "EMPTY"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-white/5">
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    Success rate
                  </p>
                  <p className="text-sm font-display font-bold dark:text-white">
                    {totalCommands > 0 ? `${Math.round((successCount / totalCommands) * 100)}%` : "—"}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    Pending
                  </p>
                  <p className="text-sm font-display font-bold dark:text-white">{pendingCount}</p>
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-display text-sm tracking-widest font-bold text-slate-900 dark:text-white uppercase">
                  Run command
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${commands !== undefined ? "bg-green-500" : "bg-zinc-800"}`} title="Convex" />
                  <span className="text-[9px] text-slate-500 font-bold">Convex</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Commands are stored in Convex (terminalCommands). Status stays &quot;pending&quot; unless updated by your backend.
              </p>
              <form
                onSubmit={handleSubmit}
                className="pt-4 border-t border-white/5 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 tracking-widest">
                    COMMAND
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-300">
                    Stored in Convex history
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Type a diagnostic command"
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold tracking-widest uppercase"
                  >
                    Run
                  </button>
                </div>
              </form>
            </div>
            <div className="glass-panel rounded-2xl p-6 flex flex-col">
              <h3 className="font-display text-sm tracking-widest font-bold text-slate-900 dark:text-white uppercase mb-2">
                Coolify logs (LiveKit Stack)
              </h3>
              <p className="text-[10px] text-slate-500 mb-2">
                One-shot load of recent Coolify application logs.
              </p>
              <button
                type="button"
                onClick={loadCoolifyLogs}
                disabled={coolifyLoading}
                className="mb-3 px-3 py-2 rounded-lg bg-primary/20 text-primary text-xs font-bold uppercase disabled:opacity-50 w-fit"
              >
                {coolifyLoading ? "Loading…" : "Load Coolify logs"}
              </button>
              <pre className="flex-1 min-h-[120px] bg-zinc-900/80 border border-white/5 rounded-lg p-3 text-[10px] text-slate-400 overflow-auto whitespace-pre-wrap font-mono" title={!coolifyLogs ? "Load Coolify logs to see output" : undefined}>
                {coolifyLogs || (LIVEKIT_STACK_UUID.trim() ? "Click Load to fetch logs." : "Set NEXT_PUBLIC_COOLIFY_LIVEKIT_STACK_APP_UUID to enable.")}
              </pre>
            </div>
          </div>
        </main>

        <footer className="flex items-center justify-between px-6 py-2 glass-panel rounded-xl text-[10px] text-slate-500 font-bold tracking-widest uppercase flex-wrap gap-2">
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${commands !== undefined ? "bg-green-500" : "bg-slate-600"}`} /> Convex: {commands !== undefined ? "Connected" : "—"}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-slate-500">Commands:</span>
              <span className="text-white">{totalCommands}</span>
            </span>
          </div>
          <div>Terminal · Command history in Convex</div>
        </footer>
      </div>
    </div>
  );
}
