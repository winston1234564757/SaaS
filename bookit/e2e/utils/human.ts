/**
 * human.ts — утиліти для імітації дій живої людини в Playwright тестах.
 *
 * Замість миттєвого .fill() використовуємо посимвольний набір з
 * випадковими затримками 40-100ms між символами — як реальна людина.
 */
import { type Locator, type Page } from '@playwright/test';

/** Посимвольний набір тексту з людськими затримками. */
export async function humanType(locator: Locator, text: string): Promise<void> {
  await locator.click();
  // Очистити поле перед набором
  await locator.selectText().catch(() => locator.fill(''));
  await locator.fill('');
  for (const char of text) {
    await locator.pressSequentially(char, { delay: Math.random() * 60 + 40 });
  }
}

/**
 * Наведення миші перед кліком — людина завжди підводить курсор.
 * Додає невелику паузу після кліку.
 */
export async function humanClick(locator: Locator): Promise<void> {
  await locator.hover();
  await locator.page().waitForTimeout(Math.random() * 120 + 80);
  await locator.click();
}

/**
 * Пауза "людина думає" — від 300 до 800 ms.
 * Використовувати між логічними блоками дій.
 */
export async function think(page: Page, min = 300, max = 800): Promise<void> {
  await page.waitForTimeout(Math.random() * (max - min) + min);
}

/**
 * Плавний скрол до елемента + пауза перед взаємодією.
 */
export async function scrollAndFocus(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.page().waitForTimeout(200);
}
