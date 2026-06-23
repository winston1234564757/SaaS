# Sprint-05 HANDOFF
> Читай цей файл ПЕРШИМ на початку кожної нової сесії.
> Тут повний стан спринту: що зроблено, що далі, всі деталі задач.

**Спринт:** Sprint-05 — Загальний беклог (74 задачі: Зона Майстра + Клієнтська Зона + Глобальне)
**Розпочато:** 2026-06-22
**Прогрес:** 6/74 ✅ (`G-LAND-02` · `M-SVC-01` · `M-DASH-06` · `M-SHOP-04` · `G-LOGIN-02` · `G-PWA-02`)
**Наступна задача:** **`G-PWA-01` — Скляна Safe Area (blur/backdrop при скролі)**
**Оновлено:** 2026-06-23

---

## Контекст спринту

Sprint-05 переріс із "тільки клієнтська зона" у **наскрізний беклог обох зон** (74 задачі, 3 секції). Повний список і скіл-стратегія — у `BACKLOG.md`. Порядок виконання — у `TRACKER.md` (фази).

**Структура:** A. Зона Майстра (57) · B. Клієнтська Зона (10) · C. Спільне/Глобальне (7).
**Скіл-стратегія:** універсальні гейти (`grilling` → робота → `impeccable`/`code-review` → `humanizer` → `ship-gate`) + спеціаліст-скіли на кожну задачу. Джерело: `XDEV/SKILLS_REFERENCE.md`.

**Дизайн-система:** Frost (єдина активна тема). `#EFF2FF` фон, `--surface: rgba(218,226,255,0.90)`.

**Технічний стан клієнт-зони (бекенд готовий, не чіпати):**
- `/my/messages`: `conversations` + `direct_messages`, RLS ✅, server actions ✅, hooks ✅
- `/my/profile`: `instagram_url` + `telegram_handle` міграція ✅, avatar upload ✅
- `/my/bookings`: `submitReview` ✅, `cancelBooking` ✅
- `/explore`: фото `h-[134px]` ✅, tags strip ✅

---

## ✅ DONE: `M-SVC-01` — Послуги: статистика по послузі (P0) · commit `028e6820`

**Root cause (контртеза до опису):** беклог казав "аналітика не передається на бекенд, зламаний пайплайн". Це **неправда**. `createBooking.ts:559-567` пише `booking_services` з `service_id`; у БД 394 рядки, 0 з NULL. Backend цілий. Реальна причина — **read-сторона не реалізована**: `ServiceEditor.tsx:574-576` показував захардкоджений плейсхолдер "Статистика з'явиться після перших записів" для будь-якої послуги, без жодного запиту до даних.

**Рішення:**
- `services/actions.ts` → `getServiceStats(serviceId)`: scoped admin-client агрегація з перевіркою власності. Повертає `completedCount`, `revenue` (Σ `service_price` по `completed`), `avgCheck`, `sharePct` (частка у виручці послуг), `lastDate`, `plannedCount` (майбутні pending/confirmed, без виручки).
- `ServiceEditor.tsx` → плейсхолдер замінено на живий блок: Записів · Виручка · Сер. чек + Частка % · Останній запис + "Попереду ще N записів". Loading/empty/planned стани оброблені.

**Перевірка:** TSC 0 · Build clean · end-to-end на реальних даних ("Брови" 102 записи / 40 800 грн / сер.чек 400 / останній 2026-06-22). Security self-audit: всі запити scoped по `master_id`, ownership перевіряється, чужі дані недоступні. Деталі — `BRIEFS/M-SVC-01.md`.

---

## ✅ DONE: `M-DASH-06` — Пікові години: тултіп з 2-го тапу (P0) · commit `f0a91bc5`

**Root cause:** На мобільному браузер синтетично генерує `mouseenter` перед `click` для кожного touch-тапу. `onMouseEnter` → `handleCell` → показує тултіп (isSame=false). Потім `onClick` → `handleCell` → isSame=true → toggle-off. Результат: блимання на першому тапі. На другому тапі `mouseenter` вже не перезапускається → тільки `onClick` → isSame=false → тултіп залишається.

**Рішення:** 2 рядки у `frost/PeakHoursWidget.tsx`:
- `onMouseEnter` → `onPointerEnter` з фільтром `if (e.pointerType !== 'mouse') return;`
- `onMouseLeave` на батьківському div → `onPointerLeave` з тим самим фільтром

Desktop поведінка без змін. TSC 0 · Build clean.

---

## ✅ DONE: `M-SHOP-04` — Магазин: модалка поповнення → vaul + собівартість (P0) · commit `98e89c52`

**Root cause:** `RestockDrawer.tsx` використовував bare framer-motion (`AnimatePresence` + `motion.div`) замість vaul — пряме порушення протоколу. Поле `cost_kopecks` було в БД (міграція 139), у типах, але не у формі та не в `restockProduct` action.

**Рішення:**
- `RestockDrawer.tsx`: повна заміна на `Drawer.Root/Portal/Overlay/Content/Title` (vaul). Додано `costStr` стейт з `useEffect`-prefill при кожному відкритті (правильно синхронізується між різними продуктами). `shouldScaleBackground` = нативний UX.
- `actions.ts → restockProduct`: 4-й параметр `costKopecks?: number`; при наявності — оновлює `products.cost_kopecks` spread-оператором в тому ж `.update()`.

**Перевірка:** TSC 0 · Build clean · 2 файли.

**Hotfix (keyboard UX) · commit `62c7da75`:** На iOS коли відкривається клавіатура — браузер зміщує `position:fixed` елементи через body scroll offset, ховаючи header drawer-а. `shrink-0` / flex-zones не допомагають бо зміщується весь layout viewport. Єдиний правильний fix: `max-h-[90dvh]` замість `vh`. `dvh` (dynamic viewport height) автоматично зменшується коли keyboard відкривається — drawer стискається рівно над нею. Нуль JS, нуль event listeners. Footer: `pb-5` (20px).

---

## ✅ DONE: `G-LOGIN-02` — Логін мобільний: iOS-клавіатура (P0) · commit `ff209529` (RE-OPEN, фінал)

> Попередні «фікси» (`e9946bc9` dvh+overflow, `ea8e73fa` mt-auto JS, `de5599ee` flex-spacer) НЕ спрацювали на iOS — усі стояли на хибній передумові.

**Справжній root cause:** `dvh`/`vh` на iOS Safari **НЕ реагують на віртуальну клавіатуру**. Вони міняються лише коли згортається адресний рядок браузера. Клавіатура — оверлей; керується `interactive-widget`, який iOS ігнорує (дефолт `resizes-visual`) → `100dvh` лишається = повна висота екрана навіть із відкритою клавіатурою. Тому форма опинялась за клавіатурою, iOS сам панорамував visual viewport → «мертва зона». Додатково: `(auth)/layout.tsx` вкладений у root `min-h-screen` → body лишався панорамованим навіть після стискання auth-контейнера.

**Рішення (visualViewport-driven fixed shell):**
- NEW `AuthViewportShell` (client): `position: fixed` (вириває з `min-h-screen`, body перестає панорамуватись) + `height = visualViewport.height` + `translateY(offsetTop)` на `resize`/`scroll`. На `resize` доскролює фокусний інпут у центр видимої зони (`scrollIntoView`), бо зміна height скидає iOS auto-scroll. Клас `kb-open` на shell коли `innerHeight − vv.height > 120`.
- `AuthScrollMain`: flex-spacer → `my-auto` (центр коли влазить, скрол без flex-clip).
- `PhoneOtpForm` phone input: каретку тримаємо після провідного `0` (`onFocus`/`onClick` → `setSelectionRange(end)`) — інакше ввід перед `0` ламав номер на iOS.
- Brand strip: при `.kb-open` росте вищою (`[.kb-open_&]:pt-10 pb-8`, transition) — бренд завжди добре видно (за бажанням юзера).
- root viewport: `interactiveWidget: 'resizes-content'` — прогресивне покращення для Android Chrome (iOS ігнорує).

**Чому минулого разу `AuthKeyboard` видалили помилково:** він ставив `height: vv.height` на **position:static** елемент → конфлікт з iOS body-pan (`offsetTop`). Висновок «прибрати JS, юзати dvh» був хибний — бракувало `position: fixed` + компенсації `offsetTop`.

**Перевірка:** TSC 0 · Build clean · 6 файлів. Підтверджено вживу на iPhone (клавіатура не перекриває, каретка після `0`, brand strip вища).

**KEY RULE:** iOS Safari + клавіатура → ТІЛЬКИ `window.visualViewport` (height + offsetTop) на `position: fixed` контейнері. `dvh`/`svh`/`interactive-widget` для iOS не працюють (тільки Android Chrome).

---

## ✅ DONE: `G-PWA-02` — Уніфікація горизонтальних скролів (P1) · commit `ae9466d8`

**Підхід:** Замість десятка окремих хаків — один спільний примітив `ScrollStrip` (`components/shared/ScrollStrip.tsx`), drop-in заміна для `overflow-x-auto scrollbar-hide`. 3 шари індикації, що з'являються ЛИШЕ коли трек переповнений:
- **Edge-fade маска** (фон-незалежна, `mask-image`) на скролючому боці.
- **Стрілки** на всіх в'юпортах → крок рівно **1 елемент** (знайти+центрувати наступний прихований).
- **Крапки** по 1 на елемент (з `track.children`): активна = **вибрана пілюля** (`aria-pressed/selected/current`), інакше найближча до центру; **вибір пілюлі → крапка перемикається + елемент плавно центрується** (детект зміни через ref, без scroll-loop).

Best-practice (скіл `scroll-experience`): нативний свайп не хайджекається, `prefers-reduced-motion` → миттєвий скрол, passive listener + guarded setState (без jank). Деталі — `BRIEFS/G-PWA-02.md`.

**Мігровано 10 стрипів:** FreeSlotsWidget (M-DASH-03), ClientsPage retention+segments (M-CLI-04), ShopPage, StepServices, KpiTicker (розплющено внутр. wrapper), ProductsPage, DashboardTopBar (`arrows/dots=false`), SegmentBuilder (`arrows=false`), SupportChatPage.

**Свідомо НЕ чіпав:** ExplorePage (auto-scroll marquee + анімований фільтр-бар + pending `C-EXPL-01` редизайн), NavigationStrip (вже має градієнт edge-індикацію), StoryGenerator (`lg:flex-wrap`, десктоп — не скролить), таблиці, snap-каруселі/день-пікери, ServiceSelector (вже крапки+стрілки), admin-консоль.

**Перевірка:** TSC 0 · Build clean. Підтверджено юзером вживу на мобілці.

**KEY:** Парасолькові UX-патерни → один примітив, не N копій. `M-DASH-03` і `M-CLI-04` тепер закриваються цим же `ScrollStrip`.

---

## ▶ NEXT: `G-PWA-01` — Скляна Safe Area

**Тип:** FEATURE (Tier 2) · **Скіли:** `progressive-web-app` + `scroll-experience` · **Модель:** Sonnet

**Задача:** Для мобільних із вирізом / Dynamic Island — при скролі вгору верхня safe-area зона плавно «поглинає» елементи через матовий скляний ефект (`blur` / `backdrop-filter`).

**Підхід:**
1. Знайти top safe-area / sticky-хедер контейнери у клієнт- і майстер-зонах (`env(safe-area-inset-top)`).
2. Scroll-driven: при скролі контенту під зону → нарощувати `backdrop-filter: blur()` + напівпрозорий Frost-фон на верхній смузі.
3. Compositor-only (backdrop-filter/opacity), без layout-thrash; перевірити на notch/Dynamic Island.

**Acceptance:**
- [ ] Верхня зона плавно матовіє при скролі
- [ ] Коректно з safe-area insets (notch/Dynamic Island)
- [ ] Без jank
- [ ] TSC 0 · Build clean

**⚠ Перед стартом:** `mempalace_search "safe area blur backdrop sticky header scroll"`.

---

## P0-черга після M-DASH-06 (ФАЗА 0)

| ID | Задача | Скіли |
|----|--------|-------|
| `M-SHOP-04` | Модалка поповнення → `vaul` BottomSheet + поле собівартості | `senior-frontend` (vaul) |
| `G-LOGIN-02` | Логін мобільний: прибрати зазор між полем і клавіатурою при відкритій keyboard; є Google auth + phone input — автофокус вже працює, не чіпати | `senior-frontend` |

---

*(деталі наступних задач додаватимуться сюди при переході до них)*
