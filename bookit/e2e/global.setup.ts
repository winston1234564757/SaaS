/**
 * Global Setup — зберігає auth state для master і client.
 * Запускається один раз перед усіма тестами.
 *
 * Потрібні змінні у .env.test (або .env.local):
 *   E2E_MASTER_EMAIL, E2E_MASTER_PASSWORD
 *   E2E_CLIENT_EMAIL, E2E_CLIENT_PASSWORD
 */
import { chromium, type FullConfig } from '@playwright/test';
import * as fs from 'fs';

async function loginAndSave(
  browserContext: Awaited<ReturnType<typeof chromium.launch>>,
  baseURL: string,
  email: string,
  password: string,
  expectedUrlPattern: RegExp,
  stateFile: string,
) {
  const context = await browserContext.newContext();
  const page = await context.newPage();

  await page.goto(`${baseURL}/login`);
  await page.waitForLoadState('networkidle');

  // Switch to Email tab (default is Phone)
  await page.getByRole('button', { name: 'Email' }).click();

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  // Wait a bit and check for error message before waiting for redirect
  await page.waitForTimeout(2000);
  const errorEl = page.locator('text=Невірний email або пароль');
  const hasError = await errorEl.isVisible();
  if (hasError) {
    const currentUrl = page.url();
    await context.close();
    throw new Error(`[setup] Логін не вдався для ${email} — невірні credentials. URL: ${currentUrl}`);
  }

  await page.waitForURL(expectedUrlPattern, { timeout: 20_000 }).catch(async () => {
    const currentUrl = page.url();
    await page.screenshot({ path: `playwright/.auth/setup-fail-${email.split('@')[0]}.png` });
    await context.close();
    throw new Error(`[setup] Редірект не відбувся для ${email}. Поточний URL: ${currentUrl} (очікувався: ${expectedUrlPattern})`);
  });

  await context.storageState({ path: stateFile });
  await context.close();
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:3000';

  fs.mkdirSync('playwright/.auth', { recursive: true });

  const browser = await chromium.launch();

  const masterEmail = process.env.E2E_MASTER_EMAIL;
  const masterPassword = process.env.E2E_MASTER_PASSWORD;
  if (masterEmail && masterPassword) {
    console.log('[setup] Авторизація майстра...');
    try {
      await loginAndSave(browser, baseURL, masterEmail, masterPassword, /\/dashboard/, 'playwright/.auth/master.json');
      console.log('[setup] master.json збережено');
    } catch (e) {
      console.warn(`[setup] ⚠️  Не вдалось авторизувати майстра: ${(e as Error).message}`);
      console.warn('[setup] Auth-залежні тести будуть пропущені');
      if (fs.existsSync('playwright/.auth/master.json')) fs.unlinkSync('playwright/.auth/master.json');
    }
  } else {
    console.warn('[setup] E2E_MASTER_EMAIL/PASSWORD не задані — master.json не буде створено');
  }

  const clientEmail = process.env.E2E_CLIENT_EMAIL;
  const clientPassword = process.env.E2E_CLIENT_PASSWORD;
  if (clientEmail && clientPassword) {
    console.log('[setup] Авторизація клієнта...');
    try {
      await loginAndSave(browser, baseURL, clientEmail, clientPassword, /\/my\/bookings/, 'playwright/.auth/client.json');
      console.log('[setup] client.json збережено');
    } catch (e) {
      console.warn(`[setup] ⚠️  Не вдалось авторизувати клієнта: ${(e as Error).message}`);
      // Remove stale auth file so tests correctly skip
      if (fs.existsSync('playwright/.auth/client.json')) fs.unlinkSync('playwright/.auth/client.json');
    }
  } else {
    console.warn('[setup] E2E_CLIENT_EMAIL/PASSWORD не задані — client.json не буде створено');
  }

  await browser.close();
}
