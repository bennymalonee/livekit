# One-time setup checklist

Complete these once so **auto-deploy on push** and **live data** work. No code changes required.

---

## 1. GitHub Actions secrets (auto-deploy on push)

In your GitHub repo: **Settings → Secrets and variables → Actions** → **New repository secret**.

| Secret | Value |
|--------|--------|
| `COOLIFY_TOKEN` | Coolify API token (Coolify → Keys & Tokens) |
| `COOLIFY_BASE_URL` | Your Coolify URL, e.g. `https://coolify.yourdomain.com` or `http://YOUR_VPS_IP:8000` |
| `COOLIFY_DASHBOARD_APP_UUID` | Dashboard application UUID from Coolify (from the app URL or Coolify API) |

After this, every `git push origin main` runs the **Deploy to Coolify** workflow. See [README.md](../README.md) section "Automatic deployment on push to GitHub".

---

## 2. LiveKit webhook (Sessions live data)

1. In the dashboard, open **Sessions** and copy the webhook URL shown at the top.
2. In your **LiveKit server config** (or LiveKit Cloud → project → Webhooks), set the webhook URL to that value.
3. In **Convex Dashboard** → Environment variables, set `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` (for webhook verification).

Events: `room_started`, `room_finished`, `participant_joined`, `participant_left`. See [LIVE-DATA-SETUP.md](LIVE-DATA-SETUP.md).

---

## 3. Convex env for Nodes

In **Convex Dashboard** → Project → **Environment variables**, set:

| Variable | Example |
|----------|---------|
| `COOLIFY_BASE_URL` | `http://YOUR_VPS_IP:8000` |
| `COOLIFY_API_TOKEN` | From Coolify → Keys & Tokens |

Then in the dashboard open **Nodes** and click **Sync from Coolify**. See [LIVE-DATA-SETUP.md](LIVE-DATA-SETUP.md).

---

## 4. Modules (one-time init)

If the modules table is empty: open **Dashboard → Modules** and click **Initialize default modules** once. This creates default labels (LiveKit, TURN, Recording).

---

## Quick check

- [ ] GitHub: `COOLIFY_TOKEN`, `COOLIFY_BASE_URL`, `COOLIFY_DASHBOARD_APP_UUID` set
- [ ] LiveKit: webhook URL set; Convex: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` set
- [ ] Convex: `COOLIFY_BASE_URL`, `COOLIFY_API_TOKEN` set; Nodes → Sync from Coolify clicked
- [ ] Modules: Initialize default modules clicked if table was empty

After this, pushes to `main` deploy automatically and Sessions/Analytics/Nodes use live data.
