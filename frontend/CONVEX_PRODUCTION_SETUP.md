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

Redeploy the app after changing env vars.

## 5. Create your first user (optional)

If signup on the deployed app fails or you want a user beforehand, see [CREATE_PRODUCTION_USER.md](./CREATE_PRODUCTION_USER.md) (use the same production URL above).
