import { type Page, type Locator } from '@playwright/test';

export class MyProfilePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly phoneText: Locator;
  readonly nameText: Locator;
  readonly logoutBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading   = page.locator('h1').first();
    this.phoneText = page.locator('[data-testid="profile-phone"], [class*="phone"]').first()
      .or(page.getByText(/\+380|\+38/i).first());
    this.nameText  = page.locator('[data-testid="profile-name"]').first()
      .or(page.locator('h2, h3').first());
    this.logoutBtn = page.getByRole('button', { name: /Вийти|Logout|Вихід/i }).first();
  }

  async goto() {
    await this.page.goto('/my/profile');
    await this.page.waitForLoadState('networkidle');
  }
}
