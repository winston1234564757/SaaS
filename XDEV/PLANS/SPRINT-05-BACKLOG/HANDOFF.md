# Sprint-05 HANDOFF
> Читай цей файл ПЕРШИМ на початку кожної нової сесії.
> Тут повний стан спринту: що зроблено, що далі, всі деталі задач.

**Спринт:** Sprint-05 — Загальний беклог (74 задачі: Зона Майстра + Клієнтська Зона + Глобальне)
**Розпочато:** 2026-06-22
**Прогрес:** 10/74 ✅ (`G-LAND-02` · `M-SVC-01` · `M-DASH-06` · `M-SHOP-04` · `G-LOGIN-02` · `G-PWA-02` · `G-PWA-01` · `M-DASH-01` · `M-DASH-02` · `M-DASH-03`)
**Наступна задача:** **`M-DASH-04` — Дашборд: "Записи" — прибрати капс у текстах** (COPY · `humanizer` · Haiku)
**Оновлено:** 2026-06-24

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

## ✅ DONE: `M-DASH-03` — Дашборд: "Вільно сьогодні" scroll UX (P1) · commit `4d6c2dcf` (+tweak `762461a3`)

**Контртеза до опису:** беклог просив "UX-стрілки, перемикачі, статус скролу" зі стрілкою `→ G-PWA-02`. Перевірка показала: скрол-UX **уже повністю закрито** — селектор послуг у `frost/FreeSlotsWidget.tsx` сидить на `ScrollStrip` (стрілки на 1 крок + крапки на елемент + selection→scroll). Drawer G-PWA-02 прямо фіксує цей віджет як мігрований. Нового скрол-коду = 0.

**Розширення scope (рішення Vitos):** додано motion-полиш — staggered reveal груп слотів.

**Рішення:** `frost/FreeSlotsWidget.tsx` — групи Ранок/День/Вечір каскадом:
- `groupStagger`/`groupItem` поза компонентом, `as const` (за `dashboard-animation-system`). spring `duration 0.6, bounce 0` — без overshoot (вимога Vitos), `staggerChildren 0.12, delayChildren 0.06`. (Стартові 0.4/0.08/0.04 відчувались різко → уповільнено на 50%, tweak `762461a3`.)
- `key={selectedService?.id}` → replay на load + кожній зміні послуги.
- `useReducedMotion()` → `initial={false}` fallback (миттєво, нуль трансформів).
- Лише `opacity`+`y`; стагеряться тільки 3 групи, чипи разом. ScrollStrip/сітка/footer не чіпані.

**Перевірка:** TSC 0 · Build clean · deploy READY на prod. Скіл `emilkowalski-motion` валідував рух. Деталі — `BRIEFS/M-DASH-03.md`.

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

## ✅ DONE: `G-PWA-01` — Скляна Safe Area

**Тип:** MOTION (Tier 1) *(виправлено з FEATURE/Tier 2 — узгоджено з WORKFLOW)* · **Скіли:** `scroll-experience` + `progressive-web-app` · **Модель:** Sonnet · **Commit:** `56ed454c`
**Статус:** ✅ код готовий, TSC 0 · Build clean · device QA ✓ (founder).

**Задача:** На мобільних із вирізом верхня safe-area смуга прозора → контент лізе під виріз сирим. Рішення: фіксований liquid-glass оверлей, матовість наростає при скролі.

**Зроблено:** новий примітив `src/components/shared/GlassSafeArea.tsx` (повний drawer у MemPalace).
- Fixed top, `height: calc(env(safe-area-inset-top,0px) * 0.8)`; scroll-driven `blur 0→14px` + `saturate(200%)`; тінт = градієнт `rgba(239,242,255, 0→0.30)`→`0→0.12` (низ); ramp 52px, ease-out `p*(2-p)`.
- Perf: passive scroll + rAF, стилі прямо в ref (нуль re-render/кадр); при p<0.01 скидає компонувальний шар. `prefers-reduced-motion`, `-webkit-` префікс, `pointer-events-none`, `aria-hidden`.
- Змонтовано: `my/layout.tsx` (клієнт) + `DashboardLayout.tsx` (майстер), scroll root=window; chat-гілки пропущені; z-40. Потребує `viewportFit:'cover'` (вже є).

**Acceptance:**
- [x] Верхня зона плавно матовіє при скролі *(код; візуал — на device QA)*
- [x] Коректно з safe-area insets (notch/Dynamic Island) — device QA ✓
- [x] Без jank (compositor-only, rAF, ref-write)
- [x] TSC 0 · Build clean

**Деплой:** код у commit `56ed454c` (локально). `git push` / `vercel --prod` — за рішенням founder.
**User-tune:** founder зменшив `maxBlur` 22 → 14 у фіналі.

---

## ✅ DONE: `M-DASH-01` — Дашборд: динамічні блоки рекомендацій (top) (P1) · commit `d857a5e6`

**Тип:** REDESIGN (Tier 2) · **Скіли:** `design-taste-frontend` + `humanizer` · **Фаза 2**

**Скоуп (розширено через QA + пряму вказівку founder):** не лише стрип, а **вся верхня зона**. Ключове рішення founder: «Stock-віджет взагалі вниз опусти, передостаннім — він не має бути зверху».

**Зроблено:**
- **`AdaptiveContextStrip.tsx` — перебудовано.** Замість 2 рівних карток у тісному `grid-cols-2` → домінантна головна картка (велика, accent-tint, іконка-чіп 44px, заголовок через `FitText`, повноширинна accent-CTA `py-3`) + компактні вторинні. Mobile: головна зверху + вторинні стеком (до 2). Desktop (`lg:`): горизонтальний ряд головна + 1 вторинна (другу `lg:hidden`) → висота лишається ~однієї картки, пара з `EarningsPulseWidget` не з'їжджає.
- **Релевантність.** Новий пріоритет головної поради: `useDashboardStats().todayPending > 0` → «N записів очікують → Підтвердити» (час-чутливе). Інакше — порада за станом завантаженості (`useBusyness`, 4 стани). popLayout-перехід keyed by `main.id`. `pluralUk` на годинах/записах (виправив прихований баг «1 вільних годин»).
- **`StockWidget.tsx` — нормалізовано під Frost.** `widget-card` → `bento-card`; shadcn-utility токени (`text-muted-foreground`, `text-destructive`, `bg-secondary`, `bg-primary/40`, `text-foreground`, `text-primary`) → Frost CSS-змінні (`var(--text-tertiary/primary)`, `var(--error)`, `var(--border)`, accent-mix). Lucide-іконки в span зі style-кольором.
- **`FrostDashboard.tsx` — Stock перенесено.** З 3-ї позиції зверху → передостаннім (після `ClientAlerts`, перед `ReferralBoostWidget`, з власним розділювачем) і на mobile, і на desktop. `custom`-індекси stagger впорядковано послідовно (були дублі `custom={3}`). `data-tour-key="dash-2"` на стрипі збережено.

**Перевірка:** TSC 0 · Build clean · 3 файли. Скіли: `design-taste-frontend` (у межах наявної Frost-системи, без нав'язування Geist/zinc) + `humanizer` (нова pending-копія). Деталі — `BRIEFS/M-DASH-01.md`.

**Device QA (за founder):** головна порада домінує на mobile / нічого не тиснеться / CTA ≥44px; desktop-пара по висоті рівна; Stock унизу виглядає як решта bento; стан із pending показує «N записів очікують» головною.

**KEY:** На desktop стрип ділить рядок `3fr` з `EarningsPulse` → vertical-stack карток зламав би парність висоти. Рішення: responsive `flex-col` (mobile) ↔ `flex-row` + `lg:hidden` на 2-й вторинній (desktop). Головна/вторинна ієрархія через вагу+розмір+tint, не лише масштаб (правило design-taste).

---

## ✅ DONE: `M-DASH-02` — Дашборд: Quick Actions tap-анімація (P2) · commit `6421b89c`

**Тип:** MOTION (Tier 1) · **Скіл:** `emilkowalski-motion` · **Feel:** «Pop з overshoot» (обрано founder)

**Before:** mobile `QuickActionsWidget` — тап лише `active:bg-white/5` (спалах фону, нуль тактильності); desktop `FrostActionsBar` — `active:scale-[0.97] active:transition-none` (різкий снеп без пружного повернення).

**Зроблено (узгоджено mobile + desktop, один motion-язик):**
- framer-motion `whileTap` на **контенті плитки** (icon+label), не на боксі → дільники сітки та `--hero-card-bg` не рвуться при масштабі.
- Press → `scale 0.92`; release → пружний spring `{ stiffness:520, damping:16, mass:0.8 }` дає overshoot ~1.03 і повернення. Іконка додатково `y:-2` через variants (parent `whileTap="tap"` пропагує лейбл на дочірні).
- Лише `transform` (GPU). `useReducedMotion()` → `whileTap` вимкнено для reduce-користувачів.
- Desktop: прибрано `active:scale active:transition-none`, той самий `TAP_POP` + variants.

**Перевірка:** TSC 0 · Build clean · 2 файли. Device QA (тактильність тапу на реальному мобільному) — за founder.

**KEY:** «Pop» = bouncy spring на release (низький damping → overshoot природно, без явних keyframes). whileTap на дочірньому контенті + variants-пропагація на іконку = ефект без скейлу самого боксу.

**Hotfix (device QA, 3 раунди) · commits `92d61922` → `e0a63f90` → `ef0c1e82` (фінал):** на тачі перший тап лише анімував, навігація — з другого.
- Раунд 1 (`92d61922`): `<Link>`→`<button>`+delay. НЕ вилікувало — `whileTap` лишався на дочірньому span.
- Раунд 2 (`e0a63f90`): `whileTap` піднято на той самий `motion.button`, що `onClick`. ВСЕ ОДНО два тапи — framer gesture перехоплює pointer і ковтає click після першої навігації.
- Раунд 3 (`ef0c1e82`): **framer `whileTap` прибрано повністю.** Press = власний `useState` (`onPointerDown/Up/Leave/Cancel`), scale через inline-`transform` + bouncy CSS-ease (pop-overshoot на release). Навігація — plain `onClick` + 160ms delay. Винесено `QuickTile`/`BarAction` під-компоненти (hooks-in-map). 3 кнопки запрацювали, але аналітика лишилась двотапною.
- Раунд 4 (`28707740`): `<button>` втратив автопрефетч `<Link>`; додав `router.prefetch` — не допомогло аналітиці.
- Раунд 5 (`dc5df938`, **ФІНАЛ — redo з нуля через plan mode**): прибрано і `<button>+setTimeout`, і manual `router.push`. Навігація — нативний **`next/link` `<Link>`** (автопрефетч + миттєвий перший тап + a11y), press — pointer-стейт + CSS transform (без `whileTap`, без затримки). Затримка 160ms була окремою причиною лагу на важкій аналітиці. Додатково: `AnalyticsClientLoader` `dynamic(ssr:false)` отримав skeleton-`loading` (не порожньо під час завантаження чанку); desktop AdaptiveStrip/Earnings `items-stretch`→`items-start`; StockWidget «+» tap-target py-2; secondary-картка size-10/gap-3.5.

**KEY-gotcha (фінал):** для tap-to-navigate — **нативний `<Link>`** (префетч + миттєва надійна навігація), press через pointer-стейт + CSS transform. НЕ `whileTap` (ковтає перший тап на тачі), НЕ `<button>+setTimeout(router.push)` (затримка = перцептивний лаг → подвійний тап + втрата префетчу). Для важких `dynamic(ssr:false)` маршрутів — завжди `loading`-фолбек. (Деталі — MemPalace `fixes` drawer `7ec491ed…`.)

> ⚠ **ЗАЛИШКОВА ПРОБЛЕМА (за рішенням founder — лишаємо як є, 2026-06-24):** після redo на `<Link>` 3 легкі Quick Actions навігують з першого тапу, але **«Аналітика» на пристрої досі вимагає повторного тапу**. Оскільки навігаційний патерн тепер канонічний і працює для інших маршрутів, причина — **внутрішня вага самого маршруту `/dashboard/analytics`** (`dynamic(ssr:false)` чанк `AnalyticsPage` + RPC), а НЕ компонент Quick Actions. Не доводилось до кінця за рішенням founder. **TODO (окремо, не M-DASH-02):** профілювати/полегшити завантаження `AnalyticsPage` (розмір бандла, code-split важких частин, RPC до маунту). Скіл: `react-doctor`/`react-best-practices` + bundle-аналіз.

---

## ▶ NEXT: `M-DASH-04` — Дашборд: "Записи" — прибрати капс у текстах

**Тип:** COPY (Tier 0) · **Скіл:** `humanizer` · **Модель:** Haiku · **P2** · **Фаза 2**

**Задача (з BACKLOG):** блок «Записи» (статистика) — у загальному звіті (конверсія, топ-послуга) прибрати капс ("ВСЬОГО", "ОЧІКУЮТЬ") → нормальний регістр.

**Підхід (Tier 0, без брифа-файлу):**
1. Знайти компонент блоку статистики записів (ймовірно у `widgets/frost/` або `master/bookings/` — grep `ОЧІКУЮТЬ`/`uppercase`/`tracking-` біля цих лейблів).
2. Зібрати всі UI-рядки → `humanizer` → нормальний регістр (не CAPS, не `uppercase` клас де він робить капс на кириличному копірайті).
3. Зважити: частина «капсу» може бути CSS `uppercase`/`tracking` на лейблах-eyebrow — рішення per-label (eyebrow-стиль лишити, читабельний текст — у нормальний регістр). Узгодити з Vitos на showі before/after.
4. `tsc` (Tier 0 — повний build батчем перед деплоєм).

---

*(деталі наступних задач додаватимуться сюди при переході до них)*
