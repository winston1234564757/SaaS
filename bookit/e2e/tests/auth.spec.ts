import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { AuthPage } from '../pages/AuthPage';

const hasMasterState = fs.existsSync('playwright/.auth/master-auth.json');
const hasClientState = fs.existsSync('playwright/.auth/client.json');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Login page — UI rendering
//    Bookit uses SMS OTP only. No email/password form exists.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Сторінка логіну', () => {
  test('відображає рольовий крок і перехід на phone OTP', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();

    await expect(auth.heading).toBeVisible();
    await expect(auth.heading).toContainText('Ласкаво просимо');
    await expect(auth.roleClientCard).toBeVisible();
    await expect(auth.roleMasterCard).toBeVisible();
    await expect(auth.continueButton).toBeVisible();

    await auth.goToPhoneStep();
    await expect(auth.phoneInput).toBeVisible();
    await expect(auth.sendSmsButton).toBeVisible();
    await expect(auth.googleButton).toBeVisible();
  });

  test('показує помилку при неповному номері', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();
    await auth.goToPhoneStep();

    // Ввести короткий номер — кнопка має бути заблокована
    await auth.phoneInput.fill('12');

    // Кнопка disabled = компонент правильно блокує надсилання
    const disabled = await auth.sendSmsButton.isDisabled();
    if (disabled) {
      // Очікувана поведінка: кнопка disabled при короткому номері
      expect(disabled).toBe(true);
    } else {
      // Кнопка активна — клікнути і перевірити помилку
      await auth.sendSmsButton.click({ force: true });
      await expect(auth.errorMessage).toBeVisible({ timeout: 5_000 });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Routing — захист маршрутів (без авторизації)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Захист роутів (без авторизації)', () => {
  test('/dashboard → редірект на /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('/my/bookings → редірект на /login', async ({ page }) => {
    await page.goto('/my/bookings');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Master session routing
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Логін майстра (storageState)', () => {
  test('майстер → /dashboard', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master-auth.json — запусти global.setup');

    const context = await browser.newContext({
      storageState: 'playwright/.auth/master-auth.json',
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    await context.close();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Client session routing
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Логін клієнта (storageState)', () => {
  test('клієнт → /my/bookings', async ({ browser }) => {
    test.skip(!hasClientState, 'Немає playwright/.auth/client.json — запусти global.setup');

    const context = await browser.newContext({
      storageState: 'playwright/.auth/client.json',
    });
    const page = await context.newPage();

    await page.goto('/my/bookings');
    await expect(page).toHaveURL(/\/my\/bookings/, { timeout: 15_000 });

    await context.close();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Security — перевірка ролей
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Безпека ролей', () => {
  test('клієнт на /dashboard → редірект на /my/bookings', async ({ browser }) => {
    test.skip(!hasClientState, 'Немає playwright/.auth/client.json — запусти global.setup');

    const context = await browser.newContext({
      storageState: 'playwright/.auth/client.json',
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/my\/bookings/, { timeout: 10_000 });

    await context.close();
  });

  test('майстер на /dashboard → залишається на /dashboard', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master-auth.json — запусти global.setup');

    const context = await browser.newContext({
      storageState: 'playwright/.auth/master-auth.json',
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    await context.close();
  });
});
