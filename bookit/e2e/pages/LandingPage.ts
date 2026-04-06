import { type Page, type Locator } from '@playwright/test';

export class LandingPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly navLoginLink: Locator;
  readonly navRegisterLink: Locator;
  readonly navExploreLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1').first();
    this.navLoginLink = page.getByRole('link', { name: 'Увійти' });
    this.navRegisterLink = page.getByRole('link', { name: 'Спробувати', exact: true }).first();
    this.navExploreLink = page.getByRole('link', { name: 'Майстри' });
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }
}
