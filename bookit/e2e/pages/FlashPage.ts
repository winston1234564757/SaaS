import { type Page, type Locator } from '@playwright/test';

export class FlashPage {
  readonly page: Page;
  readonly heading: Locator;

  // Starter tier: ліміт + upgrade
  readonly limitBar: Locator;
  readonly upgradeBtn: Locator;

  // Форма створення deal
  readonly createDealBtn: Locator;
  readonly serviceSelect: Locator;
  readonly discountInput: Locator;
  readonly launchBtn: Locator;

  // Список активних deals
  readonly dealCards: Locator;
  readonly cancelDealBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1').first();

    this.limitBar   = page.locator('[data-testid="limit-bar"], [class*="progress"], meter').first();
    this.upgradeBtn = page.getByRole('button', { name: /Upgrade|Покращити|Pro/i }).first();

    this.createDealBtn = page.getByRole('button', { name: /Створити|Новий deal|Флеш-акція/i }).first();
    this.serviceSelect = page.locator('select, [role="combobox"]').first();
    this.discountInput = page.locator('input[type="number"][name*="discount"], input[placeholder*="%"]').first();
    this.launchBtn     = page.getByRole('button', { name: /Запустити|Активувати/i }).first();

    this.dealCards     = page.locator('[data-testid="deal-card"], [class*="deal-card"]');
    this.cancelDealBtn = page.getByRole('button', { name: /Скасувати/i }).first();
  }

  async goto() {
    await this.page.goto('/dashboard/flash');
    await this.page.waitForLoadState('networkidle');
  }
}
