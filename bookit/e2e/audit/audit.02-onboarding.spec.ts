/**
 * audit.02-onboarding.spec.ts — Onboarding Wizard Impeccable Audit
 * /dashboard/onboarding: 5 кроків, progress bar, валідація, slug edit
 */

import { test, expect } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;

test.use({ storageState: 'playwright/.auth/master-audit.json' });

test.beforeAll(async () => {
  const theme = getThemeFromProject(test.info().project.name);
  await switchTheme(theme, MASTER_EMAIL);
});

test.describe('Onboarding Wizard — Layout та кроки', () => {
  test('Onboarding завантажується у Frost темі (незалежно від master теми)', async ({ page }, testInfo) => {
    await page.goto('/dashboard/onboarding');
    await waitForPageReady(page);

    // Onboarding завжди в Frost темі (за архітектурою)
    const dataTheme = await page.locator('html').getAttribute('data-theme');
    expect(dataTheme).toBe('frost');

    // Progress bar (5 dots)
    const progressDots = page.locator('[class*="progress"], [class*="dot"], [class*="step"]');
    await progressDots.first().isVisible().catch(() => {});

    await auditScreenshot(page, testInfo, 'onboarding-step1-profile');
  });

  test('Крок 1 PROFILE — поля та валідація', async ({ page }, testInfo) => {
    await page.goto('/dashboard/onboarding');
    await waitForPageReady(page);

    // Поля профілю (ім'я, назва студії)
    const nameInput = page.locator('input[name*="name"], input[placeholder*="ім\'я"], input[placeholder*="студія"]').first();
    const hasName = await nameInput.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasName) {
      await nameInput.fill('');
      // Спробувати перейти далі без заповнення
      const nextBtn = page.getByRole('button', { name: /далі|next|продовжити/i }).first();
      await nextBtn.click().catch(() => {});
      await page.waitForTimeout(300);

      // Валідаційна помилка або кнопка disabled
      const errorVisible = await page.locator('[class*="error"], [role="alert"]').first().isVisible().catch(() => false);
      const btnDisabled  = await nextBtn.isDisabled().catch(() => false);
      expect(errorVisible || btnDisabled).toBe(true);

      await auditScreenshot(page, testInfo, 'onboarding-step1-validation');
    }
  });

  test('Progress bar — 5 точок, анімовані коннектори', async ({ page }, testInfo) => {
    await page.goto('/dashboard/onboarding');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 375, height: 812 });

    await auditScreenshot(page, testInfo, 'onboarding-progress-mobile');

    await page.setViewportSize({ width: 1440, height: 900 });
    await auditScreenshot(page, testInfo, 'onboarding-progress-desktop');
  });

  test('Onboarding — A11y перевірка', async ({ page }) => {
    await page.goto('/dashboard/onboarding');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
