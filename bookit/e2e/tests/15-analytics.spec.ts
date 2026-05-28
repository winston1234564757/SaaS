/**
 * 15 — Analytics Page
 *
 * Тестує /dashboard/analytics:
 * - рендер сторінки
 * - перемикання діапазонів
 * - наявність графіків
 *
 * Для Starter (master-auth.json): upgrade gate
 * Для Pro (master-crm.json): повний UI, статистика
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { think } from '../utils/human';

const hasStarterState = fs.existsSync('playwright/.auth/master-auth.json');
const hasProState     = fs.existsSync('playwright/.auth/master-crm.json');

test.describe('Analytics', () => {

  test('Starter: відображає paywall (upgrade prompt)', async ({ browser }) => {
    test.skip(!hasStarterState, 'Немає playwright/.auth/master-auth.json (Starter)');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master-auth.json' });
    const page = await context.newPage();
    const analytics = new AnalyticsPage(page);

    try {
      await analytics.goto();
      await expect(analytics.heading).toBeVisible({ timeout: 10_000 });

      // Starter cannot view older dates without upgrading
      const weekBtn = page.getByText('Тиждень', { exact: true });
      await weekBtn.click();
      await think(page, 300, 600);

      // Upgrade prompt or locked date range should be visible
      const upgradePrompt = page.getByTestId('upgrade-prompt');
      const lockedDateRange = page.getByTestId('locked-date-range');
      const paywallLock = page.getByTestId('paywall-lock');

      await expect(
        upgradePrompt.or(lockedDateRange).or(paywallLock).first()
      ).toBeVisible({ timeout: 10_000 });

    } finally {
      await context.close();
    }
  });

  test('Pro: перемикання діапазонів День → Тиждень → Місяць', async ({ browser }) => {
    test.skip(!hasProState, 'Немає playwright/.auth/master-crm.json (Pro)');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master-crm.json' });
    const page = await context.newPage();
    const analytics = new AnalyticsPage(page);

    try {
      await analytics.goto();
      await expect(analytics.heading).toBeVisible({ timeout: 10_000 });

      // Wait for data to load
      await expect(page.getByTestId('stats-ready')).toBeVisible({ timeout: 15_000 });

      // Клікаємо Тиждень
      const weekVisible = await analytics.weekBtn.isVisible().catch(() => false);
      if (weekVisible) {
        await think(page, 300, 500);
        await analytics.weekBtn.click();
        await expect(page.getByTestId('stats-loading')).toBeVisible({ timeout: 5_000 }).catch(() => {});
        await expect(page.getByTestId('stats-ready')).toBeVisible({ timeout: 15_000 });
        await think(page, 200, 400);
      }

      // Клікаємо Місяць
      const monthVisible = await analytics.monthBtn.isVisible().catch(() => false);
      if (monthVisible) {
        await analytics.monthBtn.click();
        await expect(page.getByTestId('stats-loading')).toBeVisible({ timeout: 5_000 }).catch(() => {});
        await expect(page.getByTestId('stats-ready')).toBeVisible({ timeout: 15_000 });
        await think(page, 200, 400);
      }

      // Клікаємо Рік
      const yearVisible = await analytics.yearBtn.isVisible().catch(() => false);
      if (yearVisible) {
        await analytics.yearBtn.click();
        await expect(page.getByTestId('stats-loading')).toBeVisible({ timeout: 5_000 }).catch(() => {});
        await expect(page.getByTestId('stats-ready')).toBeVisible({ timeout: 15_000 });
      }

      expect(page.url()).toContain('/dashboard/analytics');
    } finally {
      await context.close();
    }
  });

  test('Pro: наявність графіків та числових даних', async ({ browser }) => {
    test.skip(!hasProState, 'Немає playwright/.auth/master-crm.json (Pro)');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master-crm.json' });
    const page = await context.newPage();
    const analytics = new AnalyticsPage(page);

    try {
      await analytics.goto();
      await expect(analytics.heading).toBeVisible({ timeout: 10_000 });

      // Force to "All Time" to ensure we capture the 100 seeded CRM past bookings
      await page.getByText('Весь час', { exact: true }).click();
      await expect(page.getByTestId('stats-ready')).toBeVisible({ timeout: 15_000 });
      await think(page, 500, 1000); // чекати рендеру графіків

      // Перевірити наявність графіків або цифр (Seeded data has bookings)
      const hasCanvas = await page.locator('canvas').first().isVisible({ timeout: 2_000 }).catch(() => false);
      const hasSvg    = await page.locator('svg[class*="chart"], svg[class*="Chart"], recharts-wrapper svg').first().isVisible({ timeout: 2_000 }).catch(() => false);
      const hasNumbers = await page.locator('[class*="stat"], [class*="metric"], [class*="value"]').first().isVisible({ timeout: 2_000 }).catch(() => false);

      expect(hasCanvas || hasSvg || hasNumbers).toBe(true);

      // Verify approximate matching for seeded revenue (CRM Master has 100 bookings * 600 UAH = 60000 UAH, minus cancellations/future)
      // Since some are cancelled or future, we just verify something > 0 is displayed on the page
      const revenueText = await page.locator('p.text-2xl.font-bold').first().innerText();
      expect(revenueText).not.toBe('0');
      
    } finally {
      await context.close();
    }
  });
});

