import { type Page, type Locator } from '@playwright/test';

export class ClientsPage {
  readonly page: Page;
  readonly heading: Locator;

  // Режими відображення
  readonly listViewBtn: Locator;
  readonly gridViewBtn: Locator;

  // Сортування
  readonly sortSelect: Locator;

  // Пошук
  readonly searchInput: Locator;

  // Картки клієнтів
  readonly clientCards: Locator;

  // Detail Sheet
  readonly detailSheet: Locator;
  readonly vipToggle: Locator;
  readonly closeSheetBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1').first();

    this.listViewBtn = page.getByRole('button', { name: /Список|list/i }).first()
      .or(page.locator('button[data-view="list"]').first());
    this.gridViewBtn = page.getByRole('button', { name: /Сітка|grid/i }).first()
      .or(page.locator('button[data-view="grid"]').first());

    this.sortSelect  = page.locator('select, [role="combobox"]').first();
    this.searchInput = page.getByPlaceholder(/Пошук|Ім.я|Клієнт/i).first();

    this.clientCards = page.locator('[data-testid="client-card"], .client-card').first()
      .or(page.locator('[class*="client"]').first());

    this.detailSheet  = page.locator('[role="dialog"], [data-testid="client-detail"]').first();
    this.vipToggle    = page.locator('[data-testid="vip-toggle"], input[type="checkbox"][name*="vip"]').first()
      .or(page.getByRole('switch', { name: /VIP/i }).first());
    this.closeSheetBtn = page.getByRole('button', { name: /Закрити|✕/i }).first();
  }

  async goto() {
    await this.page.goto('/dashboard/clients');
    await this.page.waitForLoadState('networkidle');
  }

  /** Клік на першого клієнта у списку. */
  async openFirstClient() {
    const firstClient = this.page.locator('[data-testid="client-card"], .bento-card').first()
      .or(this.page.locator('[class*="ClientCard"], [class*="client-card"]').first());
    await firstClient.click();
    await this.detailSheet.waitFor({ state: 'visible', timeout: 8_000 });
  }
}
