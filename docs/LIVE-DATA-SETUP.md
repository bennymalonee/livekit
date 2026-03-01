# Live data setup

This checklist gets the dashboard using **only live data** (no mock or demo).

---

## 1. Sessions (live rooms and participants)

**Goal:** Sessions page shows real rooms and participants from your LiveKit server.

1. Get your Convex HTTP webhook URL:
   - In the dashboard, open **Sessions**. The URL is shown at the top (copy it).
   - Or build it: take `NEXT_PUBLIC_CONVEX_URL`, replace `.cloud` with `.site`, and append `/livekit-webhook`. Example: `https://outgoing-lemur-279.eu-west-1.convex.cloud` → `https://outgoing-lemur-279.eu-west-1.convex.site/livekit-webhook`.
2. In your **LiveKit server config** (or LiveKit Cloud → project → Webhooks), set the webhook URL to that value.
3. Events ingested: `room_started`, `room_finished`, `participant_joined`, `participant_left`. Sessions and totals update as rooms and participants change.

**Convex:** Ensure `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are set in Convex env (for webhook signature verification).

---

## 2. Analytics (traffic metrics)

**Goal:** Analytics page shows live traffic derived from sessions.

- **No extra config.** A Convex cron runs every 15 minutes and derives traffic metrics from session data. Once Sessions are receiving live webhook events, Analytics will fill automatically.
- Optional: Convex Dashboard → Crons to confirm **sync traffic from sessions** is enabled.

---

## 3. Nodes (Coolify apps as nodes)

**Goal:** Nodes page lists your Coolify applications as infrastructure nodes.

1. In **Convex Dashboard** → Project → **Environment variables**, set:
   - `COOLIFY_BASE_URL` — e.g. `http://YOUR_VPS_IP:8000`
   - `COOLIFY_API_TOKEN` — from Coolify → Keys & Tokens (API token with access to list applications)
2. In the dashboard, open **Nodes** and click **Sync from Coolify**. Your Coolify applications will appear as nodes. A cron also runs every 15 minutes to keep nodes in sync.

---

## 4. Modules (stack labels)

**Goal:** Modules page shows LiveKit, TURN, Recording (or your stack).

- If the modules table is empty, open **Modules** and click **Initialize default modules** once. This creates the default module labels (LiveKit, TURN, Recording); it is one-time setup, not demo data.

---

## Quick reference

| Area      | Where to configure | What to set |
|-----------|--------------------|------------|
| Sessions  | LiveKit server / Cloud | Webhook URL = `https://<deployment>.convex.site/livekit-webhook` |
| Analytics | —                  | Automatic from sessions (cron every 15 min) |
| Nodes     | Convex env         | `COOLIFY_BASE_URL`, `COOLIFY_API_TOKEN` then click Sync from Coolify |
| Modules   | Dashboard          | Click **Initialize default modules** once if empty |

See [ENV-VARS.md](ENV-VARS.md) for full environment variable reference.
