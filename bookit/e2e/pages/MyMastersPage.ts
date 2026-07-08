import { type Page, type Locator } from '@playwright/test';

export class MyMastersPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly masterCards: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    // /my/masters (C-DESK-01) renders TWO trees — mobile `lg:hidden` + desktop
    // `hidden lg:block` — each with an h1 "Мої майстри". Scope to the visible copy,
    // else `.first()` grabs the hidden (off-breakpoint) one.
    this.heading     = page.locator('h1').filter({ visible: true }).first();
    // C-DESK-01 desktop gallery cards (Featured + Gallery) carry data-testid="master-card".
    // Scope to the visible tree so the hidden off-breakpoint copy is skipped.
    this.masterCards = page.locator('[data-testid="master-card"]').filter({ visible: true }).first();
    this.emptyState  = page.locator('[data-testid="empty-state"], [class*="empty"]').first()
      .or(page.getByText(/немає майстрів|no masters/i).first());
  }

  async goto() {
    await this.page.goto('/my/masters');
    await this.page.waitForLoadState('networkidle');
  }

  async clickFirstMaster() {
    await this.masterCards.click();
  }
}
