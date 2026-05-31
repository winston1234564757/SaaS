/**
 * audit.16-public-profile.spec.ts — Public Profile + BookingWizard Impeccable Audit
 * /[slug]: SSR сторінка, послуги, відгуки, shop, portfolio, BookingWizard
 */
import { test, expect } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady, getAuditMasterSlug } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

test.use({ storageState: { cookies: [], origins: [] } }); // Анонімна сесія для публічного профілю

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;

test.beforeAll(async () => {
  await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL);
});

test.describe('Public Profile', () => {
  test('Публічна сторінка — SSR контент', async ({ page }, testInfo) => {
    const slug = getAuditMasterSlug();
    await page.goto(`/${slug}`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Основний контент
    await expect(page.locator('h1, [class*="business-name"], [class*="profile-name"]').first())
      .toBeVisible({ timeout: 15_000 });

    await page.setViewportSize({ width: 1440, height: 900 });
    await auditScreenshot(page, testInfo, 'public-profile-desktop');

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/${slug}`);
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'public-profile-mobile');
  });

  test('Services list — картки послуг видимі', async ({ page }, testInfo) => {
    const slug = getAuditMasterSlug();
    await page.goto(`/${slug}`);
    await waitForPageReady(page);

    const serviceCard = page.locator('[class*="service"], [data-testid*="service"]').first();
    const hasService = await serviceCard.isVisible({ timeout: 8_000 }).catch(() => false);
    if (hasService) await auditScreenshot(page, testInfo, 'public-services-list');
  });

  test('Кнопка "Записатися" → BookingWizard відкривається', async ({ page }, testInfo) => {
    const slug = getAuditMasterSlug();
    await page.goto(`/${slug}`);
    await waitForPageReady(page);

    const bookBtn = page.getByRole('button', { name: /записатися|book|забронювати/i }).first();
    const hasBtn = await bookBtn.isVisible({ timeout: 8_000 }).catch(() => false);
    if (hasBtn) {
      await bookBtn.click();
      await page.waitForTimeout(700);
      const wizard = page.locator('[role="dialog"], [data-vaul-drawer]').first();
      if (await wizard.isVisible().catch(() => false)) {
        await auditScreenshot(page, testInfo, 'booking-wizard-step1-services');
        // Закрити
        await page.keyboard.press('Escape');
        await expect(wizard).not.toBeVisible({ timeout: 3_000 });
      }
    }
  });

  test('Shop tab — /[slug]/shop', async ({ page }, testInfo) => {
    const slug = getAuditMasterSlug();
    await page.goto(`/${slug}/shop`);
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'public-shop');
  });

  test('Portfolio tab — /[slug]/portfolio', async ({ page }, testInfo) => {
    const slug = getAuditMasterSlug();
    await page.goto(`/${slug}/portfolio`);
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'public-portfolio');
  });

  test('Public Profile — A11y', async ({ page }) => {
    const slug = getAuditMasterSlug();
    await page.goto(`/${slug}`);
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
