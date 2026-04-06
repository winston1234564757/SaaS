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

    this.nameInput      = page.getByPlaceholder(/Ваше ім.я|Олена|ім'я/i).first();
    this.slugInput      = page.locator('input[name="slug"], input[placeholder*="slug"], input[placeholder*="посилання"]').first();
    this.bioTextarea    = page.locator('textarea').first();
    this.instagramInput = page.locator('input[name="instagram_url"], input[placeholder*="instagram"]').first();
    this.telegramInput  = page.locator('input[name="telegram_url"], input[placeholder*="telegram"]').first();
    this.slugStatus     = page.locator('[data-testid="slug-status"], .slug-status, [class*="slug"]').first();

    this.saveProfileBtn  = page.getByRole('button', { name: /Зберегти профіль|Зберегти зміни|Оновити/i }).first();
    this.saveScheduleBtn = page.getByRole('button', { name: /Зберегти графік|Зберегти розклад/i }).first();

    // Понеділок — перший день у списку
    this.mondayToggle = page.locator('[data-day="1"], [data-day="monday"]').first()
      .or(page.locator('label').filter({ hasText: /Понеділок|Пн/i }).first());
  }

  async goto() {
    await this.page.goto('/dashboard/settings');
    await this.page.waitForLoadState('networkidle');
  }
}
