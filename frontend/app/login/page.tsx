"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getAuthErrorMessage, getAuthErrorHint } from "@/lib/authErrors";

const LOGIN_REDIRECT_KEY = "login_redirect_pending";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signUp" | "signIn">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showDashboardLink, setShowDashboardLink] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(LOGIN_REDIRECT_KEY)) {
      setShowDashboardLink(true);
    }
  }, []);

  function clearRedirectFlag() {
    if (typeof window !== "undefined") sessionStorage.removeItem(LOGIN_REDIRECT_KEY);
  }

  function goToDashboard() {
    if (typeof window !== "undefined") sessionStorage.setItem(LOGIN_REDIRECT_KEY, "1");
    setRedirecting(true);
    window.location.replace("/dashboard");
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 5000);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await signIn("password", formData);
      goToDashboard();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Sign in failed";
      setError(raw);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {showDashboardLink && (
          <div className="mb-4 rounded-md bg-amber-950/50 border border-amber-700 p-3 text-center">
            <p className="text-amber-200 text-sm mb-2">You are signed in.</p>
            <a
              href="/dashboard"
              onClick={clearRedirectFlag}
              className="text-amber-400 font-medium hover:underline underline-offset-2"
            >
              Open dashboard →
            </a>
          </div>
        )}
        <h1 className="text-xl font-semibold mb-4">
          {redirecting ? "Redirecting to dashboard…" : step === "signIn" ? "Sign in" : "Sign up"}
        </h1>
        {error && (
          <div className="mb-4 rounded-md bg-red-950/50 border border-red-800 text-red-200 px-3 py-2 text-sm">
            {getAuthErrorMessage(error)}
            {getAuthErrorHint(error) && (
              <p className="mt-2 text-red-300/90 text-xs">
                {getAuthErrorHint(error)}
              </p>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <input name="flow" type="hidden" value={step} />
          <button
            type="submit"
            disabled={loading || redirecting}
            className="w-full rounded-md bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            {redirecting ? "Redirecting…" : loading ? "Please wait…" : step === "signIn" ? "Sign in" : "Sign up"}
          </button>
        </form>
        {(redirecting || showDashboardLink) && (
          <p className="mt-4 text-center text-sm text-amber-400">
            <a href="/dashboard" onClick={clearRedirectFlag} className="hover:underline">
              {showDashboardLink ? "Open dashboard" : "Click here if you are not redirected"}
            </a>
          </p>
        )}
        <button
          type="button"
          onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
          className="mt-4 w-full text-sm text-zinc-400 hover:text-zinc-200"
        >
          {step === "signIn" ? "Sign up instead" : "Sign in instead"}
        </button>
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/" className="text-amber-500 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
