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
    // Desktop nav shows only login ("Увійти", hidden sm:block) + the register CTA
    // ("Спробувати безкоштовно" on ≥sm). Explore ("Майстрам") lives only in the
    // mobile hamburger (NAV_LINKS) — opened via openMobileMenu().
    this.navLoginLink = page.getByRole('link', { name: 'Увійти', exact: true }).first();
    this.navRegisterLink = page.getByRole('link', { name: 'Спробувати безкоштовно' }).first();
    this.navExploreLink = page.getByRole('link', { name: 'Майстрам' }).first();
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Opens the mobile hamburger overlay (only place explore/pricing/FAQ links live). */
  async openMobileMenu() {
    await this.page.getByRole('button', { name: 'Відкрити навігацію' }).click();
  }
}
