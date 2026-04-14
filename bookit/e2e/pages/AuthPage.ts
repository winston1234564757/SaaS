import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object для /login та /register.
 * Bookit використовує виключно SMS OTP + Google OAuth —
 * email/password форми не існує.
 */
export class AuthPage {
  readonly page: Page;
  readonly continueButton: Locator;
  readonly roleClientCard: Locator;
  readonly roleMasterCard: Locator;
  readonly phoneInput: Locator;
  readonly sendSmsButton: Locator;
  readonly googleButton: Locator;
  readonly heading: Locator;
  readonly errorMessage: Locator;
  readonly otpBox0: Locator;

  constructor(page: Page) {
    this.page = page;
    this.continueButton = page.getByRole('button', { name: /Продовжити/i });
    this.roleClientCard = page.getByRole('button', { name: /Я Клієнт/i });
    this.roleMasterCard = page.getByRole('button', { name: /Я Майстер/i });
    this.phoneInput    = page.locator('input[type="tel"]');
    this.sendSmsButton = page.getByRole('button', { name: /Отримати код/i });
    this.googleButton  = page.getByRole('button', { name: /Google/i });
    this.heading       = page.locator('h1').first();
    // Error shown below phone input or in OTP step
    this.errorMessage  = page.locator('p.text-\\[\\#C05B5B\\]').first();
    this.otpBox0       = page.locator('input[inputmode="numeric"]').first();
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async goToPhoneStep() {
    await this.continueButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Enters phone and clicks "Отримати код". */
  async enterPhone(phone: string) {
    await this.phoneInput.fill(phone);
    await this.sendSmsButton.click();
  }
}
