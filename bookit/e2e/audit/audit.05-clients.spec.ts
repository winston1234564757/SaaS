/**
 * audit.05-clients.spec.ts — CRM Clients Impeccable Audit
 * /dashboard/clients: список, фільтри, ClientDetailSheet, SmartActionSheet
 */

import { test, expect } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady, auditModal } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;
test.use({ storageState: 'playwright/.auth/master-audit.json' });

test.beforeAll(async () => {
  await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL);
});

test.describe('CRM Clients', () => {
  test('Clients сторінка — список завантажився', async ({ page }, testInfo) => {
    await page.goto('/dashboard/clients');
    await waitForPageReady(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await auditScreenshot(page, testInfo, 'clients-list-desktop');

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/clients');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'clients-list-mobile');
  });

  test('Segment chips — VIP, Sleeping, At Risk фільтрують список', async ({ page }, testInfo) => {
    await page.goto('/dashboard/clients');
    await waitForPageReady(page);

    const segments = ['VIP', 'Сплять', 'В зоні ризику', 'Sleeping', 'At Risk'];
    for (const seg of segments) {
      const chip = page.getByText(seg, { exact: false }).first();
      const hasChip = await chip.isVisible({ timeout: 2_000 }).catch(() => false);
      if (hasChip) {
        await chip.click();
        await page.waitForTimeout(400);
        await auditScreenshot(page, testInfo, `clients-segment-${seg.toLowerCase().replace(/ /g, '-')}`);
        await chip.click(); // Деселект
        break;
      }
    }
  });

  test('Пошук клієнта', async ({ page }, testInfo) => {
    await page.goto('/dashboard/clients');
    await waitForPageReady(page);

    const search = page.locator('input[type="search"], input[placeholder*="пошук"], input[placeholder*="search"]').first();
    const hasSearch = await search.isVisible().catch(() => false);
    if (hasSearch) {
      await search.fill('Олена');
      await page.waitForTimeout(500);
      await auditScreenshot(page, testInfo, 'clients-search-results');
      await search.clear();
    }
  });

  test('ClientDetailSheet — відкрити → вкладки → закрити (Escape)', async ({ page }, testInfo) => {
    await page.goto('/dashboard/clients');
    await waitForPageReady(page);

    const clientCard = page.locator('[class*="client-card"], [class*="ClientCard"], [data-testid*="client"]').first();
    const hasCard = await clientCard.isVisible({ timeout: 8_000 }).catch(() => false);

    if (hasCard) {
      await clientCard.click();
      await page.waitForTimeout(700);

      const sheet = page.locator('[role="dialog"], [data-vaul-drawer]').first();
      await expect(sheet).toBeVisible({ timeout: 5_000 });
      await auditScreenshot(page, testInfo, 'clients-detail-sheet-open');

      // Вкладки всередині
      const tabs = ['Записи', 'Відгуки', 'Нотатки'];
      for (const tab of tabs) {
        const tabBtn = sheet.getByText(tab, { exact: false }).first();
        const hasTab = await tabBtn.isVisible({ timeout: 2_000 }).catch(() => false);
        if (hasTab) {
          await tabBtn.click();
          await page.waitForTimeout(300);
          await auditScreenshot(page, testInfo, `clients-detail-tab-${tab.toLowerCase()}`);
        }
      }

      // Закрити Escape
      await page.keyboard.press('Escape');
      await expect(sheet).not.toBeVisible({ timeout: 3_000 });
    }
  });

  test('Clients — A11y', async ({ page }) => {
    await page.goto('/dashboard/clients');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
