import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const updateLatestFromWebhook = internalMutation({
  args: {
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the most recent deployment and update its status.
    const latest = await ctx.db
      .query("deployments")
      .order("desc")
      .first();

    if (!latest) return;

    const allowed = new Set(["pending", "running", "success", "failed"]);
    const nextStatus = allowed.has(args.status)
      ? (args.status as typeof latest.status)
      : "success";

    await ctx.db.patch(latest._id, {
      status: nextStatus,
      updatedAt: Date.now(),
    });
  },
});

