# LiveKit → Convex webhook + token setup

One-time setup so room/participant events feed **Sessions** and **livekit.generateToken** works.

## 1. Convex env (for token generation) — do this manually

The Convex MCP cannot set **production** environment variables (safety). Set them in the dashboard:

1. Open **Convex Dashboard** → your project → **Production** deployment → **Settings** → **Environment variables**.
2. Open **Coolify** → **livekit-stack** app → **Environment variables** and copy **`LIVEKIT_API_KEY`** and **`LIVEKIT_API_SECRET`**.
3. In Convex, add:
   - **`LIVEKIT_API_KEY`** = (paste the key from Coolify)
   - **`LIVEKIT_API_SECRET`** = (paste the secret from Coolify)
4. Save. No redeploy needed for Convex env changes.

## 2. LiveKit webhook URL (Coolify)

- Set **`LIVEKIT_WEBHOOK_URL`** on the **livekit-stack** app in Coolify to:
  **`https://<your-convex-deployment>.convex.site/livekit-webhook`**
  Replace `<your-convex-deployment>` with your Convex deployment name (e.g. from your Convex dashboard URL).
- **Redeploy** the LiveKit Stack so the server picks up the new env and `livekit.yaml` webhook config.

The repo’s `deploy/livekit.yaml` includes a `webhook` section that uses `LIVEKIT_WEBHOOK_URL`.

## 3. Convex codegen / deploy

From the repo:

```bash
cd frontend
npx convex codegen
# or to push functions: npx convex deploy
```

Crons and HTTP routes (including `/livekit-webhook`) are included when you run `convex dev` or `convex deploy`.

## Summary

| Where | What |
|-------|------|
| **Convex** env | `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` (same as LiveKit Stack) |
| **Coolify** LiveKit Stack app env | `LIVEKIT_WEBHOOK_URL` = `https://<your-deployment>.convex.site/livekit-webhook` |
| **Redeploy** | LiveKit Stack in Coolify after adding `LIVEKIT_WEBHOOK_URL` |

After this, Sessions will receive events from LiveKit, and you can call the **`livekit.generateToken`** Convex action (with `roomName`, optional `participantName`) to get tokens for “Join test room” or similar.
