import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

const SUB_DIVIDER = "|";

/** Minimum length for a valid Convex doc id (Crockford Base32, typically 31–37 chars). */
const MIN_VALID_ID_LENGTH = 20;

export type AppRole = "admin" | "operator" | "viewer";

/** Get Convex user id from auth identity (subject may be "userId" or "userId|accountId"). */
export function getUserIdFromIdentity(identity: { subject: string }): Id<"users"> {
  const [userId] = identity.subject.split(SUB_DIVIDER);
  return userId as Id<"users">;
}

/** Safe parse: returns userId only if identity has a valid-looking Convex user id; otherwise null. Use in queries that must not throw. */
export function getUserIdFromIdentityOrNull(identity: { subject: string } | null): Id<"users"> | null {
  if (!identity?.subject || typeof identity.subject !== "string") return null;
  const rawId = identity.subject.split(SUB_DIVIDER)[0];
  if (!rawId || !/^[a-z0-9]+$/i.test(rawId) || rawId.length < MIN_VALID_ID_LENGTH) return null;
  return rawId as Id<"users">;
}

/** Resolve role for a user doc; default to viewer if unset. */
export function resolveRole(role: AppRole | undefined): AppRole {
  return role === "admin" || role === "operator" ? role : "viewer";
}

/** Current user's role (for UI and for actions). Returns "viewer" if not authenticated or role unset. */
export const getMyRole = query({
  args: {},
  handler: async (ctx): Promise<AppRole> => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      const userId = getUserIdFromIdentityOrNull(identity);
      if (!userId) return "viewer";
      const user = await ctx.db.get(userId);
      return resolveRole(user?.role as AppRole | undefined);
    } catch {
      return "viewer";
    }
  },
});

/** Current user's Convex user id, or null if not authenticated. Used e.g. for bootstrap "Make me admin". */
export const getMyUserId = query({
  args: {},
  handler: async (ctx): Promise<Id<"users"> | null> => {
    const identity = await ctx.auth.getUserIdentity();
    return getUserIdFromIdentityOrNull(identity);
  },
});

/** Require one of the given roles in a mutation or query. Throws if unauthenticated or role not allowed. */
export async function requireRole(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> }; db: any }, allowedRoles: AppRole[]): Promise<AppRole> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  const userId = getUserIdFromIdentityOrNull(identity);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId);
  const role = resolveRole(user?.role as AppRole | undefined);
  if (!allowedRoles.includes(role)) throw new Error("Forbidden");
  return role;
}

/** Set another user's role. Admin only. */
export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("operator"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"]);
    const identity = await ctx.auth.getUserIdentity();
    const adminUserId = identity ? getUserIdFromIdentity(identity) : null;
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(args.userId, { role: args.role });
    if (adminUserId) {
      await ctx.scheduler.runAfter(0, internal.auditLog.record, {
        userId: adminUserId,
        action: "rbac.setUserRole",
        resourceType: "user",
        resourceId: args.userId,
        details: JSON.stringify({ targetUserId: args.userId, newRole: args.role }),
      });
    }
  },
});

/**
 * Bootstrap: set a user's role when there are no admins yet.
 * Only succeeds when zero users have role "admin". Use from Convex dashboard/MCP for first-time setup.
 * After the first admin exists, use setUserRole (admin-only) to change roles.
 */
export const bootstrapSetRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("operator"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    const allUsers = await ctx.db.query("users").collect();
    const hasAdmin = allUsers.some((u) => u.role === "admin");
    if (hasAdmin) throw new Error("Bootstrap only allowed when no admin exists. Use setUserRole as an admin instead.");
    await ctx.db.patch(args.userId, { role: args.role });
    return { ok: true, userId: args.userId, role: args.role };
  },
});
