import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';
import { ExplorePage } from '../pages/ExplorePage';

test.describe('Smoke — публічні сторінки', () => {
  test.setTimeout(60_000); // slowMo + networkidle on landing can take 30s+

  test('Головна сторінка рендериться і має h1', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(page).toHaveTitle(/Bookit/);
    await expect(landing.heading).toBeVisible();
    // Перевіряємо що h1 не порожній (текст залежить від версії лендінгу)
    const headingText = await landing.heading.textContent();
    expect(headingText?.trim().length).toBeGreaterThan(0);
  });

  test('Сторінка /explore рендериться і має h1', async ({ page }) => {
    const explore = new ExplorePage(page);
    await explore.goto();

    await expect(page).toHaveTitle(/Bookit/);
    await expect(explore.heading).toBeVisible();
    await expect(explore.heading).toContainText('Красота поруч');
  });

  test('Навігація з головної до /explore', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await landing.navExploreLink.click();
    await expect(page).toHaveURL(/\/explore/);
  });

  test('Навігація з головної до /login', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await landing.navLoginLink.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test('Навігація з головної до /register', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await landing.navRegisterLink.click();
    // It might redirect to /login if unified auth is active
    await expect(page).toHaveURL(/\/(register|login)/, { timeout: 15_000 });
  });
});
