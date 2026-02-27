# Create a user on production Convex (when signup on VPS doesn't work)

Convex Auth only creates users through the **signup flow** (password is hashed by the provider). You cannot add users manually in the dashboard.

## If you get 400 "Server Error" when logging in on the deployed app

The **production** Convex deployment (`tidy-ox-195`) must have Convex Auth env vars set:

1. Open [Convex Dashboard](https://dashboard.convex.dev) → your project → **production** deployment (tidy-ox-195).
2. Go to **Settings** → **Environment variables**.
3. Set **JWT_PRIVATE_KEY** and **JWKS** (same values as dev, or generate new ones with `npm run convex:auth:env` from `frontend/` while targeting prod: `npx convex env set --prod`).
4. Ensure **CONVEX_SITE_URL** = `https://tidy-ox-195.eu-west-1.convex.site`.

Without these, the auth backend returns "Server Error" and the login/signup request returns 400.

To create your account in **production** (`tidy-ox-195`) so you can later log in on the deployed app:

## 1. Create the user from your machine

1. Open a terminal in the repo and go to the frontend:
   ```bash
   cd frontend
   ```

2. Point the app at **production** Convex for this run only:
   ```bash
   set NEXT_PUBLIC_CONVEX_URL=https://tidy-ox-195.eu-west-1.convex.cloud
   ```
   (On macOS/Linux use `export` instead of `set`.)

3. Start the app:
   ```bash
   npm run dev
   ```

4. In the browser open: **http://localhost:3000/signup**

5. Make sure the form is in **"Create account"** mode (not "Sign in"). Enter:
   - Email: `bashkos@hotmail.com`
   - Password: (use the password you want for this account)

6. Click **Sign up**. That creates the user in **production** Convex.

7. Stop the dev server (Ctrl+C). You can unset the env or run `npm run dev` again as usual for local dev (which uses dev Convex).

## 2. Allow your deployed site so login works on the VPS

For login/signup to work on `https://z4ww800cw0sw0g8gsw0w8ckg.31.97.34.56.sslip.io`, Convex must accept requests from that origin.

- In **Convex Dashboard** → your project → deployment **tidy-ox-195**:
  - Go to **Settings** (or **Environment variables**).
  - Ensure **CONVEX_SITE_URL** is set to:
    ```text
    https://tidy-ox-195.eu-west-1.convex.site
    ```
  - If your Convex project has an **Allowed origins** / **Trusted domains** (or similar) setting, add:
    ```text
    https://z4ww800cw0sw0g8gsw0w8ckg.31.97.34.56.sslip.io
    ```
    (Exact location depends on your Convex dashboard; check Auth or Deployment settings.)

After that, open the deployed app URL, go to **Sign in**, and use the same email and password you used in step 5.
