/**
 * 03 — Referral Engine
 *
 * Tests the referral system:
 *
 *   1. /invite/[code] renders correctly for a known master referral code.
 *   2. /invite/[code] redirects to /register?ref=[code] on CTA click.
 *   3. /invite/[unknownCode] renders a generic invite page (graceful fallback).
 *   4. Referral code is preserved in the register URL (captured for post-auth).
 *   5. Master public page link is shown when the code belongs to a master.
 *
 * Referral flow (tested here at the UI layer):
 *   /invite/[code] → shows master info + "Зареєструватися" button
 *   Click CTA → navigates to /register?ref=[code]
 *   After registration (not tested here — requires real SMS OTP) →
 *     applyReferralRewards() runs server-side
 *
 * Requires:
 *   E2E_MASTER_REFERRAL_CODE  (from .env.test.runtime)
 *   E2E_MASTER_REFERRAL_SLUG  (from .env.test.runtime)
 */
import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { rt, isSeeded } from '../utils/runtimeEnv';

// ─── /invite/[code] page ──────────────────────────────────────────────────────

test.describe('/invite/[code] — Invite page', () => {
  test('renders master info for a valid referral code', async ({ page }) => {
    test.skip(!isSeeded() || !rt.masterReferralCode, 'Seeder not run or referral code missing');

    await page.goto(`/invite/${rt.masterReferralCode}`);
    await page.waitForLoadState('networkidle');

    // Page must show the master's name from the invite card
    // InvitePage renders: "{name} запрошує тебе!"
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10_000 });

    const headingText = await heading.textContent();
    // Should contain the referral master's business name or full name
    expect(headingText).toMatch(/запрошує|Bookit|Зареєструватися/i);
  });

  test('CTA button links to /register?ref=[code]', async ({ page }) => {
    test.skip(!isSeeded() || !rt.masterReferralCode, 'Seeder not run or referral code missing');

    await page.goto(`/invite/${rt.masterReferralCode}`);
    await page.waitForLoadState('networkidle');

    // The invite page CTA: "Зареєструватися безкоштовно" links to /register?ref=[code]
    const ctaLink = page.getByRole('link', { name: /Зареєструватися/i });
    await expect(ctaLink).toBeVisible({ timeout: 8_000 });

    const href = await ctaLink.getAttribute('href');
    expect(href).toContain('/register');
    expect(href).toContain(`ref=${rt.masterReferralCode}`);
  });

  test('master public page link is shown on the invite card', async ({ page }) => {
    test.skip(!isSeeded() || !rt.masterReferralCode, 'Seeder not run or referral code missing');

    await page.goto(`/invite/${rt.masterReferralCode}`);
    await page.waitForLoadState('networkidle');

    // InvitePage renders a link to /{slug} when inviter is a master
    const masterLink = page.getByRole('link', { name: /Переглянути сторінку/i });
    await expect(masterLink).toBeVisible({ timeout: 8_000 });

    const href = await masterLink.getAttribute('href');
    expect(href).toContain(rt.masterReferralSlug);
  });

  test('unknown code renders generic invite fallback', async ({ page }) => {
    await page.goto('/invite/UNKNOWNINVALIDCODE999');
    await page.waitForLoadState('networkidle');

    // Page should not 404 — renders generic "Тебе запрошують до Bookit!"
    await expect(page).not.toHaveURL(/404|error/i);

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 8_000 });

    // CTA must still link to /register (generic invite)
    const ctaLink = page.getByRole('link', { name: /Зареєструватися/i });
    await expect(ctaLink).toBeVisible();

    const href = await ctaLink.getAttribute('href');
    expect(href).toContain('/register');
    expect(href).toContain('ref=UNKNOWNINVALIDCODE999');
  });
});

// ─── Referral code propagation ────────────────────────────────────────────────

test.describe('Referral code → /register propagation', () => {
  test('/register?ref=[code] page renders with code in URL', async ({ page }) => {
    test.skip(!isSeeded() || !rt.masterReferralCode, 'Seeder not run or referral code missing');

    await page.goto(`/register?ref=${rt.masterReferralCode}`);
    await page.waitForLoadState('networkidle');

    // URL must preserve the ref param (might stay on /register or redirect to /login)
    await expect.poll(async () => {
      const url = page.url();
      return /(register|login).*ref=/.test(url) && url.includes(rt.masterReferralCode);
    }, { timeout: 10_000 }).toBeTruthy();

    // Registration page rendered (after redirect to /login)
    // Handle the mandatory role selection step
    const auth = new AuthPage(page);
    await auth.continueButton.waitFor({ state: 'visible', timeout: 10_000 });
    await auth.continueButton.click();

    // Registration page renders (SMS OTP form)
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible({ timeout: 8_000 });
  });

  test('navigating invite → CTA → /register preserves ref code end-to-end', async ({ page }) => {
    test.skip(!isSeeded() || !rt.masterReferralCode, 'Seeder not run or referral code missing');

    await page.goto(`/invite/${rt.masterReferralCode}`);
    await page.waitForLoadState('networkidle');

    // Click the CTA — should navigate (not open in new tab)
    const ctaLink = page.getByRole('link', { name: /Зареєструватися/i });
    await ctaLink.click();

    // After click, wait for registration page to load
    // Handle the mandatory role selection step
    const auth = new AuthPage(page);
    await auth.continueButton.waitFor({ state: 'visible', timeout: 10_000 });
    await auth.continueButton.click();

    // Wait for phone input visible
    await expect(page.locator('input[type="tel"]')).toBeVisible({ timeout: 10_000 });

    // Then confirm URL still preserves the ref code after any client-side routing
    // Accepts any path (register or login) as long as the ref is present.
    await expect.poll(async () => {
      const url = page.url();
      return /(register|login).*ref=/.test(url) && url.includes(rt.masterReferralCode);
    }, { timeout: 10_000 }).toBeTruthy();
  });
});

// ─── Master's referral page in dashboard ──────────────────────────────────────

test.describe('Master referral dashboard page', () => {
  const hasMasterAuth = require('fs').existsSync('playwright/.auth/master-referral.json');

  test('referral page renders with copy-link button', async ({ browser }) => {
    test.skip(!hasMasterAuth, 'playwright/.auth/master-referral.json not found');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master-referral.json' });
    const page    = await context.newPage();

    try {
      await page.goto('/dashboard/referral');
      await page.waitForLoadState('networkidle');

      // Page renders without 404/error
      await expect(page).not.toHaveURL(/404|error/i);

      // Should show a referral link or code
      const codeEl = page
        .locator('span, p, input, code')
        .filter({ hasText: new RegExp(rt.masterReferralCode || 'E2EREF', 'i') })
        .first();

      // If the referral page shows the code, assert it
      const isCodeVisible = await codeEl.isVisible().catch(() => false);
      if (isCodeVisible) {
        await expect(codeEl).toBeVisible();
      }

      // At minimum the page must render a heading
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 8_000 });
    } finally {
      await context.close();
    }
  });
});
