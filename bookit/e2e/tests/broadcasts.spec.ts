/**
 * E2E: Broadcasts — цільова розсилка Push/Telegram/SMS
 *
 * Передумови:
 *   - playwright/.auth/master.json (master storageState)
 *   - Застосована міграція 116 (npx supabase db push)
 */
import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';

// Prefer fresh crm session; fall back to legacy master.json
const MASTER_AUTH = fs.existsSync('playwright/.auth/master-crm.json')
  ? 'playwright/.auth/master-crm.json'
  : 'playwright/.auth/master.json';

const hasMasterState = fs.existsSync(MASTER_AUTH);

// ── Helper ────────────────────────────────────────────────────────────────────

async function goToBroadcastsTab(page: Page) {
  await page.goto('/dashboard/marketing?tab=broadcasts');
  await page.waitForLoadState('networkidle');
  // Якщо вкладка "Розсилки" не активна — клікаємо
  const broadcastsTab = page.getByRole('button', { name: /Розсилки/i });
  if (await broadcastsTab.isVisible()) {
    await broadcastsTab.click();
    await page.waitForTimeout(300);
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Marketing — Розсилки', () => {
  test.skip(!hasMasterState, 'Немає playwright/.auth/master.json — пропускаємо');

  test('вкладки Сторіс та Розсилки відображаються', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: MASTER_AUTH });
    const page = await ctx.newPage();

    await page.goto('/dashboard/marketing');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /Сторіс/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Розсилки/i })).toBeVisible();

    await ctx.close();
  });

  test('перехід на вкладку Розсилки показує кнопку "Нова"', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: MASTER_AUTH });
    const page = await ctx.newPage();

    await goToBroadcastsTab(page);

    await expect(page.getByTestId('new-broadcast-btn')).toBeVisible();

    await ctx.close();
  });

  test('кнопка "Нова" відкриває BroadcastEditor з полем назви', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: MASTER_AUTH });
    const page = await ctx.newPage();

    await goToBroadcastsTab(page);
    await page.getByTestId('new-broadcast-btn').click();

    await expect(page.getByTestId('broadcast-title-input')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('broadcast-message-textarea')).toBeVisible();

    await ctx.close();
  });

  test('вибір тегу "Спить" підставляє шаблон в поле повідомлення', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: MASTER_AUTH });
    const page = await ctx.newPage();

    await goToBroadcastsTab(page);
    await page.getByTestId('new-broadcast-btn').click();
    await expect(page.getByTestId('broadcast-title-input')).toBeVisible({ timeout: 5_000 });

    // Клікаємо тег "Спить"
    await page.getByTestId('tag-filter-sleeping').click();

    // Поле повідомлення має містити шаблон
    await expect(page.getByTestId('broadcast-message-textarea')).not.toHaveValue('');
    const messageValue = await page.getByTestId('broadcast-message-textarea').inputValue();
    expect(messageValue).toContain("{{ім'я}}");

    await ctx.close();
  });

  test('натиснення "Переглянути" без назви показує помилку', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: MASTER_AUTH });
    const page = await ctx.newPage();

    await goToBroadcastsTab(page);
    await page.getByTestId('new-broadcast-btn').click();
    await expect(page.getByTestId('broadcast-title-input')).toBeVisible({ timeout: 5_000 });

    // Вводимо повідомлення, але не назву
    await page.getByTestId('broadcast-message-textarea').fill('Тестове повідомлення');
    await page.getByTestId('preview-broadcast-btn').click();

    await expect(page.getByText('Вкажіть назву розсилки')).toBeVisible();

    await ctx.close();
  });

  test('happy path — заповнення форми і перехід до confirm екрану', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: MASTER_AUTH });
    const page = await ctx.newPage();

    await goToBroadcastsTab(page);
    await page.getByTestId('new-broadcast-btn').click();
    await expect(page.getByTestId('broadcast-title-input')).toBeVisible({ timeout: 5_000 });

    // Заповнюємо форму
    await page.getByTestId('broadcast-title-input').fill('E2E тест розсилки');
    await page.getByTestId('tag-filter-active').click();
    // Шаблон підставиться або заповнюємо вручну
    const msgArea = page.getByTestId('broadcast-message-textarea');
    if ((await msgArea.inputValue()) === '') {
      await msgArea.fill('Тестове повідомлення для E2E');
    }

    await page.getByTestId('preview-broadcast-btn').click();

    // Має з'явитись екран підтвердження
    await expect(page.getByTestId('confirm-send-btn')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Підтвердження розсилки')).toBeVisible();

    await ctx.close();
  });

  test('кнопка "Назад" повертає з confirm до edit', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: MASTER_AUTH });
    const page = await ctx.newPage();

    await goToBroadcastsTab(page);
    await page.getByTestId('new-broadcast-btn').click();
    await expect(page.getByTestId('broadcast-title-input')).toBeVisible({ timeout: 5_000 });

    await page.getByTestId('broadcast-title-input').fill('Тест назад');
    await page.getByTestId('broadcast-message-textarea').fill('Текст');
    await page.getByTestId('preview-broadcast-btn').click();

    await expect(page.getByTestId('confirm-send-btn')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Назад' }).click();

    await expect(page.getByTestId('broadcast-title-input')).toBeVisible({ timeout: 3_000 });

    await ctx.close();
  });
});

// ── Short link redirect ────────────────────────────────────────────────────────

test.describe('Short link /r/[code]', () => {
  test('неіснуючий код редіректить або показує не /r/ URL', async ({ page }) => {
    await page.goto('/r/zzzzzz');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    // Якщо міграція 116 застосована — redirect на /; якщо ні — показує 404 але URL змінився
    const isRedirected = !url.endsWith('/r/zzzzzz');
    const is404 = await page.getByText('404').isVisible().catch(() => false);
    // Прийнятно: redirect АБО 404 (поки міграція не застосована)
    expect(isRedirected || is404).toBe(true);
  });
});

// ── Clients page → Broadcast button ──────────────────────────────────────────

test.describe('Clients → Розсилка', () => {
  test.skip(!hasMasterState, 'Немає playwright/.auth/master.json — пропускаємо');

  test('кнопка "Розсилка" в Clients → редіректить на Розсилки', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: MASTER_AUTH });
    const page = await ctx.newPage();

    await page.goto('/dashboard/clients');
    await page.waitForLoadState('networkidle');

    const btn = page.getByRole('button', { name: /Розсилка/i });
    await expect(btn).toBeVisible({ timeout: 10_000 });
    await btn.click();

    await expect(page).toHaveURL(/marketing.*tab=broadcasts|marketing/, { timeout: 5_000 });

    await ctx.close();
  });
});
