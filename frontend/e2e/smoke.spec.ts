import { test, expect } from "@playwright/test";

test.describe("LivKit smoke", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LivKit|Enterprise|Dashboard/i);
    await expect(page.getByRole("link", { name: /sign in|login/i })).toBeVisible();
  });

  test("login page loads and shows sign in", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("link", { name: /back to home/i })).toBeVisible();
  });

  test("unauthenticated dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated deploy redirects to login", async ({ page }) => {
    await page.goto("/deploy");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated vault redirects to login", async ({ page }) => {
    await page.goto("/vault");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated agents redirects to login", async ({ page }) => {
    await page.goto("/agents");
    await expect(page).toHaveURL(/\/login/);
  });

  test("signup link toggles to sign up", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await page.getByRole("button", { name: /sign up instead/i }).click();
    await expect(page.getByRole("heading", { name: /sign up/i })).toBeVisible();
  });
});
