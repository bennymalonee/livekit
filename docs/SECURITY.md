# Security

Overview of security measures and recommendations for the LivKit dashboard.

## Authentication and authorization

- **Providers:** Convex Auth supports **password** (email/password) and optional **Google OAuth** (SSO). To enable Google, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Convex environment variables and configure the authorized redirect URI in Google Cloud Console (e.g. `https://&lt;your-convex-deployment&gt;.convex.site/auth/callback/google` per Convex Auth docs).
- **Roles:** RBAC is enforced: **admin** (full access including Vault, Modules, Deploy, node sync), **operator** (sessions, analytics, terminal, agents, LiveKit tokens, Coolify list/logs), **viewer** (read-only dashboard, sessions, analytics, nodes, diagnostics). New users get role `viewer` by default; only admins can change roles via `rbac.setUserRole`.
- **Routes:** Dashboard, Deploy, Analytics, Sessions, Nodes, Modules, Vault, Terminal, and Diagnostics are protected by Convex Auth + Next.js middleware. Unauthenticated users are redirected to `/login`.
- **Convex queries and mutations:** All data-modifying mutations and sensitive queries require `ctx.auth.getUserIdentity()`. Unauthenticated callers get empty data or "Unauthorized".
- **Convex actions:** The following actions require authentication (no anonymous access):
  - **LiveKit:** `generateToken`, `checkConfig` — only authenticated users can generate tokens or check LiveKit config.
  - **Coolify:** `listApplications`, `getApplicationEnvs`, `getApplicationEnvsForPrefill`, `getApplicationLogs`, `syncApplicationsToNodes` — only authenticated users can list apps, read env keys, fetch logs, or trigger sync. The **cron** that syncs nodes runs the internal action `coolify_internal.syncApplicationsToNodes` (no user context).
- **API routes:** `/api/deploy` is rate-limited (per IP). If `DEPLOY_SECRET` is set (Next.js app env), requests must include `Authorization: Bearer <DEPLOY_SECRET>` or `X-Deploy-Secret: <DEPLOY_SECRET>`.

## Secrets and environment variables

- **Server-only (never in client bundle):** `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `COOLIFY_BASE_URL`, `COOLIFY_API_TOKEN`, `COOLIFY_DEPLOY_WEBHOOK_URL`, `LIVEKIT_STACK_APP_UUID` — set in Convex (production) or in Coolify app env for the API route. Do not prefix with `NEXT_PUBLIC_`.
- **Optional (Convex env):** `COOLIFY_WEBHOOK_SECRET` — when set, the Coolify webhook endpoint requires `Authorization: Bearer <secret>` or `X-Webhook-Secret: <secret>`.
- **Optional (Next.js app env):** `DEPLOY_SECRET` — when set, POST `/api/deploy` requires `Authorization: Bearer <secret>` or `X-Deploy-Secret: <secret>`.
- **Client-visible (non-secret):** `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_LIVEKIT_URL`, `NEXT_PUBLIC_COOLIFY_*` — URLs and app UUIDs only. No API keys or tokens.

## Webhooks

- **LiveKit webhook** (`/livekit-webhook`): Payload is verified with `WebhookReceiver` (LIVEKIT_API_KEY/SECRET). Invalid or missing signature returns 401. Do not disable verification in production.
- **Coolify webhook** (`/coolify/webhook`): Accepts POST and updates deployment status. If `COOLIFY_WEBHOOK_SECRET` is set in Convex env, the request must include `Authorization: Bearer <secret>` or `X-Webhook-Secret: <secret>`; otherwise 401. Configure Coolify to send this header when it calls your Convex webhook URL.

## Input validation

- **Token generation:** `roomName` and `participantName` are trimmed and limited in length (e.g. 256 chars) to prevent abuse. Invalid input returns an error.
- Convex args use `v.string()`, `v.number()`, etc.; validate business rules (e.g. TTL range) in the handler.

## Rate limiting

- **Token generation:** Per-user limit of 30 token generations per hour (Convex table `tokenRateLimit`). Over limit returns "Too many token generations. Please try again later." Old rate-limit rows are pruned daily by cron.
- **Deploy API:** Per-IP limit of 5 requests per 60 seconds (in-memory in the Next.js route).

## Audit and logging

- **Token generations:** Each successful token generation is recorded in the `tokenGenerations` table (room name, permissions, timestamp, optional user id). No token or secret is stored. Use for auditing who generated tokens and when.
- **Diagnostics:** Optional `recordEvent` for node sync and other operations; use for operational visibility.

## Cookies and session

- Auth cookies use a 7-day max age. When the app is served over HTTP (e.g. internal URL), `secure: false` is set so cookies work; in production over HTTPS, use the default secure cookie behavior.
- Set `NEXT_PUBLIC_APP_URL` to the public origin so cookie domain and redirects match when behind a proxy.

## Security headers

- **Next.js** sends: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a **Content-Security-Policy** that allows the app and Convex (scripts, connect, styles, fonts, images). Adjust CSP in `next.config.js` if you add other domains.

## Recommendations

1. **HTTPS in production:** Serve the dashboard over HTTPS and ensure `NEXT_PUBLIC_APP_URL` uses `https://`.
2. **Coolify webhook:** Set `COOLIFY_WEBHOOK_SECRET` in Convex and configure Coolify to send it (e.g. `X-Webhook-Secret` or `Authorization: Bearer`) when calling your webhook URL.
3. **Deploy API:** Set `DEPLOY_SECRET` in your Next.js app env (e.g. Coolify) and send it in `Authorization: Bearer` or `X-Deploy-Secret` when triggering deploys from scripts or CI.
4. **Rotate secrets:** Rotate LIVEKIT_API_KEY/SECRET, COOLIFY_API_TOKEN, and optional COOLIFY_WEBHOOK_SECRET / DEPLOY_SECRET periodically; update Convex and LiveKit/Coolify config together.
