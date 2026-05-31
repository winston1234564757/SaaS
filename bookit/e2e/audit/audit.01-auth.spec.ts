/**
 * audit.01-auth.spec.ts — Auth Flow Impeccable Audit
 * /login, /register: роль-вибір, phone input, OTP, валідація, помилки
 */

import { test, expect } from '@playwright/test';
import { auditScreenshot, checkA11y, forViewports } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

test.use({ storageState: { cookies: [], origins: [] } }); // Анонімна сесія

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;

test.beforeAll(async () => {
  const theme = getThemeFromProject(test.info().project.name);
  await switchTheme(theme, MASTER_EMAIL);
});

test.describe('Auth — Layout та дизайн', () => {
  test('Auth сторінка завантажується коректно', async ({ page }, testInfo) => {
    await page.goto('/login');

    await forViewports(page, async (vp) => {
      // Split-screen layout на десктопі: 45% dark panel + 55% form
      if (vp === 'desktop') {
        const brandPanel = page.locator('[class*="brand"], [class*="panel"], [data-testid*="brand"]').first();
        await brandPanel.isVisible().catch(() => {});
      }

      // Form panel завжди видимий (може бути div/main)
      const form = page.locator('form, [role="form"], main, [role="main"]').first();
      await expect(form).toBeVisible();

      await auditScreenshot(page, testInfo, `auth-login-${vp}`);
    });
  });

  test('Login — вибір ролі (Майстер / Клієнт)', async ({ page }, testInfo) => {
    await page.goto('/login');

    const masterRole = page.getByText(/майстер/i).first();
    const clientRole = page.getByText(/клієнт/i).first();

    const hasMaster = await masterRole.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasMaster) {
      // Перевірити стан "unselected"
      await auditScreenshot(page, testInfo, 'auth-role-default');

      // Клік на "Майстер" → активний стан
      await masterRole.click();
      await page.waitForTimeout(300);
      await auditScreenshot(page, testInfo, 'auth-role-master-selected');

      // Клік на "Клієнт"
      await clientRole.click();
      await page.waitForTimeout(300);
      await auditScreenshot(page, testInfo, 'auth-role-client-selected');
    }
  });

  test('Phone input — поле телефону та маска', async ({ page }, testInfo) => {
    await page.goto('/login');

    // Вибрати роль
    const masterRole = page.getByText(/майстер/i).first();
    await masterRole.click().catch(() => {});

    // Знайти phone input
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="+38"], input[name="phone"]').first();
    const hasPhone = await phoneInput.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasPhone) {
      await phoneInput.click();
      await phoneInput.fill('+380501234567');
      await page.waitForTimeout(200);
      await auditScreenshot(page, testInfo, 'auth-phone-filled');

      // CTA кнопка "Отримати код"
      const sendBtn = page.getByRole('button', { name: /отримати|надіслати|код|otp|get code/i }).first();
      await expect(sendBtn).toBeEnabled();
    }
  });

  test('Phone validation — некоректний номер показує помилку', async ({ page }, testInfo) => {
    await page.goto('/login');

    const masterRole = page.getByText(/майстер/i).first();
    await masterRole.click().catch(() => {});

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="+38"]').first();
    const hasPhone = await phoneInput.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasPhone) {
      await phoneInput.fill('123'); // Некоректний номер
      const sendBtn = page.getByRole('button', { name: /отримати|надіслати|код/i }).first();
      await sendBtn.click().catch(() => {});
      await page.waitForTimeout(500);

      // Помилка валідації або disabled кнопка
      const errorMsg = page.locator('[role="alert"], [class*="error"], [class*="invalid"]').first();
      const isErrorVisible = await errorMsg.isVisible().catch(() => false);
      const isButtonDisabled = await sendBtn.isDisabled().catch(() => false);

      expect(isErrorVisible || isButtonDisabled).toBe(true);
      await auditScreenshot(page, testInfo, 'auth-phone-invalid');
    }
  });

  test('Register page — завантажується', async ({ page }, testInfo) => {
    await page.goto('/register');
    await forViewports(page, async (vp) => {
      const form = page.locator('form, [role="form"], main, [role="main"]').first();
      await expect(form).toBeVisible({ timeout: 8_000 });
      await auditScreenshot(page, testInfo, `auth-register-${vp}`);
    });
  });

  test('Auth — A11y перевірка', async ({ page }) => {
    await page.goto('/login');
    await checkA11y(page);
  });
});
