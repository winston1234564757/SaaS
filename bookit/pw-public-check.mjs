/**
 * pw-public-check.mjs
 * Batch 4 visual check — public pages across 3 themes × 2 viewports.
 *
 * Theme is forced client-side via `document.documentElement.setAttribute('data-theme', key)`.
 * No login required — all tested pages are public.
 *
 * Pages tested per theme+viewport:
 *   /explore
 *   /[slug]
 *   /[slug]/shop
 *   /[slug]/portfolio
 *   /[slug]/portfolio/[first-id]  (if any items found)
 *
 * Usage: node pw-public-check.mjs
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://bookit-five-psi.vercel.app';
const OUT_DIR  = 'pw-public-visual';

const THEMES = [
  { key: '',       label: 'Blossom' },
  { key: 'studio', label: 'Studio'  },
  { key: 'frost',  label: 'Frost'   },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile',  width: 390,  height: 844 },
];

mkdirSync(OUT_DIR, { recursive: true });

// ── Launch headless=false so we can see what's happening ─────────────────────
const browser = await chromium.launch({
  channel:  'chrome',
  headless: false,
  args: ['--disable-blink-features=AutomationControlled', '--no-first-run'],
});

const ctx  = await browser.newContext({ locale: 'uk-UA', timezoneId: 'Europe/Kyiv' });
const page = await ctx.newPage();

// ── Step 1: Discover a real master slug from /explore ────────────────────────
console.log('🔍  Шукаю slug майстра через /explore...');
await page.goto(`${BASE_URL}/explore`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
await page.waitForTimeout(1500);

const slug = await page.evaluate((base) => {
  // Find links like /some-slug (one segment, not a known route)
  const KNOWN = new Set(['explore', 'studio', 'my', 'login', 'register', 'r',
                         'dashboard', 'onboarding', 'pricing', 'about']);
  for (const a of document.querySelectorAll('a[href]')) {
    try {
      const u    = new URL(a.href);
      if (u.origin !== base) continue;
      const segs = u.pathname.split('/').filter(Boolean);
      if (segs.length === 1 && !KNOWN.has(segs[0])) return segs[0];
    } catch {}
  }
  return null;
}, BASE_URL);

if (!slug) {
  console.error('❌  Не знайдено жодного slug майстра на /explore. Перевір деплой.');
  await browser.close();
  process.exit(1);
}
console.log(`✅  Знайдено slug: ${slug}\n`);

// ── Step 2: Find first portfolio item id ─────────────────────────────────────
console.log('📂  Шукаю portfolio item id...');
await page.goto(`${BASE_URL}/${slug}/portfolio`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});

const portfolioItemId = await page.evaluate(({ origin, s }) => {
  for (const a of document.querySelectorAll('a[href]')) {
    try {
      const u = new URL(a.href);
      if (u.origin !== origin) continue;
      const segs = u.pathname.split('/').filter(Boolean);
      // pattern: /{slug}/portfolio/{id}
      if (segs.length === 3 && segs[0] === s && segs[1] === 'portfolio') return segs[2];
    } catch {}
  }
  return null;
}, { origin: BASE_URL, s: slug });

if (portfolioItemId) {
  console.log(`✅  Знайдено portfolio item: ${portfolioItemId}\n`);
} else {
  console.log('ℹ️  Портфоліо порожнє — пропускаю /portfolio/[id]\n');
}

// ── Build page list ───────────────────────────────────────────────────────────
const PAGES = [
  { id: 'explore',         path: '/explore',                         scroll: [0, 400] },
  { id: 'master',          path: `/${slug}`,                         scroll: [0, 600] },
  { id: 'shop',            path: `/${slug}/shop`,                    scroll: [0, 400] },
  { id: 'portfolio-grid',  path: `/${slug}/portfolio`,               scroll: null     },
  ...(portfolioItemId
    ? [{ id: 'portfolio-item', path: `/${slug}/portfolio/${portfolioItemId}`, scroll: null }]
    : []),
];

// ── Helper: force theme on current page ──────────────────────────────────────
async function forceTheme(key) {
  await page.evaluate((k) => {
    if (k) {
      document.documentElement.setAttribute('data-theme', k);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    // Force repaint
    document.body.style.transition = 'none';
    void document.body.offsetHeight;
  }, key);
  await page.waitForTimeout(200);
}

// ── Helper: screenshot one page in one theme+viewport ────────────────────────
async function shotPage(p, theme, vp) {
  await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 25_000 });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(800);

  await forceTheme(theme.key);

  // ATF screenshot (above-the-fold only)
  const nameAtf = `${p.id}--${theme.label.toLowerCase()}--${vp.name}--atf.png`;
  await page.screenshot({ path: join(OUT_DIR, nameAtf) });

  // Full-page screenshot
  const nameFull = `${p.id}--${theme.label.toLowerCase()}--${vp.name}--full.png`;
  await page.screenshot({ path: join(OUT_DIR, nameFull), fullPage: true });

  // Mid-scroll shot (mobile only — shows the card/content area)
  if (vp.name === 'mobile' && p.scroll) {
    const [sx, sy] = p.scroll;
    await page.evaluate(([x, y]) => window.scrollTo(x, y), [sx, sy]);
    await page.waitForTimeout(300);
    const nameMid = `${p.id}--${theme.label.toLowerCase()}--mobile--mid.png`;
    await page.screenshot({ path: join(OUT_DIR, nameMid) });
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  return nameAtf;
}

// ── Main loop ─────────────────────────────────────────────────────────────────
let count = 0;

for (const theme of THEMES) {
  console.log(`\n━━━ ${theme.label.toUpperCase()} ━━━`);

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const p of PAGES) {
      const out = await shotPage(p, theme, vp);
      count++;
      console.log(`  [${String(count).padStart(2)}] ${theme.label.padEnd(8)} ${vp.name.padEnd(8)} ${p.id.padEnd(18)} → ${out}`);
    }
  }
}

console.log(`\n✅  Готово! ${count} пар скриншотів у ./${OUT_DIR}/`);
console.log(`   ATF + full-page на кожну комбінацію. Mid-scroll — тільки mobile.`);

await ctx.close();
await browser.close();
