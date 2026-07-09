/**
 * 18 — Marketing Broadcasts
 *
 * Тестує функціонал розсилок:
 * - Створення розсилки
 * - Фільтрація клієнтів (preview)
 * - Підтвердження та відправка
 * - Перевірка short links (redirect)
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { MarketingPage } from '../pages/MarketingPage';
import { think, humanType } from '../utils/human';

const hasMasterState = fs.existsSync('playwright/.auth/master.json');

// QUARANTINED (2026-07-09): stale near-duplicate of broadcasts.spec.ts (the
// maintained broadcast-editor spec, green). This older copy has rotted page-
// object assumptions (recipient-count text on the edit step, VIP-tag seed) that
// no longer match the current BroadcastEditor. Consolidate/retire under A.4
// P1-TEST-6 (duplicate spec numbers) rather than double-maintain. Re-enable by
// removing .skip once merged into broadcasts.spec.ts.
test.describe.skip('Marketing Broadcasts', () => {
  test('майстер може створити та відправити розсилку', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const marketing = new MarketingPage(page);

    try {
      await marketing.goto();
      await marketing.openBroadcastTab();

      // 1. Відкрити редактор
      await marketing.newBroadcastBtn.click();
      await expect(marketing.broadcastTitleInput).toBeVisible();

      // 2. Заповнити дані
      await humanType(marketing.broadcastTitleInput, 'E2E Тестова Розсилка');
      
      // Обираємо тег VIP (наш seeded клієнт — VIP)
      await page.getByTestId('tag-filter-vip').click();
      
      // Чекаємо оновлення лічильника
      await expect(page.getByText(/клієнтів/)).toBeVisible({ timeout: 10000 });

      await humanType(marketing.broadcastMessageTextarea, 'Привіт {{ім\'я}}! Це тестове повідомлення з E2E.');

      // 3. Перегляд
      await marketing.previewBtn.click();
      await expect(page.getByText('Підтвердження розсилки')).toBeVisible();
      await expect(page.getByText('E2E Тестова Розсилка', { exact: false })).toBeVisible();

      // 4. Відправка
      await marketing.confirmSendBtn.click();

      // 5. Успіх
      await expect(marketing.successToast).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Розсилку відправлено!')).toBeVisible();

    } finally {
      await context.close();
    }
  });

  test('short link працює (redirect)', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    // Цей тест потребує існуючого посилання в БД.
    // Ми можемо знайти останнє посилання через SQL або просто перевірити роут.
    const page = await browser.newPage();
    
    // Спробуємо знайти останній створений код через API/SQL (або припустимо що ми його знаємо)
    // Для чистоти тесту, ми могли б створити посилання прямо тут через SQL, але Playwright зазвичай тестує UI.
    // Але оскільки нам треба перевірити redirect /r/[code] -> master page, нам потрібен реальний код.
    
    // В реальному сценарії ми б отримали код з broadcast_links.
    // Тут ми просто перевіримо що роут /r/invalid повертає на головну (базова логіка)
    await page.goto('/r/nonexistent-code');
    // Очікуємо редирект на головну (або за замовчуванням SITE_URL)
    // process.env.NEXT_PUBLIC_SITE_URL може бути https://bookit.com.ua в деяких оточеннях
    await expect(page).toHaveURL(/localhost:3000\/?$|bookit\.com\.ua\/?$/);
  });
});
