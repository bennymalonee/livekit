import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

const coolifyWebhook = httpAction(async (ctx, request) => {
  const method = request.method.toUpperCase();
  if (method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const secret = process.env.COOLIFY_WEBHOOK_SECRET;
  if (secret && secret.length > 0) {
    const authHeader = request.headers.get("Authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const headerSecret = request.headers.get("X-Webhook-Secret")?.trim() ?? bearer;
    if (headerSecret !== secret) {
      return new Response("Unauthorized", { status: 401 });
    }
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

  await ctx.runMutation(internal.deployments_internal.updateLatestFromWebhook, {
    status,
  });

  return new Response("ok", { status: 200 });
});

http.route({
  path: "/coolify/webhook",
  method: "POST",
  handler: coolifyWebhook,
});

/** LiveKit webhook: room_started, room_finished, participant_joined, participant_left, etc. Verifies signature in Node action when LIVEKIT_API_KEY/SECRET are set. */
const livekitWebhook = httpAction(async (ctx, request) => {
  if (request.method.toUpperCase() !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await request.text();
  const authHeader = request.headers.get("Authorization") ?? request.headers.get("Authorize");

  let eventName: string;
  let roomName: string;
  let participantCount: number | undefined;

  try {
    const result = await ctx.runAction(api.livekit.verifyWebhookPayload, {
      body: rawBody,
      authHeader: authHeader ?? null,
    });
    eventName = result.event;
    roomName = result.roomName;
    participantCount = result.participantCount;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "BAD_REQUEST") return new Response("Bad request", { status: 400 });
    return new Response("Unauthorized", { status: 401 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  if (!roomName && eventName !== "room_finished") {
    return new Response("ok", { status: 200 });
  }
  await ctx.runMutation(internal.sessions_internal.ingestWebhookEvent, {
    event: eventName,
    roomName: String(roomName),
    participantCount: typeof participantCount === "number" ? participantCount : undefined,
    timestamp,
  });
  return new Response("ok", { status: 200 });
});

http.route({
  path: "/livekit-webhook",
  method: "POST",
  handler: livekitWebhook,
});

/** Deploy rate limit check: POST with JSON { clientId } and optional X-Deploy-Secret. Returns { allowed: boolean }. Used by Next.js /api/deploy when CONVEX_SITE_URL is set. */
const deployRateLimit = httpAction(async (ctx, request) => {
  if (request.method.toUpperCase() !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const secret = process.env.DEPLOY_RATE_LIMIT_SECRET ?? process.env.DEPLOY_SECRET;
  if (secret && secret.length > 0) {
    const authHeader = request.headers.get("Authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const headerSecret = request.headers.get("X-Deploy-Secret")?.trim() ?? bearer;
    if (headerSecret !== secret) {
      return new Response(JSON.stringify({ allowed: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  let body: { clientId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ allowed: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const clientId = typeof body?.clientId === "string" && body.clientId.trim() ? body.clientId.trim() : "unknown";
  const result = await ctx.runMutation(internal.deployRateLimit_internal.checkAndIncrement, { clientId });
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

http.route({
  path: "/deploy-rate-limit",
  method: "POST",
  handler: deployRateLimit,
});

export default http;
