"use client";

import { useCallback, useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const LIVEKIT_STACK_UUID = "mg44c8wgocck0oso440c84s4";

export function TerminalStreamer() {
  const [command, setCommand] = useState("");
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
      const { logs } = await getApplicationLogs({
        applicationUuid: LIVEKIT_STACK_UUID,
        lines: 80,
      });
      setCoolifyLogs(logs);
    } catch {
      setCoolifyLogs("(Failed to load Coolify logs. Set COOLIFY_BASE_URL and COOLIFY_API_TOKEN in Convex.)");
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

  const logLines =
    commands && commands.length > 0
      ? commands
          .slice()
          .reverse()
          .map((c) => ({
            id: c._id,
            time: new Date(c.createdAt).toISOString().slice(11, 19),
            level: c.status.toUpperCase(),
            msg: c.command + (c.output ? `\n${c.output}` : ""),
            levelClass:
              c.status === "failed"
                ? "text-red-500 font-bold"
                : c.status === "success"
                  ? "text-green-400"
                  : "text-primary",
          }))
      : [];

  return (
    <div className="bg-background-light dark:bg-[#0a0a0a] text-slate-800 dark:text-slate-300 font-sans min-h-screen overflow-hidden pt-2 pl-16 sm:pl-20">
      <div className="flex flex-col h-screen p-4 gap-4">
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
                    STREAMING_LOGS
                  </h2>
                  <p className="text-[10px] text-primary tracking-[0.3em] font-bold uppercase mt-1">
                    Live Feed :: Cluster_X88
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                      Severity Filter
                    </span>
                    <div className="flex gap-1.5">
                      <button type="button" className="w-10 h-3 rounded-full indicator-on" />
                      <button type="button" className="w-10 h-3 rounded-full bg-[#27272a]" />
                      <button type="button" className="w-10 h-3 rounded-full bg-[#27272a]" />
                      <button type="button" className="w-10 h-3 rounded-full bg-[#27272a]" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                      Network Mode
                    </span>
                    <div className="flex items-center gap-2 bg-zinc-900/50 dark:bg-zinc-950/50 px-3 py-1 rounded-full border border-white/5">
                      <span className="text-[10px] font-bold">TUNNEL</span>
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-6 font-mono text-sm overflow-y-auto space-y-1 bg-[#0d0d0d]/50">
                {logLines.length === 0 ? (
                  <p className="text-slate-600 text-sm">No command history yet. Run a command in the panel to the right to store it in Convex.</p>
                ) : (
                  logLines.map((line) => (
                    <div key={line.id} className="flex gap-4 text-slate-500 flex-wrap">
                      <span className="w-24 shrink-0">[{line.time}]</span>
                      <span className={`shrink-0 ${line.levelClass}`}>{line.level}</span>
                      <span className="dark:text-zinc-400 whitespace-pre-wrap break-all">{line.msg}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 bg-zinc-900/40 border-t border-white/5 flex items-center justify-between text-[10px] tracking-widest font-bold">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">STATUS:</span>
                    <span className="text-green-400">ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">MODE:</span>
                    <span className="text-primary">X-BOOST</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500">
                    PACKET_LOSS: <span className="text-white">0.002%</span>
                  </span>
                  <span className="text-slate-500">
                    BANDWIDTH: <span className="text-white">1.4 GBPS</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: "thermostat", label: "Temp", value: "32.4", unit: "°C" },
                { icon: "memory", label: "CPU Freq", value: "4.8", unit: "GHz" },
                { icon: "speed", label: "Latency", value: "12", unit: "MS" },
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
                      <span className="text-xs text-slate-500 ml-1">{card.unit}</span>
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
                    RESOURCE LOAD
                  </h3>
                  <p className="text-[10px] text-primary tracking-widest font-bold uppercase">
                    Dynamic Allocation
                  </p>
                </div>
                <span className="material-icons-round text-slate-500">settings_suggest</span>
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
                      strokeDashoffset="70"
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
                      strokeDashoffset="100"
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
                      68%
                    </span>
                    <span className="text-[10px] text-slate-500 tracking-widest font-bold">
                      OPTIMAL
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-white/5">
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    Inbound
                  </p>
                  <p className="text-sm font-display font-bold dark:text-white">820 KWH</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    Outbound
                  </p>
                  <p className="text-sm font-display font-bold dark:text-white">14.2 GB/S</p>
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-display text-sm tracking-widest font-bold text-slate-900 dark:text-white uppercase">
                  Configuration
                </h3>
                <div className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                </div>
              </div>
              <div className="space-y-4">
                {["Turbo Mode", "Firewall Shield", "Cloud Sync"].map((label, i) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-icons-round text-slate-500 text-sm">
                        {i === 0 ? "bolt" : i === 1 ? "security" : "cloud_sync"}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{label}</span>
                    </div>
                    <button
                      type="button"
                      className={`w-10 h-5 rounded-full relative flex items-center px-1 ${
                        i !== 1 ? "bg-primary" : "bg-zinc-800"
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full ml-auto ${
                          i !== 1 ? "bg-white" : "bg-zinc-500"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
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
              <pre className="flex-1 min-h-[120px] bg-zinc-900/80 border border-white/5 rounded-lg p-3 text-[10px] text-slate-400 overflow-auto whitespace-pre-wrap font-mono">
                {coolifyLogs || "—"}
              </pre>
            </div>
          </div>
        </main>

        <footer className="flex items-center justify-between px-6 py-2 glass-panel rounded-xl text-[10px] text-slate-500 font-bold tracking-widest uppercase">
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" /> DB Connection: Stable
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" /> API: 14ms
            </span>
          </div>
          <div>© 2024 Terminal Diagnostic v4.2.0-Alpha</div>
        </footer>
      </div>
    </div>
  );
}
