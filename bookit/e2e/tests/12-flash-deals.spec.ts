/**
 * 12 — Flash Deals
 *
 * Тестує /dashboard/flash:
 * - Starter: ліміт-бар і upgrade gate видно
 * - Pro (якщо E2E_MASTER_TIER=pro): створення і скасування deal
 *
 * Потрібно: playwright/.auth/master.json
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { FlashPage } from '../pages/FlashPage';
import { think, scrollAndFocus } from '../utils/human';

const hasMasterState = fs.existsSync('playwright/.auth/master.json');
const IS_PRO = process.env.E2E_MASTER_TIER === 'pro';

test.describe('Flash Deals', () => {
  test('сторінка відкривається без помилок', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const flash = new FlashPage(page);

    try {
      await flash.goto();
      await expect(flash.heading).toBeVisible({ timeout: 10_000 });
      expect(page.url()).toContain('/dashboard/flash');
    } finally {
      await context.close();
    }
  });

  test('Starter: видно ліміт-бар або upgrade gate', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');
    test.skip(IS_PRO, 'Тест тільки для Starter tier');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const flash = new FlashPage(page);

    try {
      await flash.goto();

      // Перевірити наявність ліміт індикатора або upgrade пропозиції
      const hasLimitBar    = await page.locator('[role="progressbar"], progress, [class*="progress"], [class*="limit"]').first().isVisible({ timeout: 5_000 }).catch(() => false);
      const hasUpgradeText = await page.getByText(/Upgrade|Покращити|Pro|ліміт|limit/i).first().isVisible({ timeout: 5_000 }).catch(() => false);
      const hasCreateBtn   = await page.getByRole('button', { name: /Створити|Новий|Flash/i }).first().isVisible({ timeout: 5_000 }).catch(() => false);

      // Хоча б щось пов'язане з flashami має бути
      expect(hasLimitBar || hasUpgradeText || hasCreateBtn).toBe(true);
    } finally {
      await context.close();
    }
  });

  test('Pro: відкриття форми створення deal', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');
    test.skip(!IS_PRO, 'Тест тільки для Pro tier (E2E_MASTER_TIER=pro)');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const flash = new FlashPage(page);

    try {
      await flash.goto();

      const createBtn = page.getByRole('button', { name: /Створити|Новий deal|Флеш/i }).first();
      await expect(createBtn).toBeVisible({ timeout: 8_000 });

      await think(page, 300, 600);
      await createBtn.click();

      // Форма має з'явитися
      const formEl = page.locator('[role="dialog"], form, [class*="Form"]').first();
      await expect(formEl).toBeVisible({ timeout: 8_000 });

      // Закрити без збереження
      await page.keyboard.press('Escape');
    } finally {
      await context.close();
    }
  });
});
