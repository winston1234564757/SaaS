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

const SLUG = process.env.E2E_MASTER_SLUG || 'e2e-timetravel-master';

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

  test('"Далі" не показується без обраних послуг', async ({ page }) => {
    const pub = new PublicBookingPage(page);
    await pub.goto(SLUG!);
    await pub.openBookingFlow();

    // Redesigned wizard: the "Далі" CTA appears only after a service is picked
    // (no disabled placeholder button). A guiding hint is shown instead.
    await expect(pub.nextBtn).toHaveCount(0);
  });

  test('вибір однієї послуги — "Далі" зʼявляється, сума в hero', async ({ page }) => {
    const pub = new PublicBookingPage(page);
    await pub.goto(SLUG!);
    await pub.openBookingFlow();

    const firstCard = pub.serviceCard(0);
    await expect(firstCard).toBeVisible({ timeout: 8_000 });
    await firstCard.click();

    // CTA appears and is enabled; the dominant sum lives in the WizardHero band.
    await expect(pub.nextBtn).toBeVisible();
    await expect(pub.nextBtn).toBeEnabled();
    await expect(pub.nextBtn).toContainText('Далі');
    await expect(pub.heroMetric).toContainText('₴');
  });

  test('вибір двох послуг — сума в hero оновлюється', async ({ page }) => {
    const pub = new PublicBookingPage(page);
    await pub.goto(SLUG!);
    await pub.openBookingFlow();

    const cards = pub.page.locator('[data-testid="service-card"]');
    const count = await cards.count();
    if (count < 2) {
      test.skip(); // not enough services on this test master
      return;
    }

    const parsePrice = (s: string) => parseInt((s.match(/([\d\s]+)\s*₴/)?.[1] ?? '0').replace(/\s/g, ''), 10);

    await cards.nth(0).click();
    await expect(pub.heroMetric).toContainText('₴');
    const price1 = parsePrice((await pub.heroMetric.textContent()) ?? '');

    await cards.nth(1).click();
    // Sum must grow once a second service is added.
    await expect
      .poll(async () => parsePrice((await pub.heroMetric.textContent()) ?? ''))
      .toBeGreaterThan(price1);
  });
});
