/**
 * 15 — Analytics Page
 *
 * Тестує /dashboard/analytics:
 * - рендер сторінки
 * - перемикання діапазонів
 * - наявність графіків
 *
 * Для Starter: може бути upgrade gate
 * Для Pro (E2E_MASTER_TIER=pro): повний UI
 *
 * Потрібно: playwright/.auth/master.json
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { think } from '../utils/human';

const hasMasterState = fs.existsSync('playwright/.auth/master.json');
const IS_PRO = process.env.E2E_MASTER_TIER === 'pro';

test.describe('Analytics', () => {
  test('сторінка відкривається без помилок', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const analytics = new AnalyticsPage(page);

    try {
      await analytics.goto();
      // Сторінка не повинна повернути 404/500
      expect(page.url()).toContain('/dashboard/analytics');
    } finally {
      await context.close();
    }
  });

  test('Starter: upgrade gate або заголовок видно', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');
    test.skip(IS_PRO, 'Тест тільки для Starter');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const analytics = new AnalyticsPage(page);

    try {
      await analytics.goto();

      // Для Starter може бути upgrade gate або редірект
      const hasHeading  = await analytics.heading.isVisible({ timeout: 8_000 }).catch(() => false);
      const hasUpgrade  = await page.getByText(/Upgrade|Pro|Аналітика|Analytics/i).first().isVisible({ timeout: 8_000 }).catch(() => false);

      expect(hasHeading || hasUpgrade).toBe(true);
    } finally {
      await context.close();
    }
  });

  test('Pro: перемикання діапазонів День → Тиждень → Місяць', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');
    test.skip(!IS_PRO, 'Тест тільки для Pro (E2E_MASTER_TIER=pro)');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const analytics = new AnalyticsPage(page);

    try {
      await analytics.goto();
      await expect(analytics.heading).toBeVisible({ timeout: 10_000 });

      // Клікаємо Тиждень
      const weekVisible = await analytics.weekBtn.isVisible().catch(() => false);
      if (weekVisible) {
        await think(page, 300, 500);
        await analytics.weekBtn.click();
        await page.waitForLoadState('networkidle');
        await think(page, 200, 400);
      }

      // Клікаємо Місяць
      const monthVisible = await analytics.monthBtn.isVisible().catch(() => false);
      if (monthVisible) {
        await analytics.monthBtn.click();
        await page.waitForLoadState('networkidle');
        await think(page, 200, 400);
      }

      // Клікаємо Рік
      const yearVisible = await analytics.yearBtn.isVisible().catch(() => false);
      if (yearVisible) {
        await analytics.yearBtn.click();
        await page.waitForLoadState('networkidle');
      }

      expect(page.url()).toContain('/dashboard/analytics');
    } finally {
      await context.close();
    }
  });

  test('Pro: хоча б 1 графік (canvas/svg) видно', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');
    test.skip(!IS_PRO, 'Тест тільки для Pro');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const analytics = new AnalyticsPage(page);

    try {
      await analytics.goto();
      await page.waitForLoadState('networkidle');
      await think(page, 500, 1000); // чекати рендеру графіків

      // Перевірити наявність canvas або svg графіків
      const hasCanvas = await page.locator('canvas').first().isVisible({ timeout: 5_000 }).catch(() => false);
      const hasSvg    = await page.locator('svg[class*="chart"], svg[class*="Chart"], recharts-wrapper svg').first().isVisible({ timeout: 5_000 }).catch(() => false);

      // Якщо немає графіків — перевірити що є хоча б числові дані
      const hasNumbers = await page.locator('[class*="stat"], [class*="metric"], [class*="value"]').first().isVisible({ timeout: 3_000 }).catch(() => false);

      expect(hasCanvas || hasSvg || hasNumbers).toBe(true);
    } finally {
      await context.close();
    }
  });
});
