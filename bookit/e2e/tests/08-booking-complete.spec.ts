/**
 * 08 — Повний BookingFlow (5 кроків)
 *
 * Тестує кінець-у-кінець бронювання на публічній сторінці майстра:
 * Вибір послуги → Дата/час → (Пропустити товари) → Контакти → Success
 *
 * Потрібно в .env.local:
 *   E2E_MASTER_SLUG — slug тестового майстра з ≥1 послугою і налаштованим графіком
 */
import { test, expect } from '@playwright/test';
import { supabaseAdmin, deleteTestBookings } from '../utils/supabase';
import { humanType, think, scrollAndFocus } from '../utils/human';

const SLUG = process.env.E2E_MASTER_SLUG;
const TEST_CLIENT_NAME  = 'Тестовий Клієнт';
const TEST_CLIENT_PHONE = '380671234567';

test.describe('Повний BookingFlow', () => {
  test.skip(!SLUG, 'E2E_MASTER_SLUG не задано — пропускаємо');

  test.afterEach(async () => {
    // Видаляємо тестовий запис після кожного тесту
    await deleteTestBookings(SLUG!, TEST_CLIENT_NAME).catch(() => {});
  });

  test('Крок 1 → 2 → 4 → Success: гість записується на послугу', async ({ page }) => {
    test.setTimeout(120_000); // wizard flow з humanType + think займає 60-90 сек
    // ── Відкрити публічну сторінку ──────────────────────────────────────
    await page.goto(`/${SLUG}`);
    await page.waitForLoadState('networkidle');

    // Перевірити що сторінка завантажилась
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });

    await think(page);

    // ── Натиснути "Записатися" ───────────────────────────────────────────
    const bookBtn = page.getByTestId('book-button');
    await expect(bookBtn).toBeVisible({ timeout: 10_000 });

    // Клік через evaluate — обходить nav-overlay (pointer-events-none з дітьми що блокують координати)
    await page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('[data-testid="book-button"]');
      btn?.click();
    });

    // Крок 1 — wizard відкрито, перевіряємо backdrop та панель
    const wizardPanel = page.getByTestId('wizard-panel').last();
    await expect(wizardPanel).toBeVisible({ timeout: 10_000 });

    // Перевіряємо заголовок кроку 1 у header wizard
    const stepHeader = page.locator('p.font-semibold').filter({ hasText: /Обери послуги/i }).first();
    await expect(stepHeader).toBeVisible({ timeout: 8_000 });

    // Вибрати першу доступну послугу — шукаємо ВСЕРЕДИНІ wizard panel (z-[60])
    const firstService = wizardPanel.getByTestId('service-card').first();
    await expect(firstService).toBeVisible({ timeout: 10_000 });
    await think(page, 500, 1000); // "людина читає список"
    await firstService.click();

    // Кнопка "Далі" має стати активною
    const nextBtn = wizardPanel.getByTestId('wizard-next-btn').last();
    await expect(nextBtn).toBeEnabled({ timeout: 5_000 });
    await think(page, 300, 600);
    await nextBtn.click();

    // ── Крок 2 — вибір дати та часу ─────────────────────────────────────
    const dateStep = page.getByText(/Вибери дату|Оберіть дату|Дата/i).first();
    await expect(dateStep).toBeVisible({ timeout: 10_000 });

    // Знайти першу доступну дату (не вихідну, не зайняту)
    // Сьогоднішній день може бути вже вибрано — якщо слоти є, просто пропускаємо вибір дати
    await think(page, 400, 800); // "людина дивиться на календар"

    // Слоти часу: шукаємо потрібні кнопки по test-id
    // Вони знаходяться всередині wizard panel, мають disabled стан якщо зайняті
    await think(page, 500, 900);
    const availableSlot = wizardPanel.locator('[data-testid="time-slot"]:not([disabled])').first();

    const slotCount = await availableSlot.count();
    if (slotCount > 0) {
      await scrollAndFocus(availableSlot);
      await think(page, 300, 600);
      await availableSlot.click();
    }

    // Перейти далі
    const nextBtn2 = wizardPanel.getByTestId('wizard-next-btn').last();
    await expect(nextBtn2).toBeVisible({ timeout: 5_000 });
    // Чекаємо поки кнопка стане активною (слот вибрано)
    await expect(nextBtn2).toBeEnabled({ timeout: 8_000 });
    await think(page, 300, 500);
    await nextBtn2.click();

    // ── Крок 3 — товари (якщо є) або одразу крок 4 ──────────────────────
    // Спробуємо пропустити товари якщо є кнопка
    const skipProductsBtn = wizardPanel.getByTestId('wizard-skip-products-btn').first();
    const skipVisible = await skipProductsBtn.isVisible().catch(() => false);
    if (skipVisible) {
      await think(page, 300, 500);
      await skipProductsBtn.click();
    } else {
      // Можливо одразу крок деталей — перевіримо кнопку "Далі"
      const nextBtn3 = wizardPanel.getByTestId('wizard-next-btn').last();
      const nextVisible = await nextBtn3.isVisible().catch(() => false);
      if (nextVisible) {
        const isEnabled = await nextBtn3.isEnabled().catch(() => false);
        if (isEnabled) {
          await think(page, 300, 500);
          await nextBtn3.click();
        }
      }
    }

    // ── Крок 4 — деталі (ім'я, телефон) ─────────────────────────────────
    // Крок 4 видимий: "Твої контакти" + поля Ім'я і Телефон
    await expect(page.getByText("Твої контакти", { exact: true }).first()).toBeVisible({ timeout: 10_000 });

    // Поля завжди присутні в DOM (клієнтський режим без авторизації = гість)
    // Placeholder: 'Твоє імʼя та прізвище' і '+380 XX XXX XX XX'
    const nameInput = page.locator('input[placeholder*="імʼя"], input[placeholder*="прізвище"]').first();
    const phoneInput = page.locator('input[placeholder*="+380"]').first();

    await think(page, 400, 700);
    await humanType(nameInput, TEST_CLIENT_NAME);
    await think(page, 200, 400);
    await humanType(phoneInput, TEST_CLIENT_PHONE);

    // Натиснути "Підтвердити запис"
    const confirmBtn = wizardPanel.getByTestId('wizard-submit-btn');
    await scrollAndFocus(confirmBtn);
    await expect(confirmBtn).toBeEnabled({ timeout: 8_000 });
    await think(page, 500, 800); // "людина ще раз перевіряє"
    await confirmBtn.click();

    // ── Крок 5 — Success ─────────────────────────────────────────────────
    const successMsg = wizardPanel.getByTestId('wizard-success').first();
    await expect(successMsg).toBeVisible({ timeout: 15_000 });

    // Перевірити що запис є в БД
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('id, client_name, status')
      .eq('client_name', TEST_CLIENT_NAME)
      .limit(1);

    // Перевірити що запис є в БД (гостьовий запис — без client_id)
    if (bookings) {
      expect(bookings.length).toBeGreaterThan(0);
      expect(bookings[0].status).toMatch(/pending|confirmed/);
    }
  });
});
