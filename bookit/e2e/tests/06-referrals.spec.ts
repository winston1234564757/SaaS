/**
 * 06 — Referral System
 *
 * Verifies that:
 *   - The master has a referral_code in master_profiles
 *   - The /dashboard/referral page renders correctly
 *   - The invite link on that page contains the referral_code
 *   - The /invite/[code] public landing renders without a 500 error
 *
 * Requires:
 *   - E2E_MASTER_SLUG
 *   - playwright/.auth/master.json  (hasMasterState) for dashboard tests
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { getMasterProfileBySlug } from '../utils/supabase';

const hasMasterState = fs.existsSync('playwright/.auth/master.json');
const MASTER_SLUG    = process.env.E2E_MASTER_SLUG;

test.describe('Referral System', () => {

  test('майстер має referral_code у профілі', async () => {
    test.skip(!MASTER_SLUG, 'E2E_MASTER_SLUG не задано');

    const profile = await getMasterProfileBySlug(MASTER_SLUG!);

    expect(profile).not.toBeNull();
    expect(typeof profile.referral_code).toBe('string');
    expect((profile.referral_code as string).length).toBeGreaterThan(0);
  });

  test('сторінка реферальної програми рендериться', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page    = await context.newPage();

    try {
      await page.goto('/dashboard/referral');
      // Не чекаємо networkidle — realtime підписки тримають з'єднання відкритим
      await page.waitForLoadState('domcontentloaded');

      // h1 must be visible
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });

      // A share / copy button must exist
      const shareBtn = page
        .getByRole('button', { name: /Поділитися|Скопіювати|Копіювати|Share|Copy/i })
        .first();
      await expect(shareBtn).toBeVisible({ timeout: 10_000 });
    } finally {
      await context.close();
    }
  });

  test('реферальне посилання містить code майстра', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');
    test.skip(!MASTER_SLUG,    'E2E_MASTER_SLUG не задано');

    // Fetch referral_code from DB
    const profile      = await getMasterProfileBySlug(MASTER_SLUG!);
    const referralCode = profile.referral_code as string;
    expect(referralCode.length).toBeGreaterThan(0);

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page    = await context.newPage();

    try {
      await page.goto('/dashboard/referral');
      await page.waitForLoadState('networkidle');

      // Look for an input or text element containing the invite link / code
      const linkInput = page
        .locator('input[readonly], input[type="text"], [data-testid="invite-link"]')
        .first();

      const isInputVisible = await linkInput.isVisible().catch(() => false);

      if (isInputVisible) {
        const value = await linkInput.inputValue();
        expect(value).toContain(referralCode);
      } else {
        // Fallback: the code might be displayed in a <span> or <p>
        await expect(page.getByText(referralCode).first()).toBeVisible({ timeout: 8_000 });
      }
    } finally {
      await context.close();
    }
  });

  test('/invite/[code] landing рендериться', async ({ page }) => {
    await page.goto('/invite/TESTCODE');
    await page.waitForLoadState('networkidle');

    // Must not be a 500 or error page
    const url = page.url();
    expect(url).not.toMatch(/\/error|\/500/);

    // Should render a CTA / register button
    // CTA text: "Зареєструватися безкоштовно"
    const ctaBtn = page
      .getByRole('link', { name: /Зареєструват/i })
      .first();

    await expect(ctaBtn).toBeVisible({ timeout: 10_000 });
  });

});
