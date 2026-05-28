import { type Page, type Locator } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly heading: Locator;

  // Поля профілю
  readonly nameInput: Locator;
  readonly slugInput: Locator;
  readonly bioTextarea: Locator;
  readonly instagramInput: Locator;
  readonly telegramInput: Locator;
  readonly slugStatus: Locator;

  // Кнопки збереження
  readonly saveProfileBtn: Locator;
  readonly saveScheduleBtn: Locator;

  // Графік — перемикач для понеділка
  readonly mondayToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1').first();

    this.nameInput      = page.getByTestId('settings-name-input');
    this.slugInput      = page.getByTestId('settings-slug-input');
    this.bioTextarea    = page.getByTestId('settings-bio-textarea');
    this.instagramInput = page.getByTestId('settings-instagram-input');
    this.telegramInput  = page.getByTestId('settings-telegram-input');
    this.slugStatus     = page.locator('[data-testid="slug-status"], .slug-status, [class*="slug"]').first();

    this.saveProfileBtn  = page.getByTestId('settings-save-profile-btn');
    this.saveScheduleBtn = page.getByRole('button', { name: /Зберегти графік|Зберегти розклад/i }).first();

    // Понеділок — перший день у списку
    this.mondayToggle = page.getByTestId('settings-day-toggle-mon');
  }

  async goto() {
    await this.page.goto('/dashboard/settings');
    await this.page.waitForLoadState('networkidle');
  }
}
