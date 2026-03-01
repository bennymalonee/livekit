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

export default http;
