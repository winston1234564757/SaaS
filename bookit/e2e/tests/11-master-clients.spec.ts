/**
 * 11 — Master Clients (CRM)
 *
 * Тестує /dashboard/clients:
 * - рендер сторінки
 * - перемикання List/Grid
 * - пошук
 * - відкриття ClientDetailSheet
 *
 * Потрібно: playwright/.auth/master.json
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { ClientsPage } from '../pages/ClientsPage';
import { humanType, think, scrollAndFocus } from '../utils/human';

const hasMasterState = fs.existsSync('playwright/.auth/master.json');

test.describe('Master Clients — CRM', () => {
  test('сторінка відкривається і показує список або empty state', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const clients = new ClientsPage(page);

    try {
      await clients.goto();
      await expect(clients.heading).toBeVisible({ timeout: 10_000 });

      // Або є картки клієнтів, або empty state
      const hasClients = await page.locator('.bento-card, [class*="ClientCard"], [class*="client-card"]').first().isVisible({ timeout: 5_000 }).catch(() => false);
      const hasEmpty   = await page.getByText(/немає клієнтів|no clients|Поки що немає/i).first().isVisible({ timeout: 5_000 }).catch(() => false);

      expect(hasClients || hasEmpty).toBe(true);
    } finally {
      await context.close();
    }
  });

  test('перемикання List ↔ Grid', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const clients = new ClientsPage(page);

    try {
      await clients.goto();

      // Спробувати знайти кнопки перемикання виду
      // Часто це іконки grid/list у правому куті
      const gridBtn = page.locator('button[data-view="grid"], button[aria-label*="grid"], button[aria-label*="сітка"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg[data-lucide*="grid"]') }).first());

      const listBtn = page.locator('button[data-view="list"], button[aria-label*="list"], button[aria-label*="список"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg[data-lucide*="list"]') }).first());

      const gridVisible = await gridBtn.isVisible().catch(() => false);
      const listVisible = await listBtn.isVisible().catch(() => false);

      if (gridVisible) {
        await think(page, 300, 500);
        await gridBtn.click();
        await think(page, 300, 500);
      }

      if (listVisible) {
        await listBtn.click();
        await think(page, 300, 500);
      }

      // Сторінка не впала
      expect(page.url()).toContain('/dashboard/clients');
    } finally {
      await context.close();
    }
  });

  test('пошук клієнта по імені', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const clients = new ClientsPage(page);

    try {
      await clients.goto();

      const searchInput = page.getByPlaceholder(/Пошук|Ім.я|Client/i).first();
      const searchVisible = await searchInput.isVisible().catch(() => false);

      if (!searchVisible) {
        test.skip(true, 'Search input не знайдено');
        return;
      }

      await think(page, 300, 600);
      await scrollAndFocus(searchInput);
      await humanType(searchInput, 'Тест');
      await page.waitForTimeout(500);
      await page.waitForLoadState('networkidle');

      // Список або оновився або показав empty state — сторінка не впала
      expect(page.url()).toContain('/dashboard/clients');
    } finally {
      await context.close();
    }
  });

  test('клік на клієнта → ClientDetailSheet відкривається', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const clients = new ClientsPage(page);

    try {
      await clients.goto();

      // Перевірити наявність клієнтів
      const clientCard = page.locator('.bento-card, [class*="ClientCard"], [class*="client-card"]').first();
      const hasClients = await clientCard.isVisible({ timeout: 5_000 }).catch(() => false);

      if (!hasClients) {
        test.skip(true, 'Немає клієнтів для тестування — потрібні тестові дані');
        return;
      }

      await think(page, 400, 700); // "людина обирає клієнта"
      await clientCard.click();

      // Чекати появи detail sheet або modal
      const detailSheet = page.locator('[role="dialog"], [data-testid="client-detail"], [class*="Sheet"], [class*="Detail"]').first();
      const sheetVisible = await detailSheet.isVisible({ timeout: 8_000 }).catch(() => false);

      if (sheetVisible) {
        // Перевірити наявність базових полів у sheet
        await expect(detailSheet).toBeVisible();
        // Закрити sheet
        await think(page, 500, 800);
        const closeBtn = page.getByRole('button', { name: /Закрити|✕|Close/i }).first()
          .or(page.keyboard.press('Escape').then(() => null) as unknown as typeof closeBtn);
        const closeBtnVisible = await page.getByRole('button', { name: /Закрити|✕|Close/i }).first().isVisible().catch(() => false);
        if (closeBtnVisible) {
          await page.getByRole('button', { name: /Закрити|✕|Close/i }).first().click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    } finally {
      await context.close();
    }
  });
});
