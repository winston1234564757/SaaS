/**
 * E2E тести для модуля Studio (режим "coming soon" + Waitlist).
 *
 * Перевіряють:
 *   - сторінка відображає "coming soon" контент
 *   - бейдж "У розробці" видимий
 *   - кнопка Waitlist видима
 *   - список переваг відображається
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { StudioPage } from '../pages/StudioPage';

const hasMasterState = fs.existsSync('playwright/.auth/master.json');

test.describe('Studio coming-soon page', () => {
  test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

  test('відображає заголовок та бейдж "У розробці"', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const studio = new StudioPage(page);

    await studio.goto();

    await expect(studio.heading).toBeVisible({ timeout: 10_000 });
    await expect(studio.badge).toBeVisible();
    await context.close();
  });

  test('відображає список переваг студії', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const studio = new StudioPage(page);

    await studio.goto();

    await expect(studio.featuresList).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Зведена аналітика')).toBeVisible();
    await expect(page.getByText('Спільна сторінка салону')).toBeVisible();
    await context.close();
  });

  test('кнопка Waitlist видима', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const studio = new StudioPage(page);

    await studio.goto();

    await expect(studio.waitlistButton).toBeVisible({ timeout: 10_000 });
    await expect(studio.waitlistButton).toBeEnabled();
    await context.close();
  });
});
