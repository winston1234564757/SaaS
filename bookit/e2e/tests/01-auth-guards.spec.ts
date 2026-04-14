/**
 * 01 — Auth Guards
 *
 * Verifies that proxy.ts routing rules are enforced:
 *   - Unauthenticated users are redirected to /login from protected routes
 *   - Masters cannot access /my/* (redirected to /dashboard)
 *   - Clients cannot access /dashboard (redirected to /my/bookings)
 *   - Authenticated users are redirected away from /login and /register
 *
 * No seeder data required — auth guard tests use fresh browser contexts
 * (no storageState) or the master-auth / client storageState files.
 *
 * Requires:
 *   playwright/.auth/master-auth.json   (E2E_MASTER_AUTH_EMAIL)
 *   playwright/.auth/client.json        (E2E_CLIENT_EMAIL)
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const hasMasterAuth = fs.existsSync('playwright/.auth/master-auth.json');
const hasClientAuth = fs.existsSync('playwright/.auth/client.json');

// ─── Unauthenticated guards ───────────────────────────────────────────────────

test.describe('Unauthenticated → /login redirects', () => {
  // Fresh context, no cookies
  test('/dashboard → redirected to /login', async ({ browser }) => {
    const context = await browser.newContext();
    const page    = await context.newPage();

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    await context.close();
  });

  test('/my/bookings → redirected to /login', async ({ browser }) => {
    const context = await browser.newContext();
    const page    = await context.newPage();

    await page.goto('/my/bookings');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    await context.close();
  });

  test('/my/loyalty → redirected to /login', async ({ browser }) => {
    const context = await browser.newContext();
    const page    = await context.newPage();

    await page.goto('/my/loyalty');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    await context.close();
  });

  test('/dashboard/settings → redirected to /login', async ({ browser }) => {
    const context = await browser.newContext();
    const page    = await context.newPage();

    await page.goto('/dashboard/settings');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    await context.close();
  });

  test('/login page renders for unauthenticated users', async ({ browser }) => {
    const context = await browser.newContext();
    const page    = await context.newPage();

    await page.goto('/login');
    // Should stay on /login — NOT redirected
    await expect(page).toHaveURL(/\/login/);
    // Phone input must be present (SMS OTP flow)
    await expect(page.locator('input[type="tel"]')).toBeVisible({ timeout: 8_000 });

    await context.close();
  });
});

// ─── Master role guards ───────────────────────────────────────────────────────

test.describe('Master → role-based routing', () => {
  test('master accessing /dashboard lands on dashboard', async ({ browser }) => {
    test.skip(!hasMasterAuth, 'playwright/.auth/master-auth.json not found');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master-auth.json' });
    const page    = await context.newPage();

    await page.goto('/dashboard');
    // Must stay on /dashboard (not redirected to /login or /my/*)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    await context.close();
  });

  test('master accessing /my/bookings is redirected to /dashboard', async ({ browser }) => {
    test.skip(!hasMasterAuth, 'playwright/.auth/master-auth.json not found');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master-auth.json' });
    const page    = await context.newPage();

    await page.goto('/my/bookings');
    // proxy.ts: master on /my/* without view_mode=client → redirect to /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    await context.close();
  });

  test('authenticated master accessing /login is redirected to /dashboard', async ({ browser }) => {
    test.skip(!hasMasterAuth, 'playwright/.auth/master-auth.json not found');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master-auth.json' });
    const page    = await context.newPage();

    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    await context.close();
  });

  test('authenticated master accessing /register is redirected to /dashboard', async ({ browser }) => {
    test.skip(!hasMasterAuth, 'playwright/.auth/master-auth.json not found');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master-auth.json' });
    const page    = await context.newPage();

    await page.goto('/register');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    await context.close();
  });
});

// ─── Client role guards ───────────────────────────────────────────────────────

test.describe('Client → role-based routing', () => {
  test('client accessing /my/bookings lands on /my/bookings', async ({ browser }) => {
    test.skip(!hasClientAuth, 'playwright/.auth/client.json not found');

    const context = await browser.newContext({ storageState: 'playwright/.auth/client.json' });
    const page    = await context.newPage();

    await page.goto('/my/bookings');
    await expect(page).toHaveURL(/\/my/, { timeout: 10_000 });

    await context.close();
  });

  test('client accessing /dashboard is redirected to /my/bookings', async ({ browser }) => {
    test.skip(!hasClientAuth, 'playwright/.auth/client.json not found');

    const context = await browser.newContext({ storageState: 'playwright/.auth/client.json' });
    const page    = await context.newPage();

    await page.goto('/dashboard');
    // proxy.ts: client on /dashboard → redirect to /my/bookings
    await expect(page).toHaveURL(/\/my\/bookings/, { timeout: 10_000 });

    await context.close();
  });

  test('authenticated client accessing /login is redirected to /my/bookings', async ({ browser }) => {
    test.skip(!hasClientAuth, 'playwright/.auth/client.json not found');

    const context = await browser.newContext({ storageState: 'playwright/.auth/client.json' });
    const page    = await context.newPage();

    await page.goto('/login');
    await expect(page).toHaveURL(/\/my\/bookings/, { timeout: 10_000 });

    await context.close();
  });
});

// ─── Public routes ────────────────────────────────────────────────────────────

test.describe('Public routes (no auth required)', () => {
  test('/ — landing page accessible without auth', async ({ page }) => {
    await page.goto('/');
    // Must not redirect to /login
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('/explore — master catalog accessible without auth', async ({ page }) => {
    await page.goto('/explore');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toBeVisible();
  });
});
