/**
 * audit.08-marketing.spec.ts — Marketing Hub Impeccable Audit
 * /dashboard/marketing: Story Generator, Broadcasts, BroadcastEditor
 */
import { test, expect } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;
test.use({ storageState: 'playwright/.auth/master-audit.json' });
test.beforeAll(async () => { await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL); });

test.describe('Marketing Hub', () => {
  test('Marketing — tabs Stories / Broadcasts', async ({ page }, testInfo) => {
    await page.goto('/dashboard/marketing');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'marketing-stories-tab');

    const broadcastsTab = page.getByText(/розсилки|broadcast/i).first();
    const hasTab = await broadcastsTab.isVisible().catch(() => false);
    if (hasTab) {
      await broadcastsTab.click();
      await page.waitForTimeout(500);
      await auditScreenshot(page, testInfo, 'marketing-broadcasts-tab');
    }
  });

  test('Кнопка "Нова розсилка" → /dashboard/marketing/new', async ({ page }, testInfo) => {
    await page.goto('/dashboard/marketing');
    await waitForPageReady(page);

    // Перейти на Broadcasts tab
    const broadcastsTab = page.getByText(/розсилки|broadcast/i).first();
    await broadcastsTab.click().catch(() => {});
    await page.waitForTimeout(400);

    const newBtn = page.getByRole('link', { name: /нова|new|створити|create/i }).first();
    const hasNew = await newBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasNew) {
      await newBtn.click();
      await waitForPageReady(page);
      await auditScreenshot(page, testInfo, 'marketing-new-broadcast');
      await page.goBack();
    }
  });

  test('Marketing mobile', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/marketing');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'marketing-mobile');
  });

  test('Marketing — A11y', async ({ page }) => {
    await page.goto('/dashboard/marketing');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
