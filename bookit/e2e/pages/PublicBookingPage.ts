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

  // WizardHero price metric (dominant sum lives in the hero band, not the button)
  readonly heroMetric: Locator;

  constructor(page: Page) {
    this.page = page;

    // h1 on public master page
    this.masterName = page.locator('h1').first();

    // Sticky CTA — matched by unique class h-14 (flash-deal btn uses py-2, not h-14)
    this.bookBtn = page.locator('button.h-14');

    // Inside BookingFlow wizard panel (z-[60]): step header — WizardHero renders
    // the step title as an <h2 class="heading-serif">, not a <p class="font-semibold">.
    this.flowServiceHeader = page.getByRole('heading', { name: 'Обери послуги' }).first();

    // Inside BookingFlow: master name shown above step title
    this.flowMasterName = page.locator('p.text-xs').filter({ hasText: /\S/ }).first();

    // Wizard "Далі" CTA — stable data-testid. NOTE: in the redesigned wizard this
    // button renders ONLY once a service is selected (no disabled placeholder).
    this.nextBtn = page.locator('[data-testid="wizard-next-btn"]');

    // Price/count now live in the WizardHero band (.editorial-cover) — scope to it,
    // since service cards also use .metric-value for their prices/discounts.
    this.heroMetric = page.locator('.editorial-cover p.metric-value').first();
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
    return this.page.locator('[data-testid="service-card"]').nth(index);
  }

  /** Clicks a service card by its visible name text */
  serviceCardByName(name: string): Locator {
    return this.page.locator('[data-testid="service-card"]').filter({ hasText: name });
  }
}
