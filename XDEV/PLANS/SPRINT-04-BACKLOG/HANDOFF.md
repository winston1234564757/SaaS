# Sprint-04 HANDOFF
> Читай цей файл ПЕРШИМ на початку кожної нової сесії.
> Тут повний стан спринту: що зроблено, що далі, всі деталі задач.

**Спринт:** Sprint-04 (30 ітерацій)
**Розпочато:** 2026-06-12
**Прогрес:** 9/30 ✅
**Наступна задача:** **T10 — Портфоліо: кольори стандарт + mobile photo actions**

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

## ▶ T10 — Портфоліо: кольори стандарт + mobile photo actions

**Проблема (з BACKLOG + PLAN):**
- Кнопки мають нестандартні кольори (не Frost design tokens)
- На мобайлі нема дій з фото: видалити / зробити головним / переглянути
- Drag-n-drop не працює або неочевидний
- Lightbox/перегляд фото — відкривається в новій вкладці замість inline

**Де шукати:**
- `src/components/master/portfolio/` — PortfolioPage, PortfolioItem, компоненти фото
- `src/app/dashboard/portfolio/` — page, [id]

**Acceptance criteria:**
- AC-1: Всі кнопки → Frost design tokens (bg-accent, bg-secondary, border-border тощо)
- AC-2: Тап на фото (мобайл) → overlay з 3 кнопками: Видалити / Головне / Переглянути
- AC-3: "Переглянути" → inline lightbox (не нова вкладка)
- AC-4: Drag-n-drop виправлений або замінений на ↑↓ order кнопки
- AC-5: Той самий inline-перегляд → уніфікувати для фото товарів + послуг

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
