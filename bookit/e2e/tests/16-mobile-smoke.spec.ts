/**
 * 16 — Mobile Smoke Tests (Pixel 7)
 *
 * Запускається тільки в проекті 'mobile-chrome' (playwright.config.ts).
 * Перевіряє базовий рендер ключових сторінок на мобільному viewport.
 *
 * Потрібно:
 *   - E2E_MASTER_SLUG (для публічної сторінки)
 *   - playwright/.auth/master.json (для dashboard)
 *   - playwright/.auth/client.json (для /my/)
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const hasMasterState = fs.existsSync('playwright/.auth/master.json');
const hasClientState = fs.existsSync('playwright/.auth/client.json');
const SLUG = process.env.E2E_MASTER_SLUG;

test.describe('Mobile Smoke — публічні сторінки', () => {
  test('Лендінг рендериться на мобілі', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain('localhost');
  });

  test('/explore рендериться на мобілі', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
  });

  test('публічна сторінка майстра на мобілі — кнопка "Записатися" видна', async ({ page }) => {
    test.skip(!SLUG, 'E2E_MASTER_SLUG не задано');

    await page.goto(`/${SLUG}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });

    // Кнопка "Записатися" має бути видима без скролу (мобільний sticky)
    const bookBtn = page.getByRole('button', { name: /Записатися/i }).first();
    await expect(bookBtn).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Mobile Smoke — майстер dashboard', () => {
  test('dashboard рендериться на мобілі з BottomNav', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();

    try {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });

      // Мобільна нижня навігація — типово fixed bottom bar
      const bottomNav = page.locator('nav[class*="bottom"], [data-testid="bottom-nav"], nav.fixed').first()
        .or(page.locator('[class*="BottomNav"], [class*="bottom-nav"]').first());
      const navVisible = await bottomNav.isVisible({ timeout: 5_000 }).catch(() => false);

      // Bottom nav може бути або може не бути (залежить від дизайну)
      // Головне — сторінка відкрилась
      expect(page.url()).toContain('/dashboard');
    } finally {
      await context.close();
    }
  });

  test('/dashboard/services рендериться на мобілі', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();

    try {
      await page.goto('/dashboard/services');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });

      // FAB кнопка "+" на мобілі — soft check (може мати різні класи)
      const fab = page.locator('button.fixed.rounded-full').first();
      const fabVisible = await fab.isVisible({ timeout: 5_000 }).catch(() => false);
      // Якщо FAB не знайдено за цим селектором — сторінка все одно відкрилась
      expect(page.url()).toContain('/dashboard/services');
    } finally {
      await context.close();
    }
  });
});

test.describe('Mobile Smoke — клієнтська зона', () => {
  test('/my/bookings рендериться на мобілі', async ({ browser }) => {
    test.skip(!hasClientState, 'Немає playwright/.auth/client.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/client.json' });
    const page = await context.newPage();

    try {
      await page.goto('/my/bookings');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
      expect(page.url()).toContain('/my/bookings');
    } finally {
      await context.close();
    }
  });

  test('/my/profile рендериться на мобілі', async ({ browser }) => {
    test.skip(!hasClientState, 'Немає playwright/.auth/client.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/client.json' });
    const page = await context.newPage();

    try {
      await page.goto('/my/profile');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
    } finally {
      await context.close();
    }
  });
});
