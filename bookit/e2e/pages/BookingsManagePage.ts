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

    this.dayViewBtn   = page.getByRole('button', { name: /^День$/i });
    this.weekViewBtn  = page.getByRole('button', { name: /^Тиждень$/i });
    this.monthViewBtn = page.getByRole('button', { name: /^Місяць$/i });

    this.prevBtn = page.getByRole('button', { name: /назад|←|prev/i }).first()
      .or(page.locator('button[aria-label*="попередн"]').first());
    this.nextBtn = page.getByRole('button', { name: /вперед|→|next/i }).first()
      .or(page.locator('button[aria-label*="наступн"]').first());

    this.searchInput = page.getByPlaceholder(/Пошук|Клієнт|ім.я/i).first();

    // FAB — фіксована кругла кнопка
    this.fab = page.locator('button.fixed.rounded-full')
      .or(page.locator('[data-testid="fab-add-booking"]'));

    // ManualBookingForm
    this.clientNameInput  = page.getByPlaceholder(/Ім.я клієнта|Ім'я/i).first();
    this.clientPhoneInput = page.getByPlaceholder(/Телефон|380/i).first();
    this.saveBookingBtn   = page.getByRole('button', { name: /Додати запис|Зберегти/i }).first();

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
