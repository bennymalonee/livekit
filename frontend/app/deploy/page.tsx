"use client";

import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { CoolifyApplication } from "@/convex/coolify";

const LIVEKIT_STACK_UUID = process.env.NEXT_PUBLIC_COOLIFY_LIVEKIT_STACK_APP_UUID ?? "";
const DASHBOARD_APP_UUID = process.env.NEXT_PUBLIC_COOLIFY_DASHBOARD_APP_UUID ?? "";

const DEPLOY_QUICK_LINKS = [
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

export default function DeployPage() {
  const deployments = useQuery(api.deployments.listByUser);
  const deploySettings = useQuery(api.settings.getDeploySettings);
  const createDeployment = useMutation(api.deployments.create);
  const updateDeploymentStatus = useMutation(api.deployments.updateStatus);
  const setDeploySettings = useMutation(api.settings.setDeploySettings);
  const triggerDeploy = useAction(api.settings.triggerDeploy);
  const listCoolifyApps = useAction(api.coolify.listApplications);
  const getCoolifyEnvs = useAction(api.coolify.getApplicationEnvsForPrefill);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [settingsWebhook, setSettingsWebhook] = useState("");
  const [settingsLivekit, setSettingsLivekit] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [coolifyApps, setCoolifyApps] = useState<CoolifyApplication[]>([]);
  const [coolifyAppsLoading, setCoolifyAppsLoading] = useState(true);
  const [coolifyAppsError, setCoolifyAppsError] = useState<string | null>(null);

  const livekitUrl =
    deploySettings?.livekitUrl ||
    process.env.NEXT_PUBLIC_LIVEKIT_URL ||
    "https://your-livekit-url.example.com";

  async function handleDeploy() {
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const deploymentId = await createDeployment({ status: "pending" });
      try {
        await triggerDeploy();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("not configured")) {
          const res = await fetch("/api/deploy", { method: "POST" });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError(data.error || `Deploy failed (${res.status})`);
            return;
          }
        } else {
          throw e;
        }
      }
      await updateDeploymentStatus({ deploymentId, status: "running" });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deploy failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSaved(false);
    try {
      await setDeploySettings({
        webhookUrl: settingsWebhook.trim(),
        livekitUrl: settingsLivekit.trim(),
      });
      setSettingsSaved(true);
    } finally {
      setSettingsSaving(false);
    }
  }

  const latest = deployments?.[0];

  useEffect(() => {
    if (deploySettings === undefined) return;
    setSettingsWebhook(deploySettings.webhookUrl ?? "");
    setSettingsLivekit(deploySettings.livekitUrl ?? "");
  }, [deploySettings?.webhookUrl, deploySettings?.livekitUrl]);

  const fetchCoolifyApps = useCallback(async () => {
    setCoolifyAppsLoading(true);
    setCoolifyAppsError(null);
    try {
      const apps = await listCoolifyApps();
      setCoolifyApps(apps);
      const livekitApp = apps.find((a: { uuid?: string }) => a.uuid === LIVEKIT_STACK_UUID);
      if (livekitApp && !deploySettings?.livekitUrl) {
        try {
          const envs = await getCoolifyEnvs({ applicationUuid: LIVEKIT_STACK_UUID });
          const url =
            envs.NEXT_PUBLIC_LIVEKIT_URL ||
            envs.LIVEKIT_URL ||
            envs.PUBLIC_LIVEKIT_URL;
          if (url) setSettingsLivekit(url);
        } catch {
          // ignore env fetch failure for prefill
        }
      }
    } catch (e) {
      setCoolifyAppsError(e instanceof Error ? e.message : "Failed to load Coolify apps");
      setCoolifyApps([]);
    } finally {
      setCoolifyAppsLoading(false);
    }
  }, [listCoolifyApps, getCoolifyEnvs, deploySettings?.livekitUrl]);

  useEffect(() => {
    fetchCoolifyApps();
  }, [fetchCoolifyApps]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <nav className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mr-2">
          Quick links
        </span>
        {DEPLOY_QUICK_LINKS.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 text-xs font-medium transition-colors"
          >
            <span className="material-icons-round text-base">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1 max-w-2xl w-full mx-auto p-6 pt-4 pl-6 sm:pl-8">
        <h1 className="text-2xl font-semibold mb-2">Deploy LiveKit to VPS</h1>
        <p className="text-zinc-400 mb-6">
          Trigger a deployment of the LiveKit stack on your VPS via Coolify.
        </p>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-800">
            {latest ? (
              <span className="text-sm text-zinc-400">
                Last deploy:{" "}
                <span
                  className={`font-medium ${
                    latest.status === "success"
                      ? "text-green-400"
                      : latest.status === "failed"
                        ? "text-red-400"
                        : latest.status === "running"
                          ? "text-amber-400"
                          : "text-zinc-300"
                  }`}
                >
                  {latest.status}
                </span>
                {" · "}
                {new Date(latest.createdAt).toLocaleString()}
              </span>
            ) : (
              <span className="text-sm text-zinc-500">No deployments yet.</span>
            )}
            {typeof process.env.NEXT_PUBLIC_COOLIFY_BASE_URL === "string" &&
              process.env.NEXT_PUBLIC_COOLIFY_BASE_URL && (
                <a
                  href={process.env.NEXT_PUBLIC_COOLIFY_BASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-500 hover:text-amber-400 text-sm font-medium"
                >
                  View in Coolify →
                </a>
              )}
          </div>
          <button
            onClick={handleDeploy}
            disabled={loading}
            className="w-full rounded-md bg-amber-600 px-4 py-3 font-medium text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            {loading ? "Triggering deploy…" : "Deploy LiveKit to VPS"}
          </button>

          {error && (
            <div className="rounded-md bg-red-950/50 border border-red-800 text-red-200 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-950/50 border border-green-800 text-green-200 px-4 py-3 text-sm">
              Deploy triggered. Check Coolify for status.
            </div>
          )}

          <div>
            <h2 className="text-sm font-medium text-zinc-400 mb-2">
              LiveKit URL
            </h2>
            <p className="text-zinc-200 font-mono text-sm break-all">
              {latest?.livekitUrl || livekitUrl}
            </p>
            {(latest?.livekitUrl || deploySettings?.livekitUrl) && (
              <a
                href={latest?.livekitUrl || livekitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500 hover:underline text-sm mt-1 inline-block"
              >
                Open LiveKit →
              </a>
            )}
          </div>

          <div>
            <h2 className="text-sm font-medium text-zinc-400 mb-2">
              Coolify applications
            </h2>
            {coolifyAppsLoading ? (
              <p className="text-zinc-500 text-sm">Loading…</p>
            ) : coolifyAppsError ? (
              <p className="text-zinc-500 text-sm">
                {coolifyAppsError}. Set COOLIFY_BASE_URL and COOLIFY_API_TOKEN in Convex to show apps.
              </p>
            ) : coolifyApps.length === 0 ? (
              <p className="text-zinc-500 text-sm">No applications from Coolify.</p>
            ) : (
              <ul className="space-y-2">
                {coolifyApps.map((app) => (
                  <li
                    key={app.uuid}
                    className="flex items-center justify-between text-sm py-2 border-b border-zinc-800 last:border-0"
                  >
                    <span className="text-zinc-300 font-medium">{app.name}</span>
                    <span
                      className={`font-medium ${
                        app.status === "running"
                          ? "text-green-400"
                          : app.status === "stopped" || app.status === "exited"
                            ? "text-amber-400"
                            : "text-zinc-400"
                      }`}
                    >
                      {app.status ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-sm font-medium text-zinc-400 mb-2">
              Deploy settings
            </h2>
            <p className="text-zinc-500 text-xs mb-3">
              Set the Coolify webhook URL and LiveKit URL here, or use{" "}
              <code className="bg-zinc-800 px-1 rounded">
                COOLIFY_DEPLOY_WEBHOOK_URL
              </code>{" "}
              and{" "}
              <code className="bg-zinc-800 px-1 rounded">
                NEXT_PUBLIC_LIVEKIT_URL
              </code>{" "}
              in your environment.
            </p>
            <form onSubmit={handleSaveSettings} className="space-y-3">
              <input
                type="url"
                placeholder="Coolify deploy webhook URL"
                value={settingsWebhook}
                onChange={(e) => setSettingsWebhook(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 text-sm"
              />
              <input
                type="url"
                placeholder="LiveKit server URL"
                value={settingsLivekit}
                onChange={(e) => setSettingsLivekit(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 text-sm"
              />
              <button
                type="submit"
                disabled={settingsSaving}
                className="rounded-md bg-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
              >
                {settingsSaving ? "Saving…" : "Save settings"}
              </button>
              {settingsSaved && (
                <span className="text-green-400 text-sm ml-2">Saved.</span>
              )}
            </form>
            {deploySettings && (
              <p className="text-zinc-500 text-xs mt-2">
                Current: webhook{" "}
                {deploySettings.webhookUrl ? "set" : "not set"}, LiveKit URL{" "}
                {deploySettings.livekitUrl ? "set" : "not set"}.
              </p>
            )}
          </div>

          <div>
            <h2 className="text-sm font-medium text-zinc-400 mb-2">
              Recent deployments
            </h2>
            {deployments === undefined ? (
              <p className="text-zinc-500 text-sm">Loading…</p>
            ) : deployments.length === 0 ? (
              <p className="text-zinc-500 text-sm">
                No deployments yet. Click the button above to trigger one.
              </p>
            ) : (
              <ul className="space-y-2">
                {deployments.map((d) => (
                  <li
                    key={d._id}
                    className="flex items-center justify-between text-sm py-2 border-b border-zinc-800 last:border-0"
                  >
                    <span className="text-zinc-300">
                      {new Date(d.createdAt).toLocaleString()}
                    </span>
                    <span
                      className={`font-medium ${
                        d.status === "success"
                          ? "text-green-400"
                          : d.status === "failed"
                            ? "text-red-400"
                            : d.status === "running"
                              ? "text-amber-400"
                              : "text-zinc-400"
                      }`}
                    >
                      {d.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
