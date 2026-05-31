/**
 * audit.12-products.spec.ts — Products (Shop) + Orders Impeccable Audit
 */
import { test, expect } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;
test.use({ storageState: 'playwright/.auth/master-audit.json' });
test.beforeAll(async () => { await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL); });

test.describe('Products & Shop', () => {
  test('Products список — 2 товари від seed', async ({ page }, testInfo) => {
    await page.goto('/dashboard/products');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await auditScreenshot(page, testInfo, 'products-list-desktop');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/products');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'products-list-mobile');
  });

  test('Products — Orders tab', async ({ page }, testInfo) => {
    await page.goto('/dashboard/products?tab=orders');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'products-orders-tab');
  });

  test('Product EditDrawer через UrlActionBus', async ({ page }, testInfo) => {
    await page.goto('/dashboard/products');
    await waitForPageReady(page);

    const editBtn = page.locator('[aria-label*="редагув"], [class*="edit"]').first();
    if (await editBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(600);
      const drawer = page.locator('[role="dialog"]').first();
      if (await drawer.isVisible().catch(() => false)) {
        await auditScreenshot(page, testInfo, 'products-edit-drawer');
        await page.keyboard.press('Escape');
      }
    }
  });

  test('Products — A11y', async ({ page }) => {
    await page.goto('/dashboard/products');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
