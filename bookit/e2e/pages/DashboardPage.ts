import { type Page, type Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly servicesLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1').first();
    // Sidebar nav link to services
    this.servicesLink = page.getByRole('link', { name: /Послуги/i }).first();
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async goToServices() {
    await this.page.goto('/dashboard/services');
    await this.page.waitForLoadState('networkidle');
  }
}
