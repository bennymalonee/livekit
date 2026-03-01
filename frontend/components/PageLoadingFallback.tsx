"use client";

interface PageLoadingFallbackProps {
  label?: string;
}

/** Shared loading fallback for heavy pages (Sessions, Analytics, Diagnostics, Terminal). */
export function PageLoadingFallback({ label = "Loading…" }: PageLoadingFallbackProps) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-8">
      <div
        className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"
        aria-hidden
      />
      <p className="text-slate-400 text-sm font-medium">{label}</p>
    </div>
  );
}
