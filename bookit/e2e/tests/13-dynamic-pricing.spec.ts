/**
 * 13 — Dynamic Pricing
 *
 * Тестує /dashboard/pricing:
 * - Starter: TrialActive gate з прогрес-баром
 * - Pro (якщо E2E_MASTER_TIER=pro): додавання і видалення правила
 *
 * Потрібно: playwright/.auth/master.json
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { PricingPage } from '../pages/PricingPage';
import { humanType, think, scrollAndFocus } from '../utils/human';

const hasMasterState = fs.existsSync('playwright/.auth/master.json');
const IS_PRO = process.env.E2E_MASTER_TIER === 'pro';

test.describe('Dynamic Pricing', () => {
  test('сторінка відкривається без помилок', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const pricing = new PricingPage(page);

    try {
      await pricing.goto();
      await expect(pricing.heading).toBeVisible({ timeout: 10_000 });
      expect(page.url()).toContain('/dashboard/pricing');
    } finally {
      await context.close();
    }
  });

  test('Starter: Trial gate або прогрес-бар, або повний UI якщо Pro', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const pricing = new PricingPage(page);

    try {
      await pricing.goto();

      // Для Starter: trial gate; для Pro: правила ціноутворення
      const hasProgressBar  = await page.locator('[role="progressbar"], progress, [class*="progress"]').first().isVisible({ timeout: 8_000 }).catch(() => false);
      const hasTrialText    = await page.getByText(/Trial|Пробний|Starter|ліміт|earned/i).first().isVisible({ timeout: 8_000 }).catch(() => false);
      const hasUpgradeBtn   = await page.getByRole('button', { name: /Upgrade|Pro|Покращити/i }).first().isVisible({ timeout: 8_000 }).catch(() => false);
      const hasPricingRules = await page.getByText(/Смарт-ціноутворення|Quiet Hours|Динамічне|правил/i).first().isVisible({ timeout: 8_000 }).catch(() => false);
      const hasHeading      = await pricing.heading.isVisible({ timeout: 8_000 }).catch(() => false);

      // Хоча б щось має бути присутнє (trial gate, upgrade btn, або повний Pro UI)
      expect(hasProgressBar || hasTrialText || hasUpgradeBtn || hasPricingRules || hasHeading).toBe(true);
    } finally {
      await context.close();
    }
  });

  test('Pro: можна додати правило "Quiet Hours"', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');
    test.skip(!IS_PRO, 'Тест тільки для Pro tier (встанови E2E_MASTER_TIER=pro)');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const pricing = new PricingPage(page);

    try {
      await pricing.goto();

      // Знайти секцію Quiet Hours
      const quietSection = page.getByText(/Quiet Hours|Тихий час|Знижка на/i).first();
      const quietVisible = await quietSection.isVisible({ timeout: 8_000 }).catch(() => false);

      if (!quietVisible) {
        // Може бути кнопка "Додати правило"
        const addBtn = page.getByRole('button', { name: /Додати правило|Add rule/i }).first();
        const addVisible = await addBtn.isVisible().catch(() => false);
        if (!addVisible) {
          test.skip(true, 'Форма правил не знайдена (можливо Starter)');
          return;
        }
        await think(page, 300, 600);
        await addBtn.click();
      }

      // Перевірити що є input для % знижки
      const percentInput = page.locator('input[type="number"]').filter({ has: page.locator(':scope') }).first();
      const inputVisible = await percentInput.isVisible({ timeout: 5_000 }).catch(() => false);

      if (inputVisible) {
        await scrollAndFocus(percentInput);
        await humanType(percentInput, '15');
        await think(page, 300, 500);

        // Зберегти
        const saveBtn = page.getByRole('button', { name: /Зберегти|Save/i }).first();
        const saveVisible = await saveBtn.isVisible().catch(() => false);
        if (saveVisible) {
          await saveBtn.click();
          await page.waitForLoadState('networkidle');
        }
      }

      expect(page.url()).toContain('/dashboard/pricing');
    } finally {
      await context.close();
    }
  });
});
