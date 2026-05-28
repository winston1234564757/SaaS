/**
 * Auth / Onboarding Visual Check — Blossom / Studio / Frost
 * Tests /login page on localhost:3000 (local dev server).
 * Uses Chrome profile copy for onboarding (protected route).
 *
 * Run:
 *   node pw-auth-visual.mjs
 *
 * Requires: npm run dev (localhost:3000 must be running)
 */

import { chromium } from 'playwright';
import { mkdirSync, cpSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir, tmpdir } from 'os';

const BASE_URL = 'http://localhost:3000';
const OUT_DIR  = 'pw-visual-auth';

const THEMES = [
  { key: 'default', label: 'Blossom' },
  { key: 'studio',  label: 'Studio'  },
  { key: 'frost',   label: 'Frost'   },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile',  width: 390,  height: 844 },
];

mkdirSync(OUT_DIR, { recursive: true });

// ─── Copy Chrome profile to temp ─────────────────────────────────────────────
const CHROME_USER_DATA = join(homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
const TEMP_DIR    = join(tmpdir(), `pw-auth-${Date.now()}`);
const TEMP_PROFILE = join(TEMP_DIR, 'User Data');

console.log('📋  Копіюю Chrome профіль у temp...');
try {
  cpSync(join(CHROME_USER_DATA, 'Default'), join(TEMP_PROFILE, 'Default'), {
    recursive: true,
    filter: (src) => {
      const skip = ['Lock', 'SingletonLock', 'SingletonSocket', 'SingletonCookie',
                    'Cache', 'Code Cache', 'GPUCache', 'ShaderCache', 'Service Worker'];
      return !skip.some(s => src.endsWith(s));
    },
  });
  cpSync(join(CHROME_USER_DATA, 'Local State'), join(TEMP_PROFILE, 'Local State'));
} catch (e) {
  console.warn('⚠️  Частково не скопійовано (нормально):', e.message.slice(0, 80));
}

console.log('🚀  Запускаю Chrome...');
const context = await chromium.launchPersistentContext(TEMP_PROFILE, {
  channel:  'chrome',
  headless: false,
  args: [
    '--disable-blink-features=AutomationControlled',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-sync',
  ],
  ignoreDefaultArgs: ['--enable-automation'],
  locale:     'uk-UA',
  timezoneId: 'Europe/Kyiv',
  timeout:    60_000,
});

const page = await context.newPage();

// ─── Inject theme via JS (no Settings navigation needed) ─────────────────────
async function injectTheme(themeKey) {
  if (themeKey === 'default') {
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  } else {
    await page.evaluate((k) => document.documentElement.setAttribute('data-theme', k), themeKey);
  }
  await page.waitForTimeout(350);
}

// ─── Screenshot helper ────────────────────────────────────────────────────────
let count = 0;
async function shoot(name) {
  const p = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  count++;
  console.log(`  [${count}] → ${name}.png`);
}
async function shootFull(name) {
  const p = join(OUT_DIR, `${name}-full.png`);
  await page.screenshot({ path: p, fullPage: true });
  count++;
  console.log(`  [${count}] → ${name}-full.png`);
}

// ─── Test one page across all themes + viewports ──────────────────────────────
async function testPage(urlPath, pageName, waitFor) {
  console.log(`\n━━━ ${pageName.toUpperCase()} (${urlPath}) ━━━`);

  await page.goto(`${BASE_URL}${urlPath}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.waitForTimeout(1000);

  // Check if redirected (e.g. onboarding → dashboard for already-onboarded user)
  const currentUrl = page.url();
  if (!currentUrl.includes(urlPath.replace('/dashboard', ''))) {
    console.log(`  ⚠️  Редірект → ${currentUrl} (пропускаємо)`);
    return;
  }

  if (waitFor) {
    await page.waitForSelector(waitFor, { timeout: 8_000 }).catch(() => {});
  }
  await page.waitForTimeout(600);

  for (const theme of THEMES) {
    console.log(`\n  🎨 ${theme.label}`);
    await injectTheme(theme.key);

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      const base = `${pageName}-${theme.label}-${vp.name}`;
      await shoot(base);

      // Mobile mid-scroll
      if (vp.name === 'mobile') {
        await page.evaluate(() => window.scrollTo(0, 400));
        await page.waitForTimeout(200);
        await shoot(`${base}-mid`);
        await page.evaluate(() => window.scrollTo(0, 0));
      }
    }
  }
}

// ─── Run all pages ────────────────────────────────────────────────────────────

// 1. Login page (public — PhoneOtpForm з нашими змінами)
await testPage('/login', 'login', 'button, input');

// 2. Register page (public — same PhoneOtpForm component)
await testPage('/register', 'register', 'button, input');

// 3. Onboarding (protected — спробуємо через Chrome сесію)
await testPage('/dashboard/onboarding', 'onboarding', '.bento-card, form, input');

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n✅  Готово! ${count} скриншотів у ./${OUT_DIR}/`);

await context.close();
rmSync(TEMP_DIR, { recursive: true, force: true });
