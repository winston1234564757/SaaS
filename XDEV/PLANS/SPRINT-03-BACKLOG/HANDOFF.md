# Sprint-03 HANDOFF
> Читай цей файл ПЕРШИМ на початку кожної нової сесії.
> Тут повний стан спринту: що зроблено, що далі, всі деталі задач.

**Спринт:** Sprint-03 (16 задач → 18 ітерацій)
**Розпочато:** 2026-06-09
**Прогрес:** 11/18 виконано ✅
**Останній deploy:** vercel --prod T6b (commit: 60b980c)
**Наступна задача:** **T7 — Налаштування профілю десктоп** (ітерація 12)

### ⚠️ QA-знахідки після T6b deploy (потребують фіксу)

**T8 — REGRESSION: SupportWidget позиція**
- Кнопка підтримки відображається внизу ЗЛІВА (не там)
- Має бути: fixed НАД навбаром, такі ж властивості як навбар (bottom: над navbar)
- Правильна позиція: `fixed bottom-24 right-4` (над навбаром), не зліва
- Файл: `SupportWidget.tsx` або аналог — перевірити позицію/стилі

**T6a — PARTIAL: reviews + growth desktop layout відсутній**
- Billing ✅ — двоколонковий лейаут працює
- Reviews ❌ — десктоп без змін, таби без сайдбару
- Growth ❌ — всі 3 таби (Overview/Segments/Referral) без змін
- Потребує: `lg:grid lg:grid-cols-[260px_1fr]` для ReviewsPage та growth-секцій в AnalyticsPage

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
| 8 | **T8** | Навбар: профіль праворуч + FAB + сповіщення | ⚠️ REGRESSION | design-taste-frontend | f3107c4 + 620473f |
| 9 | **T6c** | Аналітика десктоп: навігація дат + слайдер | ✅ DONE | design-taste-frontend | ddcf28d |
| 10 | **T6a** | Десктоп лейаут: billing + reviews + growth | ⚠️ PARTIAL | design-taste-frontend | d184b9e |
| 11 | **T6b** | Десктоп лейаут: revenue + marketing + products + services | ✅ DONE | design-taste-frontend | 60b980c |
| 12 | **T7** | Налаштування профілю десктоп | ⬜ TODO | impeccable | — |
| 13 | **T9** | Портфоліо → конструктор сторіс | ⬜ TODO | code-reviewer | — |
| 14 | **T12** | Лояльність: два коди + двосторонній C2B бонус | ⬜ TODO | code-reviewer + create-migration | — |
| 15 | **T13** | Онбординг графік: кнопки Налаштувати/Продовжити | ⬜ TODO | impeccable | — |
| 16 | **T14** | Онбординг превью: виразніший блок посилання | ⬜ TODO | impeccable | — |
| 17 | **T11** | Флеш-акції: повний аудит + тести | ⬜ TODO | code-reviewer + react-doctor | — |
| 18 | **T16** | Тур: підсвічування елементів | ⬜ TODO | design-taste-frontend + emil-design-eng | — |

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

## ⬜ T7 — Налаштування профілю десктоп

Порожній простір + стрибки сусідніх блоків при розгортанні графіку.

---

## ⬜ T9 — Портфоліо → конструктор сторіс

Кнопка «Сторіс» → `/dashboard/marketing?type=work&workId=[id]`. StoryGenerator читає параметри при монтуванні.

---

## ⬜ T12 — Лояльність: два коди + двосторонній C2B

- `c2c_referral_code` для друзів, `c2b_referral_code` від майстра — нова міграція
- C2B BUG: тільки майстер отримує бонус → виправити двосторонньо
- Унікальний дизайн invite-сторінок для кожного типу

**Файли:** `my/loyalty/page.tsx`, `invite/[code]/page.tsx`, `referrals.ts`, `applyReferralRewards()`

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
