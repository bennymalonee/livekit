# Dashboard – what you need to do for everything to work

One-time setup so every dashboard section works (Deploy, Nodes, Sessions, Analytics, Diagnostics, Modules, Vault, Terminal).

---

## 1. Coolify – Dashboard app env vars

In **Coolify** → your **Dashboard** app (livekit main) → **Environment variables**, ensure these are set:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | Your Convex deployment URL (e.g. `https://your-deployment.convex.cloud`) |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (e.g. `https://your-app.example.com`) |
| `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit WebSocket URL (e.g. `ws://YOUR_VPS_IP:7880`) |
| `COOLIFY_BASE_URL` | Coolify API URL (e.g. `http://YOUR_VPS_IP:8000`) |
| `COOLIFY_API_TOKEN` | Coolify API token with **Deploy** permission (Coolify → Keys & Tokens → API tokens → Create) |
| `LIVEKIT_STACK_APP_UUID` | UUID of the LiveKit Stack app in Coolify (from Coolify → your LiveKit app) |

**Redeploy** the Dashboard app after changing env vars.

---

## 2. Convex Dashboard – environment variables

In **Convex Dashboard** → your project → **Production** deployment → **Settings** → **Environment variables**, add:

| Variable | Where to get it |
|----------|------------------|
| `COOLIFY_BASE_URL` | Same as Dashboard app (e.g. `http://YOUR_VPS_IP:8000`) |
| `COOLIFY_API_TOKEN` | Same Coolify API token (Deploy permission) |
| `LIVEKIT_API_KEY` | Coolify → **livekit-stack** app → Environment variables → copy `LIVEKIT_API_KEY` |
| `LIVEKIT_API_SECRET` | Coolify → **livekit-stack** app → Environment variables → copy `LIVEKIT_API_SECRET` |

No redeploy needed for Convex env changes.

---

## 3. Deploy Convex functions (one-time)

From your machine:

```bash
cd frontend
npx convex deploy
```

Choose **production** when prompted. This deploys HTTP routes (e.g. `/livekit-webhook`), crons (e.g. sync nodes from Coolify), and actions like `livekit.generateToken` and Coolify sync.

---

## 4. Coolify – LiveKit Stack app

- **Webhook:** `LIVEKIT_WEBHOOK_URL` should be set to  
  `https://<your-convex-deployment>.convex.site/livekit-webhook`  
  (so room/participant events show up in **Sessions**). Replace `<your-convex-deployment>` with your Convex deployment name.
- If you added or changed it, **redeploy** the LiveKit Stack app so the server uses the new config.

---

## 5. In the dashboard – optional “seed” buttons

Some sections start empty until there is data. Use the in-dashboard buttons when you want to see something:

| Section | What to do |
|--------|------------|
| **Nodes** | Click **“Sync from Coolify”** to pull Dashboard + LiveKit Stack apps into the Nodes table. |
| **Sessions** | If no LiveKit rooms are running, click **“Seed demo data”** to add sample sessions. |
| **Traffic analytics** | If empty, click **“Seed demo data”** to add sample metrics. A cron also derives traffic from active sessions every 15 min (real data when sessions exist). |
| **Modules** | If empty, click **“Seed default modules”** to add LiveKit, TURN, Recording. |

Diagnostics, Vault, and Terminal work as soon as Convex and Coolify env are set; you can optionally load “Coolify logs” or “Coolify env keys” from their buttons.

---

## Quick checklist

- [ ] Coolify **Dashboard** app: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_LIVEKIT_URL`, `COOLIFY_BASE_URL`, `COOLIFY_API_TOKEN`, `LIVEKIT_STACK_APP_UUID` → then redeploy.
- [ ] **Convex** env: `COOLIFY_BASE_URL`, `COOLIFY_API_TOKEN`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.
- [ ] Run **`npx convex deploy`** from `frontend` (production).
- [ ] **LiveKit Stack** in Coolify: `LIVEKIT_WEBHOOK_URL` set and stack redeployed.
- [ ] In dashboard: use **“Sync from Coolify”** (Nodes), **“Seed demo data”** (Sessions / Analytics), **“Seed default modules”** (Modules) if you want data in those sections.

After this, all dashboard sections can work: Deploy, Nodes, Sessions, Analytics, Diagnostics, Modules, Vault, Terminal.
