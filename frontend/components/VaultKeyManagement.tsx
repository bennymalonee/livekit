"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const DASHBOARD_APP_UUID = process.env.NEXT_PUBLIC_COOLIFY_DASHBOARD_APP_UUID ?? "";
const LIVEKIT_STACK_UUID = process.env.NEXT_PUBLIC_COOLIFY_LIVEKIT_STACK_APP_UUID ?? "";

const VAULT_QUICK_LINKS = [
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

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "";

const TTL_OPTIONS = [
  { label: "15 min", seconds: 15 * 60 },
  { label: "30 min", seconds: 30 * 60 },
  { label: "1 hour", seconds: 60 * 60 },
] as const;

const PERMISSION_PRESETS = [
  { id: "viewer" as const, label: "Viewer only", canPublish: false, canSubscribe: true, canPublishData: false },
  { id: "streamer" as const, label: "Streamer", canPublish: true, canSubscribe: true, canPublishData: false },
  { id: "full" as const, label: "Full", canPublish: true, canSubscribe: true, canPublishData: true },
] as const;

export function VaultKeyManagement() {
  const keys = useQuery(api.vault.listKeys);
  const createKey = useMutation(api.vault.createKey);
  const deleteKey = useMutation(api.vault.deleteKey);
  const getCoolifyEnvs = useAction(api.coolify.getApplicationEnvs);
  const generateToken = useAction(api.livekit.generateToken);
  const checkConfig = useAction(api.livekit.checkConfig);
  const recordTokenGeneration = useMutation(api.tokenGenerations.recordTokenGeneration);
  const [coolifyEnvKeys, setCoolifyEnvKeys] = useState<{ dashboard: string[]; livekit: string[] }>({ dashboard: [], livekit: [] });
  const [coolifyLoading, setCoolifyLoading] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formValue, setFormValue] = useState("");
  const [keyTypeHint, setKeyTypeHint] = useState<"livekit" | "coolify" | "webhook" | "other" | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [tokenRoom, setTokenRoom] = useState("default");
  const [tokenParticipant, setTokenParticipant] = useState("");
  const [tokenCanPublish, setTokenCanPublish] = useState(true);
  const [tokenCanSubscribe, setTokenCanSubscribe] = useState(true);
  const [tokenCanPublishData, setTokenCanPublishData] = useState(true);
  const [tokenTtlSeconds, setTokenTtlSeconds] = useState(30 * 60);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [configCheck, setConfigCheck] = useState<{ ok: boolean; message?: string } | null>(null);
  const [configChecking, setConfigChecking] = useState(false);
  const [lastGeneratedRoom, setLastGeneratedRoom] = useState<string | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  type MultiRoomRow = { id: string; roomName: string; participantName: string };
  const [multiRooms, setMultiRooms] = useState<MultiRoomRow[]>([{ id: "1", roomName: "default", participantName: "" }]);
  const [multiResults, setMultiResults] = useState<{ roomName: string; token: string }[]>([]);
  const [multiLoading, setMultiLoading] = useState(false);
  const [multiError, setMultiError] = useState<string | null>(null);

  const keyTypeOptions: { id: "livekit" | "coolify" | "webhook" | "other"; label: string; suggestedName: string; description: string }[] = [
    { id: "livekit", label: "LiveKit API key/secret", suggestedName: "LIVEKIT_API_KEY or LIVEKIT_API_SECRET", description: "From your LiveKit server or Cloud project" },
    { id: "coolify", label: "Coolify API token", suggestedName: "COOLIFY_API_TOKEN", description: "From Coolify → Keys & Tokens → API tokens" },
    { id: "webhook", label: "Webhook / signing secret", suggestedName: "WEBHOOK_SECRET", description: "For verifying webhook signatures" },
    { id: "other", label: "Other API key or secret", suggestedName: "MY_SERVICE_API_KEY", description: "Any secret you need to reference server-side" },
  ];

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const loadCoolifyEnvKeys = useCallback(async () => {
    setCoolifyLoading(true);
    try {
      const [dashboard, livekit] = await Promise.all([
        getCoolifyEnvs({ applicationUuid: DASHBOARD_APP_UUID }).catch(() => []),
        getCoolifyEnvs({ applicationUuid: LIVEKIT_STACK_UUID }).catch(() => []),
      ]);
      setCoolifyEnvKeys({
        dashboard: Array.isArray(dashboard) ? dashboard.map((e) => e.key) : [],
        livekit: Array.isArray(livekit) ? livekit.map((e) => e.key) : [],
      });
    } catch {
      setCoolifyEnvKeys({ dashboard: [], livekit: [] });
    } finally {
      setCoolifyLoading(false);
    }
  }, [getCoolifyEnvs]);

  const totalKeys = keys?.length ?? 0;
  const hasCoolifyDashboard = coolifyEnvKeys.dashboard.length > 0;
  const hasCoolifyLivekit = coolifyEnvKeys.livekit.length > 0;
  const latestLastUsed = keys?.length
    ? Math.max(...keys.map((k: { lastUsedAt?: number }) => k.lastUsedAt ?? 0), 0)
    : 0;
  const lastUsedLabel =
    latestLastUsed > 0
      ? (() => {
          const ms = Date.now() - latestLastUsed;
          const m = Math.floor(ms / 60000);
          const h = Math.floor(ms / 3600000);
          if (m < 1) return "<1m ago";
          if (h < 1) return `${m}m ago`;
          return `${h}h ago`;
        })()
      : "—";

  return (
    <div className="bg-background-light dark:bg-[#0A0B0D] text-slate-800 dark:text-slate-200 min-h-screen font-sans flex flex-col">
      <nav className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-white/10 bg-white/5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">
          Quick links
        </span>
        {VAULT_QUICK_LINKS.map((link) => (
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
              <span className="material-icons text-white text-xl">shield</span>
            </div>
            <h1 className="text-2xl font-display font-bold tracking-wider uppercase">
              VAULT <span className="text-primary">PHOENIX</span>
            </h1>
          </div>
          <span className="hidden md:inline text-slate-400 font-display text-sm tracking-widest uppercase">
            Security
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-panel-dark border border-panel-border flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-icons text-xl">notifications</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-orange-300 p-[2px]">
              <div className="w-full h-full rounded-full bg-panel-dark overflow-hidden flex items-center justify-center">
                <span className="material-icons text-slate-400">person</span>
              </div>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-panel-dark border border-panel-border rounded-xl p-8 relative overflow-hidden h-[450px]">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="text-4xl font-display font-bold uppercase tracking-tight">
                    Access <br /> <span className="text-primary">Flow</span>
                  </h2>
                </div>
                <button
                  type="button"
                  className="bg-panel-dark border border-panel-border px-4 py-2 rounded-lg text-xs font-display font-bold tracking-widest hover:border-primary transition-all flex items-center gap-2 cursor-help opacity-75"
                  title="Rotate keys in Coolify and Convex env; no bulk action in app."
                >
                  REGENERATE ALL <span className="material-icons text-sm">refresh</span>
                </button>
              </div>
              <div className="relative w-full h-64 mt-10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 800 200">
                    <defs>
                      <linearGradient id="vault-orange" x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" stopColor="rgba(249, 115, 22, 1)" />
                        <stop offset="100%" stopColor="rgba(249, 115, 22, 0.2)" />
                      </linearGradient>
                      <linearGradient id="vault-orange-dim" x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" stopColor="rgba(249, 115, 22, 0.4)" />
                        <stop offset="100%" stopColor="rgba(249, 115, 22, 0.1)" />
                      </linearGradient>
                    </defs>
                    <path
                      className="opacity-80"
                      d="M 200 100 Q 400 100 600 20"
                      fill="none"
                      stroke="url(#vault-orange)"
                      strokeWidth={3}
                    />
                    <path
                      d="M 200 100 Q 400 100 600 60"
                      fill="none"
                      stroke="#2D3139"
                      strokeWidth={2}
                    />
                    <path
                      d="M 200 100 Q 400 100 600 100"
                      fill="none"
                      stroke="#2D3139"
                      strokeWidth={2}
                    />
                    <path
                      d="M 200 100 Q 400 100 600 140"
                      fill="none"
                      stroke="url(#vault-orange-dim)"
                      strokeWidth={2}
                    />
                    <path
                      d="M 200 100 Q 400 100 600 180"
                      fill="none"
                      stroke="#2D3139"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <div className="absolute left-[140px] top-1/2 -translate-y-1/2 z-10">
                  <div className="flex items-center gap-4 bg-primary/20 p-2 pr-6 rounded-full border border-primary/50">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                      <span className="material-icons text-white">key</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none">
                        Primary
                      </p>
                      <p className="text-sm font-display font-bold truncate max-w-[120px]" title={keys?.[0]?.name ?? ""}>
                        {keys?.length ? keys[0].name : "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-2">
                  {[
                    { label: "Vault keys", active: totalKeys > 0 },
                    { label: "Dashboard env", active: hasCoolifyDashboard },
                    { label: "LiveKit env", active: hasCoolifyLivekit },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {r.label}
                      </span>
                      <div
                        className={`w-8 h-4 rounded-full border ${
                          r.active
                            ? "bg-primary/40 border-primary"
                            : "bg-panel-dark border-panel-border"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                      Key Lifespan
                    </p>
                    <p className="text-2xl font-display font-bold">
                      — <span className="text-xs text-slate-400">N/A</span>
                    </p>
                  </div>
                  <div className="h-10 w-[1px] bg-panel-border" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                      Active Keys
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-display font-bold text-primary">
                        {totalKeys}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">
                        in vault
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-panel-dark border border-panel-border rounded-xl p-6 space-y-4">
              <h3 className="text-xs font-display font-bold uppercase text-slate-500 tracking-widest">
                Vault keys (Convex)
              </h3>
              <div className="space-y-2">
                <p className="text-[10px] font-display font-bold uppercase text-slate-500 tracking-widest">
                  What are you adding? (pick one)
                </p>
                <div className="flex flex-wrap gap-4">
                  {keyTypeOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="keyType"
                        checked={keyTypeHint === opt.id}
                        onChange={() => {
                          setKeyTypeHint(opt.id);
                          if (opt.id !== "livekit") setTokenError(null);
                        }}
                        className="w-4 h-4 rounded border-panel-border bg-[#0A0B0D] text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-slate-400 group-hover:text-slate-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {keyTypeHint === "livekit" ? (
                <>
                  <p className="text-slate-400 text-sm">
                    Generate a token and LiveKit URL for your mobile app. No keys or secrets to type—just choose options and generate.
                  </p>
                  <div className="space-y-4 p-4 rounded-lg bg-[#0A0B0D]/80 border border-panel-border">
                    <p className="text-[10px] font-display font-bold uppercase text-slate-500 tracking-widest">
                      Permissions (what the app can do)
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tokenCanPublish}
                          onChange={(e) => setTokenCanPublish(e.target.checked)}
                          className="rounded border-panel-border bg-[#0A0B0D] text-primary"
                        />
                        <span className="text-sm text-slate-400">Can publish</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tokenCanSubscribe}
                          onChange={(e) => setTokenCanSubscribe(e.target.checked)}
                          className="rounded border-panel-border bg-[#0A0B0D] text-primary"
                        />
                        <span className="text-sm text-slate-400">Can subscribe</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tokenCanPublishData}
                          onChange={(e) => setTokenCanPublishData(e.target.checked)}
                          className="rounded border-panel-border bg-[#0A0B0D] text-primary"
                        />
                        <span className="text-sm text-slate-400">Can publish data</span>
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PERMISSION_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setTokenCanPublish(p.canPublish);
                            setTokenCanSubscribe(p.canSubscribe);
                            setTokenCanPublishData(p.canPublishData);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-panel-border text-xs text-slate-400 hover:bg-white/5 hover:text-slate-300"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-[10px] font-display font-bold uppercase text-slate-500 mb-1">Room name</label>
                        <input
                          type="text"
                          placeholder="e.g. my-room"
                          value={tokenRoom}
                          onChange={(e) => setTokenRoom(e.target.value)}
                          className="bg-[#0A0B0D] border border-panel-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 w-48"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-display font-bold uppercase text-slate-500 mb-1">Participant (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. mobile-user"
                          value={tokenParticipant}
                          onChange={(e) => setTokenParticipant(e.target.value)}
                          className="bg-[#0A0B0D] border border-panel-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 w-48"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-display font-bold uppercase text-slate-500 mb-1">Valid for</label>
                        <select
                          value={tokenTtlSeconds}
                          onChange={(e) => setTokenTtlSeconds(Number(e.target.value))}
                          className="bg-[#0A0B0D] border border-panel-border rounded-lg px-3 py-2 text-sm text-white w-32"
                        >
                          {TTL_OPTIONS.map((o) => (
                            <option key={o.seconds} value={o.seconds}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          setConfigChecking(true);
                          setConfigCheck(null);
                          try {
                            const r = await checkConfig({});
                            setConfigCheck(r);
                          } catch {
                            setConfigCheck({ ok: false, message: "Check failed" });
                          } finally {
                            setConfigChecking(false);
                          }
                        }}
                        disabled={configChecking}
                        className="px-3 py-2 rounded-lg border border-panel-border text-xs text-slate-400 hover:bg-white/5 disabled:opacity-50"
                      >
                        {configChecking ? "Checking…" : "Check connection"}
                      </button>
                      {configCheck !== null && (
                        <span className={`text-xs ${configCheck.ok ? "text-emerald-400" : "text-amber-400"}`}>
                          {configCheck.ok ? "Ready" : configCheck.message}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          setTokenError(null);
                          const room = tokenRoom.trim() || "default";
                          setTokenLoading(true);
                          try {
                            const result = await generateToken({
                              roomName: room,
                              participantName: tokenParticipant.trim() || undefined,
                              ttlSeconds: tokenTtlSeconds,
                              canPublish: tokenCanPublish,
                              canSubscribe: tokenCanSubscribe,
                              canPublishData: tokenCanPublishData,
                            });
                            if (!result.ok) {
                              setTokenError(result.error);
                              setGeneratedToken(null);
                            } else {
                              setGeneratedToken(result.token);
                              setLastGeneratedRoom(room);
                              setLastGeneratedAt(Date.now());
                              try {
                                await recordTokenGeneration({
                                  roomName: room,
                                  canPublish: tokenCanPublish,
                                  canSubscribe: tokenCanSubscribe,
                                  canPublishData: tokenCanPublishData,
                                });
                              } catch {
                                // Audit failure does not block the user
                              }
                            }
                          } catch (err) {
                            setTokenError(err instanceof Error ? err.message : "Failed to generate token");
                            setGeneratedToken(null);
                          } finally {
                            setTokenLoading(false);
                          }
                        }}
                        disabled={tokenLoading || !tokenRoom.trim()}
                        className="bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase disabled:opacity-50"
                      >
                        {tokenLoading ? "Generating…" : "Generate token"}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 p-4 rounded-lg bg-[#0A0B0D]/60 border border-panel-border">
                    <p className="text-[10px] font-display font-bold uppercase text-slate-500 tracking-widest">
                      Multiple rooms
                    </p>
                    <p className="text-xs text-slate-500">
                      Generate tokens for several rooms at once. Add rows, then click Generate all.
                    </p>
                    <div className="space-y-2">
                      {multiRooms.map((row) => (
                        <div key={row.id} className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            placeholder="Room name"
                            value={row.roomName}
                            onChange={(e) =>
                              setMultiRooms((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, roomName: e.target.value } : r))
                              )
                            }
                            className="bg-[#0A0B0D] border border-panel-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 w-40"
                          />
                          <input
                            type="text"
                            placeholder="Participant (optional)"
                            value={row.participantName}
                            onChange={(e) =>
                              setMultiRooms((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, participantName: e.target.value } : r))
                              )
                            }
                            className="bg-[#0A0B0D] border border-panel-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 w-40"
                          />
                          {multiRooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setMultiRooms((prev) => prev.filter((r) => r.id !== row.id))}
                              className="text-red-400 hover:text-red-300 text-xs uppercase"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setMultiRooms((prev) => [
                            ...prev,
                            {
                              id: String(Date.now()),
                              roomName: "",
                              participantName: "",
                            },
                          ])
                        }
                        className="px-3 py-2 rounded-lg border border-panel-border text-xs text-slate-400 hover:bg-white/5"
                      >
                        Add room
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setMultiError(null);
                          setMultiResults([]);
                          const rows = multiRooms.filter((r) => r.roomName.trim());
                          if (rows.length === 0) {
                            setMultiError("Add at least one room name.");
                            return;
                          }
                          setMultiLoading(true);
                          try {
                            const results: { roomName: string; token: string }[] = [];
                            for (const row of rows) {
                              const room = row.roomName.trim() || "default";
                              const result = await generateToken({
                                roomName: room,
                                participantName: row.participantName.trim() || undefined,
                                ttlSeconds: tokenTtlSeconds,
                                canPublish: tokenCanPublish,
                                canSubscribe: tokenCanSubscribe,
                                canPublishData: tokenCanPublishData,
                              });
                              if (!result.ok) {
                                setMultiError(result.error);
                                setMultiLoading(false);
                                return;
                              }
                              results.push({ roomName: room, token: result.token });
                              try {
                                await recordTokenGeneration({
                                  roomName: room,
                                  canPublish: tokenCanPublish,
                                  canSubscribe: tokenCanSubscribe,
                                  canPublishData: tokenCanPublishData,
                                });
                              } catch {
                                // Audit failure does not block the user
                              }
                            }
                            setMultiResults(results);
                            if (results.length > 0) {
                              setLastGeneratedRoom(results[0].roomName);
                              setLastGeneratedAt(Date.now());
                            }
                          } catch (err) {
                            setMultiError(err instanceof Error ? err.message : "Failed to generate tokens");
                          } finally {
                            setMultiLoading(false);
                          }
                        }}
                        disabled={multiLoading}
                        className="bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase disabled:opacity-50"
                      >
                        {multiLoading ? "Generating…" : "Generate all"}
                      </button>
                    </div>
                    {multiError && <p className="text-red-400 text-sm">{multiError}</p>}
                    {multiResults.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-panel-border">
                        <p className="text-[10px] font-display font-bold uppercase text-slate-500 tracking-widest">
                          Results
                        </p>
                        {multiResults.map((r) => (
                          <div key={r.roomName} className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-mono w-24 truncate" title={r.roomName}>
                              {r.roomName}
                            </span>
                            <input
                              type="text"
                              readOnly
                              value={r.token}
                              className="flex-1 bg-[#0A0B0D] border border-panel-border rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono truncate"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(r.token);
                                setCopyFeedback(`Token for ${r.roomName} copied`);
                                setTimeout(() => setCopyFeedback(null), 2000);
                              }}
                              className="px-2 py-1.5 rounded-lg border border-panel-border text-xs text-slate-400 hover:bg-white/5"
                            >
                              Copy
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const arr = multiResults.map((res) => ({
                              url: LIVEKIT_URL,
                              roomName: res.roomName,
                              token: res.token,
                            }));
                            navigator.clipboard.writeText(JSON.stringify(arr));
                            setCopyFeedback("All tokens copied as JSON");
                            setTimeout(() => setCopyFeedback(null), 2000);
                          }}
                          className="px-3 py-2 rounded-lg border border-panel-border text-xs text-slate-400 hover:bg-white/5"
                        >
                          Copy all (JSON array)
                        </button>
                        {copyFeedback && <span className="text-xs text-emerald-400 ml-2">{copyFeedback}</span>}
                      </div>
                    )}
                  </div>
                  {tokenError && <p className="text-red-400 text-sm">{tokenError}</p>}
                  {generatedToken && (
                    <div className="space-y-3 p-4 rounded-lg bg-[#0A0B0D]/80 border border-panel-border">
                      <p className="text-[10px] font-display font-bold uppercase text-slate-500 tracking-widest">
                        Token and URL (copy into your app)
                      </p>
                      <p className="text-xs text-slate-500">
                        Valid for {tokenTtlSeconds === 15 * 60 ? "15 min" : tokenTtlSeconds === 60 * 60 ? "1 hour" : "30 min"}.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={LIVEKIT_URL}
                            className="flex-1 bg-[#0A0B0D] border border-panel-border rounded-lg px-3 py-2 text-sm text-slate-300 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(LIVEKIT_URL);
                              setCopyFeedback("URL copied");
                              setTimeout(() => setCopyFeedback(null), 2000);
                            }}
                            className="px-3 py-2 rounded-lg border border-panel-border text-xs text-slate-400 hover:bg-white/5"
                          >
                            Copy URL
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={generatedToken}
                            className="flex-1 bg-[#0A0B0D] border border-panel-border rounded-lg px-3 py-2 text-sm text-slate-300 font-mono truncate"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedToken);
                              setCopyFeedback("Token copied");
                              setTimeout(() => setCopyFeedback(null), 2000);
                            }}
                            className="px-3 py-2 rounded-lg border border-panel-border text-xs text-slate-400 hover:bg-white/5"
                          >
                            Copy token
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const block = JSON.stringify({ url: LIVEKIT_URL, token: generatedToken });
                            navigator.clipboard.writeText(block);
                            setCopyFeedback("Token and URL copied");
                            setTimeout(() => setCopyFeedback(null), 2000);
                          }}
                          className="px-3 py-2 rounded-lg border border-panel-border text-xs text-slate-400 hover:bg-white/5"
                        >
                          Copy token and URL
                        </button>
                        {copyFeedback && <span className="text-xs text-emerald-400 ml-2">{copyFeedback}</span>}
                      </div>
                      {LIVEKIT_URL && generatedToken && (
                        <div className="pt-2 border-t border-panel-border">
                          <p className="text-[10px] font-display font-bold uppercase text-slate-500 tracking-widest mb-2">Scan with mobile (URL + token)</p>
                          <QRCodeSVG
                            value={JSON.stringify({ url: LIVEKIT_URL, token: generatedToken })}
                            size={128}
                            level="M"
                            className="rounded bg-white p-1"
                          />
                        </div>
                      )}
                      <p className="text-xs text-slate-500 pt-2 border-t border-panel-border">
                        Paste URL and token into your app; use LiveKit SDK <code className="text-slate-400">connect(url, token)</code>.{" "}
                        <a href="https://docs.livekit.io/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LiveKit docs</a>
                      </p>
                    </div>
                  )}
                  {lastGeneratedRoom && lastGeneratedAt && (
                    <p className="text-xs text-slate-500">
                      Last generated for room <span className="text-slate-400 font-mono">{lastGeneratedRoom}</span> at {new Date(lastGeneratedAt).toLocaleTimeString()}.
                      {" "}
                      <button
                        type="button"
                        onClick={async () => {
                          setTokenError(null);
                          setTokenLoading(true);
                          try {
                            const result = await generateToken({
                              roomName: lastGeneratedRoom,
                              participantName: tokenParticipant.trim() || undefined,
                              ttlSeconds: tokenTtlSeconds,
                              canPublish: tokenCanPublish,
                              canSubscribe: tokenCanSubscribe,
                              canPublishData: tokenCanPublishData,
                            });
                            if (!result.ok) {
                              setTokenError(result.error);
                              setGeneratedToken(null);
                            } else {
                              setGeneratedToken(result.token);
                              setLastGeneratedAt(Date.now());
                              try {
                                await recordTokenGeneration({
                                  roomName: lastGeneratedRoom,
                                  canPublish: tokenCanPublish,
                                  canSubscribe: tokenCanSubscribe,
                                  canPublishData: tokenCanPublishData,
                                });
                              } catch {
                                // Audit failure does not block the user
                              }
                            }
                          } catch (err) {
                            setTokenError(err instanceof Error ? err.message : "Failed to generate token");
                          } finally {
                            setTokenLoading(false);
                          }
                        }}
                        disabled={tokenLoading}
                        className="text-primary hover:underline"
                      >
                        Regenerate
                      </button>
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    To rotate keys: update LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Convex and in your LiveKit server config, then regenerate tokens.
                  </p>
                </>
              ) : (
                <>
                  {keyTypeHint != null && (
                    <div className="p-3 rounded-lg bg-[#0A0B0D]/80 border border-panel-border">
                      <p className="text-xs text-slate-400">
                        <span className="text-primary font-bold">Suggested name:</span> {keyTypeOptions.find((o) => o.id === keyTypeHint)?.suggestedName}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {keyTypeOptions.find((o) => o.id === keyTypeHint)?.description}
                      </p>
                    </div>
                  )}
                  <p className="text-slate-400 text-sm">
                    Store API keys, tokens, and secrets here. Each entry needs a <strong className="text-slate-300">name</strong>, optional <strong className="text-slate-300">description</strong>, and the <strong className="text-slate-300">secret value</strong>. Values are stored in Convex and never shown in the app.
                  </p>
                  <p className="text-amber-400/90 text-xs mt-1">
                    Note: Values are stored as plaintext in the database (not encrypted at rest). Do not store highly sensitive secrets here unless your Convex deployment is locked down. Raw values are never returned to the client.
                  </p>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setCreateError(null);
                      if (!formName.trim() || !formValue.trim()) return;
                      setCreating(true);
                      try {
                        await createKey({
                          name: formName.trim(),
                          description: formDescription.trim() || undefined,
                          encryptedValue: formValue,
                        });
                        setFormName("");
                        setFormDescription("");
                        setFormValue("");
                        setKeyTypeHint(null);
                      } catch (err) {
                        setCreateError(err instanceof Error ? err.message : "Failed to create key");
                      } finally {
                        setCreating(false);
                      }
                    }}
                    className="flex flex-wrap items-end gap-3"
                  >
                    <input
                      type="text"
                      placeholder="Key name (e.g. LIVEKIT_API_SECRET)"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="bg-[#0A0B0D] border border-panel-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 w-48 min-w-[180px]"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="bg-[#0A0B0D] border border-panel-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 w-48"
                    />
                    <input
                      type="password"
                      placeholder="Secret value (stored server-side, never shown)"
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      className="bg-[#0A0B0D] border border-panel-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 w-48"
                    />
                    <button
                      type="submit"
                      disabled={creating || !formName.trim() || !formValue.trim()}
                      className="bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase disabled:opacity-50"
                    >
                      {creating ? "Adding…" : "Add key"}
                    </button>
                  </form>
                  {createError && <p className="text-red-400 text-sm">{createError}</p>}
                </>
              )}
              <div className="border-t border-panel-border pt-4 space-y-2 max-h-40 overflow-y-auto">
                {keys === undefined ? (
                  <p className="text-slate-500 text-sm">Loading…</p>
                ) : keys.length === 0 ? (
                  <p className="text-slate-500 text-sm">No keys. Add one above.</p>
                ) : (
                  keys.map((k: { _id: Id<"vaultKeys">; name: string; description?: string; createdAt: number; lastUsedAt?: number }) => (
                    <div
                      key={k._id}
                      className="flex items-center justify-between text-sm py-2 border-b border-panel-border last:border-0"
                    >
                      <div>
                        <span className="font-mono text-white">{k.name}</span>
                        {k.description && (
                          <span className="text-slate-500 ml-2 text-xs">{k.description}</span>
                        )}
                        <span className="text-slate-600 text-xs ml-2">
                          {new Date(k.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteKey({ id: k._id })}
                        className="text-red-400 hover:text-red-300 text-xs uppercase"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-panel-dark border border-panel-border rounded-xl p-6">
                <h3 className="text-xs font-display font-bold uppercase text-slate-500 mb-4 tracking-widest">
                  Global Keys
                </h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-display font-bold">{totalKeys}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">
                      Active Keys
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, totalKeys * 25)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-primary font-bold">
                      {totalKeys > 0 ? "Active" : "Empty"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/30 border border-panel-border rounded-xl p-6 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-icons text-primary animate-pulse text-lg">
                      wifi_tethering
                    </span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Network Pulse
                </p>
                <p className="text-sm font-display font-bold text-primary">
                  {hasCoolifyDashboard || hasCoolifyLivekit ? "Connected" : "—"}
                </p>
              </div>
              <div className="bg-panel-dark border border-panel-border rounded-xl p-6">
                <h3 className="text-xs font-display font-bold uppercase text-slate-500 mb-4 tracking-widest">
                  Last Used
                </h3>
                <div className="h-16 flex items-center">
                  <p className="text-2xl font-display font-bold text-primary">{lastUsedLabel}</p>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Most recent key use</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-panel-dark border border-panel-border rounded-xl overflow-hidden">
              <div
                className="h-48 bg-cover bg-center relative p-6 flex flex-col justify-between"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0A0B0D]/80 to-[#0A0B0D]" />
                <div className="relative flex justify-between items-start">
                  <div>
                    <h4 className="text-2xl font-display font-bold text-white tracking-tight leading-none uppercase">
                      ZEUS-X
                    </h4>
                    <span className="bg-primary/20 text-primary border border-primary/40 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest mt-2 inline-block">
                      Vault-Level
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border border-panel-border bg-[#0A0B0D]/80 flex items-center justify-center">
                      <span className="material-icons text-primary text-xl">power_settings_new</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase mt-1">{totalKeys > 0 ? "ACTIVE" : "EMPTY"}</span>
                  </div>
                </div>
                <div className="relative flex justify-center">
                  <div className="w-32 h-1 bg-panel-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all"
                      style={{ width: `${totalKeys > 0 ? 75 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="relative h-40 flex items-center justify-center">
                  <svg className="w-48 h-48 -rotate-90">
                    <circle
                      className="text-slate-800"
                      cx="96"
                      cy="96"
                      fill="none"
                      r="70"
                      stroke="currentColor"
                      strokeWidth={8}
                    />
                    <circle
                      className="text-primary shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                      cx="96"
                      cy="96"
                      fill="none"
                      r="70"
                      stroke="currentColor"
                      strokeDasharray="440"
                      strokeDashoffset={440 - (440 * (totalKeys > 0 ? 75 : 0)) / 100}
                      strokeWidth={8}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="material-icons text-primary mb-1">security</span>
                    <span className="text-3xl font-display font-bold">{totalKeys > 0 ? "75" : "0"}%</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Confidence</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0A0B0D]/50 p-3 rounded-lg border border-panel-border">
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-1 tracking-wider">
                      Last Used
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-xs text-primary">schedule</span>
                      <p className="text-xs font-bold">{lastUsedLabel}</p>
                    </div>
                  </div>
                  <div className="bg-[#0A0B0D]/50 p-3 rounded-lg border border-panel-border">
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-1 tracking-wider">
                      Access Node
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-xs text-primary">place</span>
                      <p className="text-xs font-bold">{totalKeys > 0 ? "Convex" : "—"}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="bg-panel-dark border border-panel-border hover:border-primary text-slate-200 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-display font-bold text-sm tracking-widest uppercase cursor-help opacity-90"
                    title="Key values are never exposed in the app; rotate in Coolify/Convex."
                  >
                    <span className="material-icons text-sm">content_copy</span> Copy Key
                  </button>
                  <button
                    type="button"
                    className="bg-panel-dark border border-panel-border hover:border-red-500 text-slate-200 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-display font-bold text-sm tracking-widest uppercase cursor-help opacity-90"
                    title="Key rotation is done in Convex/Coolify env."
                  >
                    <span className="material-icons text-sm">lock_reset</span> ROTATE
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-panel-dark border border-panel-border rounded-xl p-6">
              <h3 className="text-xs font-display font-bold uppercase text-slate-500 mb-3 tracking-widest">
                Coolify env (read-only, key names)
              </h3>
              <p className="text-slate-500 text-xs mb-3">
                Key names from Coolify apps. Values are never stored in Convex.
              </p>
              <button
                type="button"
                onClick={loadCoolifyEnvKeys}
                disabled={coolifyLoading}
                className="bg-panel-dark border border-panel-border hover:border-primary px-3 py-2 rounded-lg text-xs font-bold uppercase mb-4 disabled:opacity-50"
              >
                {coolifyLoading ? "Loading…" : "Load Coolify env keys"}
              </button>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Dashboard app</p>
                  <div className="flex flex-wrap gap-1">
                    {coolifyEnvKeys.dashboard.length === 0 ? (
                      <span className="text-slate-600 text-xs">—</span>
                    ) : (
                      coolifyEnvKeys.dashboard.map((keyName) => (
                        <span
                          key={keyName}
                          className="bg-slate-800/50 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400"
                        >
                          {keyName}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">LiveKit Stack</p>
                  <div className="flex flex-wrap gap-1">
                    {coolifyEnvKeys.livekit.length === 0 ? (
                      <span className="text-slate-600 text-xs">—</span>
                    ) : (
                      coolifyEnvKeys.livekit.map((keyName) => (
                        <span
                          key={keyName}
                          className="bg-slate-800/50 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400"
                        >
                          {keyName}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-panel-dark border border-panel-border rounded-xl p-6 flex justify-between items-center">
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">
                  Vault Keys
                </p>
                <p className="text-lg font-display font-bold">
                  {totalKeys} <span className="text-xs text-slate-500">stored</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">
                  Status
                </p>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span className={`w-2 h-2 rounded-full ${totalKeys > 0 ? "bg-primary animate-pulse" : "bg-slate-600"}`} />
                  <p className="text-sm font-display font-bold uppercase">{totalKeys > 0 ? "Active" : "Empty"}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
