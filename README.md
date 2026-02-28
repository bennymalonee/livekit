# LivKit

LivKit dashboard: Convex auth, Coolify deploy, and LiveKit stack. One app to log in, trigger LiveKit deployment on your VPS via Coolify, and manage infrastructure views (Stitch screens).

## Local setup

1. **Frontend and Convex (dev):**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   ```
2. Set `NEXT_PUBLIC_CONVEX_URL` in `frontend/.env.local` (see [Environment variables](#environment-variables)).
3. Run Convex dev (separate terminal):
   ```bash
   cd frontend && npm run convex:dev
   ```
4. Run the Next.js app:
   ```bash
   cd frontend && npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000). Sign up or log in, then use Dashboard and Deploy.

## Environment variables

| Variable | Development | Production |
| -------- | ----------- | ---------- |
| `NEXT_PUBLIC_CONVEX_URL` | `https://tame-aardvark-57.eu-west-1.convex.cloud` | `https://patient-crocodile-0.eu-west-1.convex.cloud` |
| `COOLIFY_DEPLOY_WEBHOOK_URL` | (optional) | Coolify webhook URL for LiveKit Stack app |
| `NEXT_PUBLIC_LIVEKIT_URL` | (optional) | Your LiveKit server URL (e.g. `https://live.yourdomain.com`) |

See [frontend/.env.example](frontend/.env.example) for a template.

## Deploy with Coolify

### 1. Dashboard app (Next.js)

- **Source:** GitHub repo `bennymalonee/livekit`.
- **Build:** Dockerfile at repo root (builds `frontend/`).
- **Port:** 3000.
- **Environment:** Set `NEXT_PUBLIC_CONVEX_URL` to the **production** Convex URL: `https://patient-crocodile-0.eu-west-1.convex.cloud`.
- Optional: set `COOLIFY_DEPLOY_WEBHOOK_URL` and `NEXT_PUBLIC_LIVEKIT_URL` for the Deploy page.
- **Health check (fix "Unhealthy" in Coolify):** In Coolify, open the Dashboard app → **Health Check**, enable it and set **path** to `/api/health` and **port** to `3000`. The app skips auth for this path so the check always gets HTTP 200. Optionally the Dockerfile defines a container HEALTHCHECK; Coolify’s own check is usually enough.
- **Login / "Go to dashboard" not working (Convex logs show auth success):** The app needs the **public host** so the auth cookie is set and sent correctly. In Coolify, for the Dashboard app, set the proxy to forward **Host** or **X-Forwarded-Host** to your public domain (e.g. `your-app.sslip.io`). The app also waits ~1.2s after sign-in so the Convex Auth Next.js client can sync the token to the server cookie before redirecting.
- **"Unexpected missing refreshToken cookie during client refresh" in logs:** This appears when the server doesn’t receive the auth cookie (e.g. proxy not forwarding the public host). Ensure the proxy forwards **X-Forwarded-Host** (and **X-Forwarded-Proto** if using HTTPS) so cookies are set for the correct domain. Verbose auth logging is disabled by default to reduce log noise.

### 2. LiveKit Stack app (Docker Compose)

- Add a **second** application in Coolify:
  - **Type:** Docker Compose.
  - **Source:** Same repo `bennymalonee/livekit`.
  - **Docker Compose path:** `deploy/docker-compose.yml`.
  - **Base directory:** `deploy`.
- After the app is created, open its **Settings** and copy the **Deploy webhook URL**.
- In the **Dashboard app** (first app), add an environment variable: `COOLIFY_DEPLOY_WEBHOOK_URL` = that webhook URL. Redeploy the dashboard so the "Deploy LiveKit to VPS" button triggers the LiveKit stack deploy.
- **Or** the LiveKit Stack may already exist in Coolify (name: livekit-stack). Full Coolify setup, API-token option, and using LiveKit in your app: see [docs/LIVEKIT-COOLIFY-SETUP.md](docs/LIVEKIT-COOLIFY-SETUP.md).

### 3. Convex production

- Deploy the Convex backend to production before or after deploying the dashboard:
  ```bash
  cd frontend
  npm run convex:deploy
  ```
- Use the production deployment (`patient-crocodile-0`) and set `NEXT_PUBLIC_CONVEX_URL` in Coolify to the production Cloud URL.

## Convex

- **Development:** `tame-aardvark-57` — Cloud URL: `https://tame-aardvark-57.eu-west-1.convex.cloud`
- **Production:** `patient-crocodile-0` — Cloud URL: `https://patient-crocodile-0.eu-west-1.convex.cloud`, HTTP Actions: `https://patient-crocodile-0.eu-west-1.convex.site`  
  First-time setup: see [frontend/CONVEX_PRODUCTION_SETUP.md](frontend/CONVEX_PRODUCTION_SETUP.md).

From `frontend/`: `npm run convex:dev` (dev), `npm run convex:deploy` (prod), `npm run convex:codegen` (regenerate API).

### Convex Auth (JWT keys)

If you see `Missing environment variable JWT_PRIVATE_KEY`, set the auth keys on your Convex deployment:

```bash
cd frontend
npm run convex:auth:env
```

This generates a key pair and sets `JWT_PRIVATE_KEY` and `JWKS` via `npx convex env set`. Run once per deployment (dev and prod).

**Insight: "Retried due to write conflicts" on `auth:store` / `authRefreshTokens`**  
Convex Auth uses single-use refresh tokens. When several requests refresh at once (e.g. multiple tabs, or middleware + client), Convex may report write conflicts on `authRefreshTokens`. Convex retries these mutations; occasional retries are normal. If retries persist or users are logged out often, reduce concurrent auth (e.g. avoid many tabs or rapid reloads during login).

## Stitch screens

Dashboard pages (Landing, Global Stream Flow, Modules, Diagnostics, etc.) are powered by Stitch. To populate images and HTML:

1. Fill [scripts/stitch-urls.json](scripts/stitch-urls.json) with image and HTML URLs from the Stitch MCP or project.
2. From the repo root: `node scripts/download-stitch-assets.mjs`

## Project layout

- `frontend/` — Next.js app (Convex auth, deploy UI, Stitch screens).
- `deploy/` — LiveKit stack (docker-compose, Redis, Coturn, egress). See [deploy/README.md](deploy/README.md).
- `scripts/` — Stitch asset download, reference scripts.

## License

Private / as per your project.
