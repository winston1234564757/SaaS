# Розхідники — Feature Spec (T28)
> Дата: 2026-06-20 | Статус: APPROVED | Реалізація: T29 (DB+backend) + T30 (UX/UI)

---

## Проблема

Майстри бачать виручку, але не бачать реального прибутку. FinancesTab показує `materials_cost` на фіктивних даних — consumables є в DB, але немає жодного UX для їх ведення. Майстер не може відповісти: "Скільки я заробив цього місяця після фарби, лаку та оренди?"

---

## Що вже є (не перебудовувати)

| Актив | Розташування | Стан |
|---|---|---|
| `product_type: 'retail' \| 'consumable'` | таблиця `products` | є |
| `cost_kopecks` на products | `products` + ProductEditor UI | є |
| `auto_deduct` + тригер `decrement_product_stock_on_complete` | migration 139 | є |
| `product_service_links (product_id, service_id, quantity INT)` | таблиця + `useProductLinks` hook | є, потребує зміни типу quantity |
| `booking_products` table | bookings flow | є |
| `restockProduct()` / `adjustStock()` | `products/actions.ts` | є |
| Revenue Hub tab (nuqs `?tab=`) | `RevenueHubClient.tsx` | є |
| `WaterfallChart` (5 props, копійки) | `analytics/charts/WaterfallChart.tsx` | є |
| `get_analytics_extras` RPC, `scope: 'finances'` | Supabase | є |
| `useProductLinks` hook | `lib/supabase/hooks/useProductLinks.ts` | є |

---

## Scope: 5 модулів

### Модуль 1 — Таб "Розхідники" на сторінці Магазину
- `/dashboard/products` отримує новий таб "Розхідники" (фільтр `product_type = 'consumable'`)
- Розхідники = внутрішні матеріали (фарба, лак, шампунь) — НЕ для продажу клієнтам
- Доступно на всіх тарифах (включно зі Starter)

### Модуль 2 — Одиниці виміру + Кількість на зв'язках
- Нове поле `unit: 'pcs' | 'ml' | 'g'` на `products`
- `product_service_links.quantity` → NUMERIC(10,2) для підтримки дробових значень (50.5 мл)
- Картка розхідника відображає: linked services + скільки витрачається за послугу

### Модуль 3 — Перевірка матеріалів при завершенні запису
- "Завершити" → `MaterialsReviewSheet` (vaul BottomSheet)
- Список consumables для послуг запису (через RPC `get_consumables_for_booking`)
- Майстер може скоригувати кількість + додати ad-hoc розхідник зі складу
- "Підтвердити та завершити" → stock deducted + booking completed

### Модуль 4 — Revenue Hub "Фінанси" таб
- Новий main tab в `/dashboard/revenue?tab=finances`
- CRUD операційних витрат: оренда, комунальні, реклама, навчання, інструменти, інше
- Monthly P&L: Виручка − Матеріали − Операційні = Реальний дохід
- Pro only

### Модуль 5 — FinancesTab реальні дані
- `get_analytics_extras(scope='finances')` оновлюється з реальними даними
- `materials_cost` з `product_transactions` (consumable products)
- `operational_expenses_total` з нової `master_expenses` таблиці
- `net_profit` перераховується з усіма компонентами

---

## DB зміни (T29)

### 1. Додати `unit` до `products`
```sql
ALTER TABLE products
  ADD COLUMN unit TEXT NOT NULL DEFAULT 'pcs'
  CHECK (unit IN ('pcs', 'ml', 'g'));
```

### 2. `product_service_links.quantity` → NUMERIC(10,2)
```sql
ALTER TABLE product_service_links
  ALTER COLUMN quantity TYPE NUMERIC(10,2);
```

### 3. Нова таблиця `master_expenses`
```sql
CREATE TABLE master_expenses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id        UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  category         TEXT NOT NULL CHECK (category IN (
                     'rent', 'utilities', 'advertising',
                     'education', 'tools', 'other')),
  name             TEXT NOT NULL,
  amount_kopecks   INT NOT NULL CHECK (amount_kopecks > 0),
  expense_date     DATE NOT NULL,
  note             TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE master_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "master own expenses" ON master_expenses
  FOR ALL USING (
    master_id = (SELECT master_id FROM profiles WHERE id = auth.uid())
  );
CREATE INDEX idx_master_expenses_master_date
  ON master_expenses(master_id, expense_date DESC);
```

### 4. Оновити RPC `get_analytics_extras` (scope='finances')
- `materials_cost` = SUM(product.cost_kopecks × ABS(pt.qty_delta)) FROM product_transactions pt JOIN products p ON pt.product_id = p.id WHERE p.product_type = 'consumable' AND pt.type IN ('sale') AND pt.created_at BETWEEN p_start AND p_end
- Додати `operational_expenses_total` = SUM(amount_kopecks) FROM master_expenses WHERE master_id = p_master_id AND expense_date BETWEEN p_start AND p_end
- `net_profit` = services_revenue + products_revenue − materials_cost − discount_amount − operational_expenses_total

### 5. Новий RPC `get_consumables_for_booking(p_booking_id UUID)`
```sql
-- Returns consumables needed for all services in a booking
-- Joins: bookings → booking_services → product_service_links → products
-- Groups by product_id, sums quantities
-- Returns: product_id, name, unit, total_qty NUMERIC, cost_kopecks
```

---

## Серверні екшени (T29)

### `products/actions.ts` (розширити існуючі)
- `createProduct` / `updateProduct` приймають `unit` field

### Новий файл `revenue/expenses.actions.ts`
```typescript
createExpense(payload: ExpensePayload): Promise<{ error: string | null }>
updateExpense(id: string, payload: Partial<ExpensePayload>): Promise<{ error: string | null }>
deleteExpense(id: string): Promise<{ error: string | null }>
getExpenses(masterId: string, month?: string): Promise<MasterExpense[]>
```

### `bookings/actions.ts` (розширити `completeBooking`)
```typescript
// Новий параметр:
completeBooking(bookingId: string, reviewedConsumables?: ReviewedConsumable[]): Promise<{ error: string | null }>
// reviewedConsumable = { product_id, qty_used }
// Логіка: для кожного → adjustment transaction → оновити stock_qty → потім complete booking
```

---

## UX Flow (T30)

### Products Page — Таб Розхідники
```
Empty state: [іконка] "Ваші матеріали та косметика" + кнопка "Додати розхідник"

ConsumableCard:
  [іконка] Фарба Wella                    [Поповнити]
  Залишок: 440 мл  ·  80 ₴/100 мл
  Використовується: 2 послуги

Restock → existing RestockDrawer (без змін)
Нова картка → /dashboard/products/new?type=consumable
```

### ProductEditor — Селектор одиниць
```
[Роздрібний продаж] [Розхідник] ← type selector

Якщо Розхідник:
  Одиниця виміру: [шт] [мл] [г]  ← segmented control
  Собівартість: [___] ₴ / [одиниця]
  Автосписання: [toggle]

Зв'язки з послугами:
  Каре-фарбування      [60] мл  [×]
  Базове фарбування    [40] мл  [×]
  [+ Додати послугу]
```

### ServiceEditor — Секція Матеріали
```
▼ Матеріали та розхідники

  [пошук розхідника...]
  Фарба Wella    [60] мл  [×]
  Окислювач      [10] мл  [×]
  [+ Додати матеріал]
```

### Booking Completion — MaterialsReviewSheet
```
┌─────────────────────────────────┐
│  Перевірте використані матеріали │
├─────────────────────────────────┤
│  Фарба Wella                    │
│  [−] 60 [+] мл                  │
│                                 │
│  Окислювач                      │
│  [−] 10 [+] мл                  │
│                                 │
│  [+ Додати зі складу]           │
├─────────────────────────────────┤
│  [Підтвердити та завершити]     │
└─────────────────────────────────┘
```

### Revenue Hub — Таб Фінанси (Pro only)
```
Tabs: [Флеш-акції] [Смарт-ціни] [Фінанси] ← новий

Зліва: Витрати
  Червень 2026
  [Оренда] Оренда кабінету   3 000 ₴  01.06
  [Реклама] Instagram Ads     500 ₴  05.06
  [+ Додати витрату]

  Категорії: [Оренда][Комунальні][Реклама][Навчання][Інструменти][Інше]

Справа: P&L Червень
  Виручка послуг     +18 400 ₴
  Продажі товарів    + 2 100 ₴
  Матеріали          − 3 200 ₴
  Операційні         − 3 500 ₴
  ─────────────────────────────
  Реальний дохід     13 800 ₴
```

---

## Tier Gating

| Функція | Starter | Pro |
|---|---|---|
| Таб "Розхідники" в Магазині | ✅ | ✅ |
| Зв'язки розхідник ↔ послуга | ✅ | ✅ |
| MaterialsReviewSheet при завершенні | ✅ | ✅ |
| Revenue Hub "Фінанси" таб | ❌ | ✅ |
| Реальні дані у FinancesTab Analytics | ❌ | ✅ |

---

## TypeScript типи (T29)

```typescript
// database.ts розширення
interface Product {
  // додати:
  unit: 'pcs' | 'ml' | 'g'
}

interface MasterExpense {
  id: string
  master_id: string
  category: 'rent' | 'utilities' | 'advertising' | 'education' | 'tools' | 'other'
  name: string
  amount_kopecks: number
  expense_date: string  // DATE as string
  note: string | null
  created_at: string
}

interface ReviewedConsumable {
  product_id: string
  qty_used: number  // NUMERIC, may be decimal
}

// Оновлений FinanceAnalytics
interface FinanceAnalytics {
  services_revenue: number
  products_revenue: number
  materials_cost: number
  discount_amount: number
  operational_expenses_total: number  // НОВЕ
  net_profit: number
  services: FinanceServiceItem[]
  products: FinanceProductItem[]
}
```

---

## Верифікація (після T29 + T30)

1. `npx tsc --noEmit` → 0 errors
2. `npm run build` → clean build
3. Створити consumable "Фарба Wella" (unit: мл, cost: 80₴, stock: 500)
4. Прив'язати до послуги "Каре-фарбування" → 60 мл
5. Завершити запис з цією послугою → `MaterialsReviewSheet` показує "Фарба Wella 60 мл"
6. Підтвердити → stock: 500 → 440 мл
7. Revenue Hub → Фінанси → додати "Оренда" 3000₴ → P&L відображає мінус
8. Analytics → Фінанси таб → `materials_cost` відображає реальні дані (не demo)

---

## Sprint Road

| Задача | Scope | Залежності |
|---|---|---|
| **T28** (цей) | Spec + бізнес-аналіз | — |
| **T29** | 3 міграції + 2 RPC + серверні екшени | T28 approved |
| **T30** | Products tab UI + ServiceEditor + MaterialsReviewSheet + Revenue Hub tab | T29 deployed |
