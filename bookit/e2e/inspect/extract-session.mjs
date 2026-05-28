/**
 * Extracts auth session from your existing Chrome profile.
 *
 * Requirements:
 *   1. Close ALL Chrome windows completely (including tray icon)
 *   2. Run: node e2e/inspect/extract-session.mjs
 *   3. Chrome will open with your existing session (already logged in)
 *   4. Script auto-saves to e2e/inspect/.auth/session.json
 *   5. Press Ctrl+C when done
 */

import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR   = path.join(__dirname, '.auth');
const AUTH_FILE  = path.join(AUTH_DIR, 'session.json');
const PROFILE    = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
const BASE       = 'https://bookit-five-psi.vercel.app';

fs.mkdirSync(AUTH_DIR, { recursive: true });

console.log('\n📂 Chrome profile:', PROFILE);
console.log('🌐 Target:', BASE + '/dashboard');
console.log('\n⚠️  Chrome must be FULLY CLOSED before running this script.\n');

const ctx = await chromium.launchPersistentContext(PROFILE, {
  channel:   'chrome',
  headless:  false,
  viewport:  { width: 1440, height: 900 },
  args: [
    '--profile-directory=Default',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
  ],
});

const page = ctx.pages()[0] ?? await ctx.newPage();

await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });

// If already on dashboard — save immediately
if (page.url().includes('/dashboard')) {
  await page.waitForTimeout(2000);
  await ctx.storageState({ path: AUTH_FILE });
  console.log('✅ Already logged in. Session saved to:', AUTH_FILE);
  await ctx.close();
  process.exit(0);
}

// Otherwise — wait for user to reach dashboard
console.log('🔐 Not logged in. Waiting for you to log in...');
console.log('   (Use Google OAuth in this Chrome window — it will work!)\n');

await page.waitForURL(`${BASE}/dashboard**`, { timeout: 5 * 60_000 });
await page.waitForTimeout(2000);

await ctx.storageState({ path: AUTH_FILE });
console.log('\n✅ Session saved to:', AUTH_FILE);
console.log('   Now run the visual inspection:\n');
console.log('   npx playwright test dashboard-visual --config=playwright.inspect.config.ts --headed --project=chromium\n');

await ctx.close();
