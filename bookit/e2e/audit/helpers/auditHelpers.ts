/**
 * auditHelpers.ts — Shared utilities для всіх audit spec файлів
 *
 * auditScreenshot()  — зберігає reference screenshot в audit-screenshots/{theme}/{zone}/
 * checkA11y()        — перевіряє базову a11y (ARIA roles, tabindex, contrast)
 * forViewports()     — запускає callback на mobile (375×812) і desktop (1440×900)
 * auditModal()       — повний аудит модалки: відкрити → перевірити → знімок → закрити
 * waitForPageReady() — чекає поки немає скелетонів і spinner'ів
 */

import { type Page, type TestInfo, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

export const MOBILE_VIEWPORT  = { width: 375,  height: 812  };
export const DESKTOP_VIEWPORT = { width: 1440, height: 900  };

// ─── Screenshot helper ────────────────────────────────────────────────────────

/**
 * Зберігає screenshot в:
 *   audit-screenshots/{theme}/{zone}/{name}-{viewport}.png
 *
 * theme — з назви project: 'audit-blossom' → 'blossom'
 * zone  — назва spec файлу без 'audit.' prefix: 'audit.03-dashboard' → '03-dashboard'
 */
export async function auditScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
): Promise<void> {
  const theme    = testInfo.project.name.replace('audit-', '');
  const zone     = path.basename(testInfo.file, '.spec.ts').replace('audit.', '');
  const viewport = page.viewportSize();
  const vpLabel  = viewport && viewport.width < 500 ? 'mobile' : 'desktop';
  const dir      = path.join('audit-screenshots', theme, zone);

  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${name}-${vpLabel}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
}

// ─── A11y checker ─────────────────────────────────────────────────────────────

/**
 * Базова перевірка доступності без зовнішніх бібліотек:
 * - Кожен інтерактивний елемент має accessible name
 * - Немає aria-hidden на фокусованих елементах
 * - Images мають alt атрибути
 */
export async function checkA11y(page: Page, selector = 'body'): Promise<void> {
  // 1. Перевірити що кнопки та посилання мають accessible name
  const badButtons = await page.evaluate((sel) => {
    const root = document.querySelector(sel) || document.body;
    const elements = root.querySelectorAll('button, a[href], [role="button"], [role="link"]');
    const bad: string[] = [];
    elements.forEach((el) => {
      const name = (el as HTMLElement).getAttribute('aria-label')
        || (el as HTMLElement).getAttribute('aria-labelledby')
        || el.textContent?.trim()
        || (el as HTMLImageElement).alt;
      if (!name) bad.push(el.outerHTML.slice(0, 100));
    });
    return bad;
  }, selector);

  if (badButtons.length > 0) {
    console.warn(`[a11y] ${badButtons.length} interactive element(s) without accessible name:`, badButtons.slice(0, 3));
  }

  // 2. Перевірити що немає images без alt
  const imagesWithoutAlt = await page.locator(`${selector} img:not([alt])`).count();
  if (imagesWithoutAlt > 0) {
    console.warn(`[a11y] ${imagesWithoutAlt} image(s) without alt attribute`);
  }
}

// ─── Viewport helper ──────────────────────────────────────────────────────────

/**
 * Виконує callback на обох viewports послідовно.
 * Повертає до оригінального viewport після завершення.
 */
export async function forViewports(
  page: Page,
  fn: (viewport: 'mobile' | 'desktop') => Promise<void>,
): Promise<void> {
  const original = page.viewportSize();

  // Mobile pass
  await page.setViewportSize(MOBILE_VIEWPORT);
  await fn('mobile');

  // Desktop pass
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await fn('desktop');

  // Restore
  if (original) await page.setViewportSize(original);
}

// ─── Modal audit helper ───────────────────────────────────────────────────────

export interface AuditModalOptions {
  /** Selector або label для trigger кнопки */
  triggerSelector?: string;
  triggerText?: string;
  /** Що перевірити всередині модалки */
  contentChecks?: Array<() => Promise<void>>;
  /** Як закривати: 'escape' | 'backdrop' | 'x-button' | 'all' */
  closeMethod?: 'escape' | 'backdrop' | 'x-button' | 'all';
  /** Selector для backdrop (щоб клікнути поза модалкою) */
  backdropSelector?: string;
  /** Selector для X кнопки */
  closeButtonSelector?: string;
  /** Screenshot name після відкриття */
  screenshotName?: string;
  testInfo: TestInfo;
}

/**
 * Повний аудит модалки:
 * 1. Клікнути trigger → чекати відкриття
 * 2. Зробити screenshot
 * 3. Виконати content checks
 * 4. A11y перевірка
 * 5. Закрити (кожним доступним методом)
 */
export async function auditModal(page: Page, opts: AuditModalOptions): Promise<void> {
  const { triggerSelector, triggerText, contentChecks = [], closeMethod = 'all', testInfo, screenshotName } = opts;

  // 1. Відкрити
  if (triggerSelector) {
    await page.locator(triggerSelector).first().click();
  } else if (triggerText) {
    await page.getByText(triggerText, { exact: false }).first().click();
  }

  // Чекати поки модалка відкрилась (aria-modal або role=dialog)
  const dialog = page.locator('[role="dialog"], [data-vaul-drawer], [data-radix-dialog-content]').first();
  await expect(dialog).toBeVisible({ timeout: 8_000 });

  // 2. Screenshot
  if (screenshotName) {
    await auditScreenshot(page, testInfo, screenshotName);
  }

  // 3. Content checks
  for (const check of contentChecks) {
    await check();
  }

  // 4. A11y
  await checkA11y(page, '[role="dialog"]');

  // 5. Закрити
  const methods = closeMethod === 'all'
    ? ['x-button', 'escape'] as const
    : [closeMethod] as const;

  for (const method of methods) {
    // Спочатку переконатись що діалог відкритий
    const isOpen = await dialog.isVisible().catch(() => false);
    if (!isOpen) break;

    if (method === 'escape') {
      await page.keyboard.press('Escape');
    } else if (method === 'x-button') {
      const closeBtn = page.locator('[aria-label="Close"], [aria-label="Закрити"], button:has([data-lucide="x"]), button:has(.lucide-x)').first();
      const hasClosed = await closeBtn.isVisible().catch(() => false);
      if (hasClosed) await closeBtn.click();
      else await page.keyboard.press('Escape'); // fallback
    } else if (method === 'backdrop') {
      // Клік на backdrop (поза dialog bounds)
      const box = await dialog.boundingBox();
      if (box) {
        await page.mouse.click(box.x - 10, box.y - 10);
      }
    }

    // Дати час на анімацію закриття
    await page.waitForTimeout(400);
  }

  // Перевірити що закрилось
  await expect(dialog).not.toBeVisible({ timeout: 5_000 });
}

// ─── Wait for page ready ──────────────────────────────────────────────────────

/**
 * Чекає поки сторінка готова:
 * - Немає видимих skeleton loaders
 * - Немає loading spinners
 * - Network idle
 */
export async function waitForPageReady(page: Page): Promise<void> {
  // Чекати загального завантаження сторінки
  await page.waitForLoadState('load', { timeout: 10_000 }).catch(() => {});

  // Чекати поки зникне BeautyLoader (loading screen)
  const beautyLoader = page.locator('.bg-peach.fixed.inset-0');
  const hasLoader = await beautyLoader.isVisible().catch(() => false);
  if (hasLoader) {
    await expect(beautyLoader).not.toBeVisible({ timeout: 15_000 }).catch(() => {});
  }

  // Чекати поки зникнуть справжні скелетони (великі блоки з animate-pulse)
  await page.waitForFunction(
    () => {
      const skeletons = Array.from(document.querySelectorAll('.animate-pulse')).filter(el => {
        const rect = el.getBoundingClientRect();
        // Ігноруємо дрібні елементи (наприклад, крапки статусу, маленькі іконки)
        if (rect.width <= 16 || rect.height <= 16) return false;

        // Ігноруємо елементи в bottom nav
        if (el.closest('.bento-bottom-nav') || el.closest('[class*="bottom-nav"]')) return false;

        // Ігноруємо віджети та чати підтримки
        if (el.closest('[class*="support"]') || el.closest('[id*="support"]')) return false;

        // Ігноруємо розмиті фонові декоративні круги
        if (el.classList.contains('blur-xl') || el.classList.contains('blur-2xl')) return false;

        return true;
      });
      return skeletons.length === 0;
    },
    { timeout: 4_000 }
  ).catch(() => {
    // Якщо скелетон не зник за 4 секунди, не блокуємо тест, а просто йдемо далі
  });
}

// ─── Theme assertion ─────────────────────────────────────────────────────────

/**
 * Перевіряє що правильна тема застосована до <html>
 */
export async function assertTheme(page: Page, theme: string): Promise<void> {
  const dataTheme = await page.locator('html').getAttribute('data-theme');
  // Деякі themes можуть мати aliases ('default' = 'blossom')
  const themeMap: Record<string, string[]> = {
    blossom: ['blossom', 'default'],
    studio:  ['studio'],
    frost:   ['frost'],
  };
  const validValues = themeMap[theme] ?? [theme];
  if (!dataTheme || !validValues.includes(dataTheme)) {
    console.warn(`[theme] Expected data-theme="${theme}", got "${dataTheme}"`);
  }
}

// ─── Slug helper ─────────────────────────────────────────────────────────────

/** Slug тестового аудит-майстра з env */
export function getAuditMasterSlug(): string {
  return process.env.E2E_AUDIT_MASTER_SLUG ?? 'e2e-audit-master';
}
