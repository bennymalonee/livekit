"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function AuditLogView() {
  const entries = useQuery(api.auditLog.listRecent, { limit: 100 });

  if (entries === undefined) {
    return (
      <div className="p-8 text-slate-400">Loading audit log…</div>
    );
  }

  if (entries === null || entries.length === 0) {
    return (
      <div className="p-8 text-slate-400">No audit entries yet.</div>
    );
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
      <div className="p-6 md:p-10 max-w-6xl w-full mx-auto">
        <h1 className="text-2xl font-display font-bold tracking-widest text-white mb-2">
          Audit Log
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Recent actions by users. Admin only. No secrets or tokens are stored.
        </p>
        <div className="rounded-lg border border-white/10 bg-surface-dark/80 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider text-xs">
                <th className="p-3 font-medium">Time</th>
                <th className="p-3 font-medium">User</th>
                <th className="p-3 font-medium">Action</th>
                <th className="p-3 font-medium">Resource</th>
                <th className="p-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry._id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 font-mono text-xs text-slate-400">
                    {new Date(entry.createdAt).toISOString()}
                  </td>
                  <td className="p-3 font-mono text-xs truncate max-w-[120px]" title={entry.userId}>
                    {entry.userId}
                  </td>
                  <td className="p-3">{entry.action}</td>
                  <td className="p-3">
                    {entry.resourceType}
                    {entry.resourceId ? ` · ${entry.resourceId}` : ""}
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-xs max-w-[200px] truncate" title={entry.details ?? ""}>
                    {entry.details ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
