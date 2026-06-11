# B-09 — Products: Повний Аудит Логіки

> Трекер: [00_TRACKER.md](./00_TRACKER.md)

---

**Пріоритет:** P1 Bug  
**Скіл:** `senior-backend` + `code-reviewer`  
**Статус:** TODO

---

## Проблема
Критичний UX + data bug:
1. В списку товарів — товар присутній
2. При спробі редагування — **всі поля пусті** (форма порожня)
3. Але **замовити** цей товар можна через публічний магазин

Це означає: або дані є в DB але не завантажуються в форму, або стан даних непослідовний.

---

## Файли для аудиту

| Файл | Роль |
|------|------|
| `bookit/src/components/master/products/ProductsPage.tsx` | Список товарів + кнопка редагування |
| `bookit/src/app/(master)/dashboard/products/actions.ts` | Server Actions: getProducts, updateProduct |
| `bookit/src/app/[slug]/shop/page.tsx` | Публічний магазин (SSR) |
| `bookit/src/components/public/ShopPage.tsx` | Checkout форма |
| DB: `products` таблиця | Структура: `id, master_id, title, price, stock, for_sale, ...` |

---

## Аудит план

### Частина 1: Чому редагування порожнє
1. `Read ProductsPage.tsx` — знайти де дані товару завантажуються для форми редагування
2. Перевірити server action: `getProductById` або аналог — чи повертає дані
3. Перевірити RLS на таблиці `products`: чи SELECT через browser client повертає рядки?
4. Перевірити JOIN: чи є зайві `WHERE` умови що фільтрують товар

### Частина 2: Чому можна замовити "порожній" товар
1. `Read products/actions.ts` → `createOrder` або `createOrderItem`
2. Перевірити чи є валідація: `product.for_sale === true && product.stock > 0`
3. Якщо валідації немає → додати

### Частина 3: Загальний аудит
- Перевірити stock decrement: чи `increment_stock_rpc` зменшує стоки при замовленні
- Перевірити що видалення товару з активними замовленнями не ламає замовлення
- Перевірити foto upload flow

---

## Очікувані фікси
1. Форма редагування отримує повні дані товару (фікс завантаження)
2. Захист від замовлення пустого/неактивного товару
3. Можливо: RLS fix для `products` SELECT policy

---

## QA
```sql
-- Перевірити стан товарів:
SELECT id, title, for_sale, stock, price FROM products WHERE master_id = '<id>';
-- Перевірити замовлення з непослідовними даними:
SELECT oi.*, p.title FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE p.id IS NULL;
```
- Відкрити ProductsPage → вибрати товар → редагувати → поля заповнені ✅
- Спробувати замовити "пустий" товар через публічний магазин → заблоковано ✅
