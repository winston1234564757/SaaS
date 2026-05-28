import { type Page, type Locator } from '@playwright/test';

export class PricingPage {
  readonly page: Page;
  readonly heading: Locator;

  // Starter tier gate
  readonly trialGate: Locator;
  readonly trialProgressBar: Locator;

  // Pro: форма правила
  readonly addRuleBtn: Locator;
  readonly rulePercentInput: Locator;
  readonly saveRuleBtn: Locator;
  readonly ruleCards: Locator;
  readonly deleteRuleBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1').first();

    this.trialGate       = page.locator('[data-testid="trial-gate"], [class*="trial"], [class*="upgrade"]').first();
    this.trialProgressBar = page.locator('[role="progressbar"], progress, [class*="progress"]').first();

    this.addRuleBtn    = page.getByRole('button', { name: /Додати правило|Нове правило/i }).first();
    this.rulePercentInput = page.locator('input[type="number"][name*="percent"], input[placeholder*="%"]').first();
    this.saveRuleBtn   = page.getByRole('button', { name: /Зберегти|Додати/i }).first();
    this.ruleCards     = page.locator('[data-testid="rule-card"], [class*="rule-card"]');
    this.deleteRuleBtn = page.getByRole('button', { name: /Видалити|Delete/i }).first();
  }

  async goto() {
    await this.page.goto('/dashboard/pricing');
    await this.page.waitForLoadState('networkidle');
  }
}
