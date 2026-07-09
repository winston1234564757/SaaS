/**
 * 22 — Explore (public catalog)
 *
 * P0-TEST-2: /explore was covered only by smoke before. This exercises the full
 * conversion surface: search, category filter, sort modes, intent toggles,
 * grid/list view, pagination (needs > PAGE_SIZE masters — seeded via explore
 * fixtures) and geolocation (grant + deny paths).
 *
 * Public page — runs anonymously (no storageState).
 */
import { test, expect, type Page } from '@playwright/test';

const SEARCH_LABEL = 'Пошук майстрів за іменем, послугою або містом';

async function gotoExplore(page: Page) {
  await page.goto('/explore');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 15_000 });
}

test.describe('Explore — публічний каталог', () => {
  test('рендериться зі списком майстрів', async ({ page }) => {
    await gotoExplore(page);
    // Seeded explore fixtures rank into the first page → at least one is visible.
    // Generous timeout absorbs cold-server warm-up on the first navigation.
    await expect(page.getByText('E2E Explore Fixture', { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('пошук фільтрує; порожній результат → скидання', async ({ page }) => {
    await gotoExplore(page);
    const search = page.getByLabel(SEARCH_LABEL);

    // Gibberish → empty state
    await search.fill('zzzznobodyzzzz');
    await expect(page.getByText(/нікого не знайшли/i)).toBeVisible({ timeout: 10_000 });

    // Reset via the empty-state button
    await page.getByRole('button', { name: 'Скинути все' }).click();
    await expect(page.getByText(/нікого не знайшли/i)).toBeHidden();
    await expect(page.getByText('E2E Explore Fixture', { exact: false }).first()).toBeVisible();
  });

  test('фільтр за категорією (aria-pressed) + скидання «Усі»', async ({ page }) => {
    await gotoExplore(page);
    const group = page.getByRole('group', { name: 'Категорії' });

    const hair = group.getByRole('button', { name: /Волосся/ });
    await hair.click();
    await expect(hair).toHaveAttribute('aria-pressed', 'true');
    // Filtered count line renders when a filter is active.
    await expect(page.getByText(/майстр/i).first()).toBeVisible();

    await group.getByRole('button', { name: 'Усі' }).click();
    await expect(hair).toHaveAttribute('aria-pressed', 'false');
  });

  test('сортування через фільтри (radio aria-checked)', async ({ page }) => {
    await gotoExplore(page);
    await page.getByRole('button', { name: 'Відкрити фільтри' }).click();

    const byRating = page.getByRole('radio', { name: 'За рейтингом' });
    await expect(byRating).toBeVisible({ timeout: 10_000 });
    await byRating.click();
    await expect(byRating).toHaveAttribute('aria-checked', 'true');
  });

  test('intent-тогли (PRO, Завтра) перемикають aria-pressed', async ({ page }) => {
    await gotoExplore(page);

    const pro = page.getByRole('button', { name: 'PRO', exact: true });
    await pro.click();
    await expect(pro).toHaveAttribute('aria-pressed', 'true');
    await pro.click();
    await expect(pro).toHaveAttribute('aria-pressed', 'false');

    const tomorrow = page.getByRole('button', { name: 'Завтра', exact: true });
    await tomorrow.click();
    await expect(tomorrow).toHaveAttribute('aria-pressed', 'true');
  });

  test('перемикач вигляду сітка ↔ список', async ({ page }) => {
    await gotoExplore(page);
    const grid = page.getByRole('button', { name: 'Сітка' });
    const list = page.getByRole('button', { name: 'Список' });

    await list.click();
    await expect(list).toHaveAttribute('aria-pressed', 'true');
    await expect(grid).toHaveAttribute('aria-pressed', 'false');

    await grid.click();
    await expect(grid).toHaveAttribute('aria-pressed', 'true');
  });

  test('пагінація — «Показати ще» довантажує і зникає', async ({ page }) => {
    await gotoExplore(page);
    const loadMore = page.getByRole('button', { name: /Показати ще/ });
    // > PAGE_SIZE seeded masters → the button is present on first load.
    await expect(loadMore).toBeVisible({ timeout: 10_000 });
    await loadMore.click();
    // Total (~20) fits in two pages → after one click everything is loaded.
    await expect(loadMore).toBeHidden({ timeout: 10_000 });
  });

  test('гео — дозвіл активує «Поруч»', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 50.4501, longitude: 30.5234 }); // Kyiv
    await gotoExplore(page);

    const nearby = page.getByRole('button', { name: 'Поруч' });
    await nearby.click();
    await expect(nearby).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });
    // Results still render (distance-sorted).
    await expect(page.getByText('E2E Explore Fixture', { exact: false }).first()).toBeVisible();
  });

  test('гео — відмова показує повідомлення про блокування', async ({ page, context }) => {
    await context.clearPermissions(); // geolocation denied → error callback
    await gotoExplore(page);

    await page.getByRole('button', { name: 'Поруч' }).click();
    await expect(page.getByText(/Геолокацію заблоковано/i)).toBeVisible({ timeout: 10_000 });
  });
});
