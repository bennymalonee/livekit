# Enterprise compliance and data handling

This document describes how LivKit handles data, access control, and security for enterprise and compliance reference. See [SECURITY.md](SECURITY.md) for detailed security measures.

## Data handling

| Data / system | Where it lives | Notes |
|---------------|----------------|-------|
| User accounts, roles, sessions | Convex (auth tables) | Email/password and optional Google OAuth; role stored on user. |
| Audit log, token generations | Convex | No secrets or tokens stored; who did what and when. |
| Vault keys (names, encrypted values) | Convex | Server-side only; values never returned to client. |
| Deployments, settings, modules, nodes, sessions, analytics | Convex | Scoped by deployment; no PII beyond user ids. |
| LiveKit rooms/participants | LiveKit server (your VPS) | Webhook events ingested into Convex for sessions/analytics. |
| Coolify apps, env keys (not values) | Coolify + Convex | Env values stay in Coolify; Convex may cache key names for UI. |

## Retention

- **Audit log:** Retained in Convex per your deployment; no automatic purge. Implement retention via Convex scheduled function or export/archive if required.
- **Token generations:** Same as audit log; used for “who generated a token and when” only.
- **Sessions / traffic metrics:** Stored in Convex; retention is application-defined (e.g. keep last N days).
- **Cookies:** Auth session cookie max age 7 days; see SECURITY.md.

## Access control

- **Authentication:** Convex Auth (password and optional Google OAuth). All dashboard routes require authentication.
- **Authorization (RBAC):** Roles `admin`, `operator`, `viewer`. New users default to `viewer`. Only admins can change roles. See SECURITY.md for which role can do what.
- **SSO:** Optional Google OAuth; configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Convex env. For Okta/Azure AD use an OIDC provider with Convex Auth if needed.

## Security recommendations

1. **HTTPS:** Serve the dashboard over HTTPS; set `NEXT_PUBLIC_APP_URL` to `https://...`.
2. **Secrets:** Set optional `COOLIFY_WEBHOOK_SECRET`, `DEPLOY_SECRET`; rotate LIVEKIT_API_KEY/SECRET, COOLIFY_API_TOKEN, and auth secrets periodically.
3. **Least privilege:** Use `viewer` or `operator` where possible; reserve `admin` for vault, modules, deploy, and role management.
4. **Audit:** Use the Audit Log (admin-only) to review sensitive actions; export if needed for compliance.

## Checklist-style reference (SOC 2 / GDPR)

Use as a high-level reference only; not legal advice.

- **Access control:** RBAC and SSO (optional) in place; admin-only actions protected.
- **Audit trail:** Audit log records vault, modules, deploy, node sync, role changes; no secrets logged.
- **Data minimization:** Only necessary data stored; vault values encrypted; no tokens in audit.
- **Encryption:** Convex and LiveKit use TLS; vault values stored encrypted at rest per Convex.
- **Retention:** Document and implement retention for audit log and session data per your policy.
- **Incident response:** Follow your runbooks; rotate secrets after any suspected compromise.
