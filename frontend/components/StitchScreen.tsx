"use client";

import Link from "next/link";
import { STITCH_SCREENS } from "@/lib/stitch-screens";

type StitchScreenProps = {
  screenId: string;
  title: string;
};

export function StitchScreen({ screenId, title }: StitchScreenProps) {
  const imagePath = `/stitch/images/${screenId}.png`;
  const htmlPath = `/stitch/html/${screenId}.html`;

  return (
    <div className="stitch-screen">
      <nav style={{ padding: "1rem", background: "#0f231d", color: "#fff", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {STITCH_SCREENS.map((s) => (
          <Link key={s.id} href={s.path} style={{ color: s.id === screenId ? "#01a875" : "#ccc" }}>
            {s.name}
          </Link>
        ))}
      </nav>
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
