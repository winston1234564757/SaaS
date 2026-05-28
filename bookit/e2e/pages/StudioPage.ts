import { type Page, type Locator } from '@playwright/test';

export class StudioPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly badge: Locator;
  readonly waitlistButton: Locator;
  readonly featuresList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1').filter({ hasText: 'Студія' });
    this.badge = page.getByText('У розробці');
    this.waitlistButton = page.getByRole('button', { name: /Записатися у Waitlist/i });
    this.featuresList = page.getByText('Команда майстрів');
  }

  async goto() {
    await this.page.goto('/dashboard/studio');
    await this.page.waitForLoadState('networkidle');
  }
}
