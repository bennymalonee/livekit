"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const SCOPES_OPTIONS = ["nodes:list", "nodes:sync"];

export default function ApiKeysPage() {
  const keys = useQuery(api.apiKeys.listApiKeys);
  const createKey = useAction(api.apiKeys_actions.createApiKey);
  const revokeKey = useMutation(api.apiKeys.revokeApiKey);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["nodes:list"]);
  const [createdKey, setCreatedKey] = useState<{ id: Id<"apiKeys">; key: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setError(null);
    setLoading(true);
    try {
      const result = await createKey({ name: name || "Unnamed", scopes });
      setCreatedKey({ id: result.id, key: result.key });
      setName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setLoading(false);
    }
  }

  function handleRevoke(id: Id<"apiKeys">) {
    if (confirm("Revoke this API key? It will stop working immediately.")) {
      revokeKey({ id }).catch(() => setError("Failed to revoke"));
    }
  }

  return (
    <div
      className="text-slate-300 font-sans min-h-screen flex flex-col"
      style={{
        backgroundColor: "#0B0C0E",
        backgroundImage: "radial-gradient(rgba(255, 107, 0, 0.05) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }}
    >
      <div className="p-6 md:p-10 max-w-4xl w-full mx-auto">
        <h1 className="text-2xl font-display font-bold tracking-widest text-white mb-2">
          API Keys
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Create keys for programmatic access (e.g. CI). Use <code className="text-xs bg-white/10 px-1 rounded">Authorization: Bearer &lt;key&gt;</code>.
          Store the key securely; the raw value is shown only once.
        </p>

        {createdKey && (
          <div className="mb-6 p-4 rounded-lg bg-amber-950/30 border border-amber-700">
            <p className="text-amber-200 text-sm font-medium mb-2">Key created. Copy it now — it won&apos;t be shown again.</p>
            <code className="block p-2 bg-black/30 rounded text-xs break-all font-mono text-amber-100">
              {createdKey.key}
            </code>
            <button
              type="button"
              onClick={() => setCreatedKey(null)}
              className="mt-2 text-sm text-amber-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="mb-8 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CI pipeline"
              className="rounded-lg border border-white/10 bg-surface-dark px-3 py-2 text-sm text-white w-48"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Scopes</label>
            <div className="flex gap-2">
              {SCOPES_OPTIONS.map((s) => (
                <label key={s} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={scopes.includes(s)}
                    onChange={(e) =>
                      setScopes((prev) =>
                        e.target.checked ? [...prev, s] : prev.filter((x) => x !== s)
                      )
                    }
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create key"}
          </button>
        </div>

        <div className="rounded-lg border border-white/10 bg-surface-dark/80 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider text-xs">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Scopes</th>
                <th className="p-3 font-medium">Created</th>
                <th className="p-3 font-medium">Last used</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {keys === undefined ? (
                <tr><td colSpan={5} className="p-4 text-slate-500">Loading…</td></tr>
              ) : keys.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-slate-500">No API keys yet.</td></tr>
              ) : (
                keys.map((k: { _id: Id<"apiKeys">; name: string; scopes: string; createdAt: number; lastUsedAt?: number }) => (
                  <tr key={k._id} className="border-b border-white/5">
                    <td className="p-3">{k.name}</td>
                    <td className="p-3 font-mono text-xs">{k.scopes}</td>
                    <td className="p-3 text-slate-400">{new Date(k.createdAt).toISOString()}</td>
                    <td className="p-3 text-slate-400">{k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : "—"}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleRevoke(k._id)}
                        className="text-red-400 hover:underline text-xs"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
