import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { DashboardPage } from '../pages/DashboardPage';
import { ServicesPage } from '../pages/ServicesPage';

const hasMasterState = fs.existsSync('playwright/.auth/master.json');

// Unique suffix per test run to avoid list collisions
const RUN_ID = Date.now().toString().slice(-6);

test.describe('Master Dashboard', () => {
  test('відображає дашборд після авторизації', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(dashboard.heading).toBeVisible({ timeout: 10_000 });

    await context.close();
  });
});

test.describe('Services CRUD', () => {
  test('сторінка послуг рендериться з h1 та табами', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const services = new ServicesPage(page);

    await services.goto();
    await expect(services.heading).toBeVisible();
    await expect(services.heading).toContainText('Послуги та товари');
    await expect(services.servicesTab).toBeVisible();
    await expect(services.productsTab).toBeVisible();
    await expect(services.fab).toBeVisible();

    await context.close();
  });

  test('створення нової послуги → з\'являється у списку', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const services = new ServicesPage(page);
    const serviceName = `E2E Тест Послуга ${RUN_ID}`;

    await services.goto();
    await services.addService(serviceName, 500);

    // Verify appears in the list
    await expect(page.getByText(serviceName)).toBeVisible({ timeout: 10_000 });

    await context.close();
  });

  test('валідація форми послуги: порожня назва показує помилку', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const services = new ServicesPage(page);

    await services.goto();
    await services.openServiceForm();
    // Submit without filling name
    await services.serviceSubmitBtn.click();

    await expect(page.getByText('Вкажіть назву послуги')).toBeVisible();
    // Sheet stays open
    await expect(services.serviceSheetTitle).toBeVisible();

    await context.close();
  });
});

test.describe('Products CRUD', () => {
  test('створення нового товару → з\'являється у списку', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const services = new ServicesPage(page);
    const productName = `E2E Тест Товар ${RUN_ID}`;

    await services.goto();
    await services.addProduct(productName, 150);

    // Verify appears in the list
    await expect(page.getByText(productName)).toBeVisible({ timeout: 10_000 });

    await context.close();
  });

  test('валідація форми товару: порожня назва показує помилку', async ({ browser }) => {
    test.skip(!hasMasterState, 'Немає playwright/.auth/master.json');

    const context = await browser.newContext({ storageState: 'playwright/.auth/master.json' });
    const page = await context.newPage();
    const services = new ServicesPage(page);

    await services.goto();
    await services.openProductForm();
    await services.productSubmitBtn.click();

    await expect(page.getByText('Вкажіть назву товару')).toBeVisible();
    await expect(services.productSheetTitle).toBeVisible();

    await context.close();
  });
});
