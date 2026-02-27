#!/usr/bin/env node
/**
 * Download Stitch screen images and HTML
 * Usage: node download-stitch-assets.mjs [path-to-stitch-urls.json]
 * Fill imageUrl and htmlUrl in stitch-urls.json first (from Stitch MCP)
 */

import { readFileSync, mkdirSync, existsSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptDir = __dirname;
const projectRoot = join(scriptDir, "..");
const urlsFile = process.argv[2] || join(scriptDir, "stitch-urls.json");
const outputDir = join(projectRoot, "frontend", "public", "stitch");

if (!existsSync(urlsFile)) {
  console.error("ERROR:", urlsFile, "not found");
  console.error("Fill imageUrl and htmlUrl for each screen (from Stitch MCP), then run again.");
  process.exit(1);
}

const data = JSON.parse(readFileSync(urlsFile, "utf8"));
mkdirSync(join(outputDir, "images"), { recursive: true });
mkdirSync(join(outputDir, "html"), { recursive: true });

console.log("Downloading Stitch assets from", urlsFile);
console.log("Output:", outputDir);
console.log("");

async function run() {
  for (let i = 0; i < data.screens.length; i++) {
    const screen = data.screens[i];
    const { id, name, imageUrl, htmlUrl } = screen;

    if (imageUrl) {
      const ext = imageUrl.includes(".webp") ? "webp" : "png";
      const path = join(outputDir, "images", `${id}.${ext}`);
      console.log(`  [${i}] ${name}: image`);
      try {
        const res = await fetch(imageUrl, { redirect: "follow" });
        const buf = Buffer.from(await res.arrayBuffer());
        writeFileSync(path, buf);
      } catch (e) {
        console.warn("    Failed:", e.message);
      }
    }

    if (htmlUrl) {
      const path = join(outputDir, "html", `${id}.html`);
      console.log(`  [${i}] ${name}: HTML`);
      try {
        const res = await fetch(htmlUrl, { redirect: "follow" });
        const text = await res.text();
        writeFileSync(path, text);
      } catch (e) {
        console.warn("    Failed:", e.message);
      }
    }
  }
  console.log("\nDone. Assets in", outputDir);
}

run();
