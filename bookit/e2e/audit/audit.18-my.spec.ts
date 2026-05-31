/**
 * audit.18-my.spec.ts — B2C Client Zone (/my/*) Impeccable Audit
 * /my/bookings, /my/profile, /my/loyalty, /my/notifications, /my/masters
 */
import { test, expect } from '@playwright/test';
import { auditScreenshot, checkA11y, waitForPageReady } from './helpers/auditHelpers';
import { switchTheme, getThemeFromProject } from './setup/themeSetup';

const MASTER_EMAIL = process.env.E2E_MASTER_AUDIT_EMAIL!;
const CLIENT_AUDIT_STATE = 'playwright/.auth/client-audit.json';

test.use({ storageState: CLIENT_AUDIT_STATE });

test.beforeAll(async () => {
  // Тема для /my/* зони визначається клієнтом — перемикаємо лише якщо потрібно
  // Для audit просто використовуємо тему проекту (застосовується до будь-якого зареєстрованого юзера)
  await switchTheme(getThemeFromProject(test.info().project.name), MASTER_EMAIL)
    .catch(() => {}); // OK якщо client account не має master_profile
});

test.describe('/my Bookings — клієнтська зона', () => {
  test('/my/bookings — список записів з статусами', async ({ page }, testInfo) => {
    await page.goto('/my/bookings');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await auditScreenshot(page, testInfo, 'my-bookings-mobile');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/my/bookings');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'my-bookings-desktop');
  });

  test('/my/bookings — картка запису → деталі', async ({ page }, testInfo) => {
    await page.goto('/my/bookings');
    await waitForPageReady(page);

    const bookingCard = page.locator('[class*="booking"], [data-testid*="booking"]').first();
    if (await bookingCard.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await bookingCard.click();
      await page.waitForTimeout(600);
      const modal = page.locator('[role="dialog"], [data-vaul-drawer]').first();
      if (await modal.isVisible().catch(() => false)) {
        await auditScreenshot(page, testInfo, 'my-booking-detail-modal');

        // Кнопка скасувати
        const cancelBtn = page.getByText(/скасувати|cancel/i).first();
        if (await cancelBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await auditScreenshot(page, testInfo, 'my-booking-cancel-button');
          // НЕ клікаємо — не скасовуємо реальний запис
        }
        await page.keyboard.press('Escape');
      }
    }
  });

  test('/my/profile — редагування профілю', async ({ page }, testInfo) => {
    await page.goto('/my/profile');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await auditScreenshot(page, testInfo, 'my-profile-mobile');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/my/profile');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'my-profile-desktop');

    // Форма редагування
    const nameInput = page.locator('input[name*="name"], input[placeholder*="ім\'я"]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await expect(nameInput).toBeEnabled();
      await auditScreenshot(page, testInfo, 'my-profile-form');
    }
  });

  test('/my/loyalty — рівні лояльності та прогрес', async ({ page }, testInfo) => {
    await page.goto('/my/loyalty');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await auditScreenshot(page, testInfo, 'my-loyalty-mobile');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/my/loyalty');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'my-loyalty-desktop');
  });

  test('/my/notifications — in-app нотифікації', async ({ page }, testInfo) => {
    await page.goto('/my/notifications');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await auditScreenshot(page, testInfo, 'my-notifications-mobile');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/my/notifications');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'my-notifications-desktop');

    // Portfolio consent (якщо є)
    const consentCard = page.getByText(/портфоліо|portfolio|consent/i).first();
    if (await consentCard.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await auditScreenshot(page, testInfo, 'my-portfolio-consent');
      // Approve button (НЕ клікаємо — тільки знімок)
    }
  });

  test('/my/masters — мої майстри', async ({ page }, testInfo) => {
    await page.goto('/my/masters');
    await waitForPageReady(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await auditScreenshot(page, testInfo, 'my-masters-mobile');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/my/masters');
    await waitForPageReady(page);
    await auditScreenshot(page, testInfo, 'my-masters-desktop');
  });

  test('ChannelBanner — видимий якщо TG/Push відсутні', async ({ page }, testInfo) => {
    await page.goto('/my/bookings');
    await waitForPageReady(page);

    const banner = page.locator('[class*="channel-banner"], [class*="ChannelBanner"]').first();
    if (await banner.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await auditScreenshot(page, testInfo, 'my-channel-banner');

      // Закрити X
      const closeX = banner.locator('button').first();
      if (await closeX.isVisible().catch(() => false)) {
        await closeX.click();
        await page.waitForTimeout(400);
        await expect(banner).not.toBeVisible({ timeout: 3_000 });
      }
    }
  });

  test('/my — A11y', async ({ page }) => {
    await page.goto('/my/bookings');
    await waitForPageReady(page);
    await checkA11y(page);
  });
});
