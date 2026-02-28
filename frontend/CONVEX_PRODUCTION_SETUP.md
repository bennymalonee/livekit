# Convex production deployment (patient-crocodile-0)

Production Convex:

- **Cloud URL:** `https://patient-crocodile-0.eu-west-1.convex.cloud`
- **HTTP Actions URL:** `https://patient-crocodile-0.eu-west-1.convex.site`

## 1. Link this repo to the production project

If you see "You don't have access to the selected project":

1. Run from `frontend/`:
   ```bash
   npx convex dev
   ```
2. When prompted, log in and **select the Convex project** that has the deployment `patient-crocodile-0` (the one you created).
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

- `NEXT_PUBLIC_CONVEX_URL` = `https://patient-crocodile-0.eu-west-1.convex.cloud`
- `NEXT_PUBLIC_APP_URL` = your app’s public URL (e.g. `http://z4ww800cw0sw0g8gsw0w8ckg.31.97.34.56.sslip.io`) — so auth cookies use the right host when behind a proxy.

Redeploy the app after changing env vars.

## 5. If login fails on the deployed app (redirects back to /login)

1. **Convex Dashboard** → your project → **production** deployment → **Settings** → **Environment variables**
   - Set **CONVEX_SITE_URL** to the **exact public URL of your app** (same as `NEXT_PUBLIC_APP_URL`, e.g. `http://z4ww800cw0sw0g8gsw0w8ckg.31.97.34.56.sslip.io`). If your dashboard does not allow editing CONVEX_SITE_URL, add your app URL under **Allowed origins** / **Trusted domains** if available.
2. Ensure **JWT_PRIVATE_KEY** and **JWKS** are set on the production deployment (run `npm run convex:auth:env -- --prod` from `frontend/`).
3. Redeploy the Next.js app after adding `NEXT_PUBLIC_APP_URL` in Coolify so the auth middleware can use it for cookie host when the proxy does not send `X-Forwarded-Host`.

## 6. Create your first user (optional)

If signup on the deployed app fails or you want a user beforehand, see [CREATE_PRODUCTION_USER.md](./CREATE_PRODUCTION_USER.md) (use the same production URL above).
