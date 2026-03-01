# Backup and disaster recovery

This document describes backup and recovery for LivKit and recommended RTO/RPO.

## Convex (dashboard backend and data)

- **Data:** User accounts, roles, audit log, vault metadata, deployments, nodes, sessions, analytics, modules, settings, terminal history, token generation audit.
- **Backup:** Use [Convex backup and export](https://docs.convex.dev/backend/backup-restore) as provided by Convex. Configure scheduled exports or point-in-time recovery per your Convex plan.
- **Restore:** Follow Convex docs to restore from backup or export into a new deployment. Update dashboard env (`NEXT_PUBLIC_CONVEX_URL`) to point to the restored deployment.

## Coolify and LiveKit Stack (VPS)

- **Data:** Coolify app definitions, env vars (including LiveKit keys), LiveKit Stack containers (LiveKit server, Redis, optional Coturn).
- **Backup:** Back up the Coolify server (database and config) and the VPS disk/volumes where the LiveKit Stack runs. Coolify and your hosting provider may offer snapshot or backup tools.
- **Restore:** Restore Coolify from backup; redeploy the LiveKit Stack application from Coolify. Reconfigure webhooks and env vars to match the restored Convex deployment if you restored Convex to a new URL.

## Dashboard (Next.js app)

- **Data:** Stateless; no local persistence. Build artifacts and env are in your repo and Coolify.
- **Backup:** Use git for source; Coolify stores build and env. No additional backup needed for app state.
- **Restore:** Redeploy from git and reconfigure env (Convex URL, Coolify, LiveKit URLs, etc.).

## Recommended RTO/RPO

- **RTO (recovery time objective):** Depends on Convex restore time and Coolify/VPS restore. Typical: aim for &lt; 4–24 hours for full restore from backups.
- **RPO (recovery point objective):** Convex backup frequency (e.g. daily export or continuous); Coolify/VPS snapshots (e.g. daily). Adjust to your compliance needs.

## Post-restore checks

1. Convex deployment is reachable and env vars are set.
2. Dashboard can sign in and Convex Auth works.
3. Coolify and LiveKit Stack are running; webhooks point to the correct Convex URL.
4. LiveKit server env (API key/secret) matches what the dashboard uses for token generation.
