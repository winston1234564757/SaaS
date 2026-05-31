/**
 * audit.10-growth.spec.ts — Growth Hub (Loyalty, Referral, Partners)
 */
import { test } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;
test.use({ storageState: 'playwright/.auth/master-audit.json' });
test.beforeAll(async () => { await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL); });

test.describe('Growth Hub', () => {
  test('Growth — Loyalty tab', async ({ page }, testInfo) => {
    await page.goto('/dashboard/growth?tab=loyalty');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'growth-loyalty-desktop');
  });

  test('Growth — Referral tab', async ({ page }, testInfo) => {
    await page.goto('/dashboard/growth?tab=referral');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'growth-referral-desktop');
  });

  test('Growth — Partners tab', async ({ page }, testInfo) => {
    await page.goto('/dashboard/growth?tab=partners');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'growth-partners-desktop');
  });

  test('Loyalty drawer — відкрити деталі', async ({ page }, testInfo) => {
    await page.goto('/dashboard/growth?tab=loyalty');
    await waitForPageReady(page);

    const btn = page.getByText(/деталі|налаштувати|програма|loyalty/i).first();
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      if (await page.locator('[role="dialog"]').first().isVisible().catch(() => false)) {
        await auditScreenshot(page, testInfo, 'growth-loyalty-drawer');
        await page.keyboard.press('Escape');
      }
    }
  });

  test('Growth mobile', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/growth');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'growth-mobile');
  });

  test('Growth — A11y', async ({ page }) => {
    await page.goto('/dashboard/growth');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
