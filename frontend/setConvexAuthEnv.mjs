#!/usr/bin/env node
/**
 * Generates JWT key pair for Convex Auth and sets JWT_PRIVATE_KEY and JWKS
 * on the current Convex deployment via `npx convex env set` (value from stdin).
 * Run from frontend/: node setConvexAuthEnv.mjs
 */
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";
import { spawnSync } from "child_process";
import { writeFileSync, unlinkSync, mkdtempSync, rmdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const privateKeyOneLine = privateKey.trimEnd().replace(/\n/g, " ");
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

function runConvexEnvSetStdin(name, value) {
  const tmpDir = mkdtempSync(join(tmpdir(), "convex-auth-"));
  const tmpFile = join(tmpDir, "value.txt");
  try {
    writeFileSync(tmpFile, value, "utf8");
    const isWin = process.platform === "win32";
    const cmd = isWin
      ? `type "${tmpFile}" | npx convex env set ${name}`
      : `cat "${tmpFile}" | npx convex env set ${name}`;
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

console.log("Setting JWT_PRIVATE_KEY...");
runConvexEnvSetStdin("JWT_PRIVATE_KEY", privateKeyOneLine);
console.log("Setting JWKS...");
runConvexEnvSetStdin("JWKS", jwks);
console.log("Done. JWT_PRIVATE_KEY and JWKS are set on your Convex deployment.");
