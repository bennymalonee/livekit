# Environment variables reference

Where to set each variable and what it does.

## Next.js (Dashboard app) – set in Coolify or `.env.local`

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL (backend). | `https://patient-crocodile-0.eu-west-1.convex.cloud` |
| `NEXT_PUBLIC_APP_URL` | Public URL of this app (for auth cookies and redirects). | `http://z4ww800cw0sw0g8gsw0w8ckg.31.97.34.56.sslip.io` |
| `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit server WebSocket URL for clients. | `ws://31.97.34.56:7880` |
| `COOLIFY_DEPLOY_WEBHOOK_URL` | (Optional) Coolify deploy webhook for LiveKit Stack. | POST URL from Coolify → LiveKit app → Webhook |
| `COOLIFY_BASE_URL` | Coolify API base URL (for `/api/deploy` when not using webhook). | `http://31.97.34.56:8000` |
| `COOLIFY_API_TOKEN` | Coolify API token (Deploy permission) for `/api/deploy`. | From Coolify → Keys & Tokens |
| `LIVEKIT_STACK_APP_UUID` | Coolify application UUID for the LiveKit Stack (for deploy API). | `mg44c8wgocck0oso440c84s4` |

## Convex – set in Convex Dashboard → Project → Environment variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `COOLIFY_BASE_URL` | Used by Coolify actions (list apps, sync nodes, logs, env). | `http://31.97.34.56:8000` |
| `COOLIFY_API_TOKEN` | Coolify API token for Convex actions. | From Coolify → Keys & Tokens |
| `LIVEKIT_API_KEY` | LiveKit API key for token generation (Convex action `livekit.generateToken`). | From LiveKit Stack env in Coolify |
| `LIVEKIT_API_SECRET` | LiveKit API secret for signing tokens. Never expose to client. | From LiveKit Stack env in Coolify |

**Note:** `CONVEX_SITE_URL` is built-in and cannot be overridden.

## Coolify – LiveKit Stack app env

See [LIVEKIT-COOLIFY-SETUP.md](LIVEKIT-COOLIFY-SETUP.md). Typical: `LIVEKIT_PUBLIC_IP`, `REDIS_PASSWORD`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `TURN_HOST`, `TURN_CREDENTIAL`, `LIVEKIT_REGION`.

## LiveKit webhook (Convex HTTP)

Configure LiveKit server to send webhooks to your Convex HTTP URL, e.g.:

`https://<your-convex-deployment>.convex.site/livekit-webhook`

Events ingested: `room_started`, `room_finished`, `participant_joined`, `participant_left`.

## Staging / preview

For a second environment (e.g. preview before production):

- **Convex:** Create a second deployment (e.g. "preview") in the Convex dashboard. Use its URL as `NEXT_PUBLIC_CONVEX_URL` for the preview app.
- **Coolify:** Optionally create a second application that points to the same repo (e.g. different branch or same main) and set its env vars to the preview Convex URL and a distinct `NEXT_PUBLIC_APP_URL`.
- **Secrets:** Use separate Coolify API tokens and Convex env for preview so production is not affected.
