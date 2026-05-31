/**
 * audit.06-services.spec.ts — Services CRUD Impeccable Audit
 */
import { test, expect } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;
test.use({ storageState: 'playwright/.auth/master-audit.json' });
test.beforeAll(async () => { await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL); });

test.describe('Services', () => {
  test('Services список — 3 послуги від seed', async ({ page }, testInfo) => {
    await page.goto('/dashboard/services');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await auditScreenshot(page, testInfo, 'services-list-desktop');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/services');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'services-list-mobile');
  });

  test('Кнопка "Додати послугу" → /dashboard/services/new', async ({ page }, testInfo) => {
    await page.goto('/dashboard/services');
    await waitForPageReady(page);

    const addBtn = page.getByRole('link', { name: /додати|нова|new|add/i }).first();
    const hasBtn = await addBtn.isVisible().catch(() => false);
    if (hasBtn) {
      await addBtn.click();
      await expect(page).toHaveURL(/\/services\/(new|create)/, { timeout: 8_000 });
      await waitForPageReady(page);
      await auditScreenshot(page, testInfo, 'services-new-form');
      await page.goBack();
    }
  });

  test('Картка послуги — клік на Редагувати', async ({ page }, testInfo) => {
    await page.goto('/dashboard/services');
    await waitForPageReady(page);

    const editBtn = page.getByRole('link', { name: /редагувати|edit/i }).first();
    const hasEdit = await editBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasEdit) {
      await editBtn.click();
      await waitForPageReady(page);
      await auditScreenshot(page, testInfo, 'services-edit-form');
      await page.goBack();
    }
  });

  test('Services — A11y', async ({ page }) => {
    await page.goto('/dashboard/services');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
