/**
 * audit.17-explore.spec.ts — Explore Directory Impeccable Audit
 * /explore: search, filters, master cards, SSR
 */
import { test, expect } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

test.use({ storageState: { cookies: [], origins: [] } }); // Анонімна сесія для каталогу Explore

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;
test.beforeAll(async () => {
  await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL);
});

test.describe('Explore Directory', () => {
  test('Explore — завантажується з каталогом майстрів', async ({ page }, testInfo) => {
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await auditScreenshot(page, testInfo, 'explore-desktop');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/explore');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'explore-mobile');
  });

  test('Explore — Search input', async ({ page }, testInfo) => {
    await page.goto('/explore');
    await waitForPageReady(page);

    const search = page.locator('input[type="search"], input[placeholder*="пошук"], input[placeholder*="search"]').first();
    if (await search.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await search.fill('Манікюр');
      await page.waitForTimeout(600);
      await auditScreenshot(page, testInfo, 'explore-search-results');
      await search.clear();
    }
  });

  test('Explore — Category filters', async ({ page }, testInfo) => {
    await page.goto('/explore');
    await waitForPageReady(page);

    const categoryChip = page.locator('[class*="category"], [class*="chip"], [class*="filter"]').first();
    if (await categoryChip.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await categoryChip.click();
      await page.waitForTimeout(500);
      await auditScreenshot(page, testInfo, 'explore-filtered');
    }
  });

  test('Master card → public profile', async ({ page }, testInfo) => {
    await page.goto('/explore');
    await waitForPageReady(page);

    const masterCard = page.locator('[class*="master-card"], [class*="MasterCard"], a[href*="/"]').first();
    if (await masterCard.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await auditScreenshot(page, testInfo, 'explore-master-card');
    }
  });

  test('Explore — A11y', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
