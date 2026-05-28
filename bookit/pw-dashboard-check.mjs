/**
 * pw-dashboard-check.mjs
 * Copies Chrome profile to temp dir (avoids conflict with running Chrome).
 * Switches themes via Settings UI → takes real screenshots of each dashboard.
 * Usage: node pw-dashboard-check.mjs
 */

import { chromium } from 'playwright';
import { mkdirSync, cpSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir, tmpdir } from 'os';

const BASE_URL    = 'https://bookit-five-psi.vercel.app';
const OUT_DIR     = 'pw-visual';
const SETTINGS    = `${BASE_URL}/dashboard/settings`;

const THEMES = [
  { key: 'default', label: 'Blossom', btnText: 'Blossom' },
  { key: 'studio',  label: 'Studio',  btnText: 'Studio'  },
  { key: 'frost',   label: 'Frost',   btnText: 'Frost'   },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900  },
  { name: 'mobile',  width: 390,  height: 844  },
];

mkdirSync(OUT_DIR, { recursive: true });

const CHROME_USER_DATA = join(homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
const TEMP_DIR         = join(tmpdir(), `pw-bookit-${Date.now()}`);
const TEMP_PROFILE     = join(TEMP_DIR, 'User Data');

console.log('📋  Копіюю профіль Chrome у temp (10-30с)...');
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
  console.warn('⚠️  Копіювання частково не вдалось (нормально):', e.message.slice(0, 80));
}

console.log('🚀  Запускаю Chrome з temp профілем...');

let context;
try {
  context = await chromium.launchPersistentContext(TEMP_PROFILE, {
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
} catch (e) {
  console.error('❌  Не вдалось запустити Chrome:', e.message);
  rmSync(TEMP_DIR, { recursive: true, force: true });
  process.exit(1);
}

const page = await context.newPage();

// ─── Auto-login via Google OAuth ──────────────────────────────────────────
async function handleGoogleOAuth() {
  const G_EMAIL = 'viktor.koshel24@gmail.com';
  const G_PASS  = 'Bookit2026';

  for (let step = 0; step < 60; step++) {
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 }).catch(() => {});
    const url = page.url();
    console.log(`  [step ${step}] URL: ${url.split('?')[0].slice(0, 80)}`);

    if (url.includes('/dashboard')) return true;

    // ── Bookit login page ─────────────────────────────────────────────────
    if (url.includes(BASE_URL) && (url.includes('/login') || url.includes('/register'))) {
      // Step 2: Google button (check first — visible after role selection)
      const googleBtn = page.getByText('Продовжити з Google').first();
      if (await googleBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log('  → Клікаю "Продовжити з Google"...');
        await googleBtn.click({ force: true, timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(3000);
        continue;
      }
      // Step 1: Role select — force-click to bypass animation stability
      const masterCard = page.getByText('Я Майстер').first();
      if (await masterCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('  → Обираю роль "Я Майстер"...');
        await masterCard.click({ force: true, timeout: 8000 }).catch(() => {});
        // Wait for Google button to appear or navigation to start
        await page.waitForTimeout(1500);
        const googleVisible = await page.getByText('Продовжити з Google').first()
          .isVisible({ timeout: 2000 }).catch(() => false);
        if (!googleVisible) await page.waitForTimeout(1500);
        continue;
      }
    }

    // ── Google OAuth pages ────────────────────────────────────────────────
    if (url.includes('accounts.google') || url.includes('accounts.google.com.ua')) {
      // Password input — check first on challenge/pwd pages (email text also present there)
      const pwdInput = page.locator('input[type="password"]');
      if (await pwdInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  → Вводжу пароль...');
        await pwdInput.fill(G_PASS);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3500);
        continue;
      }
      // Email input (fresh sign-in)
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  → Вводжу email...');
        await emailInput.fill(G_EMAIL);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2500);
        continue;
      }
      // Account list — only click email text when NOT on challenge page
      if (!url.includes('/challenge/')) {
        const accountRow = page.getByText(G_EMAIL).first();
        if (await accountRow.isVisible({ timeout: 2500 }).catch(() => false)) {
          console.log('  → Обираю акаунт...');
          await accountRow.click({ timeout: 8000 }).catch(() => {});
          await page.waitForTimeout(2500);
          continue;
        }
      }
      // OAuth consent page — try all known "Allow/Continue" selectors
      for (const sel of [
        '#submit_approve_access',
        '[jsname="LgbsSe"]',
        'button[type="submit"]',
        'form[action*="consent"] button',
      ]) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`  → Клікаю consent кнопку (${sel})...`);
          await btn.click();
          await page.waitForTimeout(3000);
          break;
        }
      }
      continue;
    }

    // ── Supabase callback — just wait ─────────────────────────────────────
    if (url.includes('supabase.co') || url.includes('/auth/callback')) {
      await page.waitForTimeout(2000);
      continue;
    }

    await page.waitForTimeout(1500);
  }
  return page.url().includes('/dashboard');
}

// ─── Login if needed ───────────────────────────────────────────────────────
console.log('🌐  Відкриваю dashboard...');
await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForTimeout(1500);

if (!page.url().includes('/dashboard')) {
  console.log('⚠️  Не авторизовано. Автоматичний Google OAuth...');
  const ok = await handleGoogleOAuth();
  if (!ok) {
    console.log('  Авто-логін не вдався, чекаємо ручний (60с)...');
    await page.waitForURL(url => url.toString().includes('/dashboard'), { timeout: 60_000 });
  }
}

await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
console.log('✅  Dashboard завантажено\n');

// ─── Helper: switch theme via Settings UI ─────────────────────────────────
async function switchTheme(themeLabel) {
  console.log(`  ⚙️  Перемикаю тему → ${themeLabel} через Settings...`);
  await page.goto(SETTINGS, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(800);

  // Click the theme button by its visible text
  const btn = page.getByText(themeLabel, { exact: true }).first();
  const found = await btn.isVisible().catch(() => false);
  if (found) {
    await btn.click();
    await page.waitForTimeout(600);
    // Save settings if there's a save button
    const saveBtn = page.getByRole('button', { name: /зберег|save/i }).first();
    const hasSave = await saveBtn.isVisible().catch(() => false);
    if (hasSave) {
      await saveBtn.click();
      await page.waitForTimeout(800);
    }
    console.log(`  ✓  Тему "${themeLabel}" обрано`);
  } else {
    console.warn(`  ⚠️  Кнопка "${themeLabel}" не знайдена на Settings сторінці`);
  }

  // Navigate back to dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

// ─── Screenshot loop ───────────────────────────────────────────────────────
let count = 0;

for (const theme of THEMES) {
  console.log(`\n━━━ ${theme.label} ━━━`);
  await switchTheme(theme.btnText);

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);

    // Full page
    const pathFull = join(OUT_DIR, `${vp.name}-${theme.label.toLowerCase()}.png`);
    await page.screenshot({ path: pathFull, fullPage: true });
    count++;
    console.log(`  [${count}] ${theme.label.padEnd(8)} ${vp.name.padEnd(8)} → ${pathFull}`);

    // Above-the-fold only
    const pathAtf = join(OUT_DIR, `${vp.name}-${theme.label.toLowerCase()}-atf.png`);
    await page.screenshot({ path: pathAtf });
    console.log(`  [+] ATF                       → ${pathAtf}`);

    // Mobile mid-scroll
    if (vp.name === 'mobile') {
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(300);
      const pathMid = join(OUT_DIR, `mobile-${theme.label.toLowerCase()}-mid.png`);
      await page.screenshot({ path: pathMid });
      console.log(`  [+] mobile-mid                → ${pathMid}`);
      await page.evaluate(() => window.scrollTo(0, 0));
    }
  }
}

console.log(`\n✅  Готово! ${count} основних скриншотів у ./${OUT_DIR}/`);

await context.close();
rmSync(TEMP_DIR, { recursive: true, force: true });
