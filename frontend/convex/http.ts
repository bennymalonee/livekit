import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

const coolifyWebhook = httpAction(async (ctx, request) => {
  const method = request.method.toUpperCase();
  if (method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  // Basic shape guard for known Coolify fields (best-effort).
  const status =
    payload &&
    typeof (payload as any).status === "string" &&
    (payload as any).status
      ? ((payload as any).status as string)
      : "success";

  await ctx.runMutation(internal.deployments.updateLatestFromWebhook, {
    status,
  });

  return new Response("ok", { status: 200 });
});

http.route({
  path: "/coolify/webhook",
  method: "POST",
  handler: coolifyWebhook,
});

export default http;
