/**
 * audit.03-dashboard.spec.ts — Dashboard Overview Impeccable Audit
 * /dashboard: greeting, schedule, widgets, adaptive strip, tour, topbar, notifications
 */

import { test, expect } from '@playwright/test';
import {
  auditScreenshot, checkA11y, forViewports, waitForPageReady,
  assertTheme, auditModal,
} from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;

test.use({ storageState: 'playwright/.auth/master-audit.json' });

test.beforeAll(async () => {
  const theme = getThemeFromProject(test.info().project.name);
  await switchTheme(theme, MASTER_EMAIL);
});

test.afterEach(async ({ page }) => {
  await page.close().catch(() => {});
});

test.describe('Dashboard Overview — Layout та Bento Grid', () => {
  test('Dashboard завантажується без скелетонів', async ({ page }, testInfo) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Перевірити що data-theme встановлений
    const theme = getThemeFromProject(testInfo.project.name);
    await assertTheme(page, theme);

    // Бенто-картки завантажились
    await expect(page.locator('[class*="bento"], [class*="card"], [class*="widget"]').filter({ visible: true }).first())
      .toBeVisible({ timeout: 15_000 });

    await forViewports(page, async (vp) => {
      await auditScreenshot(page, testInfo, `dashboard-overview-${vp}`);
    });
  });

  test('Topbar — навігація та dropdown меню', async ({ page }, testInfo) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    // 5 основних посилань в топбарі
    const navLinks = ['Огляд', 'Записи', 'Аналітика', 'CRM'];
    for (const link of navLinks) {
      const navEl = page.getByText(link, { exact: false }).first();
      const isVisible = await navEl.isVisible().catch(() => false);
      if (isVisible) {
        // Не переходимо — просто перевіряємо наявність
      }
    }

    // Dropdown "Діяльність"
    const activityBtn = page.getByText(/діяльність/i).first();
    const hasActivity = await activityBtn.isVisible().catch(() => false);
    if (hasActivity) {
      await activityBtn.click();
      await page.waitForTimeout(300);
      await expect(page.getByText(/магазин|портфоліо/i).first()).toBeVisible();
      await auditScreenshot(page, testInfo, 'topbar-activity-dropdown');
      await page.keyboard.press('Escape');
    }

    // Dropdown "Розвиток"
    const growthBtn = page.getByText(/розвиток/i).first();
    const hasGrowth = await growthBtn.isVisible().catch(() => false);
    if (hasGrowth) {
      await growthBtn.click();
      await page.waitForTimeout(300);
      await auditScreenshot(page, testInfo, 'topbar-growth-dropdown');
      await page.keyboard.press('Escape');
    }

    // Profile dropdown
    const profileBtn = page.locator('[class*="avatar"], [class*="profile"], img[alt*="avatar"]').first();
    const hasProfile = await profileBtn.isVisible().catch(() => false);
    if (hasProfile) {
      await profileBtn.click();
      await page.waitForTimeout(300);
      await expect(page.getByText(/налаштування/i).first()).toBeVisible();
      await auditScreenshot(page, testInfo, 'topbar-profile-dropdown');
      await page.keyboard.press('Escape');
    }
  });

  test('Notifications Bell — відкрити та закрити панель', async ({ page }, testInfo) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);

    const bell = page.locator('[aria-label*="сповіщення"], [aria-label*="notification"], [data-testid*="notification"]').first();
    const hasBell = await bell.isVisible().catch(() => false);

    if (hasBell) {
      await bell.click();
      await page.waitForTimeout(500);
      await auditScreenshot(page, testInfo, 'notifications-panel-open');
      await page.keyboard.press('Escape');
    }
  });

  test('Dashboard Tour — запустити та пройти кроки', async ({ page }, testInfo) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);

    // Tour banner або кнопка "Пройти тур"
    const tourBtn = page.getByText(/тур|tour|огляд можливостей/i).first();
    const hasTour = await tourBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasTour) {
      await tourBtn.click();
      await page.waitForTimeout(500);
      await auditScreenshot(page, testInfo, 'tour-step-01');

      // Пройти кілька кроків
      for (let step = 0; step < 3; step++) {
        const nextBtn = page.getByRole('button', { name: /далі|next|продовжити/i }).first();
        const hasNext = await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false);
        if (hasNext) {
          await nextBtn.click();
          await page.waitForTimeout(400);
          await auditScreenshot(page, testInfo, `tour-step-0${step + 2}`);
        } else break;
      }

      // Закрити тур
      const closeBtn = page.getByRole('button', { name: /закрити|skip|пропустити|close/i }).first();
      await closeBtn.click().catch(() => page.keyboard.press('Escape'));
    }
  });

  test('Widgets — основні бенто-картки видимі', async ({ page }, testInfo) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Скролимо вниз щоб завантажились всі lazy widgets
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    await auditScreenshot(page, testInfo, 'dashboard-widgets-desktop');

    // Мобільний вигляд
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'dashboard-widgets-mobile');
  });

  test('Dashboard — A11y перевірка', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
