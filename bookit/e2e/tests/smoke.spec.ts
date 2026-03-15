import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';
import { ExplorePage } from '../pages/ExplorePage';

test.describe('Smoke — публічні сторінки', () => {
  test('Головна сторінка рендериться і має h1', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(page).toHaveTitle(/Bookit/);
    await expect(landing.heading).toBeVisible();
    await expect(landing.heading).toContainText('booking-сторінка');
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
    await expect(page).toHaveURL(/\/register/, { timeout: 15_000 });
  });
});
