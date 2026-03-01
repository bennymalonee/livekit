# Convex production deployment

Production Convex setup for the LivKit dashboard.

- **Cloud URL:** `https://<your-deployment>.convex.cloud` (from Convex dashboard)
- **HTTP Actions URL:** `https://<your-deployment>.convex.site`

## 1. Link this repo to the production project

If you see "You don't have access to the selected project":

1. Run from `frontend/`:
   ```bash
   npx convex dev
   ```
2. When prompted, log in and **select the Convex project** that has your production deployment.
3. Stop the dev server (Ctrl+C). The project is now linked.

## 2. Deploy Convex to production

From `frontend/`:

```bash
npx convex deploy -y
```

This pushes all functions, schema, and HTTP routes to the production deployment.

## 3. Set Convex Auth env vars on production

From `frontend/`:

```bash
npm run convex:auth:env -- --prod
```

This sets `JWT_PRIVATE_KEY` and `JWKS` on the **production** deployment so login/signup work. Run once per production deployment.

## 4. Coolify / app env

In Coolify (or your host), set for the Dashboard app:

- `NEXT_PUBLIC_CONVEX_URL` = your production Convex Cloud URL (e.g. `https://your-deployment.convex.cloud`)
- `NEXT_PUBLIC_APP_URL` = your app’s public URL (e.g. `https://your-app.example.com`) — so auth cookies use the right host when behind a proxy.

Redeploy the app after changing env vars.

## 5. If login fails on the deployed app (redirects back to /login)

**Note:** **CONVEX_SITE_URL** is a built-in Convex variable and cannot be overridden in Environment variables. You will see "Environment variable with name CONVEX_SITE_URL is built-in and cannot be overridden" if you try. Ignore that; you do not need to set it.

Do this instead:

1. Ensure **JWT_PRIVATE_KEY** and **JWKS** are set on the production deployment (run `npm run convex:auth:env -- --prod` from `frontend/`).
2. In Coolify, set **NEXT_PUBLIC_APP_URL** to your app’s public URL (e.g. `https://your-app.example.com`) and redeploy. The middleware uses this to rewrite the request origin so auth cookies use the correct domain.
3. **Always open the app using that same public URL.** If you use an IP address or a different host, cookies will not match and login will not persist.
4. If your reverse proxy (e.g. Traefik/Caddy) can forward headers, set **X-Forwarded-Host** and **X-Forwarded-Proto** to the public host and scheme so the middleware sees the correct origin.
5. **HTTP (no HTTPS):** On HTTP, the auth cookie must be set with `secure: false`. This repo applies a patch to `@convex-dev/auth` (see `patches/`) so that when `NEXT_PUBLIC_APP_URL` is `http://...`, the middleware’s `cookieConfig.secure: false` is respected. Run `npm install` (or redeploy) so `postinstall` applies the patch.

## 6. Create your first user (optional)

If signup on the deployed app fails or you want a user beforehand, see [CREATE_PRODUCTION_USER.md](./CREATE_PRODUCTION_USER.md) (use your production Convex URL and app URL).
