/**
 * audit.09-revenue.spec.ts — Revenue Hub (Flash Deals + Dynamic Pricing)
 */
import { test } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;
test.use({ storageState: 'playwright/.auth/master-audit.json' });
test.beforeAll(async () => { await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL); });

test.describe('Revenue Hub', () => {
  test('Revenue — Flash Deals tab', async ({ page }, testInfo) => {
    await page.goto('/dashboard/revenue?tab=flash_deals');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'revenue-flash-deals');
  });

  test('Revenue — Dynamic Pricing tab', async ({ page }, testInfo) => {
    await page.goto('/dashboard/revenue?tab=dynamic_pricing');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'revenue-dynamic-pricing');
  });

  test('Flash Deal — відкрити drawer створення', async ({ page }, testInfo) => {
    await page.goto('/dashboard/revenue?tab=flash_deals');
    await waitForPageReady(page);

    const createBtn = page.getByRole('button', { name: /нова акція|flash|створити|add/i }).first();
    const hasBtn = await createBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasBtn) {
      await createBtn.click();
      await page.waitForTimeout(600);
      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible().catch(() => false)) {
        await auditScreenshot(page, testInfo, 'revenue-flash-deal-drawer');
        await page.keyboard.press('Escape');
      }
    }
  });

  test('Revenue mobile', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/revenue');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'revenue-mobile');
  });

  test('Revenue — A11y', async ({ page }) => {
    await page.goto('/dashboard/revenue');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
