import { type Page, type Locator } from '@playwright/test';

export class ExplorePage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1').first();
  }

  async goto() {
    await this.page.goto('/explore');
    await this.page.waitForLoadState('networkidle');
  }
}
