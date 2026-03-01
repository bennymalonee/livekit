"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useEffect } from "react";

export function KeyboardShortcutsHelp() {
  const { showHelp, setShowHelp, shortcuts } = useKeyboardShortcuts();

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowHelp(false);
    };
    if (showHelp) {
      window.addEventListener("keydown", onEscape);
      return () => window.removeEventListener("keydown", onEscape);
    }
  }, [showHelp, setShowHelp]);

  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            aria-label="Close"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>
        <ul className="space-y-3 text-sm">
          {shortcuts.map((s) => (
            <li
              key={s.keys + s.path}
              className="flex justify-between items-center text-slate-700 dark:text-slate-300"
            >
              <span>{s.label}</span>
              <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500 mt-4">Press ? to toggle this help.</p>
      </div>
    </div>
  );
}
