import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the client-facing /my/bookings page.
 */
export class ClientBookingsPage {
  readonly page: Page;

  readonly heading: Locator;

  // Tab buttons
  readonly upcomingTab: Locator;
  readonly pastTab: Locator;

  // Booking cards list
  readonly bookingCards: Locator;

  // First visible cancel button on any booking card
  readonly cancelBtn: Locator;

  // Review flow
  readonly reviewBtn: Locator;
  readonly ratingStars: Locator;
  readonly reviewTextarea: Locator;
  readonly submitReviewBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // /my/bookings (C-DESK-01) renders separate mobile + `hidden lg:block` desktop
    // trees, each with an h1. Scope to the visible copy, else `.first()` grabs the
    // hidden (off-breakpoint) one.
    this.heading = page.locator('h1').filter({ visible: true }).first();

    // Section labels differ per tree: mobile "Майбутні записи"/"Минулі записи",
    // C-DESK-01 desktop DeskSectionHeader "Майбутні"/"Раніше". Match either, visible only.
    this.upcomingTab = page.getByText(/Майбутні/).filter({ visible: true }).first();
    this.pastTab     = page.getByText(/Минулі|Раніше/).filter({ visible: true }).first();

    this.bookingCards = page.locator('[data-testid="booking-card"]');

    // Cancel button — first one visible on the page
    this.cancelBtn = page.getByRole('button', { name: /Скасувати/ }).first();

    // Review modal triggers and fields
    this.reviewBtn      = page.getByRole('button', { name: /Залишити відгук/ }).first();
    // 5 star buttons inside the review dialog
    this.ratingStars    = page.locator('[role="dialog"] button[aria-label]').filter({ hasText: '' });
    this.reviewTextarea = page.locator('[role="dialog"] textarea').first();
    this.submitReviewBtn = page.locator('[role="dialog"]').getByRole('button', { name: /Відправити|Надіслати|Зберегти/ });
  }

  async goto() {
    await this.page.goto('/my/bookings');
    await this.page.waitForLoadState('networkidle');
  }
}
