/**
 * audit.15-academy.spec.ts — Academy / Knowledge Hub Impeccable Audit
 */
import { test } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;
test.use({ storageState: 'playwright/.auth/master-audit.json' });
test.beforeAll(async () => { await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL); });

test.describe('Academy', () => {
  test('Academy — завантажується і відображає контент', async ({ page }, testInfo) => {
    await page.goto('/dashboard/academy');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await auditScreenshot(page, testInfo, 'academy-desktop');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/academy');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'academy-mobile');
  });

  test('Academy — A11y', async ({ page }) => {
    await page.goto('/dashboard/academy');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
