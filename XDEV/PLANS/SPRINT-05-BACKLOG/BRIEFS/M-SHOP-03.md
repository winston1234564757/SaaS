# M-SHOP-03 — Магазин: сторінка товару + клієнт-сторінка + відгуки про товари

**Статус:** A+B DONE · commit `19bd7894` · deploy READY · очікує візуального QA founder. Фаза C (відгуки) → окремий **M-SHOP-03b** (спека нижче, Фаза C). Секція відгуків на сторінці = статичний порожній стан.
**Тип:** NEW-FEATURE (route + DATA + REDESIGN-гібрид) · **Тір:** 2 · **Пріоритет:** P1
**Скіли:** `spec-driven-workflow` → `create-migration` → `security-review` → `design-taste-frontend` + `impeccable` · **Модель:** Sonnet→Opus
**Близнюк:** `M-SVC-03` (картка послуги опис+відгуки) — але товари важчі: реальна сторінка-роут + кошик через навігацію + нова система відгуків.

---

## Рішення founder (QA 4/4)
1. **Окремий роут** `/[slug]/shop/[productId]` — shareable URL, SEO, кнопка «назад».
2. **Кошик** — спільний shop-layout + **localStorage** (переживає навігацію + reload, кнопка кошика на обох сторінках).
3. **Майстер Eye-прев'ю** — у скоупі, як у послуг (read-only перегляд сторінки).
4. **Відгуки про товари — повноцінні**, глобально: замовлення завершене → клієнту пропонуємо лишити відгук; логіка як у послуг.

---

## Контекст (поточний стан)
- `/[slug]/shop/page.tsx` (SSR, revalidate 60, Pro/Studio-gate) → `ShopPage.tsx`.
- `ShopPage` тримає **кошик у локальному `useState`** + має `ProductDetailSheet` (bottom-sheet з галереєю/описом/qty/в кошик) + `CartDrawer` (checkout: pickup/Nova Poshta) + `OrderSuccess`. Клік по `ProductTile` → відкриває sheet.
- Таблиця `reviews` = `booking_id NOT NULL` + `client_id`+`master_id`+`rating`+`comment`+`is_published` — **прив'язана до bookings, для товарів НЕ годиться**.
- `orders` (id, master_id, client_id, booking_id, status, total_kopecks…) + `order_items` (order_id, product_id, qty, price_kopecks).
- Клієнт бачить завершені замовлення: `MyBookingsPage.tsx` таб «Магазин» (OrderCard). Для записів там уже є submitReview.

---

## АРХІТЕКТУРА (3 шари переюзу)

**Презентаційний `ProductDetailView`** (новий, pure, без кошика): галерея фото (свайп+стрілки+крапки+thumbnails — винесено з нинішнього `ProductDetailSheet`), назва, ціна, залишок, опис, секція відгуків (avg+список через RPC). Юзається І публічною сторінкою, І майстер-прев'ю.
- Публічна сторінка = `ProductDetailView` + cart-контроли (qty stepper + «в кошик») + sticky cart.
- Майстер-прев'ю = `ProductDetailView` у Sheet, read-only (без cart).

---

## ФАЗА C — БД: система відгуків про товари (робити ПЕРШОЮ)

**Нова таблиця `product_reviews`:**
```
id uuid pk, product_id uuid → products(id), order_id uuid → orders(id),
order_item_id uuid → order_items(id) UNIQUE (1 відгук на позицію),
client_id uuid → client_profiles(id), master_id uuid → master_profiles(id),
rating int CHECK 1..5, comment text, client_name text (snapshot),
is_published bool default true, created_at timestamptz default now()
```
- Індекси: `(product_id)` для RPC, `(client_id)`, `(order_id)`.
- **RLS:** client INSERT own (auth.uid→client_profiles, лише свій order, лише completed) · client SELECT own · master SELECT theirs. Публічне читання — лише через RPC.
- **RPC `get_product_reviews(p_product_id uuid)`** — дзеркало `get_service_reviews`: `SECURITY DEFINER`, `SET search_path=public`, `STABLE`, `is_published=true`, безпечні поля (id/rating/comment/client_name/created_at), `REVOKE public` + `GRANT anon,authenticated`.

**Write flow — server action `submitProductReview({ orderItemId, rating, comment })`:**
- Валідує: order належить клієнту (auth) + `status='completed'` + order_item ⋈ order + ще немає відгуку (UNIQUE).
- INSERT product_reviews (snapshot client_name). Idempotent.
- Гейт: `security-review` обов'язково (новий write-вектор + RLS).

**Eligibility helper:** `getReviewableProducts(orderId)` або поле в OrderCard — позиції завершеного замовлення без відгуку.

> Скоуп відгуків: **завершені ORDERS (shop)**. `booking_products` (товар проданий на записі) — окрема ітерація (узгоджено: «коли замовлення завершене»).

## ФАЗА A — Сторінка-роут + підняття кошика

- **`[slug]/shop/layout.tsx`** (новий, client-провайдер `ShopCartProvider`): кошик у context + `useState`, sync у `localStorage['bookit_cart_${masterId}']` (read у `useEffect` post-mount → без hydration mismatch). Sticky cart-кнопка + `CartDrawer` (checkout) **переносяться сюди** → доступні на каталозі І сторінці товару.
- **`[slug]/shop/[productId]/page.tsx`** (новий SSR): fetch одного товару (active, stock>0, master по slug) + `get_product_reviews`. `generateMetadata` (title+OG). `notFound()` якщо нема. Не-Pro gate успадковано.
- **`ProductPage.tsx`** (новий client): `ProductDetailView` + qty stepper + «в кошик» (пише у `ShopCartProvider`) + хедер «назад до магазину».
- **Рефактор `ShopPage`:** кошик з local `useState` → `useShopCart()` context. `ProductTile` клік → `<Link href={/${slug}/shop/${id}}>` замість sheet. **`ProductDetailSheet` видаляється** (логіка галереї переїхала в `ProductDetailView`). CartDrawer/sticky cart переїхали в layout.

## ФАЗА B — Майстер Eye-прев'ю
- `ProductCard.tsx` (майстер): додати Eye-кнопку в `actions` (як у `ServiceCard`).
- `ProductsPage.tsx`: стан `previewProduct` → Sheet з `ProductDetailView` read-only (mode master, без cart, з нуджем порожнього опису як у M-SVC-03).

---

## Acceptance criteria
- [ ] Клік по товару в каталозі → перехід на `/[slug]/shop/[productId]` (URL змінюється, shareable).
- [ ] На сторінці: галерея (свайп/стрілки/крапки), назва, ціна, залишок, опис, відгуки (avg+список / «поки немає»), qty + «в кошик».
- [ ] Додав у кошик зі сторінки товару → повернувся на каталог → товар у кошику (localStorage). Reload → кошик зберігся.
- [ ] Кнопка кошика + checkout працюють з обох сторінок.
- [ ] Завершене замовлення в `/my/bookings` (Магазин) → клієнту пропозиція лишити відгук на кожен товар → сабміт → відгук показується на сторінці товару.
- [ ] Майстер: Eye на ProductCard → read-only прев'ю сторінки.
- [ ] Стани: loading (skeleton), empty (нема відгуків / нема товару → notFound), error (сабміт). Немає в наявності → CTA disabled.
- [ ] RLS: клієнт не може лишити відгук на чуже/незавершене замовлення; cost/internal поля не витікають.

## Ризики
- **Рефактор кошика** — найбільший. ShopPage тісно зв'язаний (cart + sheet + drawer). Лишити checkout-логіку 1:1, лише підняти стан. Регресія: перевірити повний флоу замовлення після рефактора.
- **localStorage + stock drift:** товар у кошику міг розпродатись між сесіями. createOrder уже валідує stock серверно — лишити, на сторінці показувати актуальний SSR-stock.
- **Гідрація:** cart-провайдер читає localStorage лише в useEffect.
- **Дублікат відгуку:** UNIQUE(order_item_id) + перевірка в action.

## Гейти (Tier 2)
`create-migration` (Фаза C) → `security-review` (RLS+action) → `design-taste-frontend`+`impeccable` (сторінка) → `humanizer` (новий copy: «Залишити відгук», «Про товар», «Назад до магазину», порожні стани) → `tsc` + `build` + `ship-gate`. Encoding-check перед кожним Write.

## ВІДКРИТЕ ПИТАННЯ (потребує рішення перед кодом)
Обсяг великий (нова БД-таблиця + write-flow + 2 UI-поверхні + рефактор кошика + роут + майстер-прев'ю). Робити **все в одній сесії** (кілька комітів) чи **розбити**: M-SHOP-03 = сторінка+кошик+майстер-прев'ю (A+B), а відгуки (C) = окремий під-таск M-SHOP-03b?
