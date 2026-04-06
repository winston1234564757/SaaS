import { type Page, type Locator } from '@playwright/test';

export class MyMastersPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly masterCards: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading     = page.locator('h1').first();
    this.masterCards = page.locator('[data-testid="master-card"], [class*="master-card"], .bento-card').first();
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
