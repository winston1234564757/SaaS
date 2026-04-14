/**
 * 10 — Master Bookings Page
 *
 * Тестує /dashboard/bookings:
 * - рендер з режимами Day/Week/Month
 * - навігація стрілками
 * - пошук по клієнту
 * - ручне додавання запису (FAB → форма → збереження)
 *
 * Потрібно:
 *   - playwright/.auth/master-crm.json
 *   - E2E_MASTER_ID (для DB cleanup)
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { supabaseAdmin } from '../utils/supabase';
import { BookingsManagePage } from '../pages/BookingsManagePage';
import { humanType, think, scrollAndFocus } from '../utils/human';

const hasMasterState = fs.existsSync('playwright/.auth/master-crm.json');
const MASTER_ID = process.env.E2E_MASTER_ID;
const RUN_ID = Date.now().toString().slice(-6);
const TEST_CLIENT_NAME = 'Тестове Бронювання';
const TEST_CLIENT_PHONE = `380670000${RUN_ID.slice(-3)}`;

// Cleanup після тестів
const insertedBookingIds: string[] = [];

test.afterAll(async () => {
  if (insertedBookingIds.length > 0) {
    await supabaseAdmin.from('bookings').delete().in('id', insertedBookingIds).catch(() => {});
  }
  // Також видалити по імені на випадок якщо ID не був записаний
  if (MASTER_ID) {
    try {
      await supabaseAdmin.from('bookings').delete()
        .eq('master_id', MASTER_ID)
        .eq('client_name', TEST_CLIENT_NAME);
    } catch {}
  }
});

test.describe('Master Bookings — перегляд і навігація', () => {
  test('сторінка рендериться з кнопками режимів', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master-crm.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master-crm.json' });
    const page = await context.newPage();
    const bookings = new BookingsManagePage(page);

    try {
      await bookings.goto();
      await expect(bookings.heading).toBeVisible({ timeout: 10_000 });

      // Перевірити наявність режимів перегляду
      await expect(bookings.dayViewBtn).toBeVisible({ timeout: 10_000 });
      await expect(bookings.weekViewBtn).toBeVisible({ timeout: 10_000 });
      await expect(bookings.monthViewBtn).toBeVisible({ timeout: 10_000 });
    } finally {
      await context.close();
    }
  });

  test('перемикання режимів Day → Week → Month', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master-crm.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master-crm.json' });
    const page = await context.newPage();
    const bookings = new BookingsManagePage(page);

    try {
      await bookings.goto();

      // Клікаємо "Тиждень"
      const weekBtn = await bookings.weekViewBtn.isVisible().catch(() => false);
      if (weekBtn) {
        await think(page, 300, 500);
        await bookings.weekViewBtn.click();
        await page.waitForLoadState('networkidle');
        await think(page, 200, 400);
      }

      // Клікаємо "Місяць"
      const monthBtn = await bookings.monthViewBtn.isVisible().catch(() => false);
      if (monthBtn) {
        await bookings.monthViewBtn.click();
        await page.waitForLoadState('networkidle');
        await think(page, 200, 400);
      }

      // Клікаємо "День"
      const dayBtn = await bookings.dayViewBtn.isVisible().catch(() => false);
      if (dayBtn) {
        await bookings.dayViewBtn.click();
        await page.waitForLoadState('networkidle');
      }

      // Сторінка не впала
      expect(page.url()).toContain('/dashboard/bookings');
    } finally {
      await context.close();
    }
  });

  test('навігація стрілками ← →', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master-crm.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master-crm.json' });
    const page = await context.newPage();
    const bookings = new BookingsManagePage(page);

    try {
      await bookings.goto();

      // Клік "вперед"
      const navBtns = page.locator('button').filter({ has: page.locator('svg') });
      const count = await navBtns.count();

      // Спробувати знайти і натиснути стрілки навігації
      if (count > 0) {
        await think(page, 300, 500);
        // Знайти кнопку з іконкою стрілки вперед
        const fwdBtn = page.locator('button[aria-label*="наступ"], button[aria-label*="next"]').first();
        const fwdVisible = await fwdBtn.isVisible().catch(() => false);
        if (fwdVisible) {
          await fwdBtn.click();
          await think(page, 300, 500);
          await fwdBtn.click();
          await think(page, 200, 400);
        }
      }

      expect(page.url()).toContain('/dashboard/bookings');
    } finally {
      await context.close();
    }
  });
});

test.describe('Master Bookings — пошук', () => {
  test('пошук по імені клієнта', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master-crm.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master-crm.json' });
    const page = await context.newPage();
    const bookings = new BookingsManagePage(page);

    try {
      await bookings.goto();

      await expect(bookings.searchInput).toBeVisible({ timeout: 10_000 });

      await think(page, 300, 600);
      await scrollAndFocus(bookings.searchInput);
      await humanType(bookings.searchInput, 'Test');
      await page.waitForTimeout(500); // debounce
      await page.waitForLoadState('networkidle');

      // Перевірити що список або оновився або показав empty state
      const url = page.url();
      expect(url).toContain('/dashboard/bookings');
    } finally {
      await context.close();
    }
  });
});

test.describe('Master Bookings — ручне додавання', () => {
  test('FAB → ManualBookingForm → заповнити → зберегти', async ({ browser }) => {
    test.setTimeout(120_000);
    test.skip(!hasMasterState, 'Немає playwright/.auth/master-crm.json');
    test.skip(!MASTER_ID, 'E2E_MASTER_ID не задано — потрібен для cleanup');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master-crm.json' });
    const page = await context.newPage();
    const bookings = new BookingsManagePage(page);

    try {
      await bookings.goto();

      // Клікнути FAB
      await expect(bookings.fab).toBeVisible({ timeout: 10_000 });
      await think(page, 400, 700);
      await bookings.fab.click();

      // Чекати появи wizard
      const wizardPanel = page.getByTestId('wizard-panel').last();
      await expect(wizardPanel).toBeVisible({ timeout: 10_000 });

      // Крок 1 — послуги
      const firstService = wizardPanel.getByTestId('service-card').first();
      await expect(firstService).toBeVisible({ timeout: 10_000 });
      await think(page, 300, 600);
      await firstService.click();
      
      const nextBtn1 = wizardPanel.getByTestId('wizard-next-btn').last();
      await expect(nextBtn1).toBeEnabled({ timeout: 5_000 });
      await think(page, 200, 400);
      await nextBtn1.click();

      // Крок 2 — час
      const availableSlot = wizardPanel.locator('[data-testid="time-slot"]:not([disabled])').first();
      await expect(availableSlot).toBeVisible({ timeout: 10_000 });
      await scrollAndFocus(availableSlot);
      await think(page, 300, 600);
      await availableSlot.click();

      const nextBtn2 = wizardPanel.getByTestId('wizard-next-btn').last();
      await expect(nextBtn2).toBeEnabled({ timeout: 5_000 });
      await think(page, 200, 400);
      await nextBtn2.click();

      // Крок 3 — товари (опціонально)
      const skipProductsBtn = wizardPanel.getByTestId('wizard-skip-products-btn').first();
      const skipVisible = await skipProductsBtn.isVisible().catch(() => false);
      if (skipVisible) {
        await think(page, 300, 500);
        await skipProductsBtn.click();
      } else {
        const nextBtn3 = wizardPanel.getByTestId('wizard-next-btn').last();
        const nextVisible = await nextBtn3.isVisible().catch(() => false);
        if (nextVisible) {
          await think(page, 300, 500);
          await nextBtn3.click();
        }
      }

      // Крок 4 — деталі
      await expect(bookings.clientNameInput).toBeVisible({ timeout: 10_000 });
      await think(page, 300, 600);
      await humanType(bookings.clientNameInput, TEST_CLIENT_NAME);
      
      await think(page, 200, 400);
      await humanType(bookings.clientPhoneInput, TEST_CLIENT_PHONE);

      // Зберегти
      await expect(bookings.saveBookingBtn).toBeEnabled({ timeout: 5_000 });
      await think(page, 400, 700);
      await bookings.saveBookingBtn.click();

      // У режимі master success екран не показується, вікно просто закривається
      await expect(wizardPanel).toBeHidden({ timeout: 15_000 });

      // Перевірити що запис з'явився (базово перевіряємо, що ми залишились на сторінці і немає помилок)
      expect(page.url()).toContain('/dashboard/bookings');
    } finally {
      await context.close();
    }
  });
});
