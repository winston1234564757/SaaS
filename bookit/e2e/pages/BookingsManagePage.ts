import { type Page, type Locator } from '@playwright/test';

export class BookingsManagePage {
  readonly page: Page;
  readonly heading: Locator;

  // Режими перегляду — редизайн: Список / Таймлайн / Фокус (icon-кнопки з aria-label)
  readonly listViewBtn: Locator;
  readonly timelineViewBtn: Locator;
  readonly focusViewBtn: Locator;

  // Навігація по датах
  readonly prevBtn: Locator;
  readonly nextBtn: Locator;

  // Пошук
  readonly searchInput: Locator;

  // Кнопка "Новий запис" (ручне додавання → BookingWizard master-mode)
  readonly fab: Locator;

  // ManualBookingForm поля (BookingWizard client-details крок)
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

    // Redesign dropped bookings-view-day/week/month testids; modes are now
    // Список / Таймлайн / Фокус (aria-label icon buttons). Scope to the visible tree.
    this.listViewBtn     = page.getByRole('button', { name: 'Список' }).filter({ visible: true }).first();
    this.timelineViewBtn = page.getByRole('button', { name: 'Таймлайн' }).filter({ visible: true }).first();
    this.focusViewBtn    = page.getByRole('button', { name: 'Фокус' }).filter({ visible: true }).first();

    this.prevBtn = page.getByTestId('bookings-nav-prev');
    this.nextBtn = page.getByTestId('bookings-nav-next');

    // Search input — matched by placeholder (mobile + desktop trees), visible one wins.
    this.searchInput = page.getByPlaceholder(/Ім'я або телефон/).filter({ visible: true }).first();

    // Manual add — button labelled "Новий запис" opens the master BookingWizard.
    this.fab = page.getByRole('button', { name: 'Новий запис' }).filter({ visible: true }).first();

    // ManualBookingForm / Wizard (client-details step)
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
