# Create a user on production Convex (when signup on VPS doesn't work)

Convex Auth only creates users through the **signup flow** (password is hashed by the provider). You cannot add users manually in the dashboard.

## If you get 400 "Server Error" when logging in on the deployed app

The **production** Convex deployment must have Convex Auth env vars set:

1. Open [Convex Dashboard](https://dashboard.convex.dev) → your project → **production** deployment.
2. Go to **Settings** → **Environment variables**.
3. Set **JWT_PRIVATE_KEY** and **JWKS**: from `frontend/` run:
   ```bash
   npm run convex:auth:env -- --prod
   ```
   This generates a new key pair and sets both vars on the **production** deployment. (CONVEX_SITE_URL is built-in and set automatically by Convex.)

Without JWT_PRIVATE_KEY and JWKS, the auth backend returns "Server Error" and the login/signup request returns 400.

**If Convex logs show `InvalidSecret`:** The account exists but the password does not match. Use the password you set when you signed up on **this** deployment (production). If you only signed up on dev, create an account on production first (e.g. run the app locally with `NEXT_PUBLIC_CONVEX_URL` set to production, open `/signup`, then sign in on the deployed app with that password).

To create your account in **production** so you can later log in on the deployed app:

## 1. Create the user from your machine

1. Open a terminal in the repo and go to the frontend:
   ```bash
   cd frontend
   ```

2. Point the app at **production** Convex for this run only:
   ```bash
   set NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
   ```
   (On macOS/Linux use `export` instead of `set`. Replace `<your-deployment>` with your Convex deployment name.)

3. Start the app:
   ```bash
   npm run dev
   ```

4. In the browser open: **http://localhost:3000/signup**

5. Make sure the form is in **"Create account"** mode (not "Sign in"). Enter your email and password.

6. Click **Sign up**. That creates the user in **production** Convex.

7. Stop the dev server (Ctrl+C). You can unset the env or run `npm run dev` again as usual for local dev (which uses dev Convex).

## 2. Allow your deployed site so login works on the VPS

For login/signup to work on the deployed app (e.g. `https://your-app.example.com`), do the following.

- In **Convex Dashboard** → your project → **production** deployment → **Settings** → **Environment variables**:
  - **CONVEX_SITE_URL** is built-in and cannot be set in the dashboard (you will see an error if you try). You do not need to set it.

- In **Coolify**, set for the dashboard app:
  - **NEXT_PUBLIC_APP_URL** = your deployed app URL (so the auth middleware can set cookies for the right host when behind a proxy). Then redeploy.

See **CONVEX_PRODUCTION_SETUP.md** for the full production and login checklist.

After that, open the deployed app URL, go to **Sign in**, and use the same email and password you used in step 5.
