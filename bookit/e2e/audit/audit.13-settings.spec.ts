/**
 * audit.13-settings.spec.ts — Dashboard Settings Impeccable Audit
 */
import { test } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;
test.use({ storageState: 'playwright/.auth/master-audit.json' });
test.beforeAll(async () => { await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL); });

test.describe('Settings', () => {
  test('Settings tabs — Profile / Schedule / Notifications / Integrations', async ({ page }, testInfo) => {
    await page.goto('/dashboard/settings');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'settings-profile-tab');

    const tabs = ['Розклад', 'Сповіщення', 'Інтеграції', 'Schedule', 'Notifications'];
    for (const tab of tabs) {
      const tabEl = page.getByText(tab, { exact: false }).first();
      if (await tabEl.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await tabEl.click();
        await page.waitForTimeout(400);
        await auditScreenshot(page, testInfo, `settings-tab-${tab.toLowerCase()}`);
        break;
      }
    }
  });

  test('Theme switcher — всі 3 теми в налаштуваннях', async ({ page }, testInfo) => {
    await page.goto('/dashboard/settings');
    await waitForPageReady(page);

    const themeSection = page.getByText(/тема|theme|вигляд/i).first();
    await themeSection.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(300);

    const themeOptions = page.locator('[class*="theme-option"], [class*="ThemeCard"], input[name*="theme"]');
    const count = await themeOptions.count();
    if (count >= 3) {
      await auditScreenshot(page, testInfo, 'settings-theme-switcher');
    }
  });

  test('Settings mobile', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/settings');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'settings-mobile');
  });

  test('Settings — A11y', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
