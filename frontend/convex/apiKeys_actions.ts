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

/** Check that key has the required scope. Use from HTTP routes before performing scoped operations. */
export function hasScope(scopes: string[], required: string): boolean {
  return scopes.includes(required) || scopes.includes("*");
}

/** List nodes via API key. Requires nodes:list (or *) scope. For use from Convex HTTP routes. */
export const listNodesWithApiKey = action({
  args: { rawKey: v.string() },
  handler: async (ctx, args): Promise<{ allowed: boolean; nodes: unknown }> => {
    const result = await ctx.runAction(api.apiKeys_actions.validateApiKey, { rawKey: args.rawKey });
    if (!result) return { allowed: false, nodes: null };
    if (!hasScope(result.scopes, "nodes:list")) return { allowed: false, nodes: null };
    const nodes = await ctx.runQuery(api.nodes.listNodesForApi, {});
    return { allowed: true, nodes };
  },
});

/** List sessions via API key. Requires sessions:list (or *) scope. */
export const listSessionsWithApiKey = action({
  args: {
    rawKey: v.string(),
    roomName: v.optional(v.string()),
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ allowed: boolean; sessions: unknown }> => {
    const result = await ctx.runAction(api.apiKeys_actions.validateApiKey, { rawKey: args.rawKey });
    if (!result) return { allowed: false, sessions: null };
    if (!hasScope(result.scopes, "sessions:list")) return { allowed: false, sessions: null };
    const sessions = await ctx.runQuery(api.sessions.listSessionsForApi, {
      roomName: args.roomName,
      sinceMs: args.sinceMs,
    });
    return { allowed: true, sessions };
  },
});

/** Get analytics overview via API key. Requires analytics:read (or *) scope. */
export const getAnalyticsWithApiKey = action({
  args: {
    rawKey: v.string(),
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ allowed: boolean; analytics: unknown }> => {
    const result = await ctx.runAction(api.apiKeys_actions.validateApiKey, { rawKey: args.rawKey });
    if (!result) return { allowed: false, analytics: null };
    if (!hasScope(result.scopes, "analytics:read")) return { allowed: false, analytics: null };
    const analytics = await ctx.runQuery(api.analytics.getOverviewForApi, {
      sinceMs: args.sinceMs,
    });
    return { allowed: true, analytics };
  },
});
