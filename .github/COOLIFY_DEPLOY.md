# Coolify auto-deploy (GitHub Actions)

Pushes to `main` trigger a deploy to Coolify via the workflow in `.github/workflows/coolify-deploy.yml`.

## One-time setup

Add these **repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Value |
|--------|--------|
| `COOLIFY_BASE_URL` | Your Coolify URL, e.g. `http://YOUR_VPS_IP:8000` (no trailing slash) |
| `COOLIFY_TOKEN` | Coolify API token (Keys & Tokens → API tokens, create with **Deploy** permission) |
| `COOLIFY_DASHBOARD_APP_UUID` | Your Dashboard app UUID from Coolify (app Settings or URL) |

After saving both secrets, the next push to `main` will trigger a deploy.
