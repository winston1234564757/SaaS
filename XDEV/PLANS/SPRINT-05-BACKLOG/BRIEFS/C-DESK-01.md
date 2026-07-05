# C-DESK-01 — Десктоп-лейаут клієнт-зони (лівий sidebar)

> Статус: **APPROVED · Фаза 1 реалізована (own-eyes ✅, не закомічено)** · Тип: REDESIGN + новий layout-патерн · Тір 2 · Модель: Opus
> Скіли: `impeccable` (craft/layout) + `design-taste-frontend`
> Рішення founder (2026-07-05): **лівий sidebar** (новий патерн, не топбар майстер-зони) · скоуп **8 сторінок** · **повний десктоп-редизайн (Тір 2)**

---

## Before (поточний стан)

Клієнт-зона — mobile-first, десктопу як такого немає:
- **Навігація:** `MyBottomNav` (фіксований низ, `md:hidden`, 5 слотів + FAB speed-dial з C-NAV-01) на мобільному; на десктопі падає на `PublicNavbar` зверху.
- **Контент:** `my/layout.tsx` тримає все в `max-w-lg mx-auto` (512px) по центру — на широкому екрані вузька колонка з пустелею по боках.
- **Роути живуть у 3 різних layout-групах:** `/my/*` (`my/layout.tsx`, max-w-lg), `/explore` (`explore/layout.tsx`), клієнт-магазин `/[slug]/shop` (`[slug]/layout.tsx`).
- `MyBottomNav` рендериться в **root layout** (`src/app/layout.tsx:141`), self-gating за pathname (`isMyRoute || isPublicB2CRoute`).

## Проблема

Десктоп-клієнт бачить телефонний UI, розтягнутий по центру екрана. Немає постійної навігації рівня «кабінет»; порожній простір не працює на контент.

---

## Design Direction — «Редакційний spine»

Sidebar — **не** утилітарний icon-rail (це був би AI-slop: іконка+лейбл×6). Концепт за брендом (*Intelligent · Warm · Editorial*, «елітний щоденник»): ліва колонка = **корінець журналу**.

**Sidebar (lg+, fixed left, ~264px, повна висота, на Frost-аврорі):**
1. **Верх — ідентичність бренду:** вордмарк BookIT (Great Vibes) → лінк на `/my/bookings` (домівка).
2. **Персональний блок:** аватар (ring) + ім'я клієнта (Cormorant serif) + тихий рядок (напр. «N балів» / лояльність) — теплий персональний акцент, НЕ hero-метрика. Це диференціює від generic-навігації.
3. **Первинна навігація — типографічний список** (не chunky-пігулки): Записи · Каталог · Чат (badge непрочитаних) · Бонуси · Сповіщення (badge) · Профіль.
   - **Active-стан:** заповнений rounded bg-тінт (`color-mix(in srgb, var(--foreground) 8%, transparent)`, як `layoutId="client-nav-active"` у MyBottomNav) + slate-текст + вища вага + icon fill. **БЕЗ side-stripe border** (заборонено). Одна мова активності з мобільним навбаром.
4. **Низ (bottom-anchored):** підтримка + вихід (logout). Тема зафіксована Frost — тумблера теми нема.

**Контент праворуч:** `lg:pl-[264px]`, у max-w-контейнері (5xl/6xl залежно від сторінки), щедрі `lg:px-8 lg:py-8`. Мобільний — **недоторканий** (MyBottomNav лишається, sidebar `hidden lg:flex`).

**Закон темного блоку** діє на кожній сторінці: асиметрія (один герой + диференційований решток), нуль рівних N-карток.

---

## Per-page десктоп-стратегія (8 сторінок)

| # | Сторінка | Десктоп-лейаут |
|---|----------|----------------|
| 1 | `/my/bookings` | **Master-detail:** ліворуч список записів (майбутні/минулі), праворуч постійна дет걸ь (EditorialCover-«квиток» + чек). На мобільному list→Sheet лишається. |
| 2 | `/my/messages` | **Класичний 2-pane чат:** список розмов ліворуч, активний тред праворуч (замість list→route). |
| 3 | `/my/masters` | Широка галерея (auto-fit minmax) + ClientPageHero band; featured-майстер крупніше + решта грід (асиметрія). |
| 4 | `/my/loyalty` | Hero (бали/тір) + 2-кол: ліворуч нагороди/прогрес, праворуч історія/таби. |
| 5 | `/my/notifications` | Читацька поверхня — measure ≤75ch. 2-кол: ліворуч групування/summary, праворуч фід (не розтягувати full-width). |
| 6 | `/my/profile` | Identity EditorialCover + форма → 2-кол: ліворуч identity-картка (sticky), праворуч поля. |
| 7 | `/explore` | Уже темний портал (C-EXPL-01): розширити intent-грід на більше колонок, hero-пошук full-width, sticky-фільтри. Переважно widening. |
| 8 | клієнт-магазин `/[slug]/shop` | Широкий грід товарів (auto-fit) + кошик як праве sticky-раме замість плаваючої піл. |

---

## Файли (очікувано)

**Новий шелл:**
- `src/components/client/MyDesktopSidebar.tsx` — новий (fixed, `hidden lg:flex`, self-gating pathname+auth, badges через `useUnreadDMCount` + хук непрочитаних сповіщень).
- `src/app/layout.tsx` — змонтувати `MyDesktopSidebar` поряд з `MyBottomNav`.

**Контент-офсет (головний інтеграційний ризик):**
- `my/layout.tsx` — `max-w-lg` → `lg:pl-[264px]` + ширший контейнер (завжди authed client).
- `explore/layout.tsx` — офсет **умовно за auth** (гість бачить повний публічний вид, authed-клієнт — з sidebar).
- `[slug]/layout.tsx` (shop) — те саме умовно за auth.

**Per-page (Фаза 2+, по одній):** MyBookingsPage, MessagesListPage, MyMastersPage, MyLoyaltyPage, ClientNotificationsPage, MyProfilePage, ExplorePage, ShopPage.

---

## Фазування (чесно: це не один присід)

- **Фаза 1 — Шелл + офсет-plumbing (перший shippable інкремент):** `MyDesktopSidebar` + монтаж + офсет у 3 layout. Нав працює на всіх 8 роутах, мобільний недоторканий, own-eyes lg+. Контент сторінок поки просто ширший (1:1, гріди розтягуються).
- **Фаза 2..N — per-page десктоп-контент:** по одній сторінці з рендером власними очима (закон #4), master-detail/2-pane де в таблиці вище.

Кожна фаза: `tsc` + build + own-eyes. Деплой — батчем за командою founder.

---

## Ризики / відкриті рішення (потрібне твоє APPROVE)

1. **🔴 explore + shop — спільні guest+client поверхні.** Sidebar там показувати тільки authed-клієнту (гість — повний публічний вид)? Це робить /explore і магазин частиною «кабінету» для залогінених. Підтвердь: **так, sidebar на explore/shop для authed** — чи лишити ці дві поза sidebar (тоді скоуп = 6 сторінок /my)?
2. **Ширина sidebar 264px** — ок, чи ширше/вужче?
3. **Персональний рядок під іменем** — «N балів» (лояльність) чи щось інше (місто / «Клієнт»)? Потрібен доступний легкий датасорс у layout.
3. **Breakpoint = `lg` (1024px)** — узгоджено з майстер-зоною (`hidden lg:block`). Планшет (md, 768–1023) лишається мобільним патерном (bottom-nav). Ок?

---

## Гейти (Тір 2)

Per-page: `design-taste-frontend` → `impeccable` (layout) → `mcp__a11y` → `humanizer` (нові рядки: «Вихід», tooltips). Пре-деплой: `tsc` + `build` + own-eyes кожної фази. Мобільний regression-чек (sidebar не протікає в < lg).

---

## Реалізація — Фаза 1 (шелл + офсет) ✅ own-eyes, НЕ закомічено

**Рішення founder:** sidebar на explore/shop для authed (8 стор) · персо-рядок = реальний loyalty-сигнал · старт Фаза 1.

**🔴 Знахідка — `loyalty_points` мертва колонка.** «Бали лояльності» (первинний вибір founder) НЕ існують у моделі: `loyalty_points` є в `client_master_relations`, але НІДЕ не інкрементиться (планована міграція 062 інкременту при completed — ніколи не застосована, номер перевикористано). Жива лояльність = візити (`total_visits` реально росте) + програми (target_visits→нагорода). **Рішення founder після знахідки:** персо-рядок = **«N нагород готові»** (програми де visits≥target, accent-slate) + **CTA empty state** — коли 0, лінк «Переглянути бонуси →» на `/my/loyalty`. Запит: relations + active loyalty_programs (2 легкі запити, лише коли shell видимий). Не фабрикую.

**Підсилення шеллу (за запитом founder):** панель `bg-secondary/25`→`/45` + повний border + м'яка права тінь (більше присутності); active-піл 8%→11% foreground + inset-ring (чіткіший активний стан).

**Архітектура (розв'язала проблему 3 layout одним правилом):**
- `MyDesktopSidebar.tsx` — `fixed inset-y-0 left-0 w-[264px] hidden lg:flex`, self-gating (auth+route, не fullscreen-chat). Реюз: `useUnreadDMCount` (Чат-badge), `useClientNotifications` (Сповіщення-badge, gated `null` off-route щоб realtime не крутився всюди), active-піл = та сама мова що MyBottomNav (`layoutId` + `color-mix foreground 8%`, БЕЗ side-stripe). Вордмарк serif як PublicNavbar, ідентичність Cormorant.
- **Офсет — серверний клас на `<body>`** (`has-client-shell`) у root layout за `initialIsAuth` + `x-pathname` → flash-free (нуль CLS). Один глобальний CSS-rule `@media(min-width:1024px){ body.has-client-shell main{padding-left:264px} }` зсуває спільний root `<main>` для ВСІХ 3 layout (my/explore/shop) — офсет shop безкоштовний, `[slug]/layout` не чіпав. Те саме правило ховає надлишковий `.public-navbar` на lg.
- Файли: NEW `MyDesktopSidebar.tsx`; `app/layout.tsx` (import+gate+body-class+mount); `globals.css` (shell-rules); `PublicNavbar.tsx` (+клас `public-navbar`).

**Own-eyes (Playwright headless, прев'ю-роут + прев'ю-проп, видалені):** lg 1280 — sidebar + офсет контенту + навбар прихований ✅; mobile 390 — sidebar відсутній (`hidden lg:flex`), контент повноширинний, MyBottomNav недоторканий ✅. TSC:0 · Build:clean.

**Лишилось (Фаза 2..N):** per-page десктоп-контент по одній сторінці (master-detail bookings, 2-pane messages, тощо — таблиця вище). Верхній `md:pt-20` gap при схованому навбарі лишив як top-padding (рефайн per-page).

## Прев'ю / реалізація — нижче після виконання
