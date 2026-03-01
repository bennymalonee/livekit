import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserIdFromIdentity, getUserIdFromIdentityOrNull, requireRole } from "./rbac";

/** Resolve current user's organization id from preferences or first membership. Use in queries/mutations to scope by org. */
export async function getCurrentOrganizationIdForContext(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
  db: any;
}): Promise<Id<"organizations"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  const userId = getUserIdFromIdentityOrNull(identity);
  if (!userId) return null;
  const prefs = await ctx.db
    .query("userPreferences")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();
  if (prefs?.currentOrganizationId) return prefs.currentOrganizationId;
  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  return membership?.organizationId ?? null;
}

const DEFAULT_ORG_SLUG = "default";

/** List organizations the current user is a member of. Returns [] when not authenticated. */
export const listMyOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = getUserIdFromIdentityOrNull(identity);
    if (!userId) return [];
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const orgs = await Promise.all(
      memberships.map((m) => ctx.db.get(m.organizationId))
    );
    return orgs.filter(Boolean).map((o) => ({
      _id: o!._id,
      name: o!.name,
      slug: o!.slug,
    }));
  },
});

/** Get the current user's selected organization id (from preferences or first org). Returns null when not authenticated. */
export const getCurrentOrganizationId = query({
  args: {},
  handler: async (ctx): Promise<Id<"organizations"> | null> => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = getUserIdFromIdentityOrNull(identity);
    if (!userId) return null;
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (prefs?.currentOrganizationId) return prefs.currentOrganizationId;
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return memberships?.organizationId ?? null;
  },
});

/** Set the current user's selected organization. */
export const setCurrentOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin", "operator", "viewer"]);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = getUserIdFromIdentity(identity);
    const member = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId)
      )
      .unique();
    if (!member) throw new Error("Not a member of this organization");
    const now = Date.now();
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (prefs) {
      await ctx.db.patch(prefs._id, {
        currentOrganizationId: args.organizationId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userPreferences", {
        userId,
        currentOrganizationId: args.organizationId,
        updatedAt: now,
      });
    }
  },
});

/** Create a new organization and add the creator as admin. */
export const createOrganization = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = getUserIdFromIdentity(identity);
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error("Organization slug already exists");
    const now = Date.now();
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      createdAt: now,
    });
    await ctx.db.insert("organizationMembers", {
      userId,
      organizationId: orgId,
      role: "admin",
      joinedAt: now,
    });
    return orgId;
  },
});

/** Ensure a default organization exists and add the user if they have no org. Idempotent. Call after sign-in so user has an org. Returns null when not authenticated or identity invalid (no-op to avoid server error). */
export const ensureDefaultOrganization = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"organizations"> | null> => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = getUserIdFromIdentityOrNull(identity);
    if (!userId) return null;
    let defaultOrg = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", DEFAULT_ORG_SLUG))
      .unique();
    if (!defaultOrg) {
      const now = Date.now();
      const orgId = await ctx.db.insert("organizations", {
        name: "Default",
        slug: DEFAULT_ORG_SLUG,
        createdAt: now,
      });
      defaultOrg = await ctx.db.get(orgId);
    }
    if (!defaultOrg) throw new Error("Failed to create or load default organization");
    const member = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_organization", (q) =>
        q.eq("userId", userId).eq("organizationId", defaultOrg!._id)
      )
      .unique();
    if (!member) {
      await ctx.db.insert("organizationMembers", {
        userId,
        organizationId: defaultOrg._id,
        role: "member",
        joinedAt: Date.now(),
      });
    }
    return defaultOrg._id;
  },
});
