# Environment variables reference

Where to set each variable and what it does.

## Next.js (Dashboard app) – set in Coolify or `.env.local`

| Variable | Purpose | Example (demo only) |
|----------|---------|---------------------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL (backend). | `https://your-deployment.convex.cloud` |
| `NEXT_PUBLIC_APP_URL` | Public URL of this app (for auth cookies and redirects). | `https://your-app.example.com` |
| `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit server WebSocket URL for clients. | `ws://YOUR_VPS_IP:7880` |
| `COOLIFY_DEPLOY_WEBHOOK_URL` | (Optional) Coolify deploy webhook for LiveKit Stack. | From Coolify → LiveKit app → Webhook |
| `COOLIFY_BASE_URL` | Coolify API base URL (for `/api/deploy` when not using webhook). | `http://YOUR_VPS_IP:8000` |
| `COOLIFY_API_TOKEN` | Coolify API token (Deploy permission) for `/api/deploy`. | From Coolify → Keys & Tokens |
| `LIVEKIT_STACK_APP_UUID` | Coolify application UUID for the LiveKit Stack (for deploy API). | From Coolify → your LiveKit app |
| `NEXT_PUBLIC_COOLIFY_DASHBOARD_APP_UUID` | (Optional) Dashboard app UUID for Coolify logs/env in Diagnostics & Vault. | From Coolify → Dashboard app |
| `NEXT_PUBLIC_COOLIFY_LIVEKIT_STACK_APP_UUID` | (Optional) LiveKit Stack app UUID for Deploy prefill, Diagnostics, Vault, Terminal. | From Coolify → LiveKit Stack app |

## Convex – set in Convex Dashboard → Project → Environment variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `COOLIFY_BASE_URL` | Used by Coolify actions (list apps, sync nodes, logs, env). | `http://YOUR_VPS_IP:8000` |
| `COOLIFY_API_TOKEN` | Coolify API token for Convex actions. | From Coolify → Keys & Tokens |
| `LIVEKIT_API_KEY` | LiveKit API key for token generation (Convex action `livekit.generateToken`). | From LiveKit Stack env in Coolify |
| `LIVEKIT_API_SECRET` | LiveKit API secret for signing tokens. Never expose to client. | From LiveKit Stack env in Coolify |
| `LIVEKIT_URL` | LiveKit server URL (e.g. `wss://...` or `https://...`). Required for agent dispatch (Convex action `livekit.dispatchAgentToRoom`). | Same host as client WebSocket URL, with `wss://` or `https://` |

**Note:** `CONVEX_SITE_URL` is built-in and cannot be overridden.

## Agent worker (`agent/`) – set in env when running the worker

| Variable | Purpose | Example |
|----------|---------|---------|
| `LIVEKIT_URL` | LiveKit server WebSocket URL for the agent to connect. | `wss://YOUR_VPS_IP:7880` |
| `LIVEKIT_API_KEY` | LiveKit API key. | From LiveKit Stack env |
| `LIVEKIT_API_SECRET` | LiveKit API secret. | From LiveKit Stack env |
| `OPENAI_API_KEY` | OpenAI API key for STT, LLM, and TTS in the voice agent. | From OpenAI dashboard |

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
