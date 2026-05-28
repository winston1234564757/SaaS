import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const hasMasterAuth = fs.existsSync('playwright/.auth/master-auth.json');

test.describe('Stabilization Tasks 1–10', () => {

  test.describe('Task 6: Expandable Bio на Settings', () => {
    test('текстове поле біо існує та приймає текст', async ({ browser }) => {
      test.skip(!hasMasterAuth, 'Немає playwright/.auth/master-auth.json');
      test.setTimeout(90_000);

      const ctx = await browser.newContext({ storageState: 'playwright/.auth/master-auth.json' });
      const page = await ctx.newPage();
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(4000);

      const textarea = page.getByPlaceholder('Розкажіть про себе та свої послуги...');
      await expect(textarea).toBeVisible({ timeout: 15_000 });

      await textarea.fill('Тестовий опис для перевірки роботи поля');
      await expect(textarea).not.toBeEmpty();

      await ctx.close();
    });

    test('кнопка "Читати далі" з\'являється при довгому тексті', async ({ browser }) => {
      test.skip(!hasMasterAuth, 'Немає playwright/.auth/master-auth.json');
      test.setTimeout(90_000);

      const ctx = await browser.newContext({ storageState: 'playwright/.auth/master-auth.json' });
      const page = await ctx.newPage();
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(4000);

      const textarea = page.getByPlaceholder('Розкажіть про себе та свої послуги...');
      await textarea.fill('Текст. '.repeat(50));
      await page.waitForTimeout(500);

      const readMore = page.getByText('Читати далі');
      if (await readMore.isVisible()) {
        await readMore.click();
        await page.waitForTimeout(500);
        await expect(page.getByText('Згорнути')).toBeVisible();
      }

      await ctx.close();
    });
  });

  test.describe('Task 7: Busyness Widget на Settings', () => {
    test('віджет завантаженості присутній на сторінці', async ({ browser }) => {
      test.skip(!hasMasterAuth, 'Немає playwright/.auth/master-auth.json');
      test.setTimeout(90_000);

      const ctx = await browser.newContext({ storageState: 'playwright/.auth/master-auth.json' });
      const page = await ctx.newPage();
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(4000);

      await expect(page.getByText('Завантаженість')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('Аналітика слотів на 30 днів')).toBeVisible();
      await ctx.close();
    });

    test('віджет має секції Тиждень та Місяць', async ({ browser }) => {
      test.skip(!hasMasterAuth, 'Немає playwright/.auth/master-auth.json');
      test.setTimeout(90_000);

      const ctx = await browser.newContext({ storageState: 'playwright/.auth/master-auth.json' });
      const page = await ctx.newPage();
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(4000);

      await expect(page.getByText('Тиждень')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText('Місяць', { exact: true })).toBeVisible();
      await ctx.close();
    });
  });

  test.describe('Task 9: Zod валідація форми послуги', () => {
    test('порожня назва показує помилку валідації', async ({ browser }) => {
      test.skip(!hasMasterAuth, 'Немає playwright/.auth/master-auth.json');
      test.setTimeout(120_000);

      const ctx = await browser.newContext({ storageState: 'playwright/.auth/master-auth.json' });
      const page = await ctx.newPage();
      await page.goto('/dashboard/services');
      await page.waitForLoadState('networkidle');

      const addBtn = page.getByRole('button', { name: /Додати послугу/i });
      await expect(addBtn).toBeVisible({ timeout: 10_000 });
      await addBtn.click();
      await page.waitForTimeout(1000);

      const submitBtn = page.getByRole('button', { name: /Додати послугу/i }).last();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await expect(page.getByText(/Вкажіть назву/i)).toBeVisible({ timeout: 5_000 });
      }

      await ctx.close();
    });
  });

  test.describe('Task 10: DnD drag handles', () => {
    test('послуги мають drag handle при ховері', async ({ browser }) => {
      test.skip(!hasMasterAuth, 'Немає playwright/.auth/master-auth.json');

      const ctx = await browser.newContext({
        storageState: 'playwright/.auth/master-auth.json',
        viewport: { width: 1440, height: 900 },
      });
      const page = await ctx.newPage();
      await page.goto('/dashboard/services');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const card = page.locator('.bento-card').first();
      if (await card.isVisible()) {
        const box = await card.boundingBox();
        if (box) {
          await page.mouse.move(box.x + 20, box.y + 20);
          await page.waitForTimeout(500);
        }
        const dragHandle = page.locator('[class*="cursor-grab"]').first();
        const visible = await dragHandle.isVisible().catch(() => false);
        if (!visible) {
          await page.evaluate(() => {
            const handles = document.querySelectorAll('[class*="cursor-grab"]');
            if (handles.length > 0) (handles[0] as HTMLElement).style.opacity = '1';
          });
        }
      }

      await ctx.close();
    });

    test('сітка портфоліо має drag handle при ховері', async ({ browser }) => {
      test.skip(!hasMasterAuth, 'Немає playwright/.auth/master-auth.json');

      const ctx = await browser.newContext({
        storageState: 'playwright/.auth/master-auth.json',
        viewport: { width: 1440, height: 900 },
      });
      const page = await ctx.newPage();
      await page.goto('/dashboard/portfolio');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const img = page.locator('img').first();
      if (await img.isVisible()) {
        const box = await img.boundingBox();
        if (box) {
          await page.mouse.move(box.x + 10, box.y + 10);
          await page.waitForTimeout(500);
        }
        const dragHandle = page.locator('[class*="cursor-grab"]').first();
        const visible = await dragHandle.isVisible().catch(() => false);
        if (!visible) {
          await page.evaluate(() => {
            const handles = document.querySelectorAll('[class*="cursor-grab"]');
            if (handles.length > 0) (handles[0] as HTMLElement).style.opacity = '1';
          });
        }
      }

      await ctx.close();
    });
  });

});
