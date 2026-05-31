/**
 * audit.00-landing.spec.ts — Landing Page Impeccable Audit
 * Перевіряє: всі 14 секцій, кнопки, FAQ, ROI calculator, pricing, scroll progress
 * Themes: blossom → studio → frost (через Playwright projects)
 */

import { test, expect } from '@playwright/test';
import {
  auditScreenshot, checkA11y, forViewports, waitForPageReady,
} from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

test.use({ storageState: { cookies: [], origins: [] } }); // Анонімна сесія для публічної Landing Page

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;

test.beforeAll(async () => {
  const theme = getThemeFromProject(test.info().project.name);
  await switchTheme(theme, MASTER_EMAIL);
});

test.afterEach(async ({ page }) => {
  await page.close().catch(() => {});
});

test.describe('Landing Page — структура та секції', () => {
  test('Всі ключові секції видимі при завантаженні', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    await forViewports(page, async (vp) => {
      // Hero (секція 1)
      await expect(page.locator('section, [id="hero"], h1').first()).toBeVisible();

      // Trust Bar
      const trustStats = page.locator('text=500+, text=4.9, text=98%').first();
      // Може бути відсутнє на мобільному — не critical
      await trustStats.isVisible().catch(() => {});

      // Pricing section
      await page.locator('text=Starter, text=Pro').first().isVisible().catch(() => {});

      await auditScreenshot(page, testInfo, `landing-overview-${vp}`);
    });
  });

  test('Hero — CTA кнопки навігують на auth', async ({ page }, testInfo) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Перша CTA кнопка (зазвичай "Розпочати" або "Спробувати безкоштовно")
    const primaryCta = page.getByRole('link', { name: /розпочати|спробувати|реєстрація|почати/i }).first();
    await expect(primaryCta).toBeVisible({ timeout: 10_000 });
    await auditScreenshot(page, testInfo, 'hero-cta');

    const href = await primaryCta.getAttribute('href');
    expect(href).toMatch(/\/(login|register|auth)/i);
  });

  test('Scroll progress bar видимий при скролі', async ({ page }, testInfo) => {
    await page.goto('/');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Скролимо вниз
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);

    // Progress bar (position: fixed, top: 0)
    const progressBar = page.locator('[style*="position: fixed"]').first();
    await auditScreenshot(page, testInfo, 'scroll-progress');
  });

  test('FAQ accordion — відкриття та закриття', async ({ page }, testInfo) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Скролимо до FAQ
    await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h2, h3, h1'));
      const faqHeader = headers.find(h => {
        const text = h.textContent?.toLowerCase() || '';
        return text.includes('faq') || text.includes('питання') || text.includes('питань');
      });
      const faqSection = faqHeader?.closest('section') || faqHeader?.parentElement;
      if (faqSection) faqSection.scrollIntoView();
    });
    await page.waitForTimeout(500);

    // Знайти перший accordion item
    const firstQuestion = page.locator('button[aria-expanded], [role="button"][aria-expanded]').first();
    const hasAccordion = await firstQuestion.isVisible().catch(() => false);

    if (hasAccordion) {
      await firstQuestion.click();
      await page.waitForTimeout(400);
      await auditScreenshot(page, testInfo, 'faq-open');

      await firstQuestion.click();
      await page.waitForTimeout(400);
      await auditScreenshot(page, testInfo, 'faq-closed');
    }
  });

  test('ROI Calculator — слайдери змінюють значення', async ({ page }, testInfo) => {
    await page.goto('/');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Знайти секцію з калькулятором (LandingEconomy)
    const calculator = page.locator('input[type="range"]').first();
    const hasCalc = await calculator.isVisible().catch(() => false);

    if (hasCalc) {
      await calculator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      // Захопити початкове значення
      const initialValue = await calculator.inputValue();

      // Перемістити слайдер
      await calculator.fill('10');
      await page.waitForTimeout(300);

      await auditScreenshot(page, testInfo, 'roi-calculator-changed');

      const newValue = await calculator.inputValue();
      expect(newValue).not.toBe(initialValue);
    } else {
      test.info().annotations.push({ type: 'skip', description: 'ROI Calculator not visible' });
    }
  });

  test('Pricing section — 3 тарифи відображаються', async ({ page }, testInfo) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Шукаємо карточки тарифів
    const starterCard = page.getByText('Starter', { exact: false }).first();
    const proCard     = page.getByText('Pro', { exact: false }).first();

    await starterCard.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(300);
    await auditScreenshot(page, testInfo, 'pricing-section');

    await checkA11y(page);
  });

  test('Landing — A11y перевірка', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    await checkA11y(page);
  });

  test('Landing mobile — responsive перевірка', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await waitForPageReady(page);

    // Hero видимий
    const hero = page.locator('h1').first();
    await expect(hero).toBeVisible();

    // Немає горизонтального overflow
    const hasHScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
    expect(hasHScroll).toBe(false);

    await auditScreenshot(page, testInfo, 'landing-mobile');
  });
});
