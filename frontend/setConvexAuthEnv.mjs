#!/usr/bin/env node
/**
 * Generates JWT key pair for Convex Auth and sets JWT_PRIVATE_KEY and JWKS
 * on the Convex deployment via `npx convex env set` (value from stdin).
 *
 * Usage (from frontend/):
 *   npm run convex:auth:env           # current deployment (usually dev)
 *   npm run convex:auth:env -- --prod # production deployment
 *
 * CONVEX_SITE_URL is built-in and cannot be set via this script.
 */
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";
import { spawnSync } from "child_process";
import { writeFileSync, unlinkSync, mkdtempSync, rmdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const isProd = process.argv.includes("--prod");
const convexExtra = isProd ? " --prod" : "";

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = (await exportPKCS8(keys.privateKey)).trimEnd();
// Keep newlines for PEM – importPKCS8 expects valid PEM format
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

function runConvexEnvSetStdin(name, value) {
  const tmpDir = mkdtempSync(join(tmpdir(), "convex-auth-"));
  const tmpFile = join(tmpDir, "value.txt");
  try {
    writeFileSync(tmpFile, value, "utf8");
    const isWin = process.platform === "win32";
    const cmd = isWin
      ? `type "${tmpFile}" | npx convex env set ${name}${convexExtra}`
      : `cat "${tmpFile}" | npx convex env set ${name}${convexExtra}`;
    const result = spawnSync(cmd, [], {
      stdio: "inherit",
      shell: true,
      cwd: process.cwd(),
      windowsHide: true,
    });
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  } finally {
    try {
      unlinkSync(tmpFile);
    } catch (_) {}
    try {
      rmdirSync(tmpDir);
    } catch (_) {}
  }
}

console.log(isProd ? "Target: production Convex deployment." : "Target: current (dev) Convex deployment.");
console.log("Setting JWT_PRIVATE_KEY...");
runConvexEnvSetStdin("JWT_PRIVATE_KEY", privateKey);
console.log("Setting JWKS...");
runConvexEnvSetStdin("JWKS", jwks);
console.log("Done. JWT_PRIVATE_KEY and JWKS are set on your Convex deployment.");
if (isProd) {
  console.log("");
  console.log("CONVEX_SITE_URL is a built-in Convex variable (set automatically).");
  console.log("If auth still fails, add your app origin in Dashboard → Settings → Allowed origins.");
}
