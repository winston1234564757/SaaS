import { type Page, type Locator } from '@playwright/test';

export class MyLoyaltyPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly programCards: Locator;
  readonly progressBars: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading      = page.locator('h1').first();
    this.programCards = page.locator('[data-testid="loyalty-card"], [class*="loyalty-card"], .bento-card');
    this.progressBars = page.locator('[role="progressbar"], progress, [class*="progress"]');
    this.emptyState   = page.locator('[data-testid="empty-state"]').first()
      .or(page.getByText(/немає програм|no programs/i).first());
  }

  async goto() {
    await this.page.goto('/my/loyalty');
    await this.page.waitForLoadState('networkidle');
  }
}
