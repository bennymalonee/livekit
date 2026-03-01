"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

export function RunbooksView() {
  const runbooks = useQuery(api.runbooks.list);
  const createRunbook = useMutation(api.runbooks.create);
  const removeRunbook = useMutation(api.runbooks.remove);
  const [expandedId, setExpandedId] = useState<Id<"runbooks"> | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSteps, setNewSteps] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createRunbook({
        title: newTitle.trim(),
        stepsMarkdown: newSteps.trim() || "1. Step one\n2. Step two",
      });
      setNewTitle("");
      setNewSteps("");
    } finally {
      setCreating(false);
    }
  }

  const quickLinks = [
    { path: "/dashboard", icon: "hub", label: "Dashboard" },
    { path: "/deploy", icon: "rocket_launch", label: "Deploy" },
    { path: "/nodes", icon: "dns", label: "Nodes" },
    { path: "/modules", icon: "view_module", label: "Modules" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col">
      <nav className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-slate-800">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">
          Quick links
        </span>
        {quickLinks.map(({ path, icon, label }) => (
          <Link
            key={path}
            href={path}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 text-xs font-medium transition-colors"
          >
            <span className="material-icons-round text-base">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 max-w-4xl w-full mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Runbooks</h1>
        <p className="text-slate-500 text-sm mb-6">
          Operational playbooks and steps for deploy, nodes, and incidents.
        </p>

        <form onSubmit={handleCreate} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 mb-8 space-y-3">
          <h2 className="text-sm font-semibold text-slate-400">New runbook</h2>
          <input
            type="text"
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500 text-sm"
          />
          <textarea
            placeholder="Steps (markdown)"
            value={newSteps}
            onChange={(e) => setNewSteps(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500 text-sm resize-y"
          />
          <button
            type="submit"
            disabled={creating || !newTitle.trim()}
            className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium"
          >
            {creating ? "Creating…" : "Create runbook"}
          </button>
        </form>

        {runbooks === undefined ? (
          <p className="text-slate-500">Loading runbooks…</p>
        ) : runbooks.length === 0 ? (
          <p className="text-slate-500">No runbooks yet. Create one above.</p>
        ) : (
          <ul className="space-y-4">
            {runbooks.map((rb) => (
              <li
                key={rb._id}
                className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50"
                  onClick={() => setExpandedId(expandedId === rb._id ? null : rb._id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-icons-round text-amber-500">menu_book</span>
                    <span className="font-medium">{rb.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rb.deployLink && (
                      <a
                        href={rb.deployLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-amber-500 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Deploy →
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm("Delete this runbook?")) await removeRunbook({ id: rb._id });
                      }}
                      className="text-slate-500 hover:text-red-400 text-sm"
                    >
                      Delete
                    </button>
                    <span className="material-icons-round text-slate-500">
                      {expandedId === rb._id ? "expand_less" : "expand_more"}
                    </span>
                  </div>
                </div>
                {expandedId === rb._id && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-800">
                    <pre className="mt-3 text-sm text-slate-400 whitespace-pre-wrap font-sans">
                      {rb.stepsMarkdown || "No steps."}
                    </pre>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
