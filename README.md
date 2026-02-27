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
| `NEXT_PUBLIC_CONVEX_URL` | `https://tame-aardvark-57.eu-west-1.convex.cloud` | `https://tidy-ox-195.eu-west-1.convex.cloud` |
| `COOLIFY_DEPLOY_WEBHOOK_URL` | (optional) | Coolify webhook URL for LiveKit Stack app |
| `NEXT_PUBLIC_LIVEKIT_URL` | (optional) | Your LiveKit server URL (e.g. `https://live.yourdomain.com`) |

See [frontend/.env.example](frontend/.env.example) for a template.

## Deploy with Coolify

### 1. Dashboard app (Next.js)

- **Source:** GitHub repo `bennymalonee/livekit`.
- **Build:** Dockerfile at repo root (builds `frontend/`).
- **Port:** 3000.
- **Environment:** Set `NEXT_PUBLIC_CONVEX_URL` to the **production** Convex URL: `https://tidy-ox-195.eu-west-1.convex.cloud`.
- Optional: set `COOLIFY_DEPLOY_WEBHOOK_URL` and `NEXT_PUBLIC_LIVEKIT_URL` for the Deploy page.
- **Health check (optional):** To clear "Unhealthy" in Coolify, set the application’s health check to **path** `/api/health`, **port** `3000`, **expected status** `200`. The image includes `curl` and a Dockerfile `HEALTHCHECK`. If Coolify skips the build ("image found") and the check still fails, use **Force Rebuild** so the new image (with curl and healthcheck) is built.

### 2. LiveKit Stack app (Docker Compose)

- Add a **second** application in Coolify:
  - **Type:** Docker Compose.
  - **Source:** Same repo `bennymalonee/livekit`.
  - **Docker Compose path:** `deploy/docker-compose.yml`.
  - **Base directory:** `deploy`.
- After the app is created, open its **Settings** and copy the **Deploy webhook URL**.
- In the **Dashboard app** (first app), add an environment variable: `COOLIFY_DEPLOY_WEBHOOK_URL` = that webhook URL. Redeploy the dashboard so the "Deploy LiveKit to VPS" button triggers the LiveKit stack deploy.

### 3. Convex production

- Deploy the Convex backend to production before or after deploying the dashboard:
  ```bash
  cd frontend
  npm run convex:deploy
  ```
- Use the production deployment (e.g. `tidy-ox-195`) and set `NEXT_PUBLIC_CONVEX_URL` in Coolify to the production Cloud URL.

## Convex

- **Development:** `tame-aardvark-57` — Cloud URL: `https://tame-aardvark-57.eu-west-1.convex.cloud`
- **Production:** `tidy-ox-195` — Cloud URL: `https://tidy-ox-195.eu-west-1.convex.cloud`

From `frontend/`: `npm run convex:dev` (dev), `npm run convex:deploy` (prod), `npm run convex:codegen` (regenerate API).

### Convex Auth (JWT keys)

If you see `Missing environment variable JWT_PRIVATE_KEY`, set the auth keys on your Convex deployment:

```bash
cd frontend
npm run convex:auth:env
```

This generates a key pair and sets `JWT_PRIVATE_KEY` and `JWKS` via `npx convex env set`. Run once per deployment (dev and prod).

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
