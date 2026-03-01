# LiveKit → Convex webhook + token setup

One-time setup so room/participant events feed **Sessions** and **livekit.generateToken** works.

## Webhook verification

When **`LIVEKIT_API_KEY`** and **`LIVEKIT_API_SECRET`** are set in Convex, the `/livekit-webhook` handler verifies the request signature using LiveKit’s **WebhookReceiver** (signed JWT in the `Authorization` header). If verification fails, the request is rejected with 401. Without these env vars (e.g. local testing), the handler accepts the payload without verification.

## Events handled

| Event | Handled |
|-------|--------|
| `room_started`, `room_finished` | Yes — create/update session, set participant count and `endedAt` |
| `participant_joined`, `participant_left` | Yes — update session participant count |
| `participant_connection_aborted`, `track_published`, `track_unpublished`, `egress_started`, `egress_updated`, `egress_ended`, `ingress_started`, `ingress_ended` | No — acknowledged (200) but not persisted |

## 1. Convex env (for token generation and webhook verification) — do this manually

The Convex MCP cannot set **production** environment variables (safety). Set them in the dashboard:

1. Open **Convex Dashboard** → your project → **Production** deployment → **Settings** → **Environment variables**.
2. Open **Coolify** → **livekit-stack** app → **Environment variables** and copy **`LIVEKIT_API_KEY`** and **`LIVEKIT_API_SECRET`**.
3. In Convex, add:
   - **`LIVEKIT_API_KEY`** = (paste the key from Coolify)
   - **`LIVEKIT_API_SECRET`** = (paste the secret from Coolify)
4. Save. No redeploy needed for Convex env changes.

## 2. LiveKit webhook URL (Coolify)

- Set **`LIVEKIT_WEBHOOK_URL`** on the **livekit-stack** app in Coolify to:
  **`https://<your-convex-deployment>.convex.site/livekit-webhook`**
  Replace `<your-convex-deployment>` with your Convex deployment name (e.g. from your Convex dashboard URL).
- **Redeploy** the LiveKit Stack so the server picks up the new env and `livekit.yaml` webhook config.

The repo’s `deploy/livekit.yaml` includes a `webhook` section that uses `LIVEKIT_WEBHOOK_URL`.

## 3. Convex codegen / deploy

From the repo:

```bash
cd frontend
npx convex codegen
# or to push functions: npx convex deploy
```

Crons and HTTP routes (including `/livekit-webhook`) are included when you run `convex dev` or `convex deploy`.

## Summary

| Where | What |
|-------|------|
| **Convex** env | `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` (same as LiveKit Stack) |
| **Coolify** LiveKit Stack app env | `LIVEKIT_WEBHOOK_URL` = `https://<your-deployment>.convex.site/livekit-webhook` |
| **Redeploy** | LiveKit Stack in Coolify after adding `LIVEKIT_WEBHOOK_URL` |

After this, Sessions will receive events from LiveKit, and you can call the **`livekit.generateToken`** Convex action (with `roomName`, optional `participantName`, `ttlSeconds`, `metadata`, `attributes`) to get tokens for “Join test room” or similar.

## Token TTL and refresh

Tokens use a **30-minute default TTL** for self-hosted (token revocation is Cloud-only). Pass `ttlSeconds` to `generateToken` to override (e.g. `3600` for 1 hour in dev). Mobile and web clients should request a new token from your backend when reconnecting or before expiry; use the LiveKit SDK’s token refresh callback where supported.
