import { type Page, type Locator } from '@playwright/test';

export class AnalyticsPage {
  readonly page: Page;
  readonly heading: Locator;

  // Вибір діапазону
  readonly dayBtn: Locator;
  readonly weekBtn: Locator;
  readonly monthBtn: Locator;
  readonly yearBtn: Locator;

  // Навігація
  readonly prevBtn: Locator;
  readonly nextBtn: Locator;

  // Графіки (canvas або svg)
  readonly charts: Locator;

  // Upgrade gate (для Starter)
  readonly upgradeGate: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1').first();

    this.dayBtn   = page.getByRole('button', { name: /^День$/i });
    this.weekBtn  = page.getByRole('button', { name: /^Тиждень$/i });
    this.monthBtn = page.getByRole('button', { name: /^Місяць$/i });
    this.yearBtn  = page.getByRole('button', { name: /^Рік$/i });

    this.prevBtn = page.locator('button[aria-label*="попередн"], button[aria-label*="prev"]').first()
      .or(page.getByRole('button', { name: /←/ }).first());
    this.nextBtn = page.locator('button[aria-label*="наступн"], button[aria-label*="next"]').first()
      .or(page.getByRole('button', { name: /→/ }).first());

    // Будь-який canvas або svg у зоні аналітики
    this.charts = page.locator('canvas, svg[class*="chart"], [data-testid*="chart"]').first();

    this.upgradeGate = page.locator('[data-testid="upgrade-gate"], [class*="upgrade"]').first();
  }

  async goto() {
    await this.page.goto('/dashboard/analytics');
    await this.page.waitForLoadState('networkidle');
  }
}
