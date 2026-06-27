# M-SHOP-03b — Магазин: відгуки про товари (показ на сторінці товару)

**Статус:** DONE · commit `9f97b5a5` · міграція `20260627000010` (MCP+локально) · deploy READY · smoke-test ✓
**Тип:** DATA (read-side) · **Тір:** 1 · **Пріоритет:** P1
**Скіли:** `create-migration` → `security-review` · **Модель:** Sonnet (не Opus — обсяг малий)

---

## КОНТРТЕЗА до спеки (Фаза C в M-SHOP-03.md була НЕВІРНА)

Спека припускала: «`reviews` прив'язана до bookings → потрібна нова таблиця `product_reviews` + новий flow збору». **Це не так.** Жива БД:
- `reviews` уже має колонки **`order_id`** (uuid) І **`product_id`** (uuid), обидві nullable, + `client_name` (not null).
- `submitReview` (`my/bookings/actions.ts`) **уже підтримує відгук на замовлення**: валідує order клієнта (status `completed`/`shipped`), пише `reviews(order_id, master_id, client_id, client_name, rating, comment, is_published:false)`. `product_id` НЕ пише.
- `MyBookingsPage` → `ShopOrderCard` **уже має** «Поділитись враженнями» → `ReviewSheet` (orderId). `order.hasReview` гейтить повтор. **Флоу збору вже працює** (з модерацією — `is_published:false`, майстер схвалює на `/dashboard/reviews`).
- Є 1 опублікований order-відгук (тест-дані).

**Отже бракує тільки READ-SIDE:** показати відгуки на сторінці товару. Урок M-SVC-01/M-SHOP-01 знову: беклог казав «будувати», а бекенд уже є — реалізувати лише відображення.

---

## Рішення (підхід — на узгодження)

Відгук збирається **на замовлення** (одне на order, `product_id` не пишеться). Сторінка товару показує відгуки **derive через `order_items`** — точно як послуги через `booking_services` (M-SVC-03):

```
reviews.order_id → order_items.order_id  WHERE order_items.product_id = :p_product_id  AND reviews.is_published
```

Мультитоварне замовлення: один відгук показується під КОЖНИМ товаром замовлення (свідоме рішення, як у послуг M-SVC-03).

---

## Реалізація

1. **Міграція `get_product_reviews.sql`** — RPC `get_product_reviews(p_product_id uuid)`, дзеркало `get_service_reviews`:
   - `LANGUAGE sql`, `SECURITY DEFINER`, `SET search_path=public`, `STABLE`.
   - `SELECT DISTINCT r.id, r.rating, r.comment, r.client_name, r.created_at FROM reviews r JOIN order_items oi ON oi.order_id = r.order_id WHERE oi.product_id = p_product_id AND r.is_published = true ORDER BY r.created_at DESC`.
   - Індекс `idx_reviews_order_id` (підтримка join) + `order_items(product_id)`/`(order_id)` (перевірити, додати IF NOT EXISTS).
   - `REVOKE ALL ... FROM public` + `GRANT EXECUTE ... TO anon, authenticated`.
   - Застосувати через MCP `apply_migration` + закомітити локально.

2. **`useProductReviews.ts`** — TanStack хук над RPC (дзеркало `useServiceReviews`): `useProductReviews(productId | null, enabled)` → `{ reviews, count, average, isLoading }`.

3. **`ProductDetailView.tsx`** — замінити статичний блок «Відгуків поки немає» на живий: рейтинг (avg + Stars + count) у хедері секції + список (client_name + Stars + timeAgo + comment) + loading skeleton + порожній стан. Той самий вигляд, що в `ServiceDetailSheet`. Хук `enabled` коли є productId (на публічній сторінці завжди; в майстер-прев'ю теж показати).

> Сторінка товару (`ProductPage`) рендерить `ProductDetailView` для конкретного товару → productId доступний. Майстер-прев'ю (`ProductsPage` Sheet) — теж показує відгуки read-only.

---

## Поза скоупом (свідомо)
- **Збір відгуків** — уже існує (ShopOrderCard → ReviewSheet → submitReview). Не чіпаю.
- **Нова таблиця** — не потрібна (reviews готова).
- **Per-product через `product_id`** — НЕ робимо (вимагало б rework робочого order-review UI на per-товар + більше тертя). Лишаємо per-order derive (як послуги). `product_id` лишається невикористаним — ок.

## Acceptance
- [ ] Сторінка товару, що був у завершеному+опублікованому замовленні → показує відгук (рейтинг + текст).
- [ ] Товар без відгуків → «Відгуків поки немає».
- [ ] Майстер-прев'ю → ті самі відгуки read-only.
- [ ] RPC не витікає внутрішніх полів (лише id/rating/comment/client_name/created_at), лише `is_published=true`.

## Ризики
- `is_published=false` за замовчуванням у order-відгуках → новий відгук НЕ з'явиться поки майстер не схвалить (`/dashboard/reviews`). Це **наявна поведінка модерації**, не баг. (Уточнити, що це очікувано.)
- Join `reviews.order_id = order_items.order_id` — переконатись що індекси є (інакше seq scan).

## Гейти (Tier 1)
`create-migration` → застосувати через MCP + smoke-test RPC на тест-даних → `security-review` (SECURITY DEFINER hardening) → `tsc` + `build`. Humanizer: copy мінімальний (переюз з ServiceDetailSheet).
