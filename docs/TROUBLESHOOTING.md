# Troubleshooting

Common issues and how to fix them.

---

## Sessions empty

- **Cause:** LiveKit room/participant events are not reaching Convex.
- **Fix:**
  1. In **Coolify** → your **LiveKit Stack** app → **Environment variables**, set `LIVEKIT_WEBHOOK_URL` to your Convex HTTP URL: `https://<your-convex-deployment>.convex.site/livekit-webhook`. Replace `<your-convex-deployment>` with your Convex deployment name (from Convex Dashboard → Settings → URL).
  2. Redeploy the LiveKit Stack app so the server uses the new config.
  3. If you have no LiveKit rooms running, use **"Seed demo data"** on the Sessions page to see sample sessions.

See [LIVEKIT-CONVEX-WEBHOOK-SETUP.md](LIVEKIT-CONVEX-WEBHOOK-SETUP.md) for details.

---

## Nodes empty

- **Cause:** Coolify applications have not been synced to Convex.
- **Fix:**
  1. On the **Nodes** page, click **"Sync from Coolify"**.
  2. Ensure **Convex** has `COOLIFY_BASE_URL` and `COOLIFY_API_TOKEN` set (Convex Dashboard → Production → Settings → Environment variables).
  3. Ensure your **Dashboard** app in Coolify has the same env vars so the sync action can call the Coolify API.

See [DASHBOARD-SETUP-CHECKLIST.md](DASHBOARD-SETUP-CHECKLIST.md).

---

## Deploy fails

- **Cause:** Coolify token missing, wrong permissions, or wrong app UUID.
- **Fix:**
  1. In **Coolify** → **Keys & Tokens** → create an API token with **Deploy** permission.
  2. Set `COOLIFY_API_TOKEN` in **Convex** env and (if using webhook) set `COOLIFY_DEPLOY_WEBHOOK_URL` or use the API method with `LIVEKIT_STACK_APP_UUID` in Convex/Dashboard app env.
  3. Confirm `LIVEKIT_STACK_APP_UUID` matches the UUID of your LiveKit Stack app in Coolify (from the app’s settings or URL).

---

## Analytics empty

- **Cause:** No traffic metrics in Convex yet.
- **Fix:**
  1. Click **"Seed demo data"** on the Analytics page to add sample metrics.
  2. A Convex cron runs every 15 minutes and derives traffic from active sessions; if you have sessions, real data will appear after the next run.
  3. Ensure Convex functions (including crons) are deployed: run `npx convex deploy` from the `frontend` directory.

---

## Diagnostics / Terminal logs empty

- **Cause:** Coolify logs have not been loaded, or env is not set.
- **Fix:**
  1. Use the **"Load"** (Diagnostics) or **"Load Coolify logs"** (Terminal) buttons to fetch recent logs from Coolify.
  2. Set `NEXT_PUBLIC_COOLIFY_DASHBOARD_APP_UUID` and `NEXT_PUBLIC_COOLIFY_LIVEKIT_STACK_APP_UUID` in your Dashboard app env so the UI knows which Coolify apps to request logs for.
  3. Convex must have `COOLIFY_BASE_URL` and `COOLIFY_API_TOKEN` for the Coolify API to return logs.

---

## More help

- **Full setup:** [DASHBOARD-SETUP-CHECKLIST.md](DASHBOARD-SETUP-CHECKLIST.md)
- **Environment variables:** [ENV-VARS.md](ENV-VARS.md)
- **Convex Dashboard:** [dashboard.convex.dev](https://dashboard.convex.dev)
- **Coolify:** Your Coolify instance (e.g. `http://YOUR_VPS_IP:8000`)
