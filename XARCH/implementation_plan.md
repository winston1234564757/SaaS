# Implementation Plan: Inventory & Financial Intelligence (BookIT PRO)

Цей план описує архітектурний перехід BookIT до повноцінної ERP-системи. Основна увага приділяється точності складського обліку (мл/г), фінансовій аналітиці (Net Profit) та прогностиці.

## User Review Required

> [!IMPORTANT]
> **Renaming Strategy**: Ми перейменовуємо таблицю `products` на `inventory_items`, щоб відобразити її нову роль. Це вимагатиме оновлення всіх посилань у коді (Actions, Hooks, Components).
> **Moving Average Logic**: Розрахунок середньозваженої ціни буде реалізовано на рівні PostgreSQL Trigger для забезпечення консистентності даних незалежно від того, як виконується закупівля.

## Proposed Changes

### 1. Database Layer (Supabase / PostgreSQL)

#### [MODIFY] [SQL Migration] `supabase/migrations/0120_inventory_system.sql`
- Перейменування `products` -> `inventory_items`.
- Додавання колонок:
  - `type` (consumable / for_sale)
  - `unit` (ml, gram, piece, unit)
  - `cost_per_unit` (numeric, Moving Weighted Average)
  - `stock_qty` (numeric для точності мл/г)
  - `is_upsell_enabled` (boolean)
  - `upsell_service_ids` (uuid[])
- Створення таблиці `inventory_transactions`:
  - `item_id`, `type` (in, out, sale, usage, correction), `qty_delta`, `cost_at_moment` (snapshot), `booking_id`, `order_id`.
- Створення таблиці `service_recipes`:
  - `service_id`, `item_id`, `quantity_required`.
- Модифікація `bookings`:
  - `cogs_total` (integer, коп.), `net_profit` (integer, коп.).
- **Trigger `fn_update_moving_average`**:
  - При `INSERT` в `inventory_transactions` з типом `in`:
    - `new_cost = ((current_stock * current_avg) + (new_qty * new_cost)) / (current_stock + new_qty)`.

---

### 2. Core Logic (Actions)

#### [MODIFY] [createBooking.ts](file:///c:/Users/Vitossik/SaaS/bookit/src/lib/actions/createBooking.ts)
- Оновлення валідації залишків: тепер перевіряємо `numeric` залишки (мл/г).
- Додавання підтримки `upsell_items` при створенні запису.

#### [MODIFY] [bookings/actions.ts](file:///c:/Users/Vitossik/SaaS/bookit/src/app/%28master%29/dashboard/bookings/actions.ts)
- **`completeBooking`**:
  1. Отримує рецепти для всіх `booking_services`.
  2. Для кожного матеріалу в рецепті:
     - Виконує `usage` транзакцію.
     - Копіює поточний `cost_per_unit` в `cost_at_moment`.
  3. Для товарів, що були продані в записі:
     - Те саме (вже частково є, але тепер з фіксацією вартості).
  4. Обчислює `COGS = Sum(transactions.cost_at_moment * qty)`.
  5. Оновлює запис: `net_profit = total_price - cogs_total`.

#### [NEW] [inventory.ts](file:///c:/Users/Vitossik/SaaS/bookit/src/lib/actions/inventory.ts)
- `getPredictiveStock(days: 14)`:
  - Сканує `bookings` на наступні 14 днів.
  - Розраховує потребу за `service_recipes`.
  - Повертає список дефіцитних позицій.

---

### 3. UI Components (Master Dashboard)

#### [MODIFY] `InventoryPage.tsx`
- Відображення типу та юнітів.
- Історія транзакцій з ціною закупівлі.

#### [NEW] `RecipeEditor.tsx`
- Компонент у налаштуваннях послуги для додавання розхідників.

#### [MODIFY] `AnalyticsPage.tsx`
- Додавання графіку "Net Profit vs Revenue".

---

## Claude Code Execution Prompt

```text
Act as a Senior Backend Architect. Implement the Inventory & Financial Intelligence System for BookIT.

Step 1: SQL Migration
- Rename 'products' to 'inventory_items'.
- Add 'type' (enum), 'unit' (enum), 'cost_per_unit' (numeric), 'is_upsell_enabled' (bool), 'upsell_service_ids' (uuid[]).
- Create 'inventory_transactions' with 'cost_at_moment'.
- Create 'service_recipes' (service_id, item_id, quantity_required).
- Add 'cogs_total' and 'net_profit' to 'bookings'.
- Implement PG Trigger for Moving Weighted Average on Supply (type='in').

Step 2: Database Types
- Update 'src/types/database.ts' to reflect all new fields and tables.

Step 3: Core Actions Refactoring
- Rename 'products/actions.ts' to 'inventory/actions.ts' and update all imports.
- In 'completeBooking', implement automatic deduction logic:
  - Fetch recipes for booking services.
  - Insert 'usage' transactions fixing 'cost_at_moment'.
  - Calculate COGS and update booking row.

Step 4: The Oracle Logic
- Implement 'getPredictiveStock' action in 'inventory.ts'.
- Fetch bookings for next 14 days, aggregate required consumables via recipes, compare with current stock.

Step 5: PWA Upsell Bridge
- Update 'useProducts.ts' hook and Shop components to filter products based on 'is_upsell_enabled' and 'upsell_service_ids' when a service is selected.

Follow 'AIDEVELOPER.md' standards: no 'any', use 'createAdminClient' for DB triggers/logic, revalidate paths.
```

## Verification Plan

### Automated Tests
- `vitest` для `pricing.ts` (додати тести для COGS).
- Перевірка атомарності списання при конкурентних запитах.

### Manual Verification
1. Створити товар, зробити 2 закупівлі за різною ціною. Перевірити `cost_per_unit`.
2. Створити послугу з рецептом (напр. 60мл фарби).
3. Завершити запис (`completeBooking`).
4. Перевірити: залишок зменшився, транзакція створена, в `bookings` з'явився `net_profit`.
5. Перевірити "Oracle": чи з'являється попередження, якщо на завтра заплановано більше послуг, ніж є фарби.
