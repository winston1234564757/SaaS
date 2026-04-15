import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the public master page /{slug}.
 *
 * Covers:
 *  - Profile card (h1 with master name)
 *  - Service cards + "Записатися" buttons
 *  - BookingFlow sheet (date strip, slot grid, booking summary)
 *  - Dynamic pricing badge
 *  - Smart Slots "Рекомендовано" star badge
 *  - Loyalty discount banner
 */
export class BookingWidgetPage {
  readonly page: Page;

  // ── Profile ────────────────────────────────────────────────────────────────
  readonly masterName: Locator;

  // ── Service list ───────────────────────────────────────────────────────────
  readonly serviceCards: Locator;

  // First "Записатися" button (opens BookingFlow)
  readonly firstBookButton: Locator;

  // ── BookingFlow sheet (opens after clicking a service) ────────────────────
  readonly bookingSheet: Locator;

  // Date strip — horizontal scroll of date buttons
  readonly dateStrip: Locator;

  // Individual date cells in the strip
  readonly dateCells: Locator;

  // Slot grid — available time slot buttons
  readonly slotGrid: Locator;
  readonly slotButtons: Locator;

  // "Рекомендовано" star badge shown on Smart-Slot-scored morning slots
  readonly recommendedBadge: Locator;

  // Dynamic pricing badge — "Пік +20%" / "Остання хвилина -15%" etc.
  readonly dynamicPricingBadge: Locator;

  // Loyalty discount banner in booking summary
  readonly loyaltyBanner: Locator;

  // Booking summary (step after slot selection)
  readonly bookingSummary: Locator;

  // "Підтвердити запис" / confirm button
  readonly confirmButton: Locator;

  // "Далі" / Next button in wizard steps
  readonly nextButton: Locator;

  // Client info form inputs (if visible — for unauthenticated flow)
  readonly clientNameInput: Locator;
  readonly clientPhoneInput: Locator;

  constructor(page: Page) {
    this.page = page;

    // Profile card h1
    this.masterName = page.locator('h1').first();

    // Service cards — each service is a card with a booking button
    this.serviceCards = page.locator('[class*="bento-card"], [class*="rounded-"]').filter({
      has: page.getByRole('button', { name: /Записатися/i }),
    });

    // First booking trigger button
    this.firstBookButton = page.getByRole('button', { name: /Записатися/i }).first();

    // BookingFlow appears as a bottom sheet / drawer
    this.bookingSheet = page
      .locator('[role="dialog"], [data-radix-dialog-content], [class*="sheet"], [class*="Sheet"]')
      .first();

    // Date strip inside the booking sheet
    this.dateStrip = page.locator('[class*="date-strip"], [class*="DateStrip"]').or(
      page.locator('div').filter({ has: page.locator('button[class*="date"], button[class*="Date"]') }).first(),
    );

    // Individual date cells (day buttons in the strip)
    this.dateCells = page.locator('button[class*="date"], button[class*="Date"]').or(
      // Fallback: buttons containing a 2-digit day number and abbreviated day name
      page.locator('button').filter({ hasText: /^(пн|вт|ср|чт|пт|сб|нд)/i }),
    );

    // Slot grid — time slot buttons
    this.slotGrid   = page.locator('[class*="slot-grid"], [class*="SlotGrid"]').or(
      page.locator('[class*="slot"], [class*="Slot"]').first(),
    );
    this.slotButtons = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ });

    // Star badge for Smart Slot recommendations
    // The app renders a star icon (Lucide Star) alongside "Рекомендовано" text or a badge
    this.recommendedBadge = page
      .locator('button')
      .filter({ has: page.locator('svg[class*="star"], svg[class*="Star"]') })
      .or(page.locator('[class*="recommend"], [aria-label*="рекоменд"]').first());

    // Dynamic pricing badge — rendered near the price in the booking summary or slot
    this.dynamicPricingBadge = page
      .locator('span, div, p')
      .filter({ hasText: /Пік|Остання хвилина|Рання бронь|Тихий час|\+\d+%|-\d+%/ })
      .first();

    // Loyalty banner — shown in booking summary when client qualifies
    this.loyaltyBanner = page
      .locator('div, span, p')
      .filter({ hasText: /лояльність|знижка|Знижка|Loyalty|бонус/i })
      .first();

    // Summary card / checkout area
    this.bookingSummary = page
      .locator('[class*="summary"], [class*="Summary"], [class*="checkout"], [class*="Checkout"]')
      .or(page.locator('div').filter({ hasText: /Підсумок|Разом|Всього/i }).first());

    // Confirm booking button
    this.confirmButton = page.getByRole('button', { name: /Підтвердити|Записатись|Забронювати/i }).first();

    // Next button
    this.nextButton = page.getByTestId('wizard-next-btn');

    // Client info form
    this.clientNameInput  = page.getByPlaceholder(/Ваше ім.я|Імʼя|Ім'я|ПІБ/i).first();
    this.clientPhoneInput = page.locator('input[type="tel"]').first();
  }

  /** Navigate to a master's public page by slug. */
  async goto(slug: string) {
    await this.page.goto(`/${slug}`);
    await this.page.waitForLoadState('networkidle');
  }

  /** Click the first service's "Записатися" button to open BookingFlow. */
  async openBookingFlow() {
    await this.firstBookButton.click();
    // Wait for the sheet/modal to appear
    await this.page.waitForLoadState('networkidle');
  }

  /** Click the service with a specific name. */
  async openBookingForService(serviceName: string) {
    const serviceCard = this.page.locator('div, article, section').filter({ hasText: serviceName }).first();
    const btn = serviceCard.getByRole('button', { name: /Записатися/i });
    await btn.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select a slot button that contains the given time string (e.g. "18:00").
   * Returns the locator of the slot that was clicked.
   */
  async selectSlot(time: string, options?: { force?: boolean }): Promise<Locator> {
    const slot = this.page.locator('button').filter({ hasText: new RegExp(`^${time}`) }).first();
    await slot.waitFor({ state: 'visible', timeout: 10_000 });
    await slot.click(options);
    return slot;
  }

  /**
   * Wait for any slot button to be visible in the grid.
   */
  async waitForSlots() {
    await this.slotButtons.first().waitFor({ state: 'visible', timeout: 15_000 });
  }

  /**
   * Click a date cell by its ISO date string (e.g. "2026-05-01").
   * Uses the stable ID assigned to the date button.
   */
  async selectDateByISO(isoDate: string) {
    const selector = `#day-${isoDate}`;
    const dayBtn = this.page.locator(selector);
    
    // Wait for the specific date to appear in the DOM (handles slow hydration/fetching)
    try {
      await dayBtn.waitFor({ state: 'attached', timeout: 10_000 });
    } catch (e) {
      // Diagnostic: Log all available date IDs if the target is missing
      const allDays = await this.page.evaluate(() => {
        return Array.from(document.querySelectorAll('[id^="day-"]')).map(el => el.id);
      });
      const serverNow = await this.page.locator('#e2e-debug-now').getAttribute('data-now').catch(() => 'unknown');
      
      // Check for loading or error states
      const isLoading = await this.page.locator('.animate-spin').isVisible().catch(() => false);
      const isError   = await this.page.getByText('Не вдалося завантажити розклад').isVisible().catch(() => false);

      console.error(`[E2E Error] Could not find date button ${selector}. Available date IDs:`, allDays);
      console.error(`[E2E Error] Server-side getNow() reported: ${serverNow}`);
      if (isLoading) console.error(`[E2E Error] Component is stuck in LOADING state.`);
      if (isError)   console.error(`[E2E Error] Component is in ERROR state.`);

      throw e;
    }
    
    await dayBtn.scrollIntoViewIfNeeded();
    await dayBtn.click({ force: true });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click a date cell by its date number (e.g. 15 for 15th of the month).
   */
  async selectDateByDay(day: number) {
    const cell = this.page.locator('button').filter({ hasText: new RegExp(`^${day}$`) }).first();
    await cell.scrollIntoViewIfNeeded();
    await cell.waitFor({ state: 'visible', timeout: 5_000 });
    await cell.click();
    await this.page.waitForLoadState('networkidle');
  }
}
