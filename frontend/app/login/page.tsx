"use client";

import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { getAuthErrorMessage, getAuthErrorHint } from "@/lib/authErrors";

const LOGIN_REDIRECT_KEY = "login_redirect_pending";
const DASHBOARD_PATH = "/dashboard";
const REDIRECT_FALLBACK_MS = 4000;
// Give Convex Auth Next.js time to sync token -> server cookie before full-page nav
const COOKIE_SYNC_DELAY_MS = 1200;

/** Use app's public URL for dashboard so cookies (same origin) are sent; avoids wrong host after "Leave site?" */
function getDashboardUrl(): string {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_APP_URL) {
    try {
      return new URL(DASHBOARD_PATH, process.env.NEXT_PUBLIC_APP_URL).href;
    } catch {}
  }
  return DASHBOARD_PATH;
}

type AuthDiagnostic = {
  authenticated: boolean;
  requestHost?: string;
  forwardedHost?: string;
  error?: string;
} | null;

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const token = useAuthToken();
  const [step, setStep] = useState<"signUp" | "signIn">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showDashboardLink, setShowDashboardLink] = useState(false);
  const [diagnostic, setDiagnostic] = useState<AuthDiagnostic>(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const fallbackDone = useRef(false);
  const redirectStarted = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(LOGIN_REDIRECT_KEY)) {
      setShowDashboardLink(true);
    }
  }, []);

  async function loadDiagnostic() {
    setDiagnosticLoading(true);
    setDiagnostic(null);
    try {
      const r = await fetch("/api/auth-status?debug=1", { credentials: "same-origin" });
      const data = await r.json();
      setDiagnostic({
        authenticated: data.authenticated === true,
        requestHost: data.requestHost,
        forwardedHost: data.forwardedHost,
        error: data.error,
      });
    } catch (e) {
      setDiagnostic({
        authenticated: false,
        error: e instanceof Error ? e.message : "Request failed",
      });
    } finally {
      setDiagnosticLoading(false);
    }
  }

  // Redirect after token is present and auth provider had time to sync cookie to server.
  // Use full app URL so the same-origin request sends auth cookies (avoids ending up back on /login after "Leave site?").
  useEffect(() => {
    if (!token || !redirecting) return;
    const t = setTimeout(() => {
      window.location.replace(getDashboardUrl());
    }, COOKIE_SYNC_DELAY_MS);
    return () => clearTimeout(t);
  }, [redirecting, token]);

  useEffect(() => {
    if (!token || redirectStarted.current) return;
    goToDashboard();
  }, [token]);

  function clearRedirectFlag() {
    if (typeof window !== "undefined") sessionStorage.removeItem(LOGIN_REDIRECT_KEY);
  }

  function goToDashboard() {
    if (redirectStarted.current) return;
    redirectStarted.current = true;
    if (typeof window !== "undefined") sessionStorage.setItem(LOGIN_REDIRECT_KEY, "1");
    setRedirecting(true);
    const maxAttempts = 50;
    let attempts = 0;
    const poll = () => {
      attempts += 1;
      fetch("/api/auth-status", { credentials: "same-origin" })
        .then((r) => r.json())
        .then((data) => {
          if (data.authenticated === true) {
            window.location.replace(getDashboardUrl());
            return;
          }
          if (attempts < maxAttempts) setTimeout(poll, 400);
        })
        .catch(() => {
          if (attempts < maxAttempts) setTimeout(poll, 400);
        });
    };
    setTimeout(poll, 300);
    // Fallback: if token/cookie never ready (e.g. proxy/cookie issues), still try navigating with full URL
    setTimeout(() => {
      if (fallbackDone.current) return;
      fallbackDone.current = true;
      window.location.replace(getDashboardUrl());
    }, REDIRECT_FALLBACK_MS);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await signIn("password", formData);
      e.currentTarget.reset(); // Clear form so browser is less likely to show "Leave site?"
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
          <div className="mb-4 rounded-md bg-amber-950/50 border border-amber-700 p-3 text-center space-y-2">
            <p className="text-amber-200 text-sm">You are signed in.</p>
            <a
              href={getDashboardUrl()}
              onClick={clearRedirectFlag}
              className="text-amber-400 font-medium hover:underline underline-offset-2 block"
            >
              Open dashboard (link) →
            </a>
            <button
              type="button"
              onClick={() => {
                clearRedirectFlag();
                window.location.href = getDashboardUrl();
              }}
              className="w-full rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500"
            >
              Open dashboard (button)
            </button>
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
            <a href={getDashboardUrl()} onClick={clearRedirectFlag} className="hover:underline">
              {showDashboardLink ? "Open dashboard" : "Click here if you are not redirected"}
            </a>
            {" · "}
            <button
              type="button"
              onClick={() => { clearRedirectFlag(); window.location.href = getDashboardUrl(); }}
              className="underline hover:no-underline"
            >
              Go now
            </button>
          </p>
        )}

        {/* Troubleshooting: show when redirect likely failed or user wants to see why */}
        {(showDashboardLink || error) && (
          <div className="mt-4 rounded-md bg-zinc-800/80 border border-zinc-600 p-3 text-left">
            <button
              type="button"
              onClick={loadDiagnostic}
              disabled={diagnosticLoading}
              className="text-sm font-medium text-amber-400 hover:text-amber-300 disabled:opacity-50"
            >
              {diagnosticLoading ? "Checking…" : "Why didn’t redirect work? Show troubleshooting"}
            </button>
            {diagnostic && (
              <div className="mt-3 pt-3 border-t border-zinc-600 space-y-2 text-xs font-mono text-zinc-300">
                <p className="font-sans font-medium text-zinc-200">Diagnostic:</p>
                <p>Server sees you as authenticated: <strong>{diagnostic.authenticated ? "Yes" : "No"}</strong></p>
                {diagnostic.requestHost != null && (
                  <p>Request Host (what server received): <strong>{diagnostic.requestHost || "(empty)"}</strong></p>
                )}
                {diagnostic.forwardedHost != null && (
                  <p>X-Forwarded-Host: <strong>{diagnostic.forwardedHost || "(not set)"}</strong></p>
                )}
                {typeof window !== "undefined" && (
                  <p>Your browser origin: <strong>{window.location.origin}</strong></p>
                )}
                {process.env.NEXT_PUBLIC_APP_URL && (
                  <p>Expected app URL (NEXT_PUBLIC_APP_URL): <strong>{process.env.NEXT_PUBLIC_APP_URL}</strong></p>
                )}
                {diagnostic.error && (
                  <p className="text-red-400">Server error: {diagnostic.error}</p>
                )}
                {!diagnostic.authenticated && (
                  <p className="font-sans text-amber-300/90 mt-2">
                    If Request Host is not your app’s host (e.g. an internal IP or container name), the auth cookie may not match. Open the app using the exact URL from NEXT_PUBLIC_APP_URL and ensure your proxy sends X-Forwarded-Host.
                  </p>
                )}
              </div>
            )}
          </div>
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
