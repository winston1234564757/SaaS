import { type Page, type Locator } from '@playwright/test';

export class ServicesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly servicesTab: Locator;
  readonly productsTab: Locator;
  readonly fab: Locator;

  // Service form (BottomSheet)
  readonly serviceSheetTitle: Locator;
  readonly serviceNameInput: Locator;
  readonly servicePriceInput: Locator;
  readonly serviceSubmitBtn: Locator;

  // Product form (BottomSheet)
  readonly productSheetTitle: Locator;
  readonly productNameInput: Locator;
  readonly productPriceInput: Locator;
  readonly productSubmitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1').first();

    // Tabs — use text match since buttons contain icon + text + badge
    this.servicesTab = page.locator('button').filter({ hasText: /^Послуги/ });
    this.productsTab = page.locator('button').filter({ hasText: /^Товари/ });

    // FAB — circular fixed button in bottom-right
    this.fab = page.locator('button.fixed.rounded-full');

    // Service form fields — scoped by unique placeholder
    this.serviceSheetTitle = page.locator('h3').filter({ hasText: 'Нова послуга' });
    this.serviceNameInput = page.getByPlaceholder('Наприклад: Класичний манікюр');
    this.servicePriceInput = page.locator('input[type="number"]').first();
    this.serviceSubmitBtn = page.getByRole('button', { name: 'Додати послугу' });

    // Product form fields
    this.productSheetTitle = page.locator('h3').filter({ hasText: 'Новий товар' });
    this.productNameInput = page.getByPlaceholder('Наприклад: Гель-лак OPI');
    this.productPriceInput = page.locator('input[type="number"]').first();
    this.productSubmitBtn = page.getByRole('button', { name: 'Додати товар' });
  }

  async goto() {
    // Listen for master_profiles BEFORE navigating — confirms MasterContext loaded
    const masterProfileReady = this.page.waitForResponse(
      res => res.url().includes('/rest/v1/master_profiles'),
      { timeout: 15_000 }
    ).catch(() => {
      // If it never fires, MasterContext likely couldn't load (missing master_profiles row)
      console.warn('[ServicesPage] master_profiles response not received — check DB setup');
    });

    await this.page.goto('/dashboard/services');
    await masterProfileReady;
    await this.page.waitForLoadState('networkidle');
  }

  async openServiceForm() {
    // Ensure services tab is active (default), then click FAB
    await this.servicesTab.click();
    await this.fab.click();
    await this.serviceSheetTitle.waitFor({ state: 'visible' });
  }

  async addService(name: string, price: number) {
    await this.openServiceForm();
    await this.serviceNameInput.fill(name);
    await this.servicePriceInput.fill(String(price));
    await this.serviceSubmitBtn.click();
    // Wait for sheet to close, then for React Query refetch to complete
    await this.serviceSheetTitle.waitFor({ state: 'hidden' });
    await this.page.waitForLoadState('networkidle');
  }

  async openProductForm() {
    await this.productsTab.click();
    await this.fab.click();
    await this.productSheetTitle.waitFor({ state: 'visible' });
  }

  async addProduct(name: string, price: number) {
    await this.openProductForm();
    await this.productNameInput.fill(name);
    await this.productPriceInput.fill(String(price));
    await this.productSubmitBtn.click();
    await this.productSheetTitle.waitFor({ state: 'hidden' });
    await this.page.waitForLoadState('networkidle');
  }
}
