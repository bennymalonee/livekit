"use client";

import { DashboardNav } from "@/components/DashboardNav";

type StitchScreenProps = {
  screenId: string;
  title: string;
};

export function StitchScreen({ screenId, title }: StitchScreenProps) {
  const htmlPath = `/stitch/html/${screenId}.html`;

  return (
    <div className="stitch-screen">
      <DashboardNav />
      <main style={{ padding: "1rem", minHeight: "80vh" }}>
        <h1 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>{title}</h1>
        <div style={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
          <iframe
            src={htmlPath}
            title={title}
            style={{ width: "100%", height: "80vh", border: "none" }}
            sandbox="allow-scripts"
          />
        </div>
        <p style={{ marginTop: "1rem", color: "#666", fontSize: "0.875rem" }}>
          HTML from /stitch/html/{screenId}.html. Run download script after filling stitch-urls.json.
        </p>
      </main>
    </div>
  );
}
