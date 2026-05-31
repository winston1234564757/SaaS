/**
 * audit.04-bookings.spec.ts — Dashboard Bookings Impeccable Audit
 * /dashboard/bookings: Day/Week/Month view, BookingCard, ManualBookingForm, модалки
 */

import { test, expect } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady, auditModal } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;
test.use({ storageState: 'playwright/.auth/master-audit.json' });

test.beforeAll(async () => {
  await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL);
});

test.afterEach(async ({ page }) => {
  await page.close().catch(() => {});
});

test.describe('Bookings — Command Center', () => {
  test('Bookings сторінка завантажується (Day view)', async ({ page }, testInfo) => {
    await page.goto('/dashboard/bookings');
    await waitForPageReady(page);
    await expect(page.locator('h1, [class*="heading"], [class*="title"]').first()).toBeVisible();
    await auditScreenshot(page, testInfo, 'bookings-day-desktop');

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/bookings');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'bookings-day-mobile');
  });

  test('View switcher — Day / Week / Month перемикання', async ({ page }, testInfo) => {
    await page.goto('/dashboard/bookings');
    await waitForPageReady(page);

    const tabs = ['Тиждень', 'Місяць'];
    for (const tab of tabs) {
      const tabBtn = page.getByText(tab, { exact: false }).first();
      const hasTab = await tabBtn.isVisible({ timeout: 3_000 }).catch(() => false);
      if (hasTab) {
        await tabBtn.click();
        await page.waitForTimeout(500);
        await auditScreenshot(page, testInfo, `bookings-view-${tab.toLowerCase()}`);
      }
    }
  });

  test('Кнопка "Створити запис" → ManualBookingForm відкривається', async ({ page }, testInfo) => {
    await page.goto('/dashboard/bookings');
    await waitForPageReady(page);

    const createBtn = page.getByRole('button', { name: /запис|booking|створити|create/i }).first();
    const hasCreate = await createBtn.isVisible().catch(() => false);
    if (hasCreate) {
      await createBtn.click();
      await page.waitForTimeout(600);

      const form = page.locator('[role="dialog"], form, [class*="drawer"], [class*="sheet"]').or(page.getByText('Новий запис')).first();
      await expect(form).toBeVisible({ timeout: 5_000 });
      await auditScreenshot(page, testInfo, 'bookings-create-form-open');
      await page.keyboard.press('Escape');
    }
  });

  test('BookingCard — відкрити деталі запису', async ({ page }, testInfo) => {
    await page.goto('/dashboard/bookings');
    await waitForPageReady(page);

    // Знайти першу картку запису
    const card = page.locator('[class*="booking-card"], [class*="BookingCard"], [data-testid*="booking"]').first();
    const hasCard = await card.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasCard) {
      await card.click();
      await page.waitForTimeout(600);
      await auditScreenshot(page, testInfo, 'bookings-detail-modal');
      await page.keyboard.press('Escape');
    }
  });

  test('Bookings — A11y', async ({ page }) => {
    await page.goto('/dashboard/bookings');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
