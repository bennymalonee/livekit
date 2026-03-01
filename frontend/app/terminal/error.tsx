"use client";

import Link from "next/link";

export default function TerminalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card-dark border border-panel-border rounded-2xl p-8 shadow-lg text-center">
        <h2 className="text-xl font-bold text-white mb-2">Terminal failed to load</h2>
        <p className="text-slate-400 text-sm mb-6">
          {error.message || "Something went wrong loading the terminal. Check your connection and try again."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg border border-panel-border text-slate-300 font-medium hover:bg-slate-800 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
