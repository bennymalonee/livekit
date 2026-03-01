"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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
  { path: "/terminal", icon: "terminal", label: "Terminal" },
];

export function VaultKeyManagement() {
  const keys = useQuery(api.vault.listKeys);
  const createKey = useMutation(api.vault.createKey);
  const deleteKey = useMutation(api.vault.deleteKey);
  const getCoolifyEnvs = useAction(api.coolify.getApplicationEnvs);
  const [coolifyEnvKeys, setCoolifyEnvKeys] = useState<{ dashboard: string[]; livekit: string[] }>({ dashboard: [], livekit: [] });
  const [coolifyLoading, setCoolifyLoading] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formValue, setFormValue] = useState("");
  const [keyTypeHint, setKeyTypeHint] = useState<"livekit" | "coolify" | "webhook" | "other" | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
    ? Math.max(...keys.map((k) => k.lastUsedAt ?? 0), 0)
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
              <p className="text-slate-400 text-sm">
                Store API keys, tokens, and secrets here. Each entry needs a <strong className="text-slate-300">name</strong> (e.g. LIVEKIT_API_SECRET), an optional <strong className="text-slate-300">description</strong>, and the <strong className="text-slate-300">secret value</strong>. Values are stored in Convex and never shown in the app.
              </p>
              <div className="space-y-2">
                <p className="text-[10px] font-display font-bold uppercase text-slate-500 tracking-widest">
                  What are you adding? (pick one to see hints)
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
                        onChange={() => setKeyTypeHint(opt.id)}
                        className="w-4 h-4 rounded border-panel-border bg-[#0A0B0D] text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-slate-400 group-hover:text-slate-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {keyTypeHint != null && (
                  <div className="mt-2 p-3 rounded-lg bg-[#0A0B0D]/80 border border-panel-border">
                    <p className="text-xs text-slate-400">
                      <span className="text-primary font-bold">Suggested name:</span> {keyTypeOptions.find((o) => o.id === keyTypeHint)?.suggestedName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {keyTypeOptions.find((o) => o.id === keyTypeHint)?.description}
                    </p>
                  </div>
                )}
              </div>
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
              <div className="border-t border-panel-border pt-4 space-y-2 max-h-40 overflow-y-auto">
                {keys === undefined ? (
                  <p className="text-slate-500 text-sm">Loading…</p>
                ) : keys.length === 0 ? (
                  <p className="text-slate-500 text-sm">No keys. Add one above.</p>
                ) : (
                  keys.map((k) => (
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
                      <p className="text-xs font-bold">—</p>
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
