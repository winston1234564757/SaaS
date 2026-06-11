# Sprint-03 HANDOFF
> Читай цей файл ПЕРШИМ на початку кожної нової сесії.
> Тут повний стан спринту: що зроблено, що далі, всі деталі задач.

**Спринт:** Sprint-03 (16 задач → 18 ітерацій)
**Розпочато:** 2026-06-09
**Прогрес:** 16/18 виконано ✅
**Останній deploy:** vercel --prod T6b (commit: 60b980c) → QA-fixes → T7 (eebf5b7) → T9 (f80ef35) → T12 (a42386f, 0b44cd6) → T13 (b1735d5) → T14 (4fc56d6)
**Наступна задача:** **T11 — Флеш-акції: повний аудит + тести** (ітерація 17)

> **⚠️ Відкрита задача (поза спринтом):** Сторінка налаштувань профілю потребує подальшої роботи. Проведено impeccable 6-phase pass (commits: **b81ca4c** + **10383f4**) — аудит a11y, токени, лейаут, polish. Але юзер вважає задачу не закритою — повернутись після T12.

### ✅ QA-борги після T6b — ВИПРАВЛЕНО

**T8 — SupportWidget позиція — FIXED (commits: b649402, c81d8c1, 26acd31)**
- Root cause: Framer Motion `motion.div animate` додає CSS `transform`, що ламає `position:fixed` для нащадків
- Fix: `createPortal(fab, document.body)` — FAB рендериться поза transform-ієрархією (b649402)
- Mobile: `bottom-[calc(env(safe-area-inset-bottom)+80px)]` — впритул над навбаром (c81d8c1)
- Desktop: `lg:bottom-4 lg:right-8`
- Tailwind v4 canonical classes застосовано (26acd31)
- Файл: `SupportWidget.tsx`

**T6a — Growth desktop layout — FIXED**
- `GrowthHubClient.tsx`: `lg:grid-cols-[240px_1fr]` — лівий сайдбар (header+tabs) + правий контент
- Reviews: вже мав `lg:grid-cols-[260px_1fr]` в d184b9e ✅

---

## Трекер задач

| Іт | ID | Назва | Статус | Скіл | Commit |
|----|----|----|--------|------|--------|
| 1 | **T15** | Тема Frost за замовчуванням | ✅ DONE | code-reviewer | 3454e0f + 9865942 + 3e1390b |
| 2 | **T1** | Баги сторінки Записи | ✅ DONE | code-reviewer | a3bfed2 + 06c791c + 81e75c9 |
| 3 | **T10** | Клієнти: пігулки перекривають текст | ✅ DONE | code-reviewer | 86aa48a |
| 4 | **T4** | Studio білінг: форма + баг сабміту | ✅ DONE | code-reviewer + humanizer | cb41655 + 8f2ee05 |
| 5 | **T3** | Налаштування профілю: горизонт. скрол | ✅ DONE | code-reviewer | cdc410a |
| 6 | **T2** | Дашборд: статистика мобайл + пік-годин + рефералки | ✅ DONE | impeccable + humanizer | 1de90ec + bee63a0 |
| 7 | **T5** | Конструктор сторіс: анімована стрілка | ✅ DONE | impeccable | 3ed6e4b |
| 8 | **T8** | Навбар: профіль праворуч + FAB + сповіщення | ✅ DONE | design-taste-frontend | f3107c4 + 620473f + c282e27 |
| 9 | **T6c** | Аналітика десктоп: навігація дат + слайдер | ✅ DONE | design-taste-frontend | ddcf28d |
| 10 | **T6a** | Десктоп лейаут: billing + reviews + growth | ✅ DONE | design-taste-frontend | d184b9e + c282e27 |
| 11 | **T6b** | Десктоп лейаут: revenue + marketing + products + services | ✅ DONE | design-taste-frontend | 60b980c |
| 12 | **T7** | Налаштування профілю десктоп | ⚠️ PARTIAL | impeccable | eebf5b7 + b81ca4c + 10383f4 | impeccable pass зроблено, але сторінка не закрита
| 13 | **T9** | Портфоліо → конструктор сторіс | ✅ DONE | code-reviewer | f80ef35 | 
| 14 | **T12** | Лояльність: два коди + двосторонній C2B бонус | ✅ DONE | code-reviewer + create-migration | a42386f + 0b44cd6 |
| 15 | **T13** | Онбординг графік: кнопки Налаштувати/Продовжити | ✅ DONE | impeccable | b1735d5 |
| 16 | **T14** | Онбординг превью: виразніший блок посилання | ✅ DONE | impeccable | 4fc56d6 |
| 17 | **T11** | Флеш-акції: повний аудит + тести | ⬜ TODO | code-reviewer + react-doctor | — |
| 18 | **T16** | Тур: підсвічування елементів | ⬜ TODO | design-taste-frontend + emil-design-eng | — |

---

## ✅ T13 — Онбординг графік: кнопки Налаштувати/Продовжити — ВИКОНАНО

**Проблема:** На кроці SCHEDULE одним тапом по чіпу відразу зберігалось і відбувався перехід. Повторне відвідування кроку не мало кнопки "Продовжити". Не було чіткого розмежування між "ще не налаштовано" та "вже налаштовано".

**Зроблено (1 коміт: b1735d5):**

State machine з 3 станами у `StepSchedule.tsx`:
- **State A** (`!isConfigured && !showForm`) — template chip + кнопка "Налаштувати" (opacity-70)
- **State B** (`!isConfigured && showForm`) — template chip + розгорнутий кастомний редактор з "Зберегти"
- **State C** (`isConfigured`) — summary card (getScheduleSummary: "Пн–Сб, 10:00–19:00") + кнопка "Продовжити" → onSave()

`OnboardingWizard.tsx` — додано `initialConfigured={!!initialData.schedule}` до `<StepSchedule>`.

**Ключові рішення:**
- Template chip більше не викликає `onSave()` напряму — тільки `setIsConfigured(true)`
- `onSave()` (→ DB save + navigate) викликається ЛИШЕ при "Продовжити" (State C)
- `initialConfigured=false` для нових майстрів (`initialData.schedule === undefined`)
- `initialConfigured=true` для тих, хто повернувся (schedule вже збережено в DB)
- AnimatePresence `mode="wait"` на bottom CTA, spring `{stiffness:380, damping:30}`

**TSC:** 0 помилок | **Build:** clean

---

## ✅ T14 — Онбординг превью: виразний блок посилання — ВИКОНАНО

**Проблема:** URL-блок на кроці PREVIEW онбордингу був компактним і непомітним — не передавав цінності "link in bio". Кнопка "Скопіювати" була маленькою, не було кнопки відкрити в новій вкладці та мобільного share.

**Зроблено (1 коміт: 4fc56d6):**

`StepPreview.tsx` — link hero card:
- **Лейбл:** `"Твій link in bio"` — uppercase tracking-widest, accent tint background
- **URL рядок:** `text-[15px] font-mono font-semibold` (крупніший, читабельніший)
- **Три кнопки у підвалі карти:**
  - **Copy** (`flex-1`, primary accent bg) — при кліку: accent tint + Check icon + "Скопійовано" (2с)
  - **Відкрити** (secondary bg, text+icon) — `target="_blank"`, показується тільки якщо є slug
  - **Поширити** (icon-only 46px, secondary bg) — Web Share API, `canShare && slug` guard
- **Hydration-safe:** `const [canShare, setCanShare] = useState(false)` + `useEffect(() => setCanShare('share' in navigator), [])`
- **handleShare:** `navigator.share({ title: 'Моя сторінка на Bookit', url: fullPublicUrl }).catch(() => {})`
- Кнопка редагування slug перенесена в рядок з URL (Pencil icon, розмір 8×8, secondary bg)
- Divider між URL-рядком і кнопками: `color-mix(in srgb, var(--border) 65%, transparent)`

**Ключові рішення:**
- `color-mix(in srgb, var(--accent) 5%, var(--surface))` — акцентний tint фону карти
- `color-mix(in srgb, var(--accent) 28%, transparent)` — тонкий акцентний border
- Share API guard через `useEffect` (не через SSR-unsafe `typeof window`) — уникає hydration mismatch
- Весь UI-текст через humanizer: "Твій link in bio", "Копіювати" / "Скопійовано", "Відкрити", "Поширити"

**TSC:** 0 помилок | **Build:** clean

---

## ✅ T15 — Тема Frost за замовчуванням — ВИКОНАНО

**Проблема:** Нові та існуючі майстри/клієнти могли бачити тему Blossom або відсутню тему замість Frost. Публічні сторінки та клієнтська зона також не застосовували Frost.

**Зроблено (3 коміти):**

*Коміт 3454e0f:*
- `DashboardLayout.tsx` ThemeApplier: `?? ''` → `?? 'frost'` (Pro/Studio без теми = Frost)
- `DashboardView.tsx`: `?? 'default'` → `?? 'frost'` (вибір Layout компонента)
- `my/layout.tsx`: `data-theme="frost"` на wrapper (клієнтська зона `/my/`)

*Коміт 9865942:*
- `[slug]/page.tsx`: `themeKey: 'frost'` (публічні сторінки майстра завжди Frost)
- `PublicMasterPage.tsx`: `const themeKey = 'frost'` (hardcoded, без fallback)
- `supabase/migrations/20260609000001_frost_default_theme.sql`: UPDATE всіх майстрів до frost

*Коміт 3e1390b:*
- `MyProfilePage.tsx` THEMES: `wip:true` на Blossom + Studio
- Початковий стан themeKey: `'frost'` (було `'default'`)
- Клік на wip → тост «Незабаром / Ця тема зараз у розробці»
- Кнопки: `opacity-35 cursor-not-allowed` + бейдж «Розробка»

**⚠️ Після deploy:** Застосувати міграцію `20260609000001_frost_default_theme.sql`:
```sql
UPDATE public.master_profiles
SET mood_theme = 'frost'
WHERE mood_theme IS NULL OR mood_theme != 'frost';
```

**Очікуваний результат:** ✅ Всі екрани (дашборд, клієнтська зона, публічні сторінки) відображають Frost. Blossom/Studio недоступні з бейджем «Розробка».

---

## ✅ T1 — Баги сторінки Записи — ВИКОНАНО (commits: a3bfed2, 06c791c, 81e75c9)

**Що зроблено:**

*a3bfed2 — основний фікс:*
- `toLocalDateStr()` helper замість `.toISOString().split('T')[0]` — всі місця (timezone UTC+3 bug)
- `setDate(1)` перед `setMonth()` в `navigate()` — boundary bug (Jan 31 + 1 міс = Mar 3)
- `border-border/30` замість `border-border-strong/40` на картках мобайл
- Кнопка пошуку: X при відкритому пошуку / Search при закритому

*06c791c — фікс кольорів v2:*
- `bg-error` → `bg-destructive` (bg-error не існує в @theme — тільки --color-destructive)
- `> 85` → `>= 85` для зеленого порогу

*81e75c9 — фінальні правки (за QA юзера):*
- 4 зони кольорів: ≥85% green · 61-84% orange · 40-60% blue (bg-info) · <40% red
- Панель керування на мобайлі: прибрано bg повністю (лише border-b border-border/30)
- Пошук: завжди видимий інпут між рядком перемикачів та навігацією дат, `searchOpen` state прибраний

**Файли:** `BookingsPage.tsx`, `PeriodAnalyticsView.tsx`

---

## ✅ T10 — Клієнти: пігулки перекривають текст — ВИКОНАНО (commit: 86aa48a)

**Баг A — ClientWidgets.tsx (iOS Switcher):**
Два `size-11` dot-кнопки горизонтально = 88px, `absolute top-2 right-1`. `pr-10` (40px) недостатньо → 36px перекриття з текстом "Важливі"/"Амбасадори".

**Зроблено:**
- Dots: `flex` → `flex-col h-full justify-center right-0` (вертикальний стек)
- Active dot: `w-4 h-1.5` → `h-4 w-1.5` (вертикальна таблетка)
- Content button: `pr-12` (48px clearance від dots)
- Обидва header divs: прибрано зайвий `pr-10`

**Баг B — ClientGridCard.tsx:**
Pills-ряд (статус + VIP) без max-width → перекривав `ClientIconStack` (`absolute right-4`).

**Зроблено:** Pills container: `flex-wrap max-w-[70%]`

**Deploy:** vercel --prod ✅ `bookit-five-psi.vercel.app`

---

## ✅ T4 — Studio білінг (5 змін) — ВИКОНАНО

1. ✅ Видалено блок «Коли вигідніше» (рядки 393-412)
2. ✅ Humanizer: "Залишити заявку на бета" → "Хочу в бету" · "Відправити заявку" → "Надіслати заявку"
3. ✅ Телефон: `profile?.phone` pre-fill → лейбл "Телефон", type="tel", placeholder "+380 XX XXX XXXX"
4. ✅ submitBetaRequest() bug: міграція `20260609000000_beta_requests.sql` не була застосована → `npx supabase db push` перед deploy
5. ✅ CTA кнопки вирівняні по низу картки: `flex flex-col` на `motion.div` + `flex-1` на features

**⚠️ Перед deploy:** `npx supabase db push` (таблиця beta_requests)
**Файли:** `BillingPage.tsx`
**Commits:** cb41655 (фікси 1–4) + 8f2ee05 (CTA alignment)

---

## ✅ T3 — Налаштування: горизонтальний скрол на мобайлі — ВИКОНАНО (commit: cdc410a)

**Root cause:** `TechnicalIsland.tsx:170` — `flex gap-3` з трьома `flex-1` кнопками.
Flexbox `min-width: auto` не обмежує ширину → три кнопки (swash + текст + бейдж «Розробка») переповнювали мобайл.

**Зроблено:**
- `flex gap-3` → `grid grid-cols-3 gap-3` на контейнері тем
- `flex-1` → видалено з кнопок, додано `min-w-0`
- Grid суворо ділить доступний простір, без overflow

---

## ⬜ T2 — Дашборд (3 підпроблеми)

1. Мобайл, блок записів в статистиці — шрифти завеликі, перекриваються (`TodaySchedule.tsx`)
2. ПК, пік-годин — шрифти задрібні (`PeakHoursWidget.tsx`)
3. Рефералки → humanizer: «можна заробити на повну оплату Pro тарифу»

**Файли:** `TodaySchedule.tsx`, `PeakHoursWidget.tsx`, `ReferralBoostWidget.tsx`

---

## ⬜ T5 — Конструктор сторіс: анімована стрілка

`showScrollHint` + `ChevronDown` вже є в `StoryGenerator.tsx` (4s delay). Перевірити/анімувати — чи помітна стрілка на мобайлі.

---

## ✅ T8 — Навбар: профіль праворуч + FAB + сповіщення — ВИКОНАНО (f3107c4 + 620473f)

**Зроблено:**
- `MobileHub.tsx`: NavBar layout → `[Огляд][Записи] | [FAB Твій кабінет] | [Клієнти][Профіль]`
- Bell видалено з center cluster, перетворено на floating right-side FAB (`fixed right-4 z-[76]`)
- Bell `fab=true`: відображається тільки коли `unreadCount > 0`, інакше `null` (доступ через Hub → Система)
- Bell позиція: `bottom: calc(env(safe-area-inset-bottom) + 80px)` — над навбаром
- SupportWidget: `right-4 lg:right-8` — виправлено з bottom-left на bottom-right на десктопі
- Mobile стек (знизу): Navbar → Bell (80px, тільки при unread) → Support (132px, завжди)
- z-index ієрархія: overlay `z-[70]`, navbar `z-[75]`, bell `z-[76]`, support `z-[99]`

---

## ⬜ T6c ⭐ — Аналітика десктоп (перша в групі C)

1. Кардинальний редизайн навігації дат
2. Таби → великий горизонтальний слайдер (30% наступного видно)

**Файли:** `AnalyticsPage.tsx`, `PeriodControls.tsx`

---

## ⬜ T6a — Десктоп лейаут: billing + reviews + growth

Верхні елементи не використовують ширину десктопу. CRM-оптимізація.

---

## ⬜ T6b — Десктоп лейаут: revenue + marketing + products + services

Те саме для решти сторінок.

---

## ✅ T7 — Налаштування профілю десктоп — ВИКОНАНО (commit: eebf5b7)

**Зроблено:**
- `SettingsPage.tsx`: 4-col grid тепер повністю заповнений — Segments+Retention (row4, 2+2), Identity+Vacations (row5, 2+2), TechnicalIsland full-width lg:col-span-4 (row6)
- StatsPulse: `lg:col-span-2` → `1`; Schedule: `lg:col-span-1` → `2` (більше місця для редактора)
- `ScheduleWidget.tsx`: десктоп завжди розгорнутий (`hidden lg:block`), мобайл-акордеон без змін, кнопка `lg:hidden`
- RetentionCycleDays перенесено з ScheduleWidget accordion → окрема секція поряд із SegmentConfig
- Пігулки заповненості: реальний `dayOccupancy` з `busynessData.days` (агрегація по day-of-week за 30 днів, `booked/total` як у PeriodAnalyticsView)
- Кольори пігулок: ≥85 success / >60 warning / ≥40 info / <40 destructive

---

## ✅ T9 — Портфоліо → конструктор сторіс — ВИКОНАНО (commit: f80ef35)

**Зроблено:**
- `PortfolioItemCard.tsx`: кнопка «Сторіс» (hover overlay, `bottom-[52px] left-2`, `Sparkles` icon) — показується тільки коли `item.photos.length > 0`
- `PortfolioPage.tsx`: передає `onStoryClick={() => router.push('/dashboard/portfolio?drawer=story_generator&prePortfolioId=${item.id}')}` до кожної картки
- `StoryGenerator.tsx`: авто-вибір першого item з фото (`firstWithPhoto?.id`) коли відкрито з портфоліо без конкретного ID
- URL архітектура: `?drawer=story_generator&prePortfolioId=[id]` — вже була готова, додали лише UI точку входу

---

## ✅ T12 — Лояльність: два коди + двосторонній C2B — ВИКОНАНО (commits: a42386f, 0b44cd6)

**Проблеми:**
- Invite-посилання показували пусті коди (`?ref=` / `/invite/`)
- C2B: тільки майстер отримував Pro 21 днів; клієнт не отримував промокод 50%
- Idempotency bug: при повторній реєстрації з C2B-кодом — старий M2M grant блокував правильний шлях

**a42386f — міграція + код:**
- Міграція `20260610000001_loyalty_dual_codes.sql`: колонки `c2c_referral_code` + `c2b_referral_code` в `client_profiles`, backfill, partial unique indexes
- `getOrGenerateProfileReferralCode`: зчитує правильну колонку по типу `'client-c2c'` / `'client-c2b'`
- `invite/[code]/page.tsx`: lookup chain master_slug → master_referral → client_c2b → client(legacy)
- `my/loyalty/page.tsx`: відображає обидва коди + `totalMastersInvited` + список промокодів

**0b44cd6 — cross-path idempotency fix:**
- `applyReferralRewards`: якщо в `referral_grants` є старий M2M grant і нова спроба йде через C2B-код — окремо шукає клієнта за `c2b_referral_code` і вставляє промокод + інкрементує лічильник
- Root cause: founder мав однаковий `referral_code='176921EA'` в обох таблицях → M2M path виграв

**Файли:** `referrals.ts`, `my/loyalty/page.tsx`, `invite/[code]/page.tsx`, `supabase/migrations/20260610000001_loyalty_dual_codes.sql`

---

## ⬜ T13 — Онбординг: крок графіку

Без «Свій графік» не можна продовжити. Додати: «Налаштувати» / «Продовжити».
**Файл:** `StepSchedule.tsx`

---

## ⬜ T14 — Онбординг: блок посилання

Блок посилання виглядає другорядним → зробити виразним.
**Файл:** `StepPreview.tsx`

---

## ⬜ T11 — Флеш-акції: повний аудит

- `createFlashDeal` / сповіщення / ліміти / UX
- `quick-actions.ts` (видалено) — інший файл, перевірити регресію через `git show`

**Файли:** `flash/actions.ts`, FlashDeals компонент

---

## ⬜ T16 — Тур: підсвічування елементів

Спотлайт: дімінг + обводка + плавні переходи між кроками.
**Файли:** `DashboardTourContext.tsx`, `DashboardTourBanner.tsx`
