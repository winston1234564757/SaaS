import { type Page, type Locator } from '@playwright/test';

export class PublicBookingPage {
  readonly page: Page;
  readonly masterName: Locator;

  // Sticky CTA
  readonly bookBtn: Locator;

  // BookingFlow — service step
  readonly flowServiceHeader: Locator;
  readonly nextBtn: Locator;

  // BookingFlow — header (master name inside flow)
  readonly flowMasterName: Locator;

  constructor(page: Page) {
    this.page = page;

    // h1 on public master page
    this.masterName = page.locator('h1').first();

    // Sticky CTA — matched by unique class h-14 (flash-deal btn uses py-2, not h-14)
    this.bookBtn = page.locator('button.h-14');

    // Inside BookingFlow wizard panel (z-[60]): step header
    this.flowServiceHeader = page.locator('p.font-semibold').filter({ hasText: 'Обери послуги' }).first();

    // Inside BookingFlow: master name shown above step title
    this.flowMasterName = page.locator('p.text-xs').filter({ hasText: /\S/ }).first();

    // "Далі …" or "Обери послугу" CTA inside wizard — scoped to panel
    this.nextBtn = page.locator('div[class*="z-\\[60\\]"]').getByRole('button', { name: /^(Далі|Обери)/ }).last();
  }

  async goto(slug: string) {
    await this.page.goto(`/${slug}`);
    await this.page.waitForLoadState('networkidle');
  }

  async openBookingFlow() {
    // MyBottomNav (pointer-events-none container) has children that intercept coordinate clicks.
    // Use evaluate to click h-14 CTA directly via JS, bypassing overlay issues.
    await this.page.evaluate(() => {
      const btn = document.querySelector<HTMLButtonElement>('button.h-14');
      btn?.click();
    });
    await this.flowServiceHeader.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Returns the text content of the "Далі" / "Обери" button */
  async getNextBtnText(): Promise<string> {
    return (await this.nextBtn.textContent()) ?? '';
  }

  /**
   * Clicks the n-th service card inside BookingFlow (0-indexed).
   * Wizard panel is z-[60]; service buttons are w-full text-left inside.
   */
  serviceCard(index: number): Locator {
    return this.page
      .locator('div[class*="z-\\[60\\]"] button.w-full.text-left')
      .nth(index);
  }

  /** Clicks a service card by its visible name text */
  serviceCardByName(name: string): Locator {
    return this.page
      .locator('div[class*="z-\\[60\\]"] button.w-full.text-left')
      .filter({ hasText: name });
  }
}
