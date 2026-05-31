/**
 * audit.11-portfolio.spec.ts — Portfolio CRUD Impeccable Audit
 */
import { test, expect } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;
test.use({ storageState: 'playwright/.auth/master-audit.json' });
test.beforeAll(async () => { await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL); });

test.describe('Portfolio', () => {
  test('Portfolio список кейсів', async ({ page }, testInfo) => {
    await page.goto('/dashboard/portfolio');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await auditScreenshot(page, testInfo, 'portfolio-list-desktop');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/portfolio');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'portfolio-list-mobile');
  });

  test('Кнопка "Додати" → /dashboard/portfolio/new', async ({ page }, testInfo) => {
    await page.goto('/dashboard/portfolio');
    await waitForPageReady(page);

    const addBtn = page.getByRole('link', { name: /додати|new|add|кейс/i }).first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await waitForPageReady(page);
      await expect(page).toHaveURL(/portfolio\/(new|create)/, { timeout: 8_000 });
      await auditScreenshot(page, testInfo, 'portfolio-new-form');
      await page.goBack();
    }
  });

  test('Story Generator drawer', async ({ page }, testInfo) => {
    await page.goto('/dashboard/portfolio');
    await waitForPageReady(page);

    const storyBtn = page.getByText(/story|сторіс|генерат/i).first();
    if (await storyBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await storyBtn.click();
      await page.waitForTimeout(600);
      if (await page.locator('[role="dialog"]').first().isVisible().catch(() => false)) {
        await auditScreenshot(page, testInfo, 'portfolio-story-generator');
        await page.keyboard.press('Escape');
      }
    }
  });

  test('Portfolio — A11y', async ({ page }) => {
    await page.goto('/dashboard/portfolio');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
