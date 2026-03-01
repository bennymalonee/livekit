"use client";

import Link from "next/link";
import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

/**
 * One-time setup: set your user to admin by email when no admins exist yet.
 * Use this if you can't run the Convex Dashboard "Run" with arguments.
 */
export default function BootstrapPage() {
  const bootstrapSetRoleByEmail = useMutation(api.rbac.bootstrapSetRoleByEmail);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setMessage({ type: "error", text: "Enter your email." });
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      await bootstrapSetRoleByEmail({ email: trimmed, role: "admin" });
      setMessage({ type: "success", text: "You are now admin. Refreshing…" });
      setTimeout(() => window.location.replace("/dashboard"), 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-dash-primary flex items-center justify-center">
            <span className="material-icons-round text-white text-xl">admin_panel_settings</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Set admin by email</h1>
            <p className="text-zinc-400 text-sm">Only works when no admin exists yet.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-zinc-400">Your email (the one you use to sign in)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
              disabled={loading}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-dash-primary px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Please wait…" : "Make me admin"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              message.type === "success"
                ? "bg-green-950/50 border border-green-700 text-green-200"
                : "bg-red-950/50 border border-red-800 text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <p className="mt-6 pt-4 border-t border-zinc-800 text-center text-sm text-zinc-500">
          <Link href="/login" className="text-dash-primary hover:underline">
            Back to sign in
          </Link>
          {" · "}
          <Link href="/dashboard" className="text-zinc-400 hover:text-white">
            Dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
