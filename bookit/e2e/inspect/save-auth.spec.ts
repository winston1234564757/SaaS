/**
 * Step 1: Save auth session.
 * Navigates to dashboard. Waits up to 5 minutes for manual OTP login.
 * Once on the dashboard, saves cookies to .auth/session.json
 *
 * Run:
 *   npx playwright test save-auth --config=playwright.inspect.config.ts --headed --project=chromium
 */

import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE      = 'https://bookit-five-psi.vercel.app';
const AUTH_DIR  = path.join(__dirname, '.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'session.json');

test('Save auth session', async ({ page }) => {
  test.setTimeout(0);
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  console.log('\n➜  Opening login page...');
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Log in with OTP (phone/email) — NOT Google OAuth            ║
║  The script waits up to 5 minutes for you to reach           ║
║  the /dashboard page, then auto-saves the session.           ║
╚══════════════════════════════════════════════════════════════╝
  `);

  // Poll until we land on /dashboard (up to 5 min)
  await page.waitForURL(`${BASE}/dashboard**`, { timeout: 5 * 60_000 });

  // Short wait to let the page fully hydrate
  await page.waitForTimeout(2000);

  // Save session
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`\n✅ Session saved → ${AUTH_FILE}`);
  console.log('   Now run: npx playwright test dashboard-visual --config=playwright.inspect.config.ts --headed --project=chromium\n');
});
