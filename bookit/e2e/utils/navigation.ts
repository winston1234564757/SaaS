import { expect, type Page, type Locator } from '@playwright/test';

/**
 * Standardizes assertions for navigating between pages.
 * Waits for the URL to change and match the expected condition,
 * ensuring networkidle state is reached to prevent flakiness.
 */
export async function navigateAndAssertUrl(page: Page, expectedUrlPart: string, timeout = 15000) {
  await page.waitForLoadState('networkidle', { timeout });
  await expect(page).toHaveURL(new RegExp(expectedUrlPart, 'i'), { timeout });
}

/**
 * Robustly ensures the page has completed major rendering for a key feature.
 * Accepts a locator to use as a primary readiness indicator before interactivity starts.
 */
export async function waitForPageReadyMarker(locator: Locator, timeout = 15000) {
  await expect(locator).toBeVisible({ timeout });
}
