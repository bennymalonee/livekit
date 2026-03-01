import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
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

/** LiveKit webhook: room_started, room_finished, participant_joined, participant_left. */
const livekitWebhook = httpAction(async (ctx, request) => {
  if (request.method.toUpperCase() !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  let payload: { event?: string; room?: { name?: string; num_participants?: number }; num_participants?: number };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const event = payload?.event ?? "";
  const roomName = payload?.room?.name ?? payload?.room ?? "";
  const participantCount = payload?.room?.num_participants ?? payload?.num_participants;
  const timestamp = Math.floor(Date.now() / 1000);
  if (!roomName && event !== "room_finished") {
    return new Response("ok", { status: 200 });
  }
  await ctx.runMutation(internal.sessions_internal.ingestWebhookEvent, {
    event,
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
