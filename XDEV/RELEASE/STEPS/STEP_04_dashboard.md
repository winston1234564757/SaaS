# STEP 04 — Dashboard Home (`/dashboard`)

> **Створено:** 2026-05-30
> **Модель:** Sonnet 4.6 high
> **Статус:** ⏳ In progress
> **Source of truth:** [../../MAPS/PAGE_RELEASE_ROADMAP.md#4](../../MAPS/PAGE_RELEASE_ROADMAP.md)

---

## QA-GATE — Підтверджені рішення (2026-05-30)

| Питання | Відповідь |
|---|---|
| Scope | Вся сторінка + нові фічі (тур, академія, нові віджети) |
| Theme order | Frost першим → Blossom → Studio |
| Carry-overs | B-03/04/05 → виправляємо під час полішингу |
| Theme paywall | Starter: Frost only. Pro/Studio: усі 3 теми. Downgrade → DB write. |
| Setup Wizard | Тур на дашборді (8 кроків) + Academy page `/dashboard/academy` |
| Нові віджети | Adaptive Strip + Earnings Pulse + Referral Widget + Story Launch + Smart Insights + Client Alerts |
| Impeccable | Запускаємо під час полішингу (dimension 1) |

---

## Scope

### Routes
- `/dashboard` — основна сторінка (polish + нові віджети)
- `/dashboard/academy` — **NEW** BookIT Academy (базова структура)

### Ключові файли

#### Існуючі (змінювати)
| Файл | Що змінювати |
|---|---|
| `src/components/master/DashboardLayout.tsx` | `ThemeApplier` → tier-based enforcement |
| `src/components/master/settings/SettingsPage.tsx` | Theme picker → lock badges для Starter |
| `src/components/master/settings/hooks/useSettingsForm.ts` | Block saving restricted themes |
| `src/app/(master)/dashboard/settings/actions.ts` | Downgrade server action → DB write `mood_theme='frost'` |
| `src/components/master/dashboard/DashboardTourContext.tsx` | Розширити 3 → 8 кроків |
| `src/app/(master)/dashboard/page.tsx` | Інтегрувати нові віджети |
| `src/components/master/dashboard/DashboardView.tsx` | Layout оновлення |
| `src/components/master/dashboard/widgets/InsightsRow.tsx` | Розширити Smart Insights |
| `src/components/master/dashboard/widgets/QuickActionsWidget.tsx` | Додати Story Launch |

#### Нові файли (створювати)
| Файл | Призначення |
|---|---|
| `src/app/(master)/dashboard/academy/page.tsx` | Academy route |
| `src/components/master/academy/AcademyPage.tsx` | Academy контент |
| `src/components/master/dashboard/widgets/AdaptiveContextStrip.tsx` | Контекстні 2×2 міні-блоки |
| `src/components/master/dashboard/widgets/EarningsPulseWidget.tsx` | Фінансовий трекер (сьогодні + тренд) |
| `src/components/master/dashboard/widgets/ReferralBoostWidget.tsx` | Реферальна стимуляція |
| `src/components/master/dashboard/widgets/ClientAlertsWidget.tsx` | Smart клієнтські нотатки |

### DB Tables / RPCs (touched)
- `master_profiles` — `mood_theme` (paywall enforcement)
- `master_profiles` — `seen_tours` (tour v2 steps)
- `master_referrals` — для Referral Widget прогресу
- `bookings` — для Adaptive Strip (busyness)
- `notification_logs` — опційно для Client Alerts

### TanStack Query Hooks
- `useBusyness.ts` (staleTime: 1хв) — для Adaptive Strip
- `useBookings.ts` — для сьогоднішніх даних
- існуючий analytics hook — для Earnings Pulse trend

---

## Новий функціонал — детальний опис

### A. Theme Paywall

**ThemeApplier** (`DashboardLayout.tsx`):
```ts
// Нова логіка:
const tier = masterProfile?.subscription_tier ?? 'starter';
const rawTheme = masterProfile?.mood_theme ?? '';
const effectiveTheme = tier === 'starter' ? 'frost' : rawTheme;
// Далі використовувати effectiveTheme замість moodTheme
```

**Settings Theme Picker** — для Starter:
- Blossom / Studio показуються з `Lock` іконою (Lucide) + badge "Pro"
- `cursor-not-allowed`, opacity 0.5
- Tooltip: "Доступно на Pro тарифі"
- Клік → не змінює тему, показує toast з upgrade hint

**Downgrade handler** — новий server action або розширення існуючого:
```ts
// При зміні tier → starter (billing webhook або manual):
await supabase.from('master_profiles')
  .update({ mood_theme: 'frost' })
  .eq('id', masterId);
```

---

### B. Adaptive Context Strip

**Компонент:** `AdaptiveContextStrip.tsx`  
**Дані:** `useBusyness` hook (today occupancy %)  
**Позиція:** Під greeting, над основними віджетами  

**Логіка карток (2×2 grid):**

```
Зайнятість > 80%:
  Card 1: "Насичений день! Є 1 вільний слот о 17:00"  → [Запустити флеш]
  Card 2: "Сьогодні: N записів · ₴X очікується"

Зайнятість 40–80%:
  Card 1: "Розклад на [день]" → посилання на записи
  Card 2: "Поділись посиланням — запиши ще N клієнтів" → [Копіювати]

Зайнятість < 40%:
  Card 1: "Тихий день. Розіслати нагадування клієнтам?" → [Розіслати]
  Card 2: "Флеш-акція для підняття завантаженості" → [Створити акцію]

0 записів:
  Card 1: "Ще немає записів на сьогодні" → [Поділитись профілем]
  Card 2: "Запроси першого клієнта" → [Скопіювати посилання]
```

**Технічно:** кожна картка — `motion.div` з `whileHover` scale, `cursor-pointer`, hover overlay. Spring `as const`. No emoji.

---

### C. Earnings Pulse Widget (замість Revenue Goal)

**Компонент:** `EarningsPulseWidget.tsx`  
**Дані:** dashboard actions — сьогодні + минулий тиждень той самий день  

**UI:**
```
┌─────────────────────────────────┐
│ Сьогодні                        │
│                                 │
│  ₴2,400          ↑ +18%         │
│  5 записів    vs. вівторок       │
│                                 │
│  Цього тижня: ₴8,600            │
└─────────────────────────────────┘
```

Тренд `↑` зелений, `↓` червоний. Шрифт: `.metric-value` + Cormorant для цифри.

---

### D. Referral Boost Widget — Максимальна Стимуляція

**Компонент:** `ReferralBoostWidget.tsx`  
**Дані:** `master_referrals` — кількість запрошень / статуси / earned discount  
**Мета:** Зробити реферальну програму ВИДИМОЮ і МОТИВУЮЧОЮ

**Мілстоуни (gamification):**
```
1 реферал → -10% на місяць
3 реферали → -20% на місяць  
5 рефералів → 1 безкоштовний місяць
10 рефералів → постійна знижка -30%
```

**UI — Hero картка (повна ширина або 2/4 col):**
```
┌───────────────────────────────────────────┐
│ Запроси колег — заробляй знижки           │
│                                           │
│  ██████░░░░ 2/5 → безкоштовний місяць    │
│                                           │
│  Твій бонус зараз: -10% щомісяця         │
│  Ще 3 друзі → +1 безкоштовний місяць     │
│                                           │
│  [Скопіювати посилання]  [Деталі →]       │
└───────────────────────────────────────────┘
```

Accent кольором (per theme), animated progress bar (Framer Motion width анімація).  
CTA "Деталі →" → `/dashboard/growth?tab=referral`.

---

### E. Story Quick-Launch (у QuickActionsWidget)

Нова кнопка в QuickActions grid:  
- Іконка: `Sparkles` (Lucide)  
- Label: "Сторіс"  
- Action: `router.push('/dashboard/marketing?action=story')`  
- Pre-context: передати `todayBookingsCount` як query param для pre-fill  

---

### F. Smart Insights (розширення InsightsRow)

Нові метрики до існуючих:
```
"Найдохідніша послуга: [назва] · ₴X цього місяця"
"Активний час: [HH:00–HH:00]"  
"Retention цього місяця: N%"
"Новий клієнт цього тижня: N"
```

Дані: dashboard actions або окремий RPC. staleTime: 5хв.

---

### G. Client Alerts Widget

**Компонент:** `ClientAlertsWidget.tsx`  
**Позиція:** Sidebar або окрема row внизу  

**Типи алертів:**
```
"[Ім'я] не залишила відгук (7 днів)"  → [Нагадати] → CRM filter
"[Ім'я] не була 45 днів"              → [Написати] → CRM filter
"3 клієнти давно не приходили"        → [Флеш-акція] → Revenue Hub
```

Кожен алерт — рядок з аватаром, описом, і CTA кнопкою.  
"Флеш-акція" → `/dashboard/revenue?tab=flash_deals`.  
"CRM filter" → `/dashboard/clients?filter=no_review` (або `&filter=at_risk`).

---

### H. Dashboard Tour v2 (8 кроків)

**Файл:** `DashboardTourContext.tsx` → розширити з 3 до 8  

| Крок | Елемент | Текст підказки |
|---|---|---|
| 0 | Greeting | "Ось твій робочий простір. Кожен день — нова сторінка." |
| 1 | Adaptive Strip | "Тут — контекст дня. Система підказує що зробити зараз." |
| 2 | TodaySchedule | "Розклад на сьогодні. Натисни на запис — побачиш деталі." |
| 3 | WeeklyChart | "Графік тижня показує пік і спади завантаженості." |
| 4 | QuickActions | "Швидкі дії — запис, сторіс, клієнти без зайвих кліків." |
| 5 | ReferralWidget | "Запрошуй колег — отримуй знижки на тариф." |
| 6 | InsightsRow | "Інсайти оновлюються щодня. Слідкуй за трендами." |
| 7 | Academy CTA | "В BookIT Академії — відео та поради по кожній фічі." → [Відкрити] |

Кожна підказка — `AnchoredTooltip` прив'язана до ref цільового елемента.  
Прогрес: `8 кроків · X/8` (dot indicators, як в onboarding).

---

### I. BookIT Academy Page

**Route:** `/dashboard/academy`  
**Файл:** `src/app/(master)/dashboard/academy/page.tsx`  

**Початкова структура (STEP 04):**
```
Секція 1: "Початок роботи"
  - Картка: "Налаштуй профіль" → /dashboard/settings
  - Картка: "Додай перші послуги" → /dashboard/services
  - Картка: "Поділись посиланням" → copy slug
  - Картка: "Підключи Telegram" → /dashboard/settings#telegram
  - Картка: "Запроси першого клієнта" → referral link
```

Кожна картка: іконка (Lucide) + заголовок + 1 рядок опису + статус (✓ виконано / → зробити).  
Статус "виконано" = перевіряємо по реальних даних (profile filled, services > 0, etc.)  
Footer: "Більше розділів додаються з кожним оновленням BookIT"

---

## Порядок виконання

```
PHASE 1 — Швидкі зміни (1–2 год)
  1a. ThemeApplier tier enforcement
  1b. Settings theme lock badges + toast
  1c. Downgrade server action (mood_theme reset)

PHASE 2 — Нові віджети (3–5 год)  
  2a. AdaptiveContextStrip (useBusyness + 4 стани)
  2b. EarningsPulseWidget (today + trend)
  2c. ReferralBoostWidget (milestones + progress bar)
  2d. Story Quick-Launch у QuickActionsWidget
  2e. InsightsRow розширення (нові метрики)
  2f. ClientAlertsWidget

PHASE 3 — Tour + Academy (2–3 год)
  3a. DashboardTourContext 3 → 8 кроків
  3b. AnchoredTooltip прив'язки до refs
  3c. Academy page базова структура

PHASE 4 — Dashboard Polish (3–4 год)
  4a. Frost theme — 7 Quality Gates
  4b. Blossom theme audit
  4c. Studio theme audit
  4d. Backlog B-03 (Studio BarTooltip)
  4e. Backlog B-04 (Frost tooltip rounded)
  4f. Backlog B-05 (Blossom font/contrast)

PHASE 5 — Verification
  5a. tsc --noEmit
  5b. npm run build
  5c. Manual 3 теми × mobile/desktop
  5d. Commit → push → Vercel QA
```

---

## 7 Quality Gate Dimensions

### 1. Aesthetics & Themes
- [ ] Усі нові віджети використовують CSS токени (`var(--background)`, `var(--surface)`, `var(--accent)`)
- [ ] Всі 3 теми перевірені (Frost першим)
- [ ] Responsive (мобайл < 375px + desktop)
- [ ] `rounded-3xl` (24px) для всіх нових карток
- [ ] Grain + vignette + ambient blobs присутні (не зламані новими елементами)

### 2. No-Emoji Policy
- [ ] Жодних emoji у нових віджетах
- [ ] Тільки Lucide іконки
- [ ] Перевірити `InsightsRow` — можливі старі emoji метрики

### 3. Motion & Transitions
- [ ] `mode="popLayout"` де контент змінюється
- [ ] `spring as const` у всіх variants
- [ ] `whileHover`, `whileTap` на інтерактивних картках
- [ ] Tour tooltip: fade in/out з AnimatePresence
- [ ] ReferralWidget progress bar: `motion.div` width animation

### 4. Errors & Validation
- [ ] Порожні стани для нових віджетів (no referrals / no clients / no bookings)
- [ ] Loading skeletons для async даних
- [ ] Error fallback якщо fetch fails (не crashить сторінку)

### 5. A11y & Performance
- [ ] `aria-label` на нових інтерактивних елементах
- [ ] WCAG AA для нових текстів (особливо тренд кольори ↑↓)
- [ ] Skeleton висоти = контент висоти (нуль CLS)
- [ ] Нові хуки з правильним `staleTime`

### 6. Core Features
- [ ] ThemeApplier: Starter бачить тільки Frost (тест з test account)
- [ ] Settings: Starter не може зберегти Blossom/Studio
- [ ] Downgrade: `mood_theme` → `frost` пишеться в DB
- [ ] Adaptive Strip: перемикається між 4 станами правильно
- [ ] Referral Widget: прогрес-бар відображає реальні дані
- [ ] Tour v2: 8 кроків проходяться, `seen_tours.dashboard_v2` зберігається
- [ ] Academy page: completion статус перевіряється правильно
- [ ] Client Alerts: редіректи на правильні URL з правильними фільтрами

### 7. Tests Verification
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → clean
- [ ] Manual: Frost / Blossom / Studio × mobile / desktop
- [ ] Playwright: базовий smoke для `/dashboard` (якщо є)

---

## Humanizer List (UI рядки — потребують /humanizer перед записом)

> Запустити /humanizer до написання будь-якого з цих рядків у файл

### Adaptive Context Strip
- "Насичений день! Є 1 вільний слот о [час]"
- "Тихий день. Розіслати нагадування клієнтам?"
- "Флеш-акція для підняття завантаженості"
- "Запроси першого клієнта"
- "Ще немає записів на сьогодні"
- "Поділись посиланням — запиши ще N клієнтів"
- [CTA кнопки]: "Запустити флеш", "Розіслати", "Скопіювати", "Поділитись профілем"

### Earnings Pulse
- "Сьогодні"
- "Цього тижня: ₴X"
- "vs. минулий [день тижня]"

### Referral Boost
- "Запроси колег — заробляй знижки"
- "Твій бонус зараз: -X% щомісяця"
- "Ще N друзів → +1 безкоштовний місяць"
- Мілстоун тексти (1/3/5/10 рефералів)
- [CTA]: "Скопіювати посилання", "Деталі →"

### Client Alerts
- "[Ім'я] не залишила відгук"
- "[Ім'я] давно не була"
- "[N] клієнти давно не приходили"
- [CTA]: "Нагадати", "Написати", "Флеш-акція"

### Dashboard Tour
- Всі 8 текстів підказок (крок 0–7)

### Academy
- "Початок роботи"
- "Налаштуй профіль"
- "Додай перші послуги"
- "Поділись посиланням"
- "Підключи Telegram"
- "Запроси першого клієнта"
- "Більше розділів з'являться з наступними оновленнями"

### Settings Theme Lock
- "Доступно на Pro тарифі"
- toast: "Ця тема доступна тільки на Pro"

---

## Pre-Coding Checklist

- [x] SESSION_START completed (STARTUP OK)
- [x] mempalace_search done
- [x] QA-GATE: всі 5 питань задано + відповіді отримані
- [x] Scope підтверджено користувачем
- [ ] Skill оголошений + запущений (перед першим Edit)
- [ ] Humanizer list скомпільований → підтверджений
- [ ] GATE OK написаний

---

## Documentation Updates (Close-out)

- [ ] **STATUS.md** → статус STEP 04 → ✅, дата, drawer, commit hash
- [ ] **CHANGELOG.md** → новий entry
- [ ] **SYSTEM_MAP.md** → нові routes (`/dashboard/academy`), нові компоненти
- [ ] **PAGE_RELEASE_ROADMAP.md** → STEP 04 → ✅
- [ ] **changelog/page.tsx** → B2B-видимі зміни (тур v2, академія, нові віджети)
- [ ] **MemPalace drawer** — `mempalace_add_drawer` з ключовими рішеннями

---

## Handoff Note (заповнити при close-out)

- **Prior step closed:** 2026-05-30 (STEP 03)
- **Open carry-overs from STEP 03:** B-03/04/05 (виправлено в цьому кроці)
- **New architectural decisions:**
  - Theme Paywall: Starter → Frost only (ThemeApplier runtime + DB write on downgrade)
  - Academy pattern: progressive page, секції додаються з кожним кроком
  - DashboardTour v2: tourName=`dashboard_v2` (щоб не заважати старому `dashboard`)
- **Next chat focus:** STEP 05 — Dashboard Bookings (`/dashboard/bookings`)
  - Day/Week/Month switching
  - Timeline view
  - Reschedule/cancel flow

---

*Версія: 1.0 · Створено: 2026-05-30 · QA-GATE: підтверджено*
