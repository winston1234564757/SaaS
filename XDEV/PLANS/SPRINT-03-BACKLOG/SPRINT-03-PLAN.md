# Sprint-03 — Затверджений план

> Затверджено: 2026-06-09 | Оновлено: 2026-06-11 | 19 ітерацій (T7 перенесено в кінець)
> Воркфлоу: ONE TASK = ONE SESSION → Brief file → QA Gate → код → deploy
> Живий трекер: [TRACKER.md](TRACKER.md) | Сесійний контекст: TRANSITION_PROMPT.md

---

## Порядок виконання (19 ітерацій)

| Іт | ID | Назва | Група | Скіл | Розмір | Brief |
|----|----|----|----|----|---|---|
| 1 | T15 ✅ | Тема Frost за замовчуванням | A: Баги | code-reviewer | XS | — |
| 2 | T1 ✅ | Баги сторінки Записи | A: Баги | code-reviewer | M | — |
| 3 | T10 ✅ | Клієнти: пігулки перекривають текст | A: Баги | code-reviewer | XS | — |
| 4 | T4 ✅ | Studio білінг: форма + баги | A: Баги | code-reviewer + humanizer | M | — |
| 5 | T3 ✅ | Налаштування: горизонт. скрол мобайл | B: Мобайл | code-reviewer | XS | — |
| 6 | T2 ✅ | Дашборд: статистика + пік-годин + рефералки | B: Мобайл | impeccable + humanizer | S | — |
| 7 | T5 ✅ | Конструктор сторіс: анімована стрілка | B: Мобайл | impeccable | S | — |
| 8 | T8 ✅ | Навбар: профіль + FAB + сповіщення | B: Мобайл | design-taste-frontend | M | — |
| 9 | T6c ✅ | Аналітика десктоп: дати + слайдер ⭐ | C: Десктоп | design-taste-frontend + impeccable | L | — |
| 10 | T6a ✅ | Десктоп: billing + reviews + growth | C: Десктоп | design-taste-frontend | M | — |
| 11 | T6b ✅ | Десктоп: revenue + marketing + products + services | C: Десктоп | design-taste-frontend | M | — |
| 12 | T9 ✅ | Портфоліо → конструктор сторіс | D: Фічі | code-reviewer | S | — |
| 13 | T12 ✅ | Лояльність: два коди + двосторонній C2B | D: Фічі | code-reviewer + create-migration | L | — |
| 14 | **T13** | **Онбординг: крок графіку** | D: Фічі | impeccable | S | [T13_BRIEF.md](T13_BRIEF.md) |
| 15 | T14 | Онбординг: блок посилання | D: Фічі | impeccable | S | [T14_BRIEF.md](T14_BRIEF.md) |
| 16 | T11 | Флеш-акції: повний аудит | D: Фічі | code-reviewer + react-doctor | L | [T11_BRIEF.md](T11_BRIEF.md) |
| 17 | T16 | Тур: підсвічування елементів | D: Фічі | design-taste-frontend + emil-design-eng | L | [T16_BRIEF.md](T16_BRIEF.md) |
| 18 | T7 | Налаштування профілю (ч.2 — незакрите) | C: Десктоп | impeccable | M | [T7_BRIEF.md](T7_BRIEF.md) |

---

## Деталі задач — виконано

### T15 ✅ — Тема Frost за замовчуванням
Файли: `DashboardLayout.tsx`, `DashboardView.tsx`, `my/layout.tsx`, `[slug]/page.tsx`, `PublicMasterPage.tsx`, `MyProfilePage.tsx`
Міграція: `20260609000001_frost_default_theme.sql`

### T1 ✅ — Баги сторінки Записи (5 підпроблем)
1. Дата -1 день: `toLocalDateStr()` helper замість `.split('T')[0]` UTC bug
2. Стрілки в режимі «День»: `setDate(1)` перед `setMonth()` — boundary bug
3. Кольори завантаженості: ≥85 green · 61-84 orange · 40-60 blue · <40 red
4. Рамки карток мобайл: `border-border/30`
5. Панель керування мобайл: без bg, пошук завжди видимий
Файли: `BookingsPage.tsx`, `PeriodAnalyticsView.tsx`

### T10 ✅ — Клієнти: пігулки перекривають текст
- ClientWidgets: dots → `flex-col h-full justify-center`, content: `pr-12`
- ClientGridCard: pills-ряд `max-w-[70%]`
Файли: `ClientWidgets.tsx`, `ClientGridCard.tsx`

### T4 ✅ — Studio білінг (5 змін)
1. Видалено блок «Коли вигідніше»
2. Humanizer: "Хочу в бету" / "Надіслати заявку"
3. Телефон з `profile?.phone` (type="tel")
4. `submitBetaRequest()` bug виправлено (міграція beta_requests)
5. CTA кнопки вирівняні по низу картки
Файли: `BillingPage.tsx`, `billing/actions.ts`

### T3 ✅ — Налаштування: горизонтальний скрол
Root cause: `flex gap-3` → `grid grid-cols-3 gap-3` на контейнері тем в `TechnicalIsland.tsx:170`
Файл: `TechnicalIsland.tsx`

### T2 ✅ — Дашборд (3 підпроблеми)
1. Мобайл статистика — шрифти виправлено (`TodaySchedule.tsx`)
2. ПК пік-годин — шрифти виправлено (`PeakHoursWidget.tsx`)
3. Рефералки → humanizer (`ReferralBoostWidget.tsx`)

### T5 ✅ — Конструктор сторіс: анімована стрілка
`showScrollHint` + `ChevronDown` анімовано, bounce animation 4s delay
Файл: `StoryGenerator.tsx`

### T8 ✅ — Навбар (3 підпроблеми)
- MobileHub: `[Огляд][Записи] | [FAB Твій кабінет] | [Клієнти][Профіль]`
- Bell → floating right-side FAB (тільки при unread), z-76
- SupportWidget portal → document.body, `bottom-[calc(env(safe-area-inset-bottom)+80px)]`
Файли: `BottomNav.tsx`, `NotificationsBell.tsx`, `DashboardLayout.tsx`, `SupportWidget.tsx`

### T6c ✅ — Аналітика десктоп
1. Редизайн навігації дат (`PeriodControls.tsx`)
2. Таби → горизонтальний слайдер 30% preview (`AnalyticsPage.tsx`)

### T6a ✅ — Десктоп лейаут: billing + reviews + growth
- `GrowthHubClient.tsx`: `lg:grid-cols-[240px_1fr]`
- Reviews: `lg:grid-cols-[260px_1fr]`

### T6b ✅ — Десктоп лейаут: revenue + marketing + products + services
Файл: `commit 60b980c` — відповідні сторінки адаптовані під широкий екран

### T9 ✅ — Портфоліо → конструктор сторіс
- `PortfolioItemCard.tsx`: кнопка «Сторіс» (hover overlay, Sparkles icon)
- URL: `?drawer=story_generator&prePortfolioId=[id]`
Файли: `PortfolioItemCard.tsx`, `PortfolioPage.tsx`, `StoryGenerator.tsx`

### T12 ✅ — Лояльність: два коди + двосторонній C2B
- Міграція: `c2c_referral_code` + `c2b_referral_code` в `client_profiles`
- C2B cross-path idempotency fix (0b44cd6)
Файли: `referrals.ts`, `my/loyalty/page.tsx`, `invite/[code]/page.tsx`

---

## Деталі задач — залишилось

### T13 — Онбординг: крок графіку
> **Brief:** [T13_BRIEF.md](T13_BRIEF.md) | Скіл: impeccable

**Проблема:** Без «Свій графік» майстер не може продовжити — крок заблокований.

**Файли:**
- `src/components/master/onboarding/steps/StepSchedule.tsx` — основний файл
- `src/components/master/onboarding/steps/types.ts` — Step type / STEP_ORDER
- `src/components/master/onboarding/OnboardingWizard.tsx` — orchestrator

**Рішення:**
| Стан | CTA |
|------|-----|
| Графік НЕ налаштований | «Налаштувати» → форма графіку |
| Графік налаштований | «Продовжити» → наступний крок |

**Mempalace search:** `"onboarding schedule StepSchedule wizard"` + `"StepSchedulePrompt StepScheduleForm STEP_ORDER"`

**Acceptance Criteria:**
- Без графіку → кнопка «Налаштувати»; після збереження → «Продовжити» (layout animation)
- Touch targets ≥ 44px | TSC: 0 | Build: clean

---

### T14 — Онбординг: блок посилання
> **Brief:** [T14_BRIEF.md](T14_BRIEF.md) | Скіл: impeccable

**Проблема:** Блок посилання виглядає другорядним → зробити виразним.

**Файли:**
- `src/components/master/onboarding/steps/StepPreview.tsx` — основний файл
- `src/components/master/onboarding/OnboardingWizard.tsx` — якщо потрібен slug

**Mempalace search:** `"onboarding preview step link slug StepPreview"`

**Acceptance Criteria:**
- Блок посилання домінує візуально (не дрібний текст)
- Кнопка «Копіювати» → clipboard → toast підтвердження
- Кнопка «Відкрити» → нова вкладка
- Copy text через humanizer | Touch targets ≥ 44px | TSC: 0 | Build: clean

---

### T11 — Флеш-акції: повний аудит
> **Brief:** [T11_BRIEF.md](T11_BRIEF.md) | Скіл: code-reviewer + react-doctor

**Проблема:** `quick-actions.ts` видалено (git D) — регресія? + загальний аудит UX/логіки.

**Файли:**
- `src/app/(master)/dashboard/flash/actions.ts` (рядки 1-177: createFlashDeal 23-163, cancelFlashDeal 165-177)
- `src/components/master/flash/FlashDealPage.tsx`
- `src/components/master/dashboard/FlashDealDrawer.tsx`
- `src/components/master/analytics/sections/FlashDealsCard.tsx`
- `quick-actions.ts` — DELETED, перевірити `git show HEAD -- src/app/(master)/dashboard/flash/quick-actions.ts`

**Відомий контекст:**
- Starter limit: 5 deals/month (рядок 21 actions.ts)
- Push + Telegram нотифікації клієнтам у 48h вікні (рядки 103-159)
- cancelFlashDeal → status='expired' (рядки 165-177)

**Acceptance Criteria:**
- Регресія quick-actions перевірена (git show)
- Starter limit один і правильний
- Notifications відправляються
- TSC: 0 | Build: clean

---

### T16 — Тур: підсвічування елементів
> **Brief:** [T16_BRIEF.md](T16_BRIEF.md) | Скіл: design-taste-frontend + emil-design-eng

**Проблема:** Тур не підсвічує елементи — юзер не розуміє на що дивитись.

**Файли:**
- `src/components/master/dashboard/DashboardTourContext.tsx` — tourStep, getBoundingClientRect
- `src/components/master/dashboard/DashboardTourBanner.tsx` — panel + overlay rendering
- `src/components/master/dashboard/DashboardLayout.tsx` — де монтується Provider

**Відомий контекст:**
- 8 кроків: 0=Привітання, 1=AdaptiveStrip, 2=Розклад, 3=WeeklyChart, 4=QuickActions, 5=Referral, 6=Insights, 7=Academy
- `data-tour-step` attribute targeting
- z-index: navbar z-75, bell z-76, support z-99

**Acceptance Criteria:**
- Overlay дімінг активний під час туру
- Цільовий `data-tour-step` елемент — підсвічений + accent обводка
- Spring transition між кроками (< 300ms)
- Крок 0 — без прив'язки до елемента
- z-index не конфліктує | TSC: 0 | Build: clean

---

### T7 — Налаштування профілю (ч.2 — незакрите)
> **Brief:** [T7_BRIEF.md](T7_BRIEF.md) | Скіл: impeccable

**Контекст:** 6-phase impeccable pass зроблено (b81ca4c + 10383f4). Юзер вважає незакритим.
**Ця сесія:** з'ясувати що саме не так → QA Gate 5 питань → тоді код.

**Файли:**
- `src/components/master/settings/SettingsPage.tsx`
- `src/components/master/settings/ScheduleWidget.tsx`
- `src/components/master/settings/TechnicalIsland.tsx`

**Вже виправлено (НЕ повторяти):**
- 4-col grid: Segments+Retention, Identity+Vacations, TechnicalIsland lg:col-span-4
- ScheduleWidget desktop: завжди розгорнутий (hidden lg:block)
- TechnicalIsland: grid grid-cols-3 (без overflow)
- Пігулки заповненості: реальний dayOccupancy + кольори

---

## Post-Change Protocol (кожна ітерація)
```
□ npx tsc --noEmit         ← нуль помилок обов'язково
□ npm run build            ← clean build
□ vercel --prod            ← юзер QA
□ TRACKER.md               ← ⬜ → ✅, commit hash
□ HANDOFF.md               ← додати деталі виконаного
□ TRANSITION_PROMPT.md     ← оновити next task + Brief link
□ mempalace_add_drawer     ← зберегти ключові рішення
```
