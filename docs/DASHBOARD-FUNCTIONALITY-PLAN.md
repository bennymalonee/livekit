# Dashboard functionality plan

Plan to add real functionality to every dashboard section. Steps that use **Coolify MCP** are marked so you can run them via Cursor (e.g. list apps, env vars, deploy, logs).

---

## Coolify MCP – what to use where

Configure Coolify MCP with `COOLIFY_ACCESS_TOKEN` and `COOLIFY_BASE_URL` (e.g. `http://YOUR_VPS_IP:8000`). Then you can use:

| MCP use | Purpose in this plan |
|--------|----------------------|
| **application_list** | Discover Dashboard app and LiveKit Stack app UUIDs; sync as “nodes” or show in Deploy. |
| **env_vars** (resource: application, action: list) | Read env vars for an app (e.g. `LIVEKIT_API_KEY`, `NEXT_PUBLIC_LIVEKIT_URL`); show in Vault or Deploy settings. |
| **application_logs** | Fetch recent logs for an app; show in Diagnostics or Terminal. |
| **Deploy/trigger** | Trigger deploy for an app (e.g. LiveKit Stack); already used by `/api/deploy` with API token; MCP can do the same. |

Get your app UUIDs from Coolify (Dashboard app and LiveKit Stack app; use MCP `application_list` or Coolify UI).

---

## Phase 1 – Deploy (already wired, harden with Coolify)

**Goal:** Deploy page fully reflects Coolify and can trigger LiveKit deploy.

| Step | What to do | Coolify MCP? |
|------|------------|--------------|
| 1.1 | Keep current flow: “Deploy LiveKit to VPS” calls `/api/deploy` (webhook or Coolify API). | Optional: use MCP to trigger deploy for your LiveKit Stack app UUID instead of API token. |
| 1.2 | **Coolify MCP:** List applications; show “LiveKit Stack” and “Dashboard” with status (e.g. running/stopped) on Deploy or Dashboard home. | Yes – `application_list`. |
| 1.3 | **Coolify MCP:** For LiveKit Stack app, read env vars (e.g. `LIVEKIT_API_KEY`, `NEXT_PUBLIC_LIVEKIT_URL`); optionally prefill Deploy settings or “LiveKit URL” display. | Yes – `env_vars` for your LiveKit Stack app UUID. |

---

## Phase 2 – Nodes (Coolify apps as nodes)

**Goal:** Nodes page shows real “nodes” = Coolify applications (e.g. Dashboard, LiveKit Stack) with status.

| Step | What to do | Coolify MCP? |
|------|------------|--------------|
| 2.1 | **Coolify MCP:** Call `application_list` (or per-app status if available). Map each app to Convex `nodes` shape: name, region (e.g. “default”), status (running/stopped/degraded). | Yes. |
| 2.2 | Add a Convex **action** (or scheduled job) that uses Coolify API to fetch app list and upserts into `nodes` (or add a “Sync from Coolify” button that calls this action). | Uses same data as MCP; implement via Coolify API in Convex with `COOLIFY_BASE_URL` + `COOLIFY_API_TOKEN`. |
| 2.3 | Wire **Nodes** page (`NodeInitialization`) to `api.nodes.listNodes`; show table/cards with name, region, status, last heartbeat. Optionally show “Sync from Coolify” that runs the sync action. | No. |

---

## Phase 3 – Sessions (data source)

**Goal:** Sessions page shows real or seeded session data.

| Step | What to do | Coolify MCP? |
|------|------------|--------------|
| 3.1 | **Option A – Real:** Add LiveKit webhook or periodic job that calls LiveKit API (room list, participant count) and writes to Convex `sessions` (create/update/end). | No (LiveKit API / webhook). |
| 3.2 | **Option B – Demo:** Add Convex mutation `sessions.seedDemoSessions` and a small seed script or admin button to insert sample rows. Wire **Sessions** page to `api.sessions.listActive` and `api.sessions.getTotals`. | No. |
| 3.3 | Ensure **SessionMonitor** uses only Convex queries (no local mock). Add filters (by room, time range) if needed. | No. |

---

## Phase 4 – Analytics (traffic metrics)

**Goal:** Analytics page shows real or seeded traffic metrics.

| Step | What to do | Coolify MCP? |
|------|------------|--------------|
| 4.1 | **Option A – Real:** Feed `trafficMetrics` from LiveKit/Redis or a metrics scraper (Convex action or external cron). | No. |
| 4.2 | **Option B – Demo:** Add Convex mutation `analytics.seedDemoMetrics` and seed `trafficMetrics` for a few regions/time windows. Wire **TrafficAnalytics** to Convex queries. | No. |
| 4.3 | Add simple charts (by region, by time) using existing `trafficMetrics` schema. | No. |

---

## Phase 5 – Diagnostics (events + Coolify logs)

**Goal:** Diagnostics page shows Convex events and optionally recent Coolify logs.

| Step | What to do | Coolify MCP? |
|------|------------|--------------|
| 5.1 | Wire **EdgeDiagnostics** to `api.diagnostics.listRecent`; show `diagnosticsEvents` (level, code, message, createdAt). | No. |
| 5.2 | **Coolify MCP:** Add “Coolify logs” section: call `application_logs` for Dashboard and/or LiveKit Stack; display last N lines (read-only). Optionally store last fetch in Convex or show live in UI. | Yes – `application_logs` for your Dashboard and LiveKit Stack app UUIDs. |
| 5.3 | When syncing Nodes (Phase 2), optionally call `diagnostics.recordEvent` for “node up/down” or “deploy triggered” so Diagnostics shows a timeline. | No. |

---

## Phase 6 – Modules (feature flags / stack components)

**Goal:** Modules page lists stack “modules” (e.g. LiveKit, TURN, Recording) with enable/disable and config.

| Step | What to do | Coolify MCP? |
|------|------------|--------------|
| 6.1 | Seed or define default modules in Convex (e.g. `livekit`, `turn`, `recording`) with `modules` table; wire **ProjectInfrastructureModules** to `api.modules.listModules` and `api.modules.setModuleEnabled` / `updateModuleConfig`. | No. |
| 6.2 | Optionally map “LiveKit” module to LiveKit Stack app in Coolify (e.g. show “enabled” if app is running); use MCP or API to read status. | Yes – `application_list` or status. |

---

## Phase 7 – Vault (secrets / env display)

**Goal:** Vault page shows stored keys (Convex) and optionally read-only Coolify env keys for reference.

| Step | What to do | Coolify MCP? |
|------|------------|--------------|
| 7.1 | **VaultKeyManagement** already uses `api.vault.listKeys`, createKey, etc. Ensure create/view flows work and never expose raw secret in list. | No. |
| 7.2 | **Coolify MCP (optional):** Add “Coolify env (read-only)” section: for Dashboard and LiveKit Stack, call `env_vars` and show key names only (or mask values) so user can confirm which vars are set (e.g. `LIVEKIT_API_KEY`, `NEXT_PUBLIC_LIVEKIT_URL`). Do not store Coolify secrets in Convex. | Yes – `env_vars` list for both app UUIDs; display keys only or masked. |

---

## Phase 8 – Terminal (logs / command history)

**Goal:** Terminal page shows Convex command history and optionally live Coolify logs.

| Step | What to do | Coolify MCP? |
|------|------------|--------------|
| 8.1 | Wire **TerminalStreamer** to `api.terminal.*` (list history, run command if you add a safe “run” action). If Terminal is “log viewer” only, show `terminalCommands` output. | No. |
| 8.2 | **Coolify MCP (optional):** Add “Stream Coolify logs” for one app: poll `application_logs` and append to a stream or display in Terminal UI so user sees recent logs without leaving dashboard. | Yes – `application_logs`; poll or one-shot. |

---

## Implementation order (recommended)

1. **Phase 1** – Harden Deploy with optional MCP (list apps, env for LiveKit).
2. **Phase 2** – Nodes from Coolify (sync apps → `nodes`; use MCP to define shape, then implement sync via API in Convex).
3. **Phase 3** – Sessions (seed or LiveKit webhook).
4. **Phase 4** – Analytics (seed or real metrics).
5. **Phase 5** – Diagnostics (Convex events + Coolify logs via MCP).
6. **Phase 6** – Modules (seed + optional Coolify status).
7. **Phase 7** – Vault (existing Convex + optional Coolify env keys display via MCP).
8. **Phase 8** – Terminal (history + optional Coolify log stream via MCP).

---

## Coolify MCP steps summary (add these with MCP)

When your Cursor Coolify MCP is connected, you can run:

| # | MCP step | Purpose |
|---|----------|---------|
| 1 | List applications | Get UUIDs and names; show on Deploy or sync to Nodes. |
| 2 | Get env vars for Dashboard app (your app UUID) | Show or prefill Dashboard settings / Vault keys (names only). |
| 3 | Get env vars for LiveKit Stack (your app UUID) | Prefill LiveKit URL / show in Vault or Deploy. |
| 4 | Get application_logs for Dashboard / LiveKit Stack | Show in Diagnostics or Terminal. |
| 5 | Trigger deploy for LiveKit Stack (if MCP supports it) | Alternative to `/api/deploy` for “Deploy LiveKit to VPS”. |

After each MCP step, add the corresponding Convex action or UI so the dashboard uses that data (e.g. “Sync from Coolify” button, Diagnostics “Coolify logs” panel, Vault “Coolify env (keys only)” section).
