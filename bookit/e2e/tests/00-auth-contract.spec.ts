import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const hasMasterAuth = fs.existsSync('playwright/.auth/master-auth.json');
const hasClientAuth = fs.existsSync('playwright/.auth/client.json');
const hasStudioAdminAuth = fs.existsSync('playwright/.auth/studio-admin.json');

test.describe('Auth Contract Smoke', () => {
  test('master storageState resolves to dashboard contract', async ({ browser }) => {
    test.skip(!hasMasterAuth, 'playwright/.auth/master-auth.json not found');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master-auth.json' });
    const page = await context.newPage();

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.locator('body')).toBeVisible();

    await context.close();
  });

  test('client storageState resolves to my-bookings contract', async ({ browser }) => {
    test.skip(!hasClientAuth, 'playwright/.auth/client.json not found');

    const context = await browser.newContext({ storageState: 'playwright/.auth/client.json' });
    const page = await context.newPage();

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/my\/bookings/, { timeout: 15_000 });
    await expect(page.locator('body')).toBeVisible();

    await context.close();
  });

  test('studio-admin storageState resolves to dashboard contract', async ({ browser }) => {
    test.skip(!hasStudioAdminAuth, 'playwright/.auth/studio-admin.json not found');

    const context = await browser.newContext({ storageState: 'playwright/.auth/studio-admin.json' });
    const page = await context.newPage();

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.locator('body')).toBeVisible();

    await context.close();
  });
});
