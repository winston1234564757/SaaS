/**
 * audit.14-billing.spec.ts — Billing & Subscription Impeccable Audit
 */
import { test } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;
test.use({ storageState: 'playwright/.auth/master-audit.json' });
test.beforeAll(async () => { await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL); });

test.describe('Billing', () => {
  test('Billing — поточний план і картки тарифів', async ({ page }, testInfo) => {
    await page.goto('/dashboard/billing');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await auditScreenshot(page, testInfo, 'billing-desktop');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/billing');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'billing-mobile');
  });

  test('Upgrade button — Monobank payment modal', async ({ page }, testInfo) => {
    await page.goto('/dashboard/billing');
    await waitForPageReady(page);

    const upgradeBtn = page.getByRole('button', { name: /оновити|upgrade|перейти|підписатись/i }).first();
    if (await upgradeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await upgradeBtn.click();
      await page.waitForTimeout(600);
      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible().catch(() => false)) {
        await auditScreenshot(page, testInfo, 'billing-upgrade-modal');
        await page.keyboard.press('Escape');
      }
    }
  });

  test('Billing — A11y', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
