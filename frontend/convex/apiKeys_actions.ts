"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { createHash } from "crypto";

function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey, "utf8").digest("hex");
}

function generateRawKey(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Create an API key. Returns the raw key once; store it securely. Admin or operator. */
export const createApiKey = action({
  args: {
    name: v.string(),
    scopes: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<{ id: Id<"apiKeys">; key: string }> => {
    const role = await ctx.runQuery(api.rbac.getMyRole);
    if (!role || !["admin", "operator"].includes(role)) throw new Error("Forbidden");
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const { getUserIdFromIdentity } = await import("./rbac");
    const userId = getUserIdFromIdentity(identity);
    const orgId = await ctx.runQuery(api.organizations.getCurrentOrganizationId);
    const rawKey = `lk_${generateRawKey()}`;
    const keyHash = hashKey(rawKey);
    const scopesJson = JSON.stringify(args.scopes);
    const id = await ctx.runMutation(internal.apiKeys.insertApiKey, {
      keyHash,
      name: args.name,
      userId,
      organizationId: orgId ?? undefined,
      scopes: scopesJson,
    });
    return { id, key: rawKey };
  },
});

/** Validate raw API key and return userId + scopes. Updates lastUsedAt. Use from HTTP or other entry points. */
export const validateApiKey = action({
  args: { rawKey: v.string() },
  handler: async (ctx, args): Promise<{ userId: Id<"users">; scopes: string[] } | null> => {
    const keyHash = hashKey(args.rawKey);
    const keyDoc = await ctx.runQuery(internal.apiKeys.findByHashInternal, { keyHash });
    if (!keyDoc) return null;
    await ctx.runMutation(internal.apiKeys.touchLastUsed, { id: keyDoc._id });
    let scopes: string[];
    try {
      scopes = JSON.parse(keyDoc.scopes) as string[];
    } catch {
      scopes = [];
    }
    return { userId: keyDoc.userId, scopes };
  },
});
