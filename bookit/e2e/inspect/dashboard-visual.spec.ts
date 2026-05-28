/**
 * Dashboard Visual Inspection — Blossom / Studio / Frost
 *
 * Runs in headed mode against the production URL.
 * 1. Pause for manual login.
 * 2. For each theme: inject data-theme, take desktop + mobile screenshots,
 *    interact with PeakHours tooltip, WeeklyChart bars, FreeSlotsWidget tabs.
 *
 * Run:
 *   npx playwright test e2e/inspect/dashboard-visual.spec.ts \
 *     --headed --project=chromium --timeout=0
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE = 'https://bookit-five-psi.vercel.app';
const SHOTS_DIR = path.join(__dirname, '../../playwright-visual');

const THEMES = [
  { key: 'default', label: 'Blossom' },
  { key: 'studio',  label: 'Studio'  },
  { key: 'frost',   label: 'Frost'   },
] as const;

const DESKTOP = { width: 1440, height: 900 };
const MOBILE  = { width: 390,  height: 844 };  // iPhone 14

function shot(name: string) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  return path.join(SHOTS_DIR, `${name}.png`);
}

async function injectTheme(page: Page, themeKey: string) {
  if (themeKey === 'default') {
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  } else {
    await page.evaluate((k) => document.documentElement.setAttribute('data-theme', k), themeKey);
  }
  // wait for CSS to settle
  await page.waitForTimeout(400);
}

async function waitForDashboard(page: Page) {
  // wait until at least one widget is visible
  await page.waitForSelector('.bento-card, [class*="ScheduleWidget"], [class*="GreetingWidget"]', {
    timeout: 15_000,
  }).catch(() => {});
  await page.waitForTimeout(800);
}

// ─── Desktop checks ──────────────────────────────────────────────────────────

async function checkPeakHoursTooltip(page: Page, themeLabel: string) {
  // Find a peak-hours heat cell (small divs inside the widget)
  const cells = page.locator('text=Пікові години').locator('..').locator('div[style*="border-radius"]');
  const count = await cells.count();
  if (count === 0) { console.log(`[${themeLabel}] PeakHours cells not found`); return; }

  // hover / click first non-zero cell
  let clicked = false;
  for (let i = 0; i < Math.min(count, 20); i++) {
    const cell = cells.nth(i);
    const bg = await cell.evaluate(el => (el as HTMLElement).style.background ?? '');
    if (bg && !bg.includes('0.08')) {  // skip near-zero opacity cells
      await cell.hover();
      await page.waitForTimeout(200);
      await page.screenshot({ path: shot(`${themeLabel}-desktop-peakhours-hover`) });
      clicked = true;
      break;
    }
  }
  if (!clicked) {
    await cells.first().hover();
    await page.waitForTimeout(200);
    await page.screenshot({ path: shot(`${themeLabel}-desktop-peakhours-hover`) });
  }

  // Move away to dismiss
  await page.mouse.move(100, 100);
  await page.waitForTimeout(200);
}

async function checkWeeklyChartTooltip(page: Page, themeLabel: string) {
  // Find bar columns — look for the chart bars
  const bars = page.locator('[class*="WeeklyChart"], text=Тиждень')
    .first()
    .locator('div[style*="border-radius"]');

  const count = await bars.count();
  if (count === 0) {
    // Try by clicking inside any bar-like element near "Записи"
    console.log(`[${themeLabel}] WeeklyChart bars not found, trying generic click`);
    return;
  }

  await bars.first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: shot(`${themeLabel}-desktop-weeklychart-tooltip`) });

  // click again to dismiss
  await bars.first().click();
  await page.waitForTimeout(200);
}

async function checkFreeSlotsGrouping(page: Page, themeLabel: string) {
  // Check if Ранок/День/Вечір labels exist
  const morningLabel = page.getByText('Ранок').first();
  const hasGrouping  = await morningLabel.isVisible().catch(() => false);
  console.log(`[${themeLabel}] FreeSlotsWidget time grouping visible: ${hasGrouping}`);

  await page.screenshot({ path: shot(`${themeLabel}-desktop-freeslots`) });
}

async function checkQuickActions(page: Page, themeLabel: string) {
  const quickActionsTitle = page.getByText('Швидкі дії').first();
  const visible = await quickActionsTitle.isVisible().catch(() => false);
  if (!visible) {
    console.log(`[${themeLabel}] QuickActions not visible on current viewport`);
    return;
  }

  const container = quickActionsTitle.locator('..');
  await page.screenshot({ path: shot(`${themeLabel}-desktop-quickactions`) });
  console.log(`[${themeLabel}] QuickActions visible: true`);
}

// ─── Full inspection per theme ─────────────────────────────────────────────

async function inspectTheme(page: Page, theme: typeof THEMES[number]) {
  const { key, label } = theme;
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Inspecting: ${label} (data-theme="${key}")`);
  console.log(`${'─'.repeat(50)}`);

  // ── Desktop ──
  await page.setViewportSize(DESKTOP);
  await injectTheme(page, key);
  await waitForDashboard(page);

  // Full page screenshot
  await page.screenshot({ path: shot(`${label}-desktop-full`), fullPage: true });
  console.log(`[${label}] desktop full-page screenshot saved`);

  // Above the fold
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: shot(`${label}-desktop-atf`) });
  console.log(`[${label}] desktop above-fold screenshot saved`);

  // PeakHours
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  await page.waitForTimeout(200);
  await checkPeakHoursTooltip(page, label);

  // WeeklyChart
  await page.evaluate(() => window.scrollTo(0, 0));
  await checkWeeklyChartTooltip(page, label);

  // FreeSlotsWidget
  await checkFreeSlotsGrouping(page, label);

  // QuickActions
  await checkQuickActions(page, label);

  // ── Mobile ──
  await page.setViewportSize(MOBILE);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Full mobile screenshot
  await page.screenshot({ path: shot(`${label}-mobile-full`), fullPage: true });
  console.log(`[${label}] mobile full-page screenshot saved`);

  // Above fold mobile
  await page.screenshot({ path: shot(`${label}-mobile-atf`) });
  console.log(`[${label}] mobile above-fold screenshot saved`);

  // Restore desktop for next theme
  await page.setViewportSize(DESKTOP);
}

// ─── Main test ────────────────────────────────────────────────────────────

test('Visual inspection — all 3 dashboard themes', async ({ page }) => {
  // No timeout for this test — user needs time to log in
  test.setTimeout(0);

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });

  // If redirected to login — pause for manual login
  const url = page.url();
  if (url.includes('/login') || url.includes('/auth') || url.includes('/onboarding')) {
    console.log('\n🔐 Please log in manually in the browser, then press Resume in Playwright inspector.\n');
    await page.pause();
  }

  // Wait for dashboard to load
  await page.waitForURL(`${BASE}/dashboard**`, { timeout: 60_000 });
  await waitForDashboard(page);

  console.log('\n✅ Logged in. Starting visual inspection...\n');
  await page.screenshot({ path: shot('00-initial-state') });

  for (const theme of THEMES) {
    await inspectTheme(page, theme);
  }

  // Summary
  const files = fs.readdirSync(SHOTS_DIR).filter(f => f.endsWith('.png'));
  console.log(`\n✅ Done. ${files.length} screenshots saved to: ${SHOTS_DIR}`);
  console.log(files.map(f => `  · ${f}`).join('\n'));
});

// ─── Sticky sidebar check ─────────────────────────────────────────────────

test('Sticky sidebar spacing — scroll test', async ({ page }) => {
  test.setTimeout(0);

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });

  const url = page.url();
  if (url.includes('/login') || url.includes('/auth')) {
    console.log('\n🔐 Please log in manually, then press Resume.\n');
    await page.pause();
  }

  await page.waitForURL(`${BASE}/dashboard**`, { timeout: 60_000 });
  await waitForDashboard(page);

  for (const theme of THEMES) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await injectTheme(page, theme.key);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    // Scroll down to trigger sticky
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot(`${theme.label}-desktop-sticky-scroll`) });
    console.log(`[${theme.label}] sticky scroll screenshot saved`);

    // Check sticky element distance from top
    const topbarHeight = await page.evaluate(() => {
      const el = document.querySelector('[class*="topbar"], [class*="Topbar"], header') as HTMLElement | null;
      return el ? el.getBoundingClientRect().height : 60;
    });

    const stickyEls = page.locator('[style*="position: sticky"], [class*="sticky"]');
    const stickyCount = await stickyEls.count();
    console.log(`[${theme.label}] topbarHeight=${topbarHeight}px, sticky elements found: ${stickyCount}`);

    for (let i = 0; i < Math.min(stickyCount, 5); i++) {
      const el = stickyEls.nth(i);
      const rect = await el.boundingBox();
      if (rect) {
        const gapFromTopbar = rect.y - topbarHeight;
        console.log(`[${theme.label}] sticky[${i}] top=${rect.y.toFixed(0)}px, gap from topbar: ${gapFromTopbar.toFixed(0)}px`);
      }
    }
  }
});
