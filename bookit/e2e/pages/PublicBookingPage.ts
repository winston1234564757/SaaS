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

    // Sticky "Записатися" button at the bottom
    this.bookBtn = page.getByRole('button', { name: 'Записатися' });

    // Inside BookingFlow: step header text "Обери послуги" (step = 'service')
    this.flowServiceHeader = page.locator('p').filter({ hasText: 'Обери послуги' });

    // Inside BookingFlow: master name shown above step title
    this.flowMasterName = page.locator('p.text-xs').filter({ hasText: /\S/ }).first();

    // "Далі …" or "Обери послугу" — the primary CTA inside the flow
    // We locate it by role=button with text that starts with Далі or Обери послугу
    this.nextBtn = page.getByRole('button', { name: /^(Далі|Обери послугу)/ });
  }

  async goto(slug: string) {
    await this.page.goto(`/${slug}`);
    await this.page.waitForLoadState('networkidle');
  }

  async openBookingFlow() {
    await this.bookBtn.click();
    await this.flowServiceHeader.waitFor({ state: 'visible', timeout: 8_000 });
  }

  /** Returns the text content of the "Далі" / "Обери послугу" button */
  async getNextBtnText(): Promise<string> {
    return (await this.nextBtn.textContent()) ?? '';
  }

  /**
   * Clicks the n-th service card inside BookingFlow (0-indexed).
   * Service cards are <button> elements that contain the service name.
   */
  serviceCard(index: number): Locator {
    // Service step: buttons inside the scrollable content area of the flow sheet
    // They have class "flex items-center gap-3 p-4 rounded-2xl border text-left"
    return this.page
      .locator('.fixed.bottom-0.left-0.right-0.z-50 button.rounded-2xl.border')
      .nth(index);
  }

  /** Clicks a service card by its visible name text */
  serviceCardByName(name: string): Locator {
    return this.page
      .locator('.fixed.bottom-0.left-0.right-0.z-50 button')
      .filter({ hasText: name });
  }
}
