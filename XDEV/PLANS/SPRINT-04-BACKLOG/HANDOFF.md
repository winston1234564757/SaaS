# Sprint-04 HANDOFF
> Читай цей файл ПЕРШИМ на початку кожної нової сесії.
> Тут повний стан спринту: що зроблено, що далі, всі деталі задач.

**Спринт:** Sprint-04 (30 ітерацій)
**Розпочато:** 2026-06-12
**Прогрес:** 16/30 ✅
**Наступна задача:** **T17 — /my/masters: картка майстра → як картка товару**

---

## ⚠️ Pending з Sprint-03 (ОБОВ'ЯЗКОВО закрити)
- `npx supabase db push` — міграція `20260607000000_security_search_path_fix.sql` (19 RPC search_path functions)
  - Якщо CLI не працює → Dashboard SQL Editor
- Vercel Pro upgrade → cron `0 * * * *` для `check-uncompleted` endpoint

---

## ✅ T01 — Frost тема для всіх клієнтів
**Commit:** `490a108`
**Root cause:** `src/app/layout.tsx` — `rawTheme` fallback `|| ''` → empty string → `data-theme` не встановлювався → CSS default = Blossom background.

**Що зроблено:**
1. `src/app/layout.tsx`: нормалізація rawTheme — `(!cookieTheme || cookieTheme === 'default') ? 'frost' : cookieTheme`
   - Нові клієнти (без cookie) → Frost ✅
   - Старі клієнти з 'default' (Blossom) cookie → Frost ✅
2. DB міграція: `20260609000001_frost_default_theme.sql` вже існує з Sprint-03 — `UPDATE master_profiles SET mood_theme = 'frost' WHERE mood_theme IS NULL OR mood_theme != 'frost'`
3. `client_profiles` — **немає колонки theme** (тема зберігається в cookie, не в БД)
4. `my/layout.tsx` — вже має `data-theme="frost"` hardcoded для `/my/*` роутів

**TSC:** 0 помилок | **Build:** clean

---

## ✅ T02 — In-app сповіщення: unread кольорові + z-index
**Commit:** `b7c1d25`

**Що зроблено** (`NotificationsBell.tsx`):
1. Десктоп bell кнопка: `text-muted-foreground` завжди → `unreadCount > 0 ? 'text-accent' : 'text-muted-foreground'`
2. Badge z-index: `z-10` на всіх 3 badge span (mobileNav / fab / default)
3. Body text прочитаних: `text-muted-foreground/50` (vs unread: `text-muted-foreground`)
4. **Hotfix** (`f88b444`): `markAllRead()` переміщено з `handleOpen()` → `onOpenChange(!val)` — тепер відмічає прочитаними при **закритті**, а не при відкритті. Root cause: виклик до рендеру → всі items одразу `isRead=true` → сірі.

**Hotfix-3** (`185d78a`) — optimistic mark-as-read: `qc.setQueryData` синхронно перед DB write → instant UI, DB write у background `.then(invalidateQueries)`. Функції змінені з `async` на sync. File: `src/lib/supabase/hooks/useNotifications.ts`.
**Hotfix-4** (`2746e21`) — X кнопка тепер також викликає `markAllRead()`: Vaul v1 не тригерить `onOpenChange` при зовнішньому `setOpen(false)` → close button мав додатковий explicit call. `onClick={() => { markAllRead(); setOpen(false); }}`. File: `NotificationsBell.tsx`.

**TSC:** 0 | **Build:** clean

---

## ✅ T03 — Портфоліо → Сторіс: редірект замість drawer
**Commit:** `55ce2f9`

**Root cause:** `StoryGenerator` жив inline в `PortfolioPage` — дублював маркетинг-логіку. `/dashboard/stories` не існував — реальний роут `/dashboard/marketing?tab=stories`.

**Що зроблено:**
1. `PortfolioPage.tsx`: `handleOpenStories` + `onStoryClick` → `router.push('/dashboard/marketing?tab=stories&portfolioId=<id>')`. Видалено `StoryGenerator`, `isStoryOpen`, `prePortfolioId`, `useSearchParams`, `useMasterContext`.
2. `PortfolioItemPage.tsx`: Link href → `/dashboard/marketing?tab=stories&portfolioId=${itemId}`
3. `marketing/page.tsx`: додано `portfolioId` у searchParams; `activeMode` деривується з portfolioId (`portfolio_item` якщо є). Передається в `MarketingTabs`.
4. `MarketingTabs.tsx`: додано `initialPortfolioId` prop → передається в `StoryGenerator`.

**TSC:** 0 | **Build:** clean

---

## ✅ T04 — Мобайл магазин: кнопка "Додати товар" + toggle a11y
**Commit:** `df27107`

**Root cause:** FAB мав тільки іконку без тексту (a11y); TabBtn використовував `bg-primary/bg-secondary` замість `bg-accent/border`; ProductCard toggle мав `aria-pressed` замість `role="switch"` + `aria-checked`; touch target = 20px замість ≥ 44px.

**Що зроблено:**
1. `ProductsPage.tsx`: inline `<button>` "Додати товар" (Plus icon + text) в header поряд з h1, видимий коли `tab === 'products'`; FAB залишено
2. `ProductsPage.tsx` — `TabBtn`: active = `bg-accent text-accent-foreground`; inactive = `border border-border bg-transparent text-muted-foreground`
3. `ProductCard.tsx`: toggle → `role="switch"` + `aria-checked={p.is_active}`; `bg-primary→bg-accent`; `py-[12px] -my-[12px]` для 44px touch target

**T04-ext (commit `3c26ff6`) — уніфікація всіх pill-тоглів:**
- `ServiceCard.tsx`: `bg-primary→bg-accent` · `role=switch` · 44px touch
- `ProductFormDrawer.tsx`: `bg-primary→bg-accent` · `role=switch` · CSS→spring motion · 44px touch
- `PublicStatusWidget.tsx`: `role=switch` · 44px touch · `bg-success` збережено (семантика публікації)
- `ScheduleWidget.tsx`: `bg-[var(--btn-primary-bg)]→bg-accent` · `role=switch` · 44px touch
- Клієнтська зона (`/my/*`): tab-кнопки з `aria-pressed` — залишено (семантично коректно)

**Стандарт тоглів:** `role=switch` + `aria-checked` + `bg-accent` + `py-[12px] -my-[12px]` + spring `stiffness:500 damping:30`

**TSC:** 0 | **Build:** clean

---

## ✅ T05 — Клієнти (список): стандартизація кнопок + smart кнопка
**Commit:** `c239ae4`

**Root cause:** `ClientListRow` мав `MessageSquare` (→ маркетинг) замість `Sparkles` (smart-action) як кнопку #2; стилі були `rounded-lg px-3` замість `size-11 rounded-full` як у `ClientGridCard`; `onSmartAction` не був прокинутий.

**Що зроблено:**
1. `ClientListRow.tsx`: кнопка #2 `MessageSquare → Sparkles` + `onSmartAction(client)`. Всі 3 іконки → `size-11 rounded-full` (desktop hover + mobile bar). Видалено `useRouter` + `MessageSquare` imports.
2. `ClientsPage.tsx`: додано `onSmartAction` callback до `ClientListRow` (той самий `getSmartAction` → `setSmartMessage` → `setShowSmartAction` що в grid).

**Hotfix** (`ee456cb`) — два баги виявлені під час impeccable audit:
1. `ClientListRow.tsx`: status/VIP badge wrapper → додано `sm:group-hover:hidden` (badge проглядався крізь absolute hover overlay на desktop)
2. `ClientListRow.tsx`: mobile action bar → загорнуто в `{!editing && (...)}` guard (bar показувався одночасно з note editor)

**TSC:** 0 | **Build:** clean

---

## ✅ T06 — Меню > Система > Студія: redesign + alpha/beta

**Commit:** `875f512`

**Root cause:** `/dashboard/studio` мав `WaitlistButton` (joinWaitlist — анонімний список) замість beta-форми з реальними контактами. Стиль кнопки `bg-primary` не відповідав BillingPage Studio CTA.

**Що зроблено:**
1. `studio/page.tsx` — повний rewrite: Server Component, STUDIO_COLOR = #5C9E7A, left-aligned layout, vertical feature list, humanized copy
2. `StudioBetaCard.tsx` — новий Client Component: "Беремо перших" секція + Sheet форма (name/contact/size → submitBetaRequest з billing/actions)
3. CTA "Хочу в бету" — style як на BillingPage: `background: #5C9E7A, boxShadow: 0 4px 16px #5C9E7A40`
4. Badge a11y fix: `color: #1E5C3F` на `#5C9E7A18` bg = 7.90:1 WCAG AA
5. WaitlistButton → більше не використовується (замінений StudioBetaCard)

**TSC:** 0 | **Build:** pending deploy

---

## ✅ T07 — Записи мобайл: safe area top + opacity при скролі

**Commit:** `224b0f9`

**Root cause:** `top-[var(--safe-top,0px)]` — `--safe-top` ніде не встановлювався → дефолт 0px → sticky bar при стікінгу залазив вище `main`'s `pt-[env(safe-area-inset-top)]`, тобто під нотч. Бар не мав background → картки видно крізь нього при скролі.

**Що зроблено** (`BookingsPage.tsx`):
1. AC-1: `paddingTop: 'calc(env(safe-area-inset-top) + 8px)'` inline style — зберігає оригінальний pt-2 + додає safe zone
2. AC-2: `isScrolled` state + passive `window.scroll` listener (scrollY > 50). При скролі: `bg-background/90 backdrop-blur-[12px] opacity-[0.95]`. В спокої: `bg-background` (solid). `transition-all duration-300` для плавності
3. AC-3: `controlsRef` + `ResizeObserver` → `barHeight`. `scroll-padding-top` на `document.documentElement`. `scrollMarginTop: barHeight` на кожній date-group div
4. AC-4: Desktop: `lg:hidden` → barHeight = 0 (offsetHeight hidden = 0) → scroll-padding-top = 0 автоматично

**Hotfix** (`5be8ae1`) — impeccable audit: flat `bg-background` bar замінено на `widget-card` (glass surface = `var(--surface)` + `blur(36px)` + inset glow + `0.5px border`), що відповідає 4 stat-картам вище. Outer div = safe-area cover (`var(--background)`). Видалено redundant `backdrop-blur-sm` з View Switcher та `isScrolled` opacity hack (a11y ризик).

**Hotfix-2** (`0167e17`) — sticky повністю видалено на прохання юзера: controls panel скролиться вільно. Видалено `sticky`, `isScrolled`, `controlsRef`, `ResizeObserver`, `barHeight`, `scroll-padding-top`, `scrollMarginTop`. Залишився простий `<div className="lg:hidden widget-card p-4 flex flex-col gap-3">` без будь-яких ефектів.

**TSC:** 0 | **Build:** clean

---

## ✅ T08 — Дашборд: tooltip safe area (кліп на краях)

**Commit:** `acce085`

**Root cause:**
1. `WeeklyChartWidget` (Доходи): `BarTooltip` був `position: absolute` всередині `bento-card overflow-hidden`. `bento-card` має `backdrop-filter: blur(36px)` → створює новий stacking context → `position: fixed` дітей "trapped" відносно bento-card, а не viewport. Навіть `z-[9000]` не допомагав.
2. `PeakHoursWidget` (Пікові години): тултіп вже мав `position: fixed`, але `left` не клемпувався. Для Sunday (крайня права колонка) → `translateX(-50%)` виводив правий край за межі. `HALF_W=90` недостатньо для "немає записів" (~225px = half 113px).

**Що зроблено:**
1. `WeeklyChartWidget.tsx`: обгортка `<div className="flex flex-col flex-1">` → всередині `AnimatePresence + fixed tooltip` та `bento-card` як siblings. Tooltip рендериться поза bento-card → escape backdrop-filter trap. `onMouseLeave` dismiss на bars-container. scroll dismiss useEffect.
2. `PeakHoursWidget.tsx`: вже рендерив fixed tooltip поза bento-card. Доданий `useLayoutEffect` clamp (div 2).

**Hotfix** (`3743331`) — статичний `HALF_W=115` виявився недостатнім (реальна ширина tooltip "Нд · 20:00 · немає записів" ~220px = halfW 110px, але translateX(-50%) використовує РЕАЛЬНУ ширину). Рішення: `useLayoutEffect` + `tooltipRef` → вимірює `offsetWidth` після DOM commit поки tooltip ще `opacity:0` (Framer Motion initial) → clamps → state update → re-render (досі opacity:0) → browser paint з правильною позицією → opacity animation. Без видимого стрибка. Applied до обох виджетів.

**Hotfix-4** (`5a5971f`) — Framer Motion overrides `style.transform` when `initial/animate` contain transform props (`y`, `scale`). The `translateX(-50%)` centering was silently dropped → `tooltip.left` became the LEFT EDGE, not center. `useLayoutEffect` clamping was correct but operating on the wrong assumption. Fix: two nested `motion.div` — outer handles `position: fixed` + `style.transform: 'translateX(-50%)'` + only `exit={{ opacity:0 }}` (no transform props → FM doesn't touch outer's transform); inner handles `initial/animate` with `y/scale/opacity` independently. Applied to both widgets.

**Залізний патерн:** Ніколи не змішуй `style.transform` з `initial/animate` transform-props на одному `motion.div` — FM перезаписує user transform. Рішення: outer `motion.div` (position) + inner `motion.div` (animation).

**TSC:** 0 | **Build:** clean

---

## ✅ T09 — Мобайл послуги: кнопка + toggle a11y + компакт + sep

**Commit:** `99cbd6c`

**Root cause:** FAB (іконка без тексту) → не очевидно. Toggle knob = `bg-accent-on` (непрозоро в inactive). Картки p-4 + size-12 — надто великі. Жодного групування по категоріях.

**Що зроблено:**

`ServicesPage.tsx`:
1. FAB видалено → `w-full min-h-[44px] rounded-xl bg-accent text-accent-foreground` кнопка в sidebar widget (як ProductsPage). `id="tour-services-add"` перенесено.
2. `groupByCategory(services)` → CATEGORIES порядок + extra cats → `Map<string, Service[]>`. `useMemo` wrapper.
3. Render: `Array.from(grouped).map([cat, items])` → `CategoryHeader` + `Droppable droppableId={cat}`.
4. `handleServiceDragEnd`: cross-category drag rejected (`source.droppableId !== dest.droppableId → return`). Within-category: знаходить позиції в повному масиві → реконструює повний array → `reorderServices(next)`.
5. `!mounted` (SSR) та DnD рендер уніфіковані через `groupedContent(withDnd: boolean)`.
6. Видалено `masterProfile` (не використовувався).

`ServiceCard.tsx`:
1. Compact: `p-4→p-3`, `size-12→size-10`, `gap-3→gap-2.5`, actions `mt-3 pt-3→mt-2 pt-2`.
2. Toggle knob: `bg-accent-on→bg-white` (explicit white, однаково видний в active/inactive).
3. Price: `text-base→text-sm`, icon `size-18→size-16`.

**Hotfix** (`decf6fd`) — toggle knob position + shop standardization:
1. `ServiceCard.tsx`: `x=20→26` — симетрична формула: active_x = track(44) - knob(16) - inactive_x(2) = 26
2. `ProductCard.tsx`: knob `bg-accent-on→bg-white`
3. `ProductFormDrawer.tsx`: knob `bg-[var(--accent-on)]→bg-white`
**Залізний патерн:** `active_x = track_width - knob_size - inactive_x`. Knob скрізь = `bg-white`.

**TSC:** 0 | **Build:** clean

---

## ✅ T10 — Портфоліо: кольори стандарт + mobile photo actions

**Commits:** `69f072e` (GLCH — AC-1/2/3/4) `39cc4e9` (AC-1 PortfolioItemPage + AC-3 public + AC-5)

**Що зроблено:**

**AC-1 — Frost tokens:**
- `PortfolioPage.tsx`: Сторіс/Перегляд/Додати → `bg-secondary/60 border-border` + `bg-accent text-accent-foreground`
- `PortfolioItemPage.tsx`: Відмітити/Зберегти → `bg-accent text-accent-foreground`; review selected → `bg-accent/10 border-accent/30`; checkbox → `border-accent bg-accent`; Зберегти відгуки → `border-accent text-accent`

**AC-2 — Mobile tap overlay:**
- `PortfolioPhotoUploader.tsx`: `PhotoItem` subcomponent, `size-28` (112px) thumbs, `activeId` state
- Overlay z-[3] з AnimatePresence fade (bg-black/60): 3 кнопки — Переглянути / Головне / Видалити
- Star badge (cover indicator) hidden when overlay active. Dismiss on outside tap.

**AC-3 — Inline lightbox:**
- `src/components/shared/PhotoLightbox.tsx` — NEW: fixed inset-0 z-[100], keyboard nav (Esc/←→), safe-area X button
- `PortfolioPhotoViewer.tsx` — NEW Client Component для public portfolio (Server Component не може мати lightbox)
- `[slug]/portfolio/[id]/page.tsx` — статичний grid замінений на `<PortfolioPhotoViewer>`

**AC-4 — Reorder buttons:**
- `@hello-pangea/dnd` видалено з PortfolioPhotoUploader; замінений на ChevronLeft/ChevronRight кнопки `size-6` під кожним фото
- `handleMove(index, -1|1)` → swap + `reorderPortfolioPhotos`

**AC-5 — Product photos lightbox:**
- `ProductFormDrawer.tsx`: `lightboxIndex` state; invisible `<button z-[1]>` на кожному фото; delete button → `z-[2]`; `PhotoLightbox` в AnimatePresence поряд з drawer

**Hotfix** (`3cb5502`) — lightbox розмір: `max-w-lg mx-16 aspect-square` → `w-[90vw] max-w-[640px] h-[80vh]`; адаптивний aspect ratio з `object-contain`.
**Hotfix-2** (`438a2f7`) — grid: `grid-cols-1 sm:grid-cols-2` → `grid-cols-2` дефолтно; `gap-3→gap-4`.

**TSC:** 0 | **Build:** pending

---

## ✅ T11 — GrowthHub мобайл: tab layout redesign
**Commit:** `fae6e9a`
**Root cause:** `flex-1 px-5` на 3 довгих українських слова в `rounded-[100px]` pill контейнері → overflow на мобайлі. Старий дизайн рівно ділив ширину між табами незалежно від тексту.

**Що зроблено** (`GrowthHubClient.tsx`):
1. Видалено `bg-surface/40 backdrop-blur-md border border-border/40 p-1 rounded-[100px]` pill-контейнер
2. Wrapper → `grid grid-cols-3 gap-2` (mobile) / `lg:flex lg:flex-col lg:gap-1` (desktop — без змін)
3. Кожен button = widget-блок: `flex-col items-center gap-1.5 p-3 rounded-2xl`
   - Inactive: `bg-surface/60 border border-border/40` (мобайл) / `lg:bg-transparent lg:border-0` (десктоп)
   - Active: `text-[var(--accent-on)]` + `motion.div layoutId="growth-active-tab"` з `bg: var(--accent)`
4. Видалено `Rocket` іконку + `bg-warning/10` обгортку з хедера
5. Додано `description` поле в tabs array:
   - Лояльність: "Знижки для постійних клієнтів"
   - Реферали: "Бонус за кожного нового майстра"
   - Партнери: "Спільні акції з майстрами поряд"
6. `text-[11px] leading-snug opacity-70 lg:hidden` — опис видно тільки на мобайлі

**TSC:** 0 | **Build:** clean

---

## ✅ T12 — Профіль: відпустка/вихідні overlap fix (3 таби)
**Commit:** `8533ce4`
**Root cause:** Форма ховалася за toggle-кнопкою; при відкритті AnimatePresence(height: 0→auto) викликав layout jump. Vacation dates у `grid-cols-2` — задасно для мобайлу. `bg-primary` замість accent токенів.

**Що зроблено** (`src/components/master/settings/VacationManager.tsx`):
1. Видалено `showForm` state + "Додати виняток з розкладу" кнопку — форма завжди відкрита
2. Type selector: `grid grid-cols-3 gap-1.5` з `min-h-[44px]`; active = `motion.div layoutId="vacation-type-active"` + `bg: var(--accent)`; inactive = `bg-secondary/40 border-border`
3. `type` switch також викликає `resetForm()` — поля скидаються при зміні типу
4. Vacation dates: `grid-cols-2` → `flex flex-col gap-3` (вертикально стек)
5. Short-day times: grid-cols-2 залишено (HH:MM компактні); labels `"Початок роботи"/"Кінець роботи"` → `"Від"/"До"`
6. `bg-primary` → `bg-accent`, `text-primary-foreground` → `text-accent-foreground`; `focus:border-accent focus:ring-accent/20`
7. Form wrapper: `gap-3` → `gap-4`; `inputClass`: `py-2` → `py-2.5`
8. Entries list: додано `"Заплановано"` label зверху (тільки коли `entries.length > 0`)
9. Видалено зайві імпорти: `CalendarOff`, `useEffect`

**Hotfix** (`7b617ac`): text-[10px] font-medium px-1.5 + bg-background/60 + LayoutGroup — not enough, "Короткий день" still wraps.
**Hotfix-2** (`b9b3b86`): full rewrite — `grid-cols-3` → `flex gap-1` container + `flex-1` buttons (CSS flex stretch guarantees equal height). "Короткий день" → "Короткий". Inputs: rounded-2xl py-3 text-sm. TSC: 0.
**Hotfix-3** (`1af1b3e`): input polish — `py-3 text-sm` → `py-2 text-xs rounded-xl`; form wrapper `p-4` → `p-5`; fields `gap-3` → `gap-4`; submit `py-3 text-sm` → `py-2.5 text-xs`. Mobile form spacing polished.

**TSC:** 0 | **Build:** clean

---

## ✅ T13 — Записи: баг буферу 10 хв між записами
**Commit:** `9b5fdde`
**Root cause:** `src/lib/utils/smartSlots.ts` — функція `generateAvailableSlots` перевіряла overlap лише в одному напрямку. Код додавав `bufferMinutes` до кінця НОВОГО слоту (`totalBlockedEnd = slotEnd + buffer`), але не до кінця ІСНУЮЧОГО бронювання. Через строгу нерівність `s1 < e2` в `isOverlapping`, слот що стартує рівно в момент кінця існуючого бронювання повертав `false` → показувався як доступний.

**Що зроблено** (`src/lib/utils/smartSlots.ts`, `smartSlots.test.ts`):
1. Рядок 163: `b.end` → `b.end + bufferMinutes` в `isOverlapping` check
   - `isOverlapping(slotStart, totalBlockedEnd, b.start, b.end + bufferMinutes)` — тепер буфер існуючого бронювання також враховується
2. Додані 2 regression тести: `blocks slot starting exactly at existing booking end` + `allows slot starting exactly at buffer boundary`
3. Оновлено існуючий тест `real-world day` — очікування 11:00 і 15:30 виправлені (були написані під баг)

**Математика фіксу:**
- До: `isOverlapping(600, 660, 540, 600)` = `600 < 600` = FALSE → 10:00 доступний (ПОМИЛКА)
- Після: `isOverlapping(600, 660, 540, 610)` = `600 < 610` = TRUE → 10:00 заблокований ✓

**TSC:** 0 | **Tests:** 32/32 ✅

---

## ✅ T14 — Конструктор сторіс (ПК): розширення робочої зони
**Commit:** `6cc91f2`

**Root cause:** StoryGenerator.tsx мав `max-w-2xl mx-auto` з фіксованим preview `252×448px` (scale 0.7). На широкому десктопі (~900px+ content area) справа і знизу залишалось ~600px порожнього місця. Mobile scroll hint з'являвся тільки на першу взаємодію (hasInteracted guard).

**Що зроблено** (`StoryGenerator.tsx`):

**Desktop two-column layout:**
- Прибрано `max-w-2xl mx-auto px-4 py-6 space-y-5` wrapper
- Новий outer: `flex flex-col lg:flex-row lg:items-start`
- Controls panel: `lg:w-[340px] lg:shrink-0 lg:border-r lg:border-border` — фіксована ширина, скролиться зі сторінкою
- Preview panel: `hidden lg:flex flex-1 self-start sticky top-16 h-[calc(100vh-4rem)]` — sticky, fills viewport minus navbar
- `HINT_SPRING = { type: 'spring', stiffness: 380, damping: 28 } as const` (RULE 4)

**Desktop preview scaling (ResizeObserver):**
- `desktopPreviewPanelRef` + `ResizeObserver` → `scale = Math.min((w-80)/360, (h-80)/640, 1.15)`
- На 900px панелі preview ≈ 414×736px (scale ~1.15) замість колишніх 252×448
- Мінімум scale: 0.55

**Mobile scroll hint redesign:**
- Прибрано `hasInteracted` state — hint тригериться на КОЖЕН `onControlChange`
- Таймер: 3s auto-hide (було 4s)
- Замінено inline AnimatePresence hint → `fixed bottom-6 inset-x-0 lg:hidden` floating button
- Текст: "Переглянути результат" + ChevronDown bounce

**Code quality:**
- `previewCanvas(scale, radius)` helper — shared між мобайл (0.7) і десктоп (desktopScale)
- `previewOverlay` — blur-lock overlay + premium timer badge (shared)
- `UpgradePromptModal` переміщено в `sharedBottom` (рендериться в обох режимах)

**Hotfix-5** (`8d39a4d`) — попередній чат не закрив 3 баги:
1. Mode tabs + Photo picker: `overflow-x-auto` без `lg:flex-wrap` → горизонтальний скрол на десктопі. Фікс: `lg:overflow-x-visible lg:flex-wrap` на обох рядах.
2. `setMode(m.id)` і `setPalIdx(i)` не викликали `onControlChange()` → mobile floating pill не з'являвся при зміні режиму/кольору. Фікс: `onControlChange()` в кожному `onClick`.
3. Preview panel `w-[260px] xl:w-[320px]` → scale 0.57/0.73 (замалий preview). Фікс: `w-[280px] xl:w-[360px]` → scale 0.62/0.84.

**TSC:** 0 | **Build:** clean

---

## ✅ T14 mobile hotfix — Конструктор сторіс: мобайл redesign
**Commit:** `51e8875`

**Root cause:** T14 desktop layout (overflow-x-auto tabs + horizontal photo picker) спричинив page-wide horizontal scroll на iPhone. Preview знаходився в самому низу сторінки.

**Що зроблено** (`StoryGenerator.tsx`):
1. Two-section split: `lg:hidden` (mobile) / `hidden lg:flex` (desktop — незмінений T14 layout)
2. Mobile mode tabs: `flex flex-wrap gap-1.5` → всі 8 режимів видимі без scroll (~4 на рядок)
3. Mobile preview: переміщено ВГОРУ (над контролами); `mobilePreviewPanelRef` + ResizeObserver → `mobileScale = clamp((w-24)/360, 0.55, 0.82)`
4. Photo picker mobile: `grid grid-cols-4 gap-2 aspect-square` thumbnails (без горизонтального scroll)
5. Видалено: `showScrollHint`, `hintTimerRef`, `previewRef`, floating "Переглянути результат" pill
6. `fileInputRef` переміщено в `sharedBottom` (єдиний DOM-елемент, спрацьовує з обох секцій через `.click()`)
7. Спільні константи: `downloadBtn`, `settingsRows` — зменшення дублювання

**TSC:** 0 | **Build:** clean

---

## ✅ T14 hotfix-6 — settingsRows polish: grid-cols-2 + glass full-width + pill switches
**Commit:** `0fa2aab`

**Root cause:** `settingsRows` had `grid-cols-3` (Позиція/Текст/Скло cramped on mobile), ToggleLeft/ToggleRight icons (inconsistent with project pattern), and both `ToggleLeft`/`ToggleRight` were removed from imports causing TSC errors at lines 550/558.

**Що зроблено** (`StoryGenerator.tsx`):
1. `settingsRows` rewritten via full-file Write (CRLF-safe):
   - `grid-cols-3` → `grid-cols-2` for Позиція + Текст (side by side)
   - Скло range input moved to separate full-width row below (`space-y-3` container)
   - ToggleLeft/ToggleRight → pill switches (`role="switch"`, `aria-checked`, `w-11 h-6 rounded-full`, `motion.div animate={{ x: active ? 26 : 2 }}`, spring `{ stiffness: 500, damping: 30 }`)
2. Pill switch pattern matches `ServiceCard.tsx` — consistent project design system

**TSC:** 0 | **Build:** clean

---

## ✅ T15 — Сповіщення: каскад Push→TG + тексти + PWA deep link
**Commit:** `51f0ba7`

**Root cause (3 критичних + 3 проактивних):**

**1. CRITICAL — Cascade double-delivery:**
`NotificationOrchestrator.ts:133` — `pushSubs.some(s => s.endpoint.includes('web.push.apple.com'))` тригерив TG навіть якщо Chrome push OK. Юзер з Chrome+Safari сабскрипцією отримував і push і TG.
Фікс: `pushSubs.every(...)` + renamed `onlyApplePush` — TG fallback тільки якщо ВСІ subs = Apple (APNs 201 = ненадійний).

**2. CRITICAL — Price "2 грн":**
`notifMap.ts:109` — `Math.round(d.totalPrice / 100)`. Але `bookings.total_price` = `DECIMAL(10,2)` у ГРИВНЯХ. Поділ на 100 робив 650 грн → "6 грн". (Плутанина з `products.price_kopecks` де ділення на 100 = правильне).
Фікс: прибрано `/100` — `${Math.round(d.totalPrice)} грн`.

**3. HIGH — SW_NAVIGATE listener відсутній для клієнтів:**
Listener був тільки в `DashboardLayout.tsx` (master routes). Клієнти на `/my/*` не мали listener → iOS PWA push-click при відкритому додатку не навігував.
Фікс: переміщено в `ServiceWorkerRegistration.tsx` (root layout, shared). Видалено дублікат з DashboardLayout.

**Проактивні фікси (full audit 23 типів):**
- `booking_cancelled` push: `'/my/bookings'` → `?bookingId=${d.bookingId}` (deeplink)
- `booking_cancelled` TG: відсутня кнопка → додано "Мої записи" (всі інші події мали кнопки)
- `reminder_30m` TG: відсутня кнопка → додано "Деталі" (reminder_24h/2h мали, 30m — ні)

**debug/fire-notifs:** додано `email` lookup, `summary` таблиця, `cleanupExpired` для 49 накопичених push subs.

**TSC:** 0 | **Build:** clean

**Hotfix-7** (`f2b24bf`) — подвійне сповіщення + TG→PWA deep link:

**4. BUG — Double delivery (TG + Push обидва приходять):**
Після реактивації push subs юзер з APNs-only setup отримував і TG (бо `onlyApplePush=true`) і Push (APNs доставив). Root cause: попередній фікс `every()` → TG ЗАВЖДИ для Apple-only, незалежно від `pushDelivered`.
Фікс (`NotificationOrchestrator.ts`): видалено `onlyApplePush` константу і умову. Тепер: `if (!pushDelivered)` — довіряємо APNs 201 = прийнято → доставить. TG тільки при реальному failure push.

**5. TG button → opens in TG WebView (internal browser):**
TG inline keyboard buttons завжди відкриваються у власному WebView, не в системному браузері → PWA не запускається.
Фікс: `gotoUrl()` helper у `notifMap.ts` — всі 19 TG inline-keyboard URLs тепер ведуть через `/goto?url=...`.

**6. NEW ROUTE — `/goto` redirect page:**
`src/app/goto/page.tsx` + `src/app/goto/GotoClient.tsx`:
- UA detection: `Telegram` in `navigator.userAgent` → показує hint
- iOS Telegram: "Відкрити в Safari" (···→Відкрити в Safari інструкція) + кнопка з `target="_blank"`
- Android Telegram: "Відкрити в Chrome" (⋮→Відкрити у Chrome) + кнопка
- Не-Telegram UA: `window.location.replace(targetUrl)` — миттєвий редірект
- Security: `rawUrl.startsWith('/')` guard — тільки відносні шляхи (захист від open redirect)

---

## ✅ T16 — Клієнтський навбар: redesign + Каталог + desktop notif + /explore redesign
**Commit:** `e5e15d8`

**Що зроблено:**

**1. MyBottomNav.tsx (повний redesign)**
- Nav items: Записи / Каталог (`/explore`) / Бонуси / Сповіщення / Профіль (5 items, Майстри прибрано)
- LayoutGroup id="client-nav" + `motion.div layoutId="client-nav-active"` spring pill — sliding active indicator
- `SPRING = { type: 'spring', stiffness: 400, damping: 30 } as const` (RULE 4)
- Active: `text-foreground`, inactive: `text-muted-foreground/50`
- `transition-all` → `transition-colors duration-150` (perf fix)

**2. ExplorePage.tsx (повний redesign)**
- `max-w-lg` → `max-w-2xl mx-auto` — ширший контейнер для discovery
- Grid: `grid grid-cols-2 sm:grid-cols-3 gap-3` (портретні картки замість горизонтального списку)
- MasterCard: `h-36` photo zone (object-cover / emoji centered) + `p-3` text zone (name + city + 2 chips)
- Rating badge: overlay `bg-black/50 backdrop-blur-sm` в photo zone
- `getCategoryIcon` switch → `CATEGORY_ICONS: Record<string, CatIconEntry>` data object + `CategoryIcon` component
- Category chips: LayoutGroup id="explore-cats" + `layoutId="explore-cat-pill"` spring pill
- `transition-all` → `transition-colors duration-150` всюди

**3. ClientNotificationsBell.tsx (новий компонент)**
- `hidden md:inline-flex` — desktop-only wrapper
- `useClientNotifications(userId)` hook (новий, не MasterContext залежний)
- Shake animation на нові unread: `motion.div animate={shaking ? { rotate: [...] } : { rotate: 0 }}`
- Warning badge: `motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}`
- Vaul drawer: `z-[140]` overlay, `z-[150]` content, `max-h-[78dvh]`, `rounded-t-[28px]`
- Click routing: bookingId → `/my/bookings?bookingId=...`, else → `/my/notifications`
- TYPE_CONFIG: booking_confirmed / booking_created / booking_cancelled / booking_reminder / support_reply

**4. PublicNavbar.tsx + my/layout.tsx**
- PublicNavbar: `{ notifBell?: React.ReactNode }` prop — RSC slot pattern (Server stays server)
- `{notifBell}` рендериться між "Мої записи" і profile avatar
- my/layout.tsx: `<PublicNavbar notifBell={<ClientNotificationsBell userId={user.id} />} />`
- ClientNotificationsBell (Client) передається як ReactNode з Server Component (valid RSC pattern)

**5. useClientNotifications.ts (новий хук)**
- Path: `src/lib/supabase/hooks/useClientNotifications.ts`
- `userId: string | null` prop (не MasterContext — клієнтська зона)
- QueryKey: `['client-notifications', userId]`, staleTime: 30s
- markAllRead(): optimistic setQueryData + DB update + invalidateQueries
- Повертає: `{ notifications, unreadCount, markAllRead }`

**Root cause:** `useNotifications` використовує `useMasterContext()` → недоступний для клієнтів. Рішення: окремий хук з `userId` prop.

**TSC:** 0 | **Build:** clean

---

## ▶ T17 — /my/masters: картка майстра → як картка товару

**Де шукати:**
- `src/app/my/masters/` — список майстрів клієнта
- `src/components/public/ExplorePage.tsx` — новий `MasterCard` (T16) як референс для portrait картки

**Скіл:** `design-taste-frontend` + `impeccable`

---

## ⬜ T31 — Smart Design System: Context-Adaptive UI

**Концепція (2026-06-13):** Три глобальних утиліти для iOS-like адаптивного UI.

### Паттерн 1: Adaptive Text Contrast
Елемент "читає" колір фону під собою → автоматично перемикає text-color.
- **CSS-only:** `mix-blend-mode: difference` → `.adaptive-text` клас
- **JS hook:** `useAdaptiveColor(ref)` → `getComputedStyle` + `getBoundingClientRect` → returns `'light' | 'dark'`
- **Застосування:** dashboard greeting name, заголовки поверх фото/градієнтів

### Паттерн 2: Smart Tooltip Hook (reusable)
`useSmartTooltip(anchorRef, options)` → `{ x, y, side }` — pre-clamped, viewport-aware.
- Вимірює anchor rect → вимірює tooltip after mount → вибирає оптимальний side (top/bottom) → shift left/right
- Safe area: `Math.max(SAFE + safeInset, Math.min(vw - tooltipW - SAFE - safeInset, centerX))`
- Замінює всі ручні clamp у WeeklyChart + PeakHours + всі future tooltips
- Враховує `env(safe-area-inset-left/right)` для iPhone notch landscape

### Паттерн 3: FitText Component
`<FitText text={...} maxLines={1|2} minSize={px} maxSize={px} />`
- `ResizeObserver` на контейнер + `canvas.measureText()` бінарний пошук max font-size що влізає
- 1 рядок → scale up щоб заповнити ширину (як iOS заголовок)
- Overflow → break на 2 рядки + ще більший шрифт
- **Застосування:** Dashboard greeting (ім'я + вітання), великі метрики

**Acceptance Criteria:**
- AC-1: `.adaptive-text` CSS клас + `useAdaptiveColor` hook → задокументовані в `globals.css` + `src/lib/hooks/`
- AC-2: `useSmartTooltip` → рефакторинг WeeklyChart + PeakHours → видалити `useLayoutEffect` clamp з обох
- AC-3: `<FitText>` компонент → `src/components/shared/FitText.tsx` → застосувати в Dashboard greeting

**Скіл:** `spec-driven-workflow` + `senior-frontend` + `impeccable`

---

## Контекст

**Root:** `C:\Users\Vitossik\SaaS\bookit\`
**Тема:** Frost (єдина; Blossom/Studio = wip)
**Stack:** Next.js 16, TS strict, Tailwind v4, Supabase, Vaul
**Скіли:** 28 скілів у `bookit/.claude/skills/`
**Повний план:** `XDEV/PLANS/SPRINT-04-BACKLOG/SPRINT-04-PLAN.md`
**Трекер:** `XDEV/PLANS/SPRINT-04-BACKLOG/TRACKER.md`
