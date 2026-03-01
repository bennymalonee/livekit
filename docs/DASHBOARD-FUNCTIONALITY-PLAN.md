# Dashboard functionality plan

Plan to add real functionality to every dashboard section. **Status:** Most phases are implemented in the app (Convex actions, Coolify API, LiveKit webhook, crons). Steps that use **Coolify MCP** are optional—for use via Cursor when you want to inspect or trigger things manually (e.g. list apps, env vars, deploy, logs).

---

## Coolify MCP – what to use where (optional)

Configure Coolify MCP with `COOLIFY_ACCESS_TOKEN` and `COOLIFY_BASE_URL` (e.g. `http://YOUR_VPS_IP:8000`). Then you can use:

| MCP use | Purpose in this plan |
|--------|----------------------|
| **application_list** | Discover Dashboard app and LiveKit Stack app UUIDs; sync as “nodes” or show in Deploy. |
| **env_vars** (resource: application, action: list) | Read env vars for an app (e.g. `LIVEKIT_API_KEY`, `NEXT_PUBLIC_LIVEKIT_URL`); show in Vault or Deploy settings. |
| **application_logs** | Fetch recent logs for an app; show in Diagnostics or Terminal. |
| **Deploy/trigger** | Trigger deploy for an app (e.g. LiveKit Stack); already used by `/api/deploy` with API token; MCP can do the same. |

Get your app UUIDs from Coolify (Dashboard app and LiveKit Stack app; use MCP `application_list` or Coolify UI).

---

## Phase 1 – Deploy (Done)

**Goal:** Deploy page fully reflects Coolify and can trigger LiveKit deploy.

| Step | What to do | Status |
|------|------------|--------|
| 1.1 | “Deploy LiveKit to VPS” calls `/api/deploy` (webhook or Coolify API); in-app Deploy can use Convex action `settings.triggerDeploy`. | **Done** |
| 1.2 | List applications; show “LiveKit Stack” and “Dashboard” with status on Deploy or Dashboard home. | **Optional:** Coolify MCP `application_list`. |
| 1.3 | For LiveKit Stack app, read env vars; optionally prefill Deploy settings or “LiveKit URL” display. | **Optional:** Coolify MCP `env_vars` for your LiveKit Stack app UUID. |

---

## Phase 2 – Nodes (Done)

**Goal:** Nodes page shows real “nodes” = Coolify applications (e.g. Dashboard, LiveKit Stack) with status.

| Step | What to do | Status |
|------|------------|--------|
| 2.1 | Map Coolify apps to Convex `nodes` shape: name, region, status (running/stopped/degraded). | **Done** (sync action + cron). |
| 2.2 | Convex action `coolify.syncApplicationsToNodes` and cron (15 min) use Coolify API to fetch app list and upsert `nodes`. “Sync from Coolify” button calls the sync. | **Done** |
| 2.3 | **Nodes** page (`NodeInitialization`) uses `api.nodes.listNodes`; shows table/cards with name, region, status, last heartbeat and “Sync from Coolify”. | **Done** |

---

## Phase 3 – Sessions (Done)

**Goal:** Sessions page shows live session data only (no demo seed).

| Step | What to do | Status |
|------|------------|--------|
| 3.1 | LiveKit webhook writes to Convex `sessions` (room/participant events). Cron can sync traffic from sessions. | **Done** |
| 3.2 | **Sessions** page uses `api.sessions.listActive` and `api.sessions.getTotals`. Sessions are populated only by the LiveKit webhook. | **Done** |
| 3.3 | **SessionMonitor** uses only Convex queries (no local mock). Filters by room and time range. | **Done** |

---

## Phase 4 – Analytics (Done)

**Goal:** Analytics page shows live traffic metrics only (no demo seed).

| Step | What to do | Status |
|------|------------|--------|
| 4.1 | Feed `trafficMetrics` from sessions/cron (existing cron derives traffic from sessions). | **Done** |
| 4.2 | **TrafficAnalytics** uses Convex queries; analytics are filled only by the cron (no demo seed). | **Done** |
| 4.3 | Charts (by region, by time) using `trafficMetrics` schema. | **Done** |

---

## Phase 5 – Diagnostics (Done)

**Goal:** Diagnostics page shows Convex events and optionally recent Coolify logs.

| Step | What to do | Status |
|------|------------|--------|
| 5.1 | **EdgeDiagnostics** uses `api.diagnostics.listRecent`; shows `diagnosticsEvents` (level, code, message, createdAt). | **Done** |
| 5.2 | “Coolify logs” section: Convex action `coolify.getApplicationLogs` for Dashboard and/or LiveKit Stack; display last N lines in UI. | **Done** |
| 5.3 | When syncing Nodes or deploying, optionally call `diagnostics.recordEvent` for timeline. | **Optional** (enhancement). |

---

## Phase 6 – Modules (Done)

**Goal:** Modules page lists stack “modules” (e.g. LiveKit, TURN, Recording) with enable/disable and config.

| Step | What to do | Status |
|------|------------|--------|
| 6.1 | Default modules in Convex `modules` table; **ProjectInfrastructureModules** uses `api.modules.listModules`, `setModuleEnabled`, `seedModules`. | **Done** |
| 6.2 | Map “LiveKit” module to LiveKit Stack app status in Coolify (e.g. show “enabled” if app is running). | **Done** (Modules page shows Coolify app status for LiveKit module). |

---

## Phase 7 – Vault (Done)

**Goal:** Vault page shows stored keys (Convex) and optionally read-only Coolify env keys for reference.

| Step | What to do | Status |
|------|------------|--------|
| 7.1 | **VaultKeyManagement** uses `api.vault.listKeys`, createKey, deleteKey; raw secret never returned. Values stored as plaintext; see schema and UI warning. | **Done** |
| 7.2 | “Coolify env (read-only)” section: Convex action `coolify.getApplicationEnvs` for Dashboard and LiveKit Stack; key names only (masked) in Vault UI. | **Done** |

---

## Phase 8 – Terminal (Done)

**Goal:** Terminal page shows Convex command history and optionally live Coolify logs.

| Step | What to do | Status |
|------|------------|--------|
| 8.1 | **TerminalStreamer** uses `api.terminal.listCommands`, `recordCommand`; shows command history. | **Done** |
| 8.2 | “Coolify logs” in Terminal: Convex action `coolify.getApplicationLogs`; display in Terminal UI. | **Done** |

---

## Phase 9 – Enhancements (Done)

**Goal:** Live data only, UX quick wins, and API/ops features.

| Feature | Status |
|---------|--------|
| Theme persistence in Convex `userPreferences`; Refresh button; keyboard shortcuts (G+D → Dashboard, G+S → Sessions, ? → help). | **Done** |
| Global date range (24h / 7d / 30d) on Dashboard; wired to Sessions and Analytics. | **Done** |
| Real uptime from oldest session in window (Analytics); Coolify apps card on Dashboard. | **Done** |
| Export CSV for Audit Log and Analytics. | **Done** |
| Runbooks (Convex table, list/create/delete, Runbooks page under Infrastructure). | **Done** |
| API key–scoped HTTP routes: `GET /api/v1/nodes`, `GET /api/v1/sessions`, `GET /api/v1/analytics` (scopes: `nodes:list`, `sessions:list`, `analytics:read`). | **Done** |
| Node health cron: every 15 min writes one diagnostics event (e.g. “3 of 5 nodes online”). | **Done** |

See [ENV-VARS.md](ENV-VARS.md) for API key scopes and Convex env vars.

---

## Implementation status

All nine phases are implemented. Optional enhancements (e.g. Coolify MCP for manual inspection, stricter filters, diagnostics timeline from node sync) are marked **Optional** in the tables above.

---

## Coolify MCP steps summary (optional – use with Cursor MCP)

When your Cursor Coolify MCP is connected, you can run:

| # | MCP step | Purpose |
|---|----------|---------|
| 1 | List applications | Get UUIDs and names; show on Deploy or sync to Nodes. |
| 2 | Get env vars for Dashboard app (your app UUID) | Show or prefill Dashboard settings / Vault keys (names only). |
| 3 | Get env vars for LiveKit Stack (your app UUID) | Prefill LiveKit URL / show in Vault or Deploy. |
| 4 | Get application_logs for Dashboard / LiveKit Stack | Show in Diagnostics or Terminal. |
| 5 | Trigger deploy for LiveKit Stack (if MCP supports it) | Alternative to `/api/deploy` for “Deploy LiveKit to VPS”. |

After each MCP step, add the corresponding Convex action or UI so the dashboard uses that data (e.g. “Sync from Coolify” button, Diagnostics “Coolify logs” panel, Vault “Coolify env (keys only)” section).
