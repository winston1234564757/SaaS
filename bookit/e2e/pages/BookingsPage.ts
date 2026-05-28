import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for master's /dashboard/bookings page.
 */
export class BookingsPage {
  readonly page: Page;

  readonly heading: Locator;

  // Tab buttons
  readonly todayTab: Locator;
  readonly futureTab: Locator;
  readonly pastTab: Locator;
  readonly allTab: Locator;

  // Booking cards list
  readonly bookingCards: Locator;

  // Modal / sheet controls
  readonly modalOverlay: Locator;
  readonly confirmBtn: Locator;
  readonly completeBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.locator('h1').first();

    this.todayTab  = page.getByRole('button', { name: /^Сьогодні/ });
    this.futureTab = page.getByRole('button', { name: /^Майбутні/ });
    this.pastTab   = page.getByRole('button', { name: /^Минулі/ });
    this.allTab    = page.getByRole('button', { name: /^Всі/ });

    // Cards — each rendered by BookingCard component
    this.bookingCards = page.locator('[data-testid="booking-card"]');

    // Modal / sheet — framer-motion div, no [role="dialog"]; identified by unique rounded-t-3xl + heading
    this.modalOverlay = page.locator('div[class*="rounded-t-3xl"]').filter({ has: page.locator('h2', { hasText: 'Деталі запису' }) }).first();

    // Action buttons inside the modal sheet — scoped to avoid matching quick-action buttons in card list
    const sheet = page.locator('div[class*="rounded-t-3xl"]').filter({ has: page.locator('h2', { hasText: 'Деталі запису' }) });
    this.confirmBtn  = sheet.getByRole('button', { name: 'Підтвердити' }).first();
    this.completeBtn = sheet.getByRole('button', { name: 'Завершити' }).first();
    this.cancelBtn   = sheet.getByRole('button', { name: 'Скасувати' }).first();
  }

  async goto() {
    await this.page.goto('/dashboard/bookings');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate directly to the bookings page with a specific booking open via
   * the ?bookingId= query param (the app opens the detail sheet on load).
   */
  async openBookingById(bookingId: string) {
    // Navigate to bookings page first to let MasterProvider initialize auth
    await this.page.goto('/dashboard/bookings');
    // Wait for the page heading to confirm auth + page are ready
    await this.heading.waitFor({ state: 'visible', timeout: 15_000 });
    await this.page.waitForLoadState('networkidle');

    // Now navigate with the bookingId — auth is already loaded so useBookingById will work
    await this.page.goto(`/dashboard/bookings?bookingId=${bookingId}`);
    await this.modalOverlay.waitFor({ state: 'visible', timeout: 10_000 });
    // Wait for the booking content to load (spinner disappears)
    await this.page.locator('div[class*="rounded-t-3xl"]').locator('p.text-base.font-bold').waitFor({ state: 'visible', timeout: 20_000 });
  }
}
