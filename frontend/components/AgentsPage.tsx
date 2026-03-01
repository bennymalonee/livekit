"use client";

import Link from "next/link";
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

const QUICK_LINKS = [
  { path: "/dashboard", icon: "hub", label: "Dashboard" },
  { path: "/deploy", icon: "rocket_launch", label: "Deploy" },
  { path: "/nodes", icon: "dns", label: "Nodes" },
  { path: "/sessions", icon: "sensors", label: "Sessions" },
  { path: "/analytics", icon: "bar_chart", label: "Analytics" },
  { path: "/diagnostics", icon: "bolt", label: "Diagnostics" },
  { path: "/modules", icon: "view_module", label: "Modules" },
  { path: "/vault", icon: "shield", label: "Vault" },
  { path: "/agents", icon: "smart_toy", label: "Agents" },
  { path: "/terminal", icon: "terminal", label: "Terminal" },
];

export function AgentsPage() {
  const dispatchAgent = useAction(api.livekit.dispatchAgentToRoom);
  const checkConfig = useAction(api.livekit.checkConfig);
  const [roomName, setRoomName] = useState("default");
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [configCheck, setConfigCheck] = useState<{ ok: boolean; message?: string } | null>(null);
  const [configLoading, setConfigLoading] = useState(false);

  const onCheckConfig = async () => {
    setConfigLoading(true);
    setConfigCheck(null);
    try {
      const result = await checkConfig();
      setConfigCheck(result);
    } catch (e) {
      setConfigCheck({ ok: false, message: e instanceof Error ? e.message : "Check failed" });
    } finally {
      setConfigLoading(false);
    }
  };

  const onDispatch = async () => {
    const room = (roomName ?? "").trim();
    if (!room) {
      setDispatchError("Enter a room name.");
      return;
    }
    setDispatchLoading(true);
    setDispatchError(null);
    setDispatchSuccess(false);
    try {
      await dispatchAgent({ roomName: room });
      setDispatchSuccess(true);
    } catch (e) {
      setDispatchError(e instanceof Error ? e.message : "Dispatch failed");
    } finally {
      setDispatchLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-[#0A0B0D] text-slate-800 dark:text-slate-200 min-h-screen font-sans flex flex-col">
      <nav className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-white/10 bg-white/5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">
          Quick links
        </span>
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white text-xs font-medium transition-colors"
          >
            <span className="material-icons-round text-base">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 lg:p-8 pt-4 pl-6 sm:pl-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="material-icons text-white text-xl">smart_toy</span>
            </div>
            <h1 className="text-2xl font-display font-bold tracking-wider uppercase">
              Voice <span className="text-primary">Agents</span>
            </h1>
          </div>
        </header>

        <main className="space-y-8">
          <div className="bg-panel-dark border border-panel-border rounded-xl p-6">
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-2xl mb-6">
              Voice AI agents connect to your LiveKit server. Run the agent worker (see below), then
              dispatch it to a room from here. Use the <Link href="/vault" className="text-primary hover:underline">Vault</Link> to
              generate a token and join the same room from a client (e.g. Meet or your app) to talk to the agent.
            </p>

            <h2 className="text-lg font-semibold text-slate-200 dark:text-slate-100 mb-3">
              How to run the agent
            </h2>
            <ul className="text-sm text-slate-400 dark:text-slate-500 space-y-2 list-disc list-inside mb-4">
              <li>Set <code className="bg-black/30 px-1 rounded">LIVEKIT_URL</code>, <code className="bg-black/30 px-1 rounded">LIVEKIT_API_KEY</code>, <code className="bg-black/30 px-1 rounded">LIVEKIT_API_SECRET</code> (and <code className="bg-black/30 px-1 rounded">OPENAI_API_KEY</code> for the worker).</li>
              <li>From the repo: <code className="bg-black/30 px-1 rounded">cd agent && npm install && npm run start</code> (or <code className="bg-black/30 px-1 rounded">npm run dev</code> for watch).</li>
              <li>Optionally run the agent in Docker or Coolify as a second service.</li>
            </ul>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              <button
                type="button"
                onClick={onCheckConfig}
                disabled={configLoading}
                className="px-4 py-2 rounded-lg bg-panel-dark border border-panel-border text-sm font-medium text-slate-300 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
              >
                {configLoading ? "Checking…" : "Check LiveKit config"}
              </button>
              {configCheck !== null && (
                <span className={`text-sm ${configCheck.ok ? "text-emerald-500" : "text-amber-500"}`}>
                  {configCheck.ok ? "LiveKit env OK" : configCheck.message ?? "Not configured"}
                </span>
              )}
            </div>

            <h2 className="text-lg font-semibold text-slate-200 dark:text-slate-100 mb-3">
              Dispatch agent to room
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
              Send the voice agent into a room. Ensure the agent worker is running and the room name
              matches the room you join with a token from Vault.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name"
                className="bg-black/30 border border-panel-border rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:border-primary focus:outline-none min-w-[200px]"
              />
              <button
                type="button"
                onClick={onDispatch}
                disabled={dispatchLoading}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {dispatchLoading ? "Dispatching…" : "Dispatch agent to room"}
              </button>
            </div>
            {dispatchError && (
              <p className="mt-2 text-sm text-amber-500">{dispatchError}</p>
            )}
            {dispatchSuccess && (
              <p className="mt-2 text-sm text-emerald-500">Agent dispatched. Join the room with a token from Vault to talk to the agent.</p>
            )}
            <p className="mt-4 text-sm text-slate-500">
              <Link href="/vault" className="text-primary hover:underline">Get a token in Vault</Link> for this room, then open the room in a LiveKit client to see the agent join.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
