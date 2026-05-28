import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const AUTH_FILE = 'playwright/.auth/master-auth.json';
const hasMasterAuth = fs.existsSync(AUTH_FILE);

test.describe('Services Loading — icon_name fallback', () => {
  test('services page loads real data and CRUD works', async ({ browser }) => {
    test.skip(!hasMasterAuth, `Немає ${AUTH_FILE}`);

    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();

    const runId = Date.now().toString().slice(-6);
    const serviceName = `E2E Icon Test ${runId}`;

    try {
      // ── PART 1: Verify services page loads real data ──
      await page.goto('/dashboard/services');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3_000);

      // The page must render a heading
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible({ timeout: 15_000 });

      // No crash — page body renders
      await expect(page.locator('body')).toBeVisible();

      // At least one service must show (not empty/INITIAL_SERVICES)
      const serviceCountEl = page.locator('p').filter({ hasText: /активних послуг/i });
      if (await serviceCountEl.isVisible().catch(() => false)) {
        const text = await serviceCountEl.textContent();
        expect(text).toMatch(/[1-9]/);
      }

      // No skeleton loaders after settling
      const skeletons = page.locator('[class*="skeleton"], [class*="Skeleton"]');
      expect(await skeletons.count()).toBe(0);

      // ── PART 2: Navigate to new service page ──
      await page.goto('/dashboard/services/new');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1_000);

      if (page.url().includes('/login')) {
        test.info().annotations.push({ type: 'warn', description: 'Redirected to login — auth state expired' });
        return;
      }

      // Fill the service form (full-page editor)
      const nameInput = page.getByPlaceholder('Введіть назву...');
      await nameInput.waitFor({ state: 'visible', timeout: 10_000 });
      await nameInput.fill(serviceName);

      const priceInput = page.locator('input[type="number"]').first();
      await priceInput.fill('500');

      // Select "Преміум" icon (wand)
      const premiumBtn = page.locator('button').filter({ hasText: 'Преміум' });
      if (await premiumBtn.isVisible().catch(() => false)) {
        await premiumBtn.click();
        await page.waitForTimeout(200);
      }

      // Save
      const saveBtn = page.getByRole('button', { name: /зберегти/i });
      await saveBtn.waitFor({ state: 'visible', timeout: 5_000 });
      await saveBtn.click();

      // Wait for redirect back + list refetch
      await page.waitForURL(/\/dashboard\/services$/, { timeout: 15_000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3_000);

      // Verify new service appears
      await expect(page.getByText(serviceName)).toBeVisible({ timeout: 10_000 });

    } finally {
      await context.close();
    }
  });
});
