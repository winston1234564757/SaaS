/**
 * Phase 4 — Booking Flow
 *
 * Tests the public master page and the multi-step BookingFlow:
 *   1. Public page renders master name
 *   2. "Записатися" button opens BookingFlow (service step)
 *   3. "Далі" is disabled when no service selected
 *   4. Selecting a service enables "Далі" with correct label format
 *   5. Selecting two services sums the price
 *
 * Runs without auth (public page is accessible to everyone).
 * Requires E2E_MASTER_SLUG in .env.local pointing to a test master with ≥2 services.
 */
import { test, expect } from '@playwright/test';
import { PublicBookingPage } from '../pages/PublicBookingPage';

const SLUG = process.env.E2E_MASTER_SLUG;

test.describe('Публічна сторінка + Booking Flow', () => {
  test.skip(!SLUG, 'E2E_MASTER_SLUG не задано — пропускаємо тести публічної сторінки');

  test("публічна сторінка — рендериться ім'я майстра", async ({ page }) => {
    const pub = new PublicBookingPage(page);
    await pub.goto(SLUG!);

    await expect(pub.masterName).toBeVisible();
    const name = await pub.masterName.textContent();
    expect(name?.trim().length).toBeGreaterThan(0);
  });

  test('кнопка "Записатися" відкриває BookingFlow', async ({ page }) => {
    const pub = new PublicBookingPage(page);
    await pub.goto(SLUG!);

    await pub.openBookingFlow();

    // Step header should say "Обери послуги"
    await expect(pub.flowServiceHeader).toBeVisible();
  });

  test('"Далі" задизейблена без обраних послуг', async ({ page }) => {
    const pub = new PublicBookingPage(page);
    await pub.goto(SLUG!);
    await pub.openBookingFlow();

    // nextBtn should show "Обери послугу" and be disabled
    await expect(pub.nextBtn).toBeVisible();
    await expect(pub.nextBtn).toBeDisabled();
    await expect(pub.nextBtn).toHaveText('Обери послугу');
  });

  test('вибір однієї послуги — "Далі" активна, відображає ціну', async ({ page }) => {
    const pub = new PublicBookingPage(page);
    await pub.goto(SLUG!);
    await pub.openBookingFlow();

    // Click the first service card
    const firstCard = pub.serviceCard(0);
    await expect(firstCard).toBeVisible({ timeout: 8_000 });
    await firstCard.click();

    // nextBtn should become enabled and match "Далі · N посл. · X ₴"
    await expect(pub.nextBtn).toBeEnabled();
    const btnText = await pub.getNextBtnText();
    expect(btnText).toMatch(/^Далі · \d+ посл\. · [\d\s]+ ₴$/);
    expect(btnText).toContain('1 посл.');
  });

  test('вибір двох послуг — лічильник і сума оновлюються', async ({ page }) => {
    const pub = new PublicBookingPage(page);
    await pub.goto(SLUG!);
    await pub.openBookingFlow();

    // We need at least 2 service cards
    const cards = pub.page
      .locator('.fixed.bottom-0.left-0.right-0.z-50 button.rounded-2xl.border');
    const count = await cards.count();

    if (count < 2) {
      test.skip(); // not enough services on this test master
      return;
    }

    await cards.nth(0).click();
    const textAfterFirst = await pub.getNextBtnText();
    // Extract price from "Далі · 1 посл. · X ₴"
    const priceMatch1 = textAfterFirst.match(/([\d\s]+)\s*₴/);
    const price1 = priceMatch1 ? parseInt(priceMatch1[1].replace(/\s/g, '')) : 0;

    await cards.nth(1).click();
    const textAfterSecond = await pub.getNextBtnText();
    const priceMatch2 = textAfterSecond.match(/([\d\s]+)\s*₴/);
    const price2 = priceMatch2 ? parseInt(priceMatch2[1].replace(/\s/g, '')) : 0;

    expect(textAfterSecond).toContain('2 посл.');
    // Total price after selecting two services must be greater than first alone
    expect(price2).toBeGreaterThan(price1);
  });
});
