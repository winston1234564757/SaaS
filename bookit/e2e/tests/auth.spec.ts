import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { AuthPage } from '../pages/AuthPage';

const masterEmail = process.env.E2E_MASTER_EMAIL;
const masterPassword = process.env.E2E_MASTER_PASSWORD;
const clientEmail = process.env.E2E_CLIENT_EMAIL;
const clientPassword = process.env.E2E_CLIENT_PASSWORD;

const hasMasterCreds = !!(masterEmail && masterPassword);
const hasClientCreds = !!(clientEmail && clientPassword);
const hasMasterState = fs.existsSync('playwright/.auth/master.json');
const hasClientState = fs.existsSync('playwright/.auth/client.json');

// ─────────────────────────────────────────────────────────────────────
// 1. Login page renders
// ─────────────────────────────────────────────────────────────────────
test.describe('Сторінка логіну', () => {
  test('відображає h1 "Вхід" та поля форми', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    await expect(auth.heading).toBeVisible();
    await expect(auth.heading).toContainText('Вхід');
    await expect(auth.emailInput).toBeVisible();
    await expect(auth.passwordInput).toBeVisible();
    await expect(auth.submitButton).toBeVisible();
    await expect(auth.googleButton).toBeVisible();
  });

  test('показує помилку при невірних credentials', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    await auth.login('wrong@test.com', 'wrongpassword');
    await expect(auth.errorMessage).toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────
// 2. Routing без авторизації
// ─────────────────────────────────────────────────────────────────────
test.describe('Захист роутів (без авторизації)', () => {
  test('/dashboard → редірект на /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('/my/bookings → редірект на /login', async ({ page }) => {
    await page.goto('/my/bookings');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────
// 3. Master login flow
// ─────────────────────────────────────────────────────────────────────
test.describe('Логін майстра', () => {
  test('UI логін → редірект на /dashboard', async ({ page }) => {
    test.skip(!hasMasterCreds, 'Потрібні E2E_MASTER_EMAIL + E2E_MASTER_PASSWORD');
    test.skip(!hasMasterState, 'Акаунт майстра не існує в Supabase — global.setup не зміг авторизуватись');

    const auth = new AuthPage(page);
    await auth.goto();
    await auth.login(masterEmail!, masterPassword!);

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────
// 4. Client login flow
// ─────────────────────────────────────────────────────────────────────
test.describe('Логін клієнта', () => {
  test('UI логін → редірект на /my/bookings', async ({ page }) => {
    test.skip(!hasClientCreds, 'Потрібні E2E_CLIENT_EMAIL + E2E_CLIENT_PASSWORD');
    test.skip(!hasClientState, 'Акаунт клієнта не існує в Supabase — global.setup не зміг авторизуватись');

    const auth = new AuthPage(page);
    await auth.goto();
    await auth.login(clientEmail!, clientPassword!);

    await expect(page).toHaveURL(/\/my\/bookings/, { timeout: 15_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────
// 5. Security: клієнт намагається зайти на /dashboard
// ─────────────────────────────────────────────────────────────────────
test.describe('Безпека ролей', () => {
  test('клієнт на /dashboard → редірект на /my/bookings', async ({ browser }) => {
    test.skip(!hasClientState, 'Немає playwright/.auth/client.json — запусти global.setup спочатку');

    const context = await browser.newContext({
      storageState: 'playwright/.auth/client.json',
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/my\/bookings/, { timeout: 10_000 });

    await context.close();
  });

  test('майстер в режимі клієнта на /dashboard → редірект на /dashboard', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json — запусти global.setup спочатку');

    const context = await browser.newContext({
      storageState: 'playwright/.auth/master.json',
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    await context.close();
  });
});
