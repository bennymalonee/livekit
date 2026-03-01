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

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      await signIn("google");
      goToDashboard();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Google sign-in failed";
      setError(raw);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100 relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,107,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,107,0,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-zinc-950/80 pointer-events-none" aria-hidden />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-sm p-8 shadow-2xl shadow-black/40">
          {/* Branding */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-dash-primary flex items-center justify-center shadow-lg shadow-dash-primary/25 mb-4">
              <span className="material-icons-round text-white text-3xl">bolt</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              LivKit Enterprise
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {redirecting ? "Redirecting to dashboard…" : "Sign in to your dashboard"}
            </p>
          </div>

          {showDashboardLink && (
            <div className="mb-6 rounded-xl bg-amber-950/40 border border-amber-700/50 p-4 text-center space-y-3">
              <p className="text-amber-200 text-sm font-medium">You are signed in.</p>
              <a
                href={getDashboardUrl()}
                onClick={clearRedirectFlag}
                className="text-dash-primary font-medium hover:underline underline-offset-2 block text-sm"
              >
                Open dashboard →
              </a>
              <button
                type="button"
                onClick={() => {
                  clearRedirectFlag();
                  window.location.href = getDashboardUrl();
                }}
                className="w-full rounded-lg bg-dash-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Open dashboard
              </button>
            </div>
          )}

          {!showDashboardLink && (
            <>
              {error && (
                <div className="mb-6 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 px-4 py-3 text-sm">
                  <p className="font-medium">{getAuthErrorMessage(error)}</p>
                  {getAuthErrorHint(error) && (
                    <p className="mt-2 text-red-300/90 text-xs">
                      {getAuthErrorHint(error)}
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || redirecting}
                  className="w-full rounded-xl border border-zinc-600 bg-white/5 px-4 py-3 font-medium text-zinc-100 hover:bg-white/10 hover:border-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-dash-primary/50 focus:ring-offset-2 focus:ring-offset-zinc-900 flex items-center justify-center gap-3 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-zinc-900 px-3 text-zinc-500">or continue with email</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="sr-only">Email</span>
                    <input
                      name="email"
                      type="email"
                      placeholder="Email"
                      required
                      autoComplete="email"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/30 transition-colors"
                    />
                  </label>
                  <label className="block">
                    <span className="sr-only">Password</span>
                    <input
                      name="password"
                      type="password"
                      placeholder="Password"
                      required
                      autoComplete={step === "signIn" ? "current-password" : "new-password"}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/30 transition-colors"
                    />
                  </label>
                </div>
                <input name="flow" type="hidden" value={step} />
                <button
                  type="submit"
                  disabled={loading || redirecting}
                  className="w-full rounded-xl bg-dash-primary px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2 focus:ring-offset-zinc-900 transition-opacity"
                >
                  {redirecting ? "Redirecting…" : loading ? "Please wait…" : step === "signIn" ? "Sign in" : "Sign up"}
                </button>
              </form>

              {(redirecting || showDashboardLink) && (
                <p className="mt-5 text-center text-sm text-zinc-400">
                  <a href={getDashboardUrl()} onClick={clearRedirectFlag} className="text-dash-primary hover:underline font-medium">
                    {showDashboardLink ? "Open dashboard" : "Click here if you are not redirected"}
                  </a>
                  {" · "}
                  <button
                    type="button"
                    onClick={() => { clearRedirectFlag(); window.location.href = getDashboardUrl(); }}
                    className="text-dash-primary hover:underline font-medium"
                  >
                    Go now
                  </button>
                </p>
              )}

              <button
                type="button"
                onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
                className="mt-6 w-full text-sm text-zinc-400 hover:text-zinc-200 transition-colors py-1"
              >
                {step === "signIn" ? "Sign up instead" : "Sign in instead"}
              </button>
            </>
          )}

          {/* Troubleshooting: show when redirect likely failed or user wants to see why */}
          {(showDashboardLink || error) && (
            <div className="mt-6 rounded-xl bg-zinc-800/60 border border-zinc-700 p-4 text-left">
              <button
                type="button"
                onClick={loadDiagnostic}
                disabled={diagnosticLoading}
                className="text-sm font-medium text-dash-primary hover:text-amber-400 disabled:opacity-50"
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
                      {diagnostic.requestHost && diagnostic.requestHost === (typeof window !== "undefined" ? window.location.host : "") ? (
                        <>Host and origin match but the server still doesn’t see a session. On HTTP, the auth cookie must be set with <code className="text-xs">secure: false</code> (this repo applies a patch to <code className="text-xs">@convex-dev/auth</code> so that works). Redeploy the app so the patch is applied, then sign in again.</>
                      ) : (
                        <>If Request Host is not your app’s host (e.g. an internal IP or container name), the auth cookie may not match. Open the app using the exact URL from NEXT_PUBLIC_APP_URL and ensure your proxy sends X-Forwarded-Host.</>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="mt-6 pt-6 border-t border-zinc-800 text-center space-y-1">
            <span className="text-sm text-zinc-500">Can’t set role in Dashboard?</span>
            <br />
            <Link href="/bootstrap" className="text-sm text-dash-primary hover:underline font-medium">
              Set admin by email (first user only)
            </Link>
            <br />
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1 mt-2">
              <span className="material-icons-round text-base">arrow_back</span>
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
