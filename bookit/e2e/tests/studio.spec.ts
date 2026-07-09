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

const MASTER_STATE = 'playwright/.auth/master-crm.json';
const hasMasterState = fs.existsSync(MASTER_STATE);

test.describe('Studio coming-soon page', () => {
  test.skip(!hasMasterState, 'Немає playwright/.auth/master-crm.json');

  test('відображає заголовок та бейдж "У розробці"', async ({ browser }) => {
    const context = await browser.newContext({ storageState: MASTER_STATE });
    const page = await context.newPage();
    const studio = new StudioPage(page);

    await studio.goto();

    await expect(studio.heading).toBeVisible({ timeout: 10_000 });
    await expect(studio.badge).toBeVisible();
    await context.close();
  });

  test('відображає список переваг студії', async ({ browser }) => {
    const context = await browser.newContext({ storageState: MASTER_STATE });
    const page = await context.newPage();
    const studio = new StudioPage(page);

    await studio.goto();

    await expect(studio.featuresList).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Спільна аналітика')).toBeVisible();
    await expect(page.getByText('Сторінка салону')).toBeVisible();
    await context.close();
  });

  test('кнопка заявки в бету видима', async ({ browser }) => {
    const context = await browser.newContext({ storageState: MASTER_STATE });
    const page = await context.newPage();
    const studio = new StudioPage(page);

    await studio.goto();

    await expect(studio.waitlistButton).toBeVisible({ timeout: 10_000 });
    await expect(studio.waitlistButton).toBeEnabled();
    await context.close();
  });
});
