# LiveKit Stack on Coolify (VPS)

The **LiveKit Stack** app in Coolify runs the LiveKit server + Redis from this repo. The Dashboard app can trigger its deploy and show the LiveKit URL.

## LiveKit Stack app (already created)

- **Name:** livekit-stack  
- **UUID:** `mg44c8wgocck0oso440c84s4`  
- **Repo:** bennymalonee/livekit, branch main  
- **Build pack:** Docker Compose  

If you see "Docker Compose file not found at: /deploy/deploy/docker-compose.yml", the compose path is wrong. In Coolify open **livekit-stack** → **Configuration** / **Build** and set **Base directory** to `deploy` and **Docker Compose path** to `docker-compose.yml` (not `deploy/docker-compose.yml` — Coolify joins base dir + path, so this resolves to `deploy/docker-compose.yml` in the repo). Then redeploy.

**If the app shows "Degraded (unhealthy)":** LiveKit does not expose an HTTP health endpoint (it uses WebSocket on port 7880). In Coolify open **livekit-stack** → **Health Check** and **disable** the health check so Coolify does not mark the app unhealthy. If the app is not running at all, check **Logs** for errors (e.g. missing env vars or invalid `livekit.yaml`); ensure all env vars (`LIVEKIT_PUBLIC_IP`, `REDIS_PASSWORD`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `TURN_HOST`, `TURN_CREDENTIAL`, `LIVEKIT_REGION`) are set on the app.

## "Deploy LiveKit to VPS" button

The Dashboard uses one of two methods:

1. **Webhook (optional):** In Coolify, open the **livekit-stack** app → **Webhook**, copy the **Deploy webhook** URL. In the **Dashboard** app (livekit_main) add env var `COOLIFY_DEPLOY_WEBHOOK_URL` = that URL. No token needed.
2. **API (current):** The Dashboard app already has `COOLIFY_BASE_URL` and `LIVEKIT_STACK_APP_UUID`. For the button to work, add one more env var on the **Dashboard** app in Coolify: **`COOLIFY_API_TOKEN`** = a Coolify API token with **Deploy** permission (Coolify → Keys & Tokens → API tokens → Create). Then redeploy the Dashboard.

After that, open the Dashboard → **Deploy** and click **Deploy LiveKit to VPS**.

## LiveKit URL in the app

The Dashboard has **`NEXT_PUBLIC_LIVEKIT_URL`** = `ws://31.97.34.56:7880`. You can also set or override it in **Deploy** → **Deploy settings** → LiveKit server URL (stored in Convex).

## Using LiveKit in your app (tokens)

To create LiveKit access tokens (server-side), use the same **API Key** and **API Secret** as the LiveKit Stack:

1. In Coolify, open the **livekit-stack** app → **Environment variables**.
2. Copy **`LIVEKIT_API_KEY`** and **`LIVEKIT_API_SECRET`**.
3. Set them in your backend (e.g. Convex production env: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`) or in a server-only config. Never expose the secret to the client.
4. In your Convex action (or API route), use the LiveKit server SDK to create an access token with that key/secret and the LiveKit URL (`NEXT_PUBLIC_LIVEKIT_URL` or from Convex/settings). The client then connects with that token to `ws://31.97.34.56:7880` (or your public URL).

See [deploy/README.md](../deploy/README.md) for manual deploy and [LiveKit token docs](https://docs.livekit.io/realtime/authentication/) for token creation.
