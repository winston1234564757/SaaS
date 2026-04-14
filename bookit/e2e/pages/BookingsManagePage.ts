import { type Page, type Locator } from '@playwright/test';

export class BookingsManagePage {
  readonly page: Page;
  readonly heading: Locator;

  // Режими перегляду
  readonly dayViewBtn: Locator;
  readonly weekViewBtn: Locator;
  readonly monthViewBtn: Locator;

  // Навігація по датах
  readonly prevBtn: Locator;
  readonly nextBtn: Locator;

  // Пошук
  readonly searchInput: Locator;

  // FAB — кнопка "+" для ручного запису
  readonly fab: Locator;

  // ManualBookingForm поля
  readonly clientNameInput: Locator;
  readonly clientPhoneInput: Locator;
  readonly saveBookingBtn: Locator;

  // Деталі запису (модалка)
  readonly bookingModal: Locator;
  readonly confirmBtn: Locator;
  readonly completeBtn: Locator;
  readonly cancelBookingBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1').first();

    this.dayViewBtn   = page.getByTestId('bookings-view-day');
    this.weekViewBtn  = page.getByTestId('bookings-view-week');
    this.monthViewBtn = page.getByTestId('bookings-view-month');

    this.prevBtn = page.getByTestId('bookings-nav-prev');
    this.nextBtn = page.getByTestId('bookings-nav-next');

    this.searchInput = page.getByTestId('bookings-search-input');

    // FAB — фіксована кругла кнопка
    this.fab = page.getByTestId('fab-add-booking');

    // ManualBookingForm / Wizard
    this.clientNameInput  = page.getByTestId('wizard-name-input');
    this.clientPhoneInput = page.getByTestId('wizard-phone-input');
    this.saveBookingBtn   = page.getByTestId('wizard-submit-btn');

    // Деталі
    this.bookingModal     = page.locator('[role="dialog"]').first();
    this.confirmBtn       = page.getByRole('button', { name: /Підтвердити/i }).first();
    this.completeBtn      = page.getByRole('button', { name: /Завершити/i }).first();
    this.cancelBookingBtn = page.getByRole('button', { name: /Скасувати запис/i }).first();
  }

  async goto() {
    await this.page.goto('/dashboard/bookings');
    await this.page.waitForLoadState('networkidle');
  }

  /** Відкрити запис за ID через URL. */
  async openBookingById(bookingId: string) {
    await this.page.goto(`/dashboard/bookings?booking=${bookingId}`);
    await this.page.waitForLoadState('networkidle');
    await this.bookingModal.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {
      // Fallback: знайти картку в списку і клікнути
    });
  }
}
