/**
 * audit.07-analytics.spec.ts — Analytics Pro Impeccable Audit
 */
import { test } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;
test.use({ storageState: 'playwright/.auth/master-audit.json' });
test.beforeAll(async () => { await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL); });

test.describe('Analytics', () => {
  test('Analytics завантажується з графіками', async ({ page }, testInfo) => {
    await page.goto('/dashboard/analytics');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    // Дати час Recharts відрендерити
    await page.waitForTimeout(1000);
    await auditScreenshot(page, testInfo, 'analytics-desktop');
  });

  test('Analytics filters — Revenue / Top Services / Retention', async ({ page }, testInfo) => {
    await page.goto('/dashboard/analytics');
    await waitForPageReady(page);

    const tabs = ['Виручка', 'Топ', 'Retention', 'Утримання'];
    for (const tab of tabs) {
      const tabEl = page.getByText(tab, { exact: false }).first();
      const hasTab = await tabEl.isVisible({ timeout: 3_000 }).catch(() => false);
      if (hasTab) {
        await tabEl.click();
        await page.waitForTimeout(600);
        await auditScreenshot(page, testInfo, `analytics-tab-${tab.toLowerCase()}`);
        break;
      }
    }
  });

  test('Date range picker', async ({ page }, testInfo) => {
    await page.goto('/dashboard/analytics');
    await waitForPageReady(page);

    const datePicker = page.locator('button[class*="date"], [class*="DatePicker"], input[type="date"]').first();
    const hasDatePicker = await datePicker.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasDatePicker) {
      await datePicker.click();
      await page.waitForTimeout(400);
      await auditScreenshot(page, testInfo, 'analytics-date-picker');
      await page.keyboard.press('Escape');
    }
  });

  test('Analytics mobile', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/analytics');
    await waitForPageReady(page);
    await page.waitForTimeout(800);
    await auditScreenshot(page, testInfo, 'analytics-mobile');
  });

  test('Analytics — A11y', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
