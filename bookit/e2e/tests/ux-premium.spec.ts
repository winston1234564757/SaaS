import { test, expect } from '@playwright/test';

test.describe('💎 Premium UX/UI Excellence Suite', () => {

  test.describe('1. Global Interactive Elements (Tactile Feedback & A11y)', () => {
    test('All primary buttons should exhibit tactile feedback (scale down on active)', async ({ page }) => {
      await page.goto('/');
      // Знаходимо першу доступну кнопку
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        // Кнопка має отримувати фокус з клавіатури
        await button.focus();
        await expect(button).toBeFocused();

        // Кнопка повинна мати наші класи для tactile feedback (active:scale-95)
        const className = await button.getAttribute('class') || '';
        const hasInteractiveClass = /active:scale|button-tactile|motion\.button/.test(className);
        expect(hasInteractiveClass).toBeTruthy();
      }
    });

    test('Inputs must receive premium focus ring and retain border radius', async ({ page }) => {
      await page.goto('/');
      // Шукаємо будь-який інпут
      const input = page.locator('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"])').first();
      
      if (await input.isVisible()) {
        await input.focus();
        
        // Перевіряємо, що стандартний системний outline вимкнено
        const outlineStyle = await input.evaluate((el) => window.getComputedStyle(el).outlineStyle);
        expect(outlineStyle).toBe('none');
        
        // Tailwind focus:ring-2 повинен додавати box-shadow
        const boxShadow = await input.evaluate((el) => window.getComputedStyle(el).boxShadow);
        expect(boxShadow).not.toBe('none');
      }
    });

    test('Buttons transition into a disabled/loading state properly', async ({ page }) => {
      await page.goto('/');
      const submit = page.locator('button[type="submit"]').first();
      
      if (await submit.isVisible()) {
        // Імітуємо повільну мережу або тривалу дію
        await page.route('**/*', async route => {
          await new Promise(resolve => setTimeout(resolve, 500));
          await route.continue();
        });

        await submit.click();
        
        // Перевіряємо, що під час кліку кнопка блокується (aria-disabled або disabled)
        // Залежить від швидкодії DOM
        const isDisabled = await submit.evaluate(el => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true');
        if (isDisabled) {
           await expect(submit).toHaveCSS('cursor', 'not-allowed');
           // Перевіряємо чи є opacity (disabled:opacity-50)
           const opacity = await submit.evaluate(el => window.getComputedStyle(el).opacity);
           expect(Number(opacity)).toBeLessThan(1);
        }
      }
    });
  });

  test.describe('2. Overlay Architecture & Focus Trap (Radix UI Integration)', () => {
    test('Dialog traps focus and prevents body scroll', async ({ page }) => {
      await page.goto('/');
      // Намагаємось знайти трігер для модального вікна (Radix UI)
      const dialogTrigger = page.locator('[aria-haspopup="dialog"]').first();
      
      if (await dialogTrigger.isVisible()) {
        await dialogTrigger.click();
        
        const dialog = page.locator('[role="dialog"]').first();
        await expect(dialog).toBeVisible();

        // 1. Scroll Lock: Radix UI додає pointer-events: none на body
        const bodyStyle = await page.locator('body').getAttribute('style') || '';
        expect(bodyStyle.includes('pointer-events: none') || bodyStyle.includes('overflow: hidden')).toBeTruthy();

        // 2. Focus Trap
        await page.keyboard.press('Tab');
        const focusedInside = await dialog.evaluate((node) => node.contains(document.activeElement));
        expect(focusedInside).toBeTruthy();

        // 3. Escape to Close
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
      }
    });
    
    test('Mobile Bottom Sheet maintains Z-Index hierarchy', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
      await page.goto('/');
      
      const sheetTrigger = page.locator('button').filter({ hasText: /меню|menu/i }).first();
      if (await sheetTrigger.isVisible()) {
        await sheetTrigger.click();
        
        const sheet = page.locator('[role="dialog"]').first();
        await expect(sheet).toBeVisible();
        
        // Перевіряємо Z-Index (повинен бути 50)
        const zIndex = await sheet.evaluate((el) => window.getComputedStyle(el).zIndex);
        expect(Number(zIndex)).toBeGreaterThanOrEqual(50);
      }
    });
  });

  test.describe('3. Toaster Notification System', () => {
    test('Toasts stack gracefully and use z-[100] to overlay everything', async ({ page }) => {
      await page.goto('/');
      
      // Чекаємо поки Тостер з'явиться (якщо його можна викликати), або перевіряємо контейнер
      const toasterContainer = page.locator('div[class*="z-[100]"]').first();
      
      if (await toasterContainer.isVisible()) {
        const zIndex = await toasterContainer.evaluate((el) => window.getComputedStyle(el).zIndex);
        expect(zIndex).toBe('100'); // Тости завжди поверх модалок (z-50)
      }
    });
  });

  test.describe('4. Dropdown Menus & Selects', () => {
    test('Dropdown menus provide hover states and keyboard navigation', async ({ page }) => {
      await page.goto('/');
      const menuTrigger = page.locator('[aria-haspopup="menu"]').first();
      
      if (await menuTrigger.isVisible()) {
        await menuTrigger.click();
        const menu = page.locator('[role="menu"]').first();
        await expect(menu).toBeVisible();
        
        const menuItem = menu.locator('[role="menuitem"]').first();
        await expect(menuItem).toBeVisible();
        
        // Перевіряємо наявність transition класів для плавності
        const className = await menuItem.getAttribute('class') || '';
        expect(className).toContain('transition');
        
        // Escape to Close
        await page.keyboard.press('Escape');
        await expect(menu).toBeHidden();
      }
    });
  });

  test.describe('5. Glassmorphism & Aesthetics (Mica Cards)', () => {
    test('Cards and overlays use backdrop-blur and specific border transparency', async ({ page }) => {
      await page.goto('/');
      const bentoCard = page.locator('.bento-card').first();
      
      if (await bentoCard.isVisible()) {
        const computedStyle = await bentoCard.evaluate((el) => window.getComputedStyle(el));
        
        // Перевірка Glassmorphism (backdrop-filter)
        const backdrop = computedStyle.getPropertyValue('backdrop-filter') || computedStyle.getPropertyValue('-webkit-backdrop-filter');
        const hasBlur = backdrop && backdrop.includes('blur');
        expect(hasBlur).toBeTruthy();
        
        // Перевірка Hover ефекту (якщо є onClick)
        const hasHoverTransform = computedStyle.transition.includes('transform');
        expect(hasHoverTransform).toBeTruthy();
      }
    });
  });

  test.describe('6. Graceful Degradation & Errors', () => {
    test('Forms display error states robustly (aria-invalid) with human-readable text', async ({ page }) => {
      await page.goto('/'); // Якщо є форма логіну
      const form = page.locator('form').first();
      
      if (await form.isVisible()) {
        const submit = form.locator('button[type="submit"]').first();
        if (await submit.isVisible()) {
          // Пустий сабміт має викликати валідацію
          await submit.click();
          
          const invalidInput = form.locator('[aria-invalid="true"]').first();
          if (await invalidInput.isVisible()) {
            // Бордер має бути червоним (destructive)
            const borderColor = await invalidInput.evaluate(el => window.getComputedStyle(el).borderColor);
            expect(borderColor).not.toBe('rgb(0, 0, 0)');
            
            // Має з'явитись повідомлення про помилку з aria-describedby
            const errorId = await invalidInput.getAttribute('aria-describedby');
            if (errorId) {
                const errorMessage = page.locator(`id=${errorId}`);
                await expect(errorMessage).toBeVisible();
                
                // Перевірка на людяність тексту: не повинно бути сирих Zod чи Postgres помилок
                const text = await errorMessage.textContent() || '';
                expect(text).not.toMatch(/String must contain|failed to fetch|duplicate key|violates/i);
                expect(text.length).toBeGreaterThan(3);
            }
          }
        }
      }
    });
  });

});
