# Sprint-04 — Глобальний план
> **30 ітерацій** | Старт: 2026-06-12 | ONE TASK = ONE DEPLOY
> Трекер: `TRACKER.md` | Сесійний стан: `HANDOFF.md` | Beклог: `BACKLOG.md`

---

## Огляд фаз

| Фаза | Ітерації | Тип | Складність |
|---|---|---|---|
| **Phase 1** | T01–T08 | Швидкі фікси | 🟢🟡 |
| **Phase 2** | T09–T18 | UX / Дизайн | 🟡🔴 |
| **Phase 3** | T19–T30 | Складні фічі | 🔴 |

---

## PHASE 1 — Швидкі фікси (T01–T08)

---

### T01 — Frost тема: всі клієнти → міграція
**Беклог:** BL#16
**Скіл:** `code-reviewer` + `create-migration`
**Складність:** 🟢

**Проблема:** При реєстрації нового клієнта застосовується тема Blossom. Всі існуючі клієнти з Blossom/Studio → також перевести на Frost.

**Де шукати:**
- `src/app/(client)/` — registration/onboarding flow
- `client_profiles` table — default value на колонці `theme`
- Порівняти з `master_profiles` (там вже Frost)

**Acceptance criteria:**
- AC-1: Новий клієнт після реєстрації → Frost завжди
- AC-2: `client_profiles` INSERT default = `'frost'`
- AC-3: Міграція: `UPDATE client_profiles SET theme = 'frost' WHERE theme != 'frost'`
- AC-4: Blossom/Studio не застосовуються автоматично ніколи

**Definition of done:** tsc clean → build clean → deploy → реєстрація нового клієнта → Frost ✅

---

### T02 — In-app сповіщення: unread кольорові + z-index лічильника
**Беклог:** BL#21b
**Скіл:** `code-reviewer`
**Складність:** 🟢

**Проблема:** Непрочитані сповіщення виглядають приглушено (як прочитані). Лічильник badge ховається за кнопкою навбару.

**Де шукати:**
- Notification bell/button компонент у навбарі
- Список сповіщень — стилізація прочитаних vs непрочитаних

**Acceptance criteria:**
- AC-1: Непрочитані → `text-foreground` або `--color-text-primary` (Frost token)
- AC-2: Прочитані → `text-muted-foreground` або `opacity-50`
- AC-3: Badge лічильника: `z-index` перевищує кнопку (`z-[60]` або `z-50` залежно від контексту)
- AC-4: Перевірити на мобайлі + десктоп

**Definition of done:** Непрочитані яскраві, прочитані приглушені, лічильник видно ✅

---

### T03 — Портфоліо → Конструктор сторіс: redirect
**Беклог:** BL#20
**Скіл:** `code-reviewer`
**Складність:** 🟢

**Проблема:** Кнопка "Сторіс" у портфоліо відкриває Drawer замість redirect на `/dashboard/stories` з передачею параметрів.

**Acceptance criteria:**
- AC-1: Кнопка → `router.push('/dashboard/stories?type=portfolio&id=<work_id>')`
- AC-2: Drawer — повністю видалено
- AC-3: Stories constructor підхоплює `type` + `id` і передобирає значення форми

**Definition of done:** Тап "Сторіс" → редірект на конструктор з потрібними значеннями ✅

---

### T04 — Мобайл магазин: кнопка "Додати товар" + toggle a11y
**Беклог:** BL#5
**Скіл:** `code-reviewer` + `impeccable`
**Складність:** 🟢

**Проблема:** Кнопка без тексту + не після заголовку. Toggle: активний = весь чорний, неактивний = весь білий.

**Acceptance criteria:**
- AC-1: `<button>` "Додати товар" з іконкою + текстом, одразу після `<h1>` сторінки
- AC-2: Toggle: active = Frost primary (`--color-accent`), inactive = outlined/muted
- AC-3: `role="switch"` + `aria-checked={bool}` на toggle
- AC-4: Touch target ≥ 44px

**Definition of done:** Кнопка з текстом, toggle правильних кольорів ✅

---

### T05 — Клієнти (список): стандартизація кнопок + smart кнопка
**Беклог:** BL#0 + BL#22
**Скіл:** `code-reviewer`
**Складність:** 🟢

**Проблема (BL#0):** У режимі список кнопка "зв'язок" → маркетинг (не чат). У режимі сітки є "smart кнопка".
**Проблема (BL#22):** 3 іконки-кнопки у списку мають різні форми/розміри.

**Acceptance criteria:**
- AC-1: Кнопка №2 (середня) у режимі список = та сама smart кнопка що в режимі сітки
- AC-2: Всі 3 кнопки — однакові `border-radius`, `width`, `height`
- AC-3: Поведінка grid↔list синхронізована

**Definition of done:** Обидва режими клієнтів — ідентичний набір кнопок ✅

---

### T06 — Меню > Система > Студія: redesign + alpha/beta
**Беклог:** BL#8
**Скіл:** `design-taste-frontend` + `impeccable`
**Складність:** 🟡

**Проблема:** Кнопка "Студія" в системному меню → немає деталей участі в alpha/beta. Кнопка не відповідає стилю тарифної сторінки.

**Acceptance criteria:**
- AC-1: Секція з описом: участь в alpha/beta, вплив на продукт, власні ідеї
- AC-2: CTA кнопка — той самий style що на `/pricing` або тарифній сторінці
- AC-3: Humanizer для всього copy (жодних AI-кліше)
- AC-4: Frost дизайн tokens

**Definition of done:** Секція виглядає premium, copy живий, кнопка як на тарифах ✅

---

### T07 — Записи мобайл: safe area top + opacity при скролі
**Беклог:** BL#3
**Скіл:** `senior-frontend` + `impeccable`
**Складність:** 🟡
**Референс:** `Screens/photo_5280650625760828115_w.jpg`

**Проблема:** Control panel (тижні/місяці/режими) ховається за "чубом" телефону. При скролі накладається на картки.

**Acceptance criteria:**
- AC-1: `padding-top: env(safe-area-inset-top)` на sticky control panel
- AC-2: При скролі > 50px → sticky bar: `backdrop-filter: blur(12px)` + `opacity: 0.95`
- AC-3: Або: картки під sticky bar мають `mt` = висота sticky bar (без overlap)
- AC-4: Десктоп view — не зламано

**Definition of done:** Контент не ховається за "чубом", no overlap при скролі ✅

---

### T08 — Дашборд: tooltip safe area
**Беклог:** BL#17
**Скіл:** `senior-frontend` + `impeccable`
**Складність:** 🟡
**Референс:** `Screens/photo_5285469750865631645_w.jpg`

**Проблема:** Тултіпи віджету "Доходи" обрізаються у блоці. Тултіпи "Пікові години" виходять за край дисплею.

**Де шукати:** `src/components/master/dashboard/` — RevenueWidget, PeakHoursWidget

**Acceptance criteria:**
- AC-1: Доходи: `overflow: visible` на контейнері, тултіп `z-index` вище siblings
- AC-2: Пікові години: `clamp(8px, calculatedX, viewportWidth - tooltipWidth - 8px)`
- AC-3: Жоден тултіп не виходить за межі viewport на будь-якому розмірі екрану

**Definition of done:** Всі тултіпи видні повністю на мобайлі + десктоп ✅

---

## PHASE 2 — UX / Дизайн (T09–T18)

---

### T09 — Мобайл послуги: кнопка + toggle a11y + компакт + роздільники
**Беклог:** BL#4
**Скіл:** `design-taste-frontend` + `impeccable`
**Складність:** 🟡
**Референс:** `Screens/photo_5280650625760828123_w.jpg`

**Проблема:** Кнопка "Додати послугу" без тексту. Toggle — кольоровий збій. Картки занадто великі. Немає роздільників між спеціалізаціями.

**Acceptance criteria:**
- AC-1: "Додати послугу" → `<button>` з текстом + іконкою після `<h1>`
- AC-2: Toggle: `role="switch"`, Frost color tokens, `aria-checked`
- AC-3: Картки компактніші (менше padding/gap)
- AC-4: Роздільники між спеціалізаціями (лейбл + `<hr>`)
- AC-5: Touch targets ≥ 44px

**Definition of done:** Послуги виглядають компактно, кнопки правильні ✅

---

### T10 — Портфоліо: кольори стандарт + mobile photo actions
**Беклог:** BL#6
**Скіл:** `design-taste-frontend` + `impeccable`
**Складність:** 🟡

**Проблема:** Кнопки мають нестандартні кольори. На мобайлі нема кнопки видалити/drag-n-drop не працює.

**Acceptance criteria:**
- AC-1: Всі кнопки → Frost design tokens
- AC-2: Тап на фото (мобайл) → 3 кнопки overlay: видалити / зробити головним / переглянути
- AC-3: "Переглянути" → inline lightbox (не нова вкладка)
- AC-4: Drag-n-drop виправлений або замінений на order кнопки
- AC-5: Той самий inline-перегляд → фото товарів + послуг (уніфікація)

**Definition of done:** Кольори стандартні, мобайл photo actions працюють ✅

---

### T11 — GrowthHub мобайл: tab layout redesign
**Беклог:** BL#7
**Скіл:** `design-taste-frontend` + `impeccable`
**Складність:** 🟡
**Референс:** `Screens/photo_5280650625760828124_w.jpg`

**Проблема:** 3 таби не вміщуються в рядок на мобайлі → боковий скрол або overflow.

**Acceptance criteria:**
- AC-1: Варіант A: `grid-cols-3` compact (менший text, більший padding)
- AC-2: Варіант B: horizontal scroll tabs (`overflow-x: auto; scrollbar-width: none`)
- AC-3: Активний таб чітко виділений (Frost token)
- AC-4: Жодного горизонтального скролу всієї сторінки

**Definition of done:** 3 таби влазять / прокручуються зручно на мобайлі ✅

---

### T12 — Профіль: відпустка/вихідні/короткий день — overlap fix
**Беклог:** BL#18
**Скіл:** `redesign-existing-projects` + `impeccable`
**Складність:** 🟡
**Референс:** `Screens/photo_5285469750865631647_w.jpg`, `photo_5285469750865631648_w.jpg`

**Проблема:** На всіх 3 табах (Вихідний / Відпустка / Короткий день) поля накладаються одне на одного.

**Де шукати:** `src/app/(master)/dashboard/settings/` — vacation/days-off tabs

**Acceptance criteria:**
- AC-1: Всі поля мають нормальний `gap` / `margin-bottom`
- AC-2: Якщо контент великий — власний scroll context для кожного таба
- AC-3: Label'и зрозумілі, UX без тертя
- AC-4: Мінімальне тертя: date pickers зручні на мобайлі

**Definition of done:** Жодних overlapping полів, форми читабельні ✅

---

### T13 — Записи: баг буферу 10 хвилин між записами
**Беклог:** BL#19
**Скіл:** `focused-fix` + `senior-backend`
**Складність:** 🟡
**Debug master ID:** `551c7a11-a02b-4944-9b34-594c41ccb951`

**Проблема:** Запис Брови 2 (9:00–10:00, 1 год) → наступний запис дозволено рівно на 10:00 без 10 хв буфера.

**Де шукати:**
- RPC для розрахунку доступних слотів
- `src/lib/booking/` або slots logic
- `master_profiles.buffer_time` або аналог

**Acceptance criteria:**
- AC-1: Знайти де розраховується `next_available_slot`
- AC-2: `end_time + buffer_minutes = next_start` (буфер включається)
- AC-3: Перевірити де зберігається buffer_time (per-master? global?)
- AC-4: SQL query для верифікації: запити майстра `551c7a11...` показують правильний буфер

**Definition of done:** Між записами 9:00–10:00 і 10:00–10:50 є буфер 10 хв ✅

---

### T14 — Конструктор сторіс (ПК): розширення робочої зони
**Беклог:** BL#2
**Скіл:** `senior-frontend` + `impeccable`
**Складність:** 🟡
**Референс:** `Screens/photo_5280650625760828114_w.jpg` (синім = вільне місце)

**Проблема:** На десктопі canvas/preview area занадто мала — є вільний простір справа/знизу.

**Acceptance criteria:**
- AC-1: Визначити safe ranges для розширення (sidebar tools не обрізається)
- AC-2: Canvas area: `flex-1` або `calc(100% - sidebar_width)` для максимізації
- AC-3: Sidebar інструментів залишається фіксованим, не ламається
- AC-4: Preview залишається пропорційним (9:16 або обраний ratio)

**Definition of done:** Робоча зона суттєво більша, preview займає весь доступний простір ✅

---

### T15 — Сповіщення: каскад Push→TG + виправлення текстів + PWA deep link
**Беклог:** BL#21a
**Скіл:** `spec-driven-workflow` + `senior-backend`
**Складність:** 🔴

**Проблема:**
1. Push + TG надсилаються одночасно (має бути каскад: Push → якщо fail → TG)
2. Сума у сповіщенні: "2 грн" (мав бути реальний total_price)
3. TG кнопка "Відкрити" не веде у PWA

**Spec (spec-driven-workflow):**
- FR-1: Push успішно → TG не надсилати
- FR-2: Push fail / немає push підписки → надіслати TG
- FR-3: Перевірити ВСІ типи сповіщень: new_booking, reminder, cancellation, payment
- FR-4: `total_price` (копійки) → `/100` → `${price} грн`
- FR-5: TG inline кнопка → `https://{PWA_URL}/dashboard/bookings/{booking_id}`

**Де шукати:** `src/lib/notifications/` + orchestrator + TG webhook handler

**Acceptance criteria:**
- AC-1: Каскад реалізований через статус відповіді Push API
- AC-2: Всі шаблони сповіщень перевірені — коректний price, service name, datetime
- AC-3: TG deep link → відкриває PWA (якщо встановлено)

**Definition of done:** Сповіщення приходить або через Push або через TG (не обидва), сума правильна ✅

---

### T16 — Клієнтський навбар: redesign + Каталог + desktop нотифікації
**Беклог:** BL#12
**Скіл:** `design-taste-frontend` + `impeccable`
**Складність:** 🟡

**Проблема:** Клієнтський мобайл навбар відрізняється від майстерського. Немає кнопки "Каталог". `/explore` — навбар спрощується. Десктоп — немає сповіщень.

**Acceptance criteria:**
- AC-1: Навбар за аналогією майстерського (той самий layout pattern)
- AC-2: Кнопка "Каталог" → `/explore`
- AC-3: На `/explore` навбар не змінюється (не спрощується)
- AC-4: Десктоп: іконка сповіщень + dropdown/popover список
- AC-5: Frost дизайн tokens
- AC-5: `/explore` повний редизайн, це маркетплейс послуг і майстрів, треба винайти нову Best Practice, використовуєш скіли і їх інструменти. Це роробка дизайну UX/UI з нуля має бути.
**Definition of done:** Клієнтський навбар виглядає premium, Каталог є, `/explore` без регресій ✅

---

### T17 — /my/masters: картка майстра як картка товару
**Беклог:** BL#13
**Скіл:** `design-taste-frontend` + `impeccable`
**Складність:** 🟡

**Проблема:** Картка майстра generic. Має виглядати як картка товару — з усією інформацією і активними кнопками.

**Acceptance criteria:**
- AC-1: Layout: фото / ім'я / спеціалізація / рейтинг (зірки або число)
- AC-2: Кнопки: "Записатись" (primary) + "Переглянути профіль" (secondary)
- AC-3: `<button type="button">` — не `<div onClick>`
- AC-4: Frost дизайн tokens
- AC-5: Responsive: мобайл grid + десктоп grid

**Definition of done:** Картки майстрів виглядають premium, кнопки активні ✅

---

### T18 — Оптимізація завантаження сторінки послуг
**Беклог:** BL#10
**Скіл:** `performance-profiler` + `senior-backend`
**Складність:** 🟡

**Проблема:** Сторінка `/dashboard/services` дуже довго завантажується на мобайлі.

**Acceptance criteria:**
- AC-1: Виміряти LCP/TTI до фіксу (DevTools Lighthouse або вбудований profiler)
- AC-2: Знайти bottleneck: N+1 Supabase queries? Великий JS bundle? Відсутній Suspense?
- AC-3: Skeleton/loading state поки дані завантажуються
- AC-4: Після фіксу → LCP суттєво менший (≥ 30% покращення)

**Definition of done:** Сторінка послуг завантажується помітно швидше ✅

---

## PHASE 3 — Складні фічі (T19–T30)

---

### T19 — /my/bookings: повний аудит + premium redesign
**Беклог:** BL#11
**Скіл:** `impeccable` + `redesign-existing-projects`
**Складність:** 🔴

**Проблема:** Клієнтська сторінка записів потребує повного premium redesign — control panel, картки, типографіка, ієрархія.

**Acceptance criteria:**
- AC-1: impeccable аудит → список порушень → fixes
- AC-2: Control panel (Записи/Замовлення) — premium tabs з Frost tokens
- AC-3: Картки записів — premium design: типографіка, spacing, ієрархія
- AC-4: Frost дизайн tokens скрізь
- AC-5: Мобайл + десктоп responsive

**Definition of done:** /my/bookings виглядає так само premium як дашборд майстра ✅

---

### T20 — /my/bookings: відгук + кнопка "Записатись знову"
**Беклог:** BL#11.2/11.3
**Скіл:** `senior-frontend` + `humanizer`
**Складність:** 🟡

**Проблема:** Немає можливості залишити відгук з /my/bookings. "Записатись знову" — текст-посилання.

**Acceptance criteria:**
- AC-1: "Залишити відгук" → modалка (BottomSheet) або окремий route
- AC-2: Відгук відкривається з deep link (для email/SMS посилань)
- AC-3: "Записатись знову" → `<button type="button">` + `router.push`
- AC-4: Humanizer для всіх нових strings

**Definition of done:** Відгук можна залишити з запису, кнопка "Записатись знову" — активний `<button>` ✅

---

### T21 — Профіль клієнта: фото/IG/TG + impeccable аудит
**Беклог:** BL#15
**Скіл:** `design-taste-frontend` + `impeccable`
**Складність:** 🟡

**Проблема:** Клієнт не може додати фото, Instagram, Telegram. Profile page потребує аудиту.

**Acceptance criteria:**
- AC-1: Avatar upload (Supabase Storage `avatars` bucket)
- AC-2: Поля: Instagram URL + Telegram handle
- AC-3: `client_profiles` — нові колонки `instagram_url`, `telegram_handle` (міграція)
- AC-4: impeccable аудит сторінки → fixes

**Definition of done:** Клієнт може додати фото + соцмережі, profile page виглядає premium ✅

---

### T22 — Стандартизація завантаження фото (всі сутності)
**Беклог:** BL#9
**Скіл:** `senior-fullstack` + `impeccable`
**Складність:** 🔴

**Проблема:** Завантаження фото для послуг, товарів, портфоліо, профілю — різна логіка і якість.

**Acceptance criteria:**
- AC-1: Єдиний `<PhotoUploader>` компонент: crop / preview / progress / error
- AC-2: Bucket routing per entity type (services-photos, products-photos, portfolios, avatars)
- AC-3: Однакова поведінка iOS + Android + desktop
- AC-4: Поступова заміна всіх старих upload implеmentations

**Definition of done:** Завантаження фото скрізь працює однаково і виглядає premium ✅

---

### T23 — Онбординг тур: persona simulation + brainstorm + spec
**Беклог:** BL#23
**Скіл:** `spec-driven-workflow` + `ui-ux-pro-max`
**Складність:** 🟡

**Deliverable:** Spec документ + pain map, НЕ код

**User-side brainstorm = симуляція персонажів:**
- Новачок-майстер (перша реєстрація, нічого не знає)
- Просунутий майстер (знає продукт, шукає нові фічі)
- Мобайл-юзер (тільки телефон, маленький екран)
- Десктоп-юзер (адмінська робота, велика сесія)

**Acceptance criteria:**
- AC-1: Pain map — топ-10 confusion points по сторінках
- AC-2: Brainstorm: per-page tour vs contextual tooltips vs onboarding checklist
- AC-3: Spec: які сторінки, яка форма допомоги, trigger логіка
- AC-4: Approved spec → стає T23-impl (наступний спринт)

**Definition of done:** Детальний spec затверджено юзером ✅

---

### T24 — Клієнтська зона: desktop layout (/my/* + /explore)
**Беклог:** BL#14
**Скіл:** `design-taste-frontend` + `impeccable`
**Складність:** 🔴

**Проблема:** Desktop layout клієнтської зони не оптимізований.

**Acceptance criteria:**
- AC-1: `/my/bookings` — desktop: 2-column або max-width + side panel
- AC-2: `/my/masters` — grid layout, 2-3 картки в ряд
- AC-3: `/my/profile` — form layout оптимізований під wide screen
- AC-4: `/explore` — оптимізований desktop layout каталогу
- AC-5: Responsive: мобайл не ламається

**Definition of done:** Клієнтська зона виглядає premium на desktop ✅

---

### T25 — dashboard/settings (ПК): повний redesign з нуля
**Беклог:** BL#00
**Скіл:** `design-taste-frontend` + `impeccable`
**Складність:** 🔴

**Сторінка:** `/dashboard/settings` (майстер, налаштування профілю)

**Проблема:** Desktop layout налаштувань профілю застарів — переосмислити з нуля: розташування блоків, розміри, форми.

**Acceptance criteria:**
- AC-1: Нова grid-структура блоків (2-column або sidebar + content)
- AC-2: Всі існуючі поля збережені (нічого не видалено)
- AC-3: impeccable audit → 0 critical issues
- AC-4: Мобайл version — не зламано

**Definition of done:** Settings desktop виглядає modern і premium ✅

---

### T26 — Чат підтримки: список діалогів (desktop + mobile)
**Беклог:** BL#1.1
**Скіл:** `spec-driven-workflow` + `senior-frontend`
**Складність:** 🔴

**Проблема:** Немає списку діалогів. Неможливо перемикатись між розмовами або видалити.

**Spec required:**
- FR-1: Desktop → sidebar з списком діалогів (avatar, ім'я, preview last message, timestamp)
- FR-2: Mobile → окрема сторінка `/chat` зі списком → тап → відкриває чат
- FR-3: Back button на мобайлі: чат → список
- FR-4: Активний діалог виділений (desktop sidebar)
- FR-5: Видалити діалог → тільки для клієнта (soft delete зі свого боку)

**Де шукати:** `src/app/(client)/chat/` + `support_tickets` table

**Definition of done:** Список діалогів є на desktop і mobile, видалення працює ✅

---

### T27 — Чат підтримки: мобайл keyboard UX
**Беклог:** BL#1.2
**Скіл:** `senior-frontend` + `emil-design-eng`
**Складність:** 🔴
**Референс:** `Screens/photo_5280650625760828109_w.jpg` – `photo_5280650625760828113_w.jpg`

**Проблема:** Контент ховається за "чубом" (safe area). Клавіатура відкривається → поле вводу не підіймається.

**Acceptance criteria:**
- AC-1: `padding-top: env(safe-area-inset-top)` на chat container
- AC-2: `visualViewport.onresize` або `resize observer` для keyboard detection
- AC-3: Input bar: `padding-bottom: env(safe-area-inset-bottom)` + jump вгору при keyboard open
- AC-4: Messages list займає весь простір між header і input bar
- AC-5: По макету як Telegram: messages list flex-1 + input bar внизу

**Definition of done:** Чат на мобайлі поводиться як Telegram — keyboard не ламає layout ✅

---

### T28 — Розхідники: бізнес-аналіз + persona simulation + spec
**Беклог:** BL#24
**Скіл:** `spec-driven-workflow` + `senior-architect` (+ `ui-ux-pro-max`)
**Складність:** 🔴

**Deliverable:** Spec документ + business analysis, НЕ код

**Контекст:** У нас є 2 типи товарів: "на продаж" і "розхідники для послуг". Розхідники "просто існують" без реальної бізнес-логіки.

**Бізнес brainstorm:**
- Яка цінність розхідника для майстра?
- Як він хоче це використовувати в щоденній роботі?
- Автосписання при записі vs ручне списання?
- Що робити якщо розхідник закінчився: блокувати запис? Попереджати?

**Persona simulation:**
- Майстер з барбершопу (використовує воскові стрічки, гелі)
- Майстер нігтів (гель-лаки, пилки — великий асортимент)
- Лешмейкер (клей для вій — дорогий, важливо не перевитратити)

**Spec deliverable:**
- Два типи: "на продаж" (`for_sale`) vs "розхідник" (`consumable`)
- Auto-deduct: при завершенні запису → списати кількість
- Stock alert: сповіщення при залишку < threshold
- Звіт: витрати розхідників по послугах (analytics)
- Migrations plan

**Definition of done:** Детальний spec затверджено ✅

---

### T29 — Розхідники: міграції + серверна логіка
**Беклог:** BL#24 (частина 2)
**Скіл:** `create-migration` + `senior-backend`
**Складність:** 🔴
**Залежність:** T28 spec approved

**Acceptance criteria:**
- AC-1: `create-migration` — нові колонки/таблиці для consumable tracking
- AC-2: RPC `deduct_consumable_on_booking` — atomic деducт при завершенні запису
- AC-3: RPC `check_consumable_stock` — перевірка наявності перед записом
- AC-4: RLS policies на нові таблиці
- AC-5: Stock alert trigger або cron

**Definition of done:** DB схема + RPCs задеплоєні, тести підтверджують логіку ✅

---

### T30 — Розхідники: UX/UI реалізація
**Беклог:** BL#24 (частина 3)
**Скіл:** `design-taste-frontend` + `impeccable`
**Складність:** 🔴
**Залежність:** T29 deployed

**Acceptance criteria:**
- AC-1: UI прив'язки розхідника до послуги
- AC-2: Stock management widget на сторінці магазину
- AC-3: Сповіщення про низький stock (in-app alert)
- AC-4: Звіт витрат розхідників (простий список або графік)
- AC-5: Humanizer для всього copy

**Definition of done:** Майстер може управляти розхідниками, бачити stock level, отримувати alert ✅

---

### T31 — Smart Design System: Context-Adaptive UI
**Беклог:** BL#25
**Скіл:** `spec-driven-workflow` + `senior-frontend` + `impeccable`
**Складність:** 🔴
**Залежність:** немає (незалежна архітектурна задача)

**Контекст:** iOS-like адаптивний UI — три глобальних утиліти що використовуються по всьому проекту.

**Acceptance criteria:**
- AC-1: CSS `.adaptive-text` (`mix-blend-mode: difference`) + `useAdaptiveColor(ref)` hook → `src/lib/hooks/`; застосовано в Dashboard greeting
- AC-2: `useSmartTooltip(anchorRef, options)` → `src/lib/hooks/`; viewport flip+shift+safe-area; рефакторинг WeeklyChart + PeakHours (прибрати ручний useLayoutEffect clamp)
- AC-3: `<FitText>` → `src/components/shared/FitText.tsx`; ResizeObserver + canvas.measureText() binary search; Dashboard greeting name

**Definition of done:** Три утиліти типізовані, документовані, застосовані в dashboard ✅

---

## Skill Assignments

| Скіл | Задачі |
|---|---|
| `code-reviewer` | T01, T02, T03, T04, T05 |
| `create-migration` | T01 (Frost migration), T29 |
| `design-taste-frontend` | T06, T09, T10, T11, T16, T17, T21, T24, T25, T30 |
| `redesign-existing-projects` | T12, T19 |
| `senior-frontend` | T07, T08, T14, T20, T26, T27, T31 |
| `focused-fix` | T13 |
| `senior-backend` | T13, T15, T18, T29 |
| `performance-profiler` | T18 |
| `spec-driven-workflow` | T15, T23, T26, T28, T31 |
| `impeccable` | T06, T07, T08, T09, T10, T11, T12, T14, T16, T17, T19, T21, T22, T24, T25, T30, T31 |
| `spec-driven-workflow` | T15, T23, T26, T28 |
| `emil-design-eng` | T27 |
| `senior-fullstack` | T22 |
| `ui-ux-pro-max` | T23, T28 |
| `senior-architect` | T28 |
| `humanizer` | ОБОВ'ЯЗКОВО для всіх задач з UI text |

---

## Post-Deploy Checklist (кожна ітерація)

```
□ npx tsc --noEmit → 0 помилок
□ npm run build → clean
□ vercel --prod → deployed
□ TRACKER.md → T[N] ⬜→✅ + commit hash
□ HANDOFF.md → секція T[N]: що зроблено, root cause, файли
□ TRANSITION_PROMPT.md → оновити "Наступна" → T[N+1]
□ mempalace_add_drawer → зберегти key learnings
□ QA → юзер перевіряє → підтверджує → наступна задача
```

---

*Створено: 2026-06-12 | Sprint-04 v1.0*
