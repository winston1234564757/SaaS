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

    this.heading = page.locator('h1').first();

    this.upcomingTab = page.getByRole('button', { name: /^Майбутні/ });
    this.pastTab     = page.getByRole('button', { name: /^Минулі/ });

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
