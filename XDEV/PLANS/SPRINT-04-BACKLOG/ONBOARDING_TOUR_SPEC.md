# Activation Tour — Implementation Spec

> **For Claude:** REQUIRED SUB-SKILL: Use `writing-plans` to execute this plan task-by-task.
> **Brainstorm session:** 2026-06-17 | **Author:** Вітос + Claude

**Goal:** Замінити 17-кроковий Dashboard Tour єдиним 7-кроковим Activation Tour, що супроводжує нового майстра від /dashboard до першого booking, навігуючи між сторінками та зберігаючи прогрес між сесіями (PWA-safe).

**Architecture:** `ActivationTourProvider` у master layout (`src/app/(master)/layout.tsx`) — глобально доступний на всіх master сторінках. Той самий візуал: spotlight overlay + AnimatePresence banner (розширення існуючого `DashboardTourBanner`). Стан туру зберігається в `master_profiles.activation_tour_step` (DB-first, PWA-safe).

**Tech Stack:** Next.js App Router, React Context, Framer Motion, Supabase, `useTour.ts` pattern, `markTourSeen` server action pattern.

---

## 1. Goals & Success Metrics

### Primary KPI
- **Activation rate:** % нових майстрів, що отримали ≥ 1 booking протягом 7 днів після реєстрації
- **Baseline:** невідомо (немає трекінгу зараз)
- **Target:** ≥ 40% нових майстрів = activated протягом 7 днів

### Secondary KPIs
| Метрика | Мета |
|---|---|
| TG connect rate (перші 7 днів) | ≥ 60% |
| Public page share (перші 3 дні) | ≥ 70% |
| Tour completion rate | ≥ 55% |
| Tour step 3+ reached | ≥ 75% |

### Definition of "Activated"
Майстер вважається activated коли:
- `seen_tours.activation_v1 = true` **АБО** `activation_tour_step = NULL` після SUCCESS wizard + ≥ 1 booking в DB

---

## 2. Persona Profiles & Journey Map

### Persona A — Анна, 25, нейл-майстер (Solo, Новачок)
**Тло:** Перший SaaS. Вела записи через Instagram DM і паперовий щоденник. Прийшла через рекламу.

**Journey:**
- **SUCCESS wizard:** *"Ого, все! Але де мій лінк? Я хочу відразу запостити в Stories."*
- **Dashboard (без туру):** Скролить, бачить пусті графіки, не розуміє що робити. **Виходить.**
- **Dashboard (з туром):** Бачить spotlight на FreeSlots — *"О, клієнти вже можуть записатись!"* → Копіює лінк → Постить в Instagram bio.
- **AHA moment:** Push-сповіщення о 22:30: *"Катерина записалась на 14:00 завтра"* — поки спала.
- **Що повертає:** Ранкові пуші з новими записами.

**Pain points без туру:** Не знає де лінк. Не розуміє що слоти вже відкриті. Не підключила TG — не знає про записи.

---

### Persona B — Марина, 33, косметолог (Solo, Досвідчена)
**Тло:** Мігрує з паперових нотаток і Google Sheets. Знає що хоче — швидко.

**Journey:**
- **SUCCESS wizard:** *"Добре. Де кнопка 'Записати клієнта'? Хочу одразу записати Олесю на п'ятницю."*
- **Dashboard (без туру):** Не знаходить manual booking. Думає що BookIT тільки для online-записів. Розчарована.
- **Dashboard (з туром):** Крок 2 (лінк) → розуміє що клієнти самі записуються. Крок 3 (TG) → підключає. **AHA:** *"3 записи прийшли поки я на процедурі. Не треба нікому дзвонити."*
- **Що повертає:** Dashboard stat — "Сьогодні 4 записи, 2 800 ₴ очікуваний дохід."

**Pain points без туру:** Очікує manual CRM flow, отримує booking-link flow — когнітивний gap.

---

### Persona C — Олена, 38, власниця студії
**Тло:** 3 майстри, шукає централізацію. Studio tier ще в waitlist.

**Journey:**
- **SUCCESS wizard:** *"Де додати інших майстрів?"* — не знаходить.
- **Dashboard (без туру):** Розчарована відсутністю multi-master. Виходить.
- **Dashboard (з туром):** Тур показує Solo flow — частково корисно. Крок 2 (лінк) → публікує лінк для свого майстра. Крок 3 (TG) → підключає для себе.
- **AHA:** Перший запис через лінк для майстра зі студії.
- **Блокер:** Studio tier waitlist — тур не вирішує core потребу.

**Висновок для spec:** Олена — edge case. Тур не оптимізований під неї. Прийнятно — Studio = waitlist.

---

## 3. Activation Tour Architecture

### Tour Name
`activation_v1` — зберігається в `seen_tours.activation_v1 = true` при завершенні.

### Trigger Conditions
```
Тур стартує якщо:
  masterProfile.seen_tours?.activation_v1 !== true
  AND masterProfile.seen_tours?.dashboard_v2 !== true  ← backward compat для старих юзерів
  AND masterProfile.activation_tour_step IS NOT NULL
     OR (перший вхід після wizard SUCCESS)
```

**Перший запуск detection:**
- `activation_tour_step = 0` встановлюється server-side при redirect з wizard SUCCESS
- Або client-side: якщо `seen_tours.activation_v1` не існує AND `onboarding_step = 'SUCCESS'`

### Timing
- 1 200ms затримка після mount (як існуючий Dashboard Tour) — дає сторінці завантажитись
- При поверненні (step > 0 збережений в DB): 800ms затримка

---

## 4. Tour Steps — Повна Специфікація

| # | Сторінка | `data-tour-step` target | Заголовок | Текст | CTA |
|---|---|---|---|---|---|
| 0 | `/dashboard` | `[data-tour-step="act-0"]` на FreeSlots widget | Твій розклад відкритий | Клієнти вже можуть записатись — ось твої вільні слоти на сьогодні. | Далі |
| 1 | `/dashboard` | `[data-tour-step="act-1"]` на публічний лінк/slug в Greeting або Quick Actions | Це твоя сторінка | Скопіюй лінк і постав у Instagram bio — і клієнти самі знайдуть тебе. | Далі |
| 2 | `/dashboard/settings` → `#notifications` | `[data-tour-step="act-2"]` на TG connect блок | Telegram — твій пульс | Підключи Telegram — дізнавайся про кожен новий запис миттєво, навіть якщо відчинені додаток. | Підключити |
| 3 | `/dashboard/clients` | `[data-tour-step="act-3"]` на client list area | Твоя клієнтська база | Кожен клієнт, що запишеться через лінк, автоматично з'явиться тут. VIP, нові, в зоні ризику — все видно одразу. | Далі |
| 4 | `/dashboard/flash` | `[data-tour-step="act-4"]` на Flash Deal creation CTA | Порожній слот — не проблема | Якщо вільний час нікого не зацікавив — запусти Flash Sale. Знижка приваблює клієнтів за лічені хвилини. | Далі |
| 5 | `/dashboard/marketing` | `[data-tour-step="act-5"]` на Story Generator card | Перша сторіс за 30 секунд | Обери вільний слот — система сама створить красиву сторіс для Instagram. Клієнти побачать тебе в стрічці. | Далі |
| 6 | `/dashboard` | `[data-tour-step="act-6"]` на ScheduleWidget | Все готово | Коли прийде перший запис — він з'явиться тут. Telegram повідомить тебе миттєво. | Завершити |

### Навігація між сторінками
```
Step 0 → Step 1: залишаємось на /dashboard (scroll до target)
Step 1 → Step 2: router.push('/dashboard/settings') → 500ms wait → spotlight
Step 2 → Step 3: router.push('/dashboard/clients') → spotlight
Step 3 → Step 4: router.push('/dashboard/flash') → spotlight
Step 4 → Step 5: router.push('/dashboard/marketing') → spotlight
Step 5 → Step 6: router.push('/dashboard') → spotlight ScheduleWidget
Step 6 → Finish: completeTour() → seen_tours.activation_v1 = true, activation_tour_step = NULL
```

### Step 2 CTA — "Підключити"
На кроці 2 (TG) CTA кнопка не "Далі" а "Підключити" — відкриває TG flow inline (не завершує тур). Після підключення або skip — тур продовжується до кроку 3.

---

## 5. UI/UX Spec

### Компонент: `ActivationTourBanner`
**Файл:** `src/components/master/onboarding/ActivationTourBanner.tsx`

Клонує візуал `DashboardTourBanner.tsx` з такими змінами:
- Progress dots замінити на `{tourStep + 1} / {totalSteps}` counter + горизонтальний progress bar (`width: (tourStep+1)/total * 100%`)
- Видалити `GraduationCap` / Academy CTA на last step — замінити на "`Завершити`" + confetti micro-animation
- Позиція: `fixed bottom-[calc(var(--bottom-nav-height,76px)+12px)] left-4 right-4` (mobile) / `fixed bottom-6 right-6 w-80` (desktop) — ідентично до DashboardTourBanner

### Spotlight Overlay
**Без змін** — той самий DOM overlay код з `DashboardTourBanner.tsx`:
```
box-shadow: 0 0 0 9999px rgba(0,0,0,0.55), accent glow
```
`data-tour-step` атрибути: тепер `act-0` через `act-6` (замість числових 0–16).

### Компонент: `ActivationTourContext`
**Файл:** `src/components/master/onboarding/ActivationTourContext.tsx`

Розширює логіку `DashboardTourContext.tsx`:
```tsx
// Ключові відмінності від DashboardTourContext:

// 1. Читає початковий крок з masterProfile.activation_tour_step
const [tourStep, setTourStep] = useState(masterProfile?.activation_tour_step ?? -1);

// 2. При кожному nextStep — persist to DB
async function handleNextStep() {
  const next = tourStep + 1;
  if (next >= TOTAL) {
    await completeTour(); // seen_tours.activation_v1 = true, activation_tour_step = NULL
  } else {
    setTourStep(next);
    await saveStep(next); // UPDATE master_profiles SET activation_tour_step = next
  }
}

// 3. Навігація між сторінками
useEffect(() => {
  const step = ACTIVATION_STEPS[tourStep];
  if (step && step.route !== pathname) {
    router.push(step.route);
  }
}, [tourStep]);
```

### Provider Location
**Файл:** `src/app/(master)/layout.tsx`

```tsx
// Додати після існуючих провайдерів:
import { ActivationTourProvider } from '@/components/master/onboarding/ActivationTourContext';

// Wrap children:
<ActivationTourProvider initialStep={masterProfile?.activation_tour_step ?? -1}
                        seenTours={masterProfile?.seen_tours}>
  {children}
  <ActivationTourBanner />
</ActivationTourProvider>
```

**Важливо:** `DashboardTourProvider` і `DashboardTourBanner` — видалити з `/dashboard` layout після впровадження.

---

## 6. DB Changes

### Migration
```sql
-- Файл: supabase/migrations/YYYYMMDD000000_activation_tour_step.sql

ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS activation_tour_step smallint DEFAULT NULL;

COMMENT ON COLUMN master_profiles.activation_tour_step IS
  'Current step of activation tour (0-6). NULL = not started or completed.';

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS master_profiles_activation_tour_step_idx
  ON master_profiles (activation_tour_step)
  WHERE activation_tour_step IS NOT NULL;
```

### RLS
Без змін — `master_profiles` RLS вже дозволяє майстру UPDATE свій рядок.

### TypeScript Types
**Файл:** `src/types/database.ts`
```ts
// Додати в MasterProfile interface:
activation_tour_step: number | null;
```

### Server Actions
**Файл:** `src/app/(master)/dashboard/actions.ts` — додати:
```ts
export async function saveActivationTourStep(step: number): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('master_profiles')
    .update({ activation_tour_step: step })
    .eq('id', user.id);
}

export async function completeActivationTour(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // Fetch current seen_tours to merge
  const { data: current } = await supabase
    .from('master_profiles')
    .select('seen_tours')
    .eq('id', user.id)
    .maybeSingle();
  const currentTours = (current?.seen_tours as Record<string, boolean> | null) ?? {};
  await supabase
    .from('master_profiles')
    .update({
      activation_tour_step: null,
      seen_tours: { ...currentTours, activation_v1: true },
    })
    .eq('id', user.id);
}
```

### Wizard SUCCESS Integration
**Файл:** `src/app/onboarding/actions.ts` (або де `completeOnboarding` server action)
При успішному завершенні wizard — встановити `activation_tour_step = 0`:
```ts
await supabase
  .from('master_profiles')
  .update({ activation_tour_step: 0 })
  .eq('id', user.id);
```

---

## 7. Backward Compatibility

### Існуючі майстри
Майстри, що вже пройшли `dashboard_v2` tour (або старий `has_seen_tour`), не повинні бачити новий тур:

```ts
// В ActivationTourProvider — skip logic:
const seenOldTour = seenTours?.dashboard_v2 === true || masterProfile?.has_seen_tour === true;
const seenNewTour = seenTours?.activation_v1 === true;

if (seenOldTour || seenNewTour) {
  // не показувати тур
  return;
}
```

### Dashboard Tour Deprecation
- `DashboardTourContext.tsx` і `DashboardTourBanner.tsx` — НЕ видаляємо відразу (backward compat)
- Видалити `DashboardTourProvider` з dashboard layout тільки після deploy і перевірки
- Файли можна архівувати пізніше

---

## 8. `data-tour-step` Attributes — Де додавати

| Step | Компонент | Файл | Де додати атрибут |
|---|---|---|---|
| act-0 | FreeSlotsWidget | `src/components/master/dashboard/widgets/FreeSlotsWidget.tsx` | На root `<div>` widget card |
| act-1 | FrostGreeting або QuickActions | `src/components/master/dashboard/FrostGreeting.tsx` | На елемент з slug/public link |
| act-2 | TelegramConnect block | `src/components/master/settings/NotificationsSettings.tsx` | На TG connect card |
| act-3 | ClientList header | `src/components/master/clients/ClientsPage.tsx` | На main content area |
| act-4 | FlashDealPage CTA | `src/components/master/flash/FlashDealPage.tsx` | На "Створити Flash Sale" button area |
| act-5 | StoryGenerator card | `src/components/master/marketing/MarketingPage.tsx` | На Story Generator card |
| act-6 | ScheduleWidget | `src/components/master/dashboard/widgets/ScheduleWidget.tsx` | На root widget card |

---

## 9. Implementation Plan (Bite-Sized Tasks)

### Task 1 — DB Migration
**Час:** ~15 хв

1. Створити файл `supabase/migrations/20260618000000_activation_tour_step.sql` (SQL з розділу 6)
2. `npx supabase db push` або через Dashboard SQL Editor
3. Перевірити: `SELECT column_name FROM information_schema.columns WHERE table_name='master_profiles' AND column_name='activation_tour_step'`
4. Оновити `src/types/database.ts` — додати `activation_tour_step: number | null`
5. `npx tsc --noEmit` → 0 errors
6. Commit: `feat(db): add activation_tour_step to master_profiles`

### Task 2 — Server Actions
**Час:** ~20 хв

1. Відкрити `src/app/(master)/dashboard/actions.ts`
2. Додати `saveActivationTourStep(step)` і `completeActivationTour()` (код з розділу 6)
3. Знайти `completeOnboarding` server action → додати `activation_tour_step = 0` при SUCCESS
4. `npx tsc --noEmit` → 0 errors
5. Commit: `feat(tour): add saveActivationTourStep + completeActivationTour server actions`

### Task 3 — ActivationTourContext
**Час:** ~45 хв

1. Створити `src/components/master/onboarding/ActivationTourContext.tsx`
2. Скопіювати структуру з `DashboardTourContext.tsx` як базу
3. Додати `ACTIVATION_STEPS` array (7 steps — route + data-tour-step + title + text)
4. Реалізувати `handleNextStep()` з `router.push()` між сторінками + `saveActivationTourStep()`
5. Реалізувати skip/close logic → `completeActivationTour()`
6. Backward compat check (seenOldTour || seenNewTour → no tour)
7. `npx tsc --noEmit` → 0 errors
8. Commit: `feat(tour): ActivationTourContext — 7-step cross-page tour`

### Task 4 — ActivationTourBanner
**Час:** ~30 хв

1. Створити `src/components/master/onboarding/ActivationTourBanner.tsx`
2. Скопіювати з `DashboardTourBanner.tsx` як базу
3. Замінити dots → progress bar (`h-1 rounded-full bg-accent`)
4. Last step: "Завершити" кнопка замість Academy CTA
5. Spotlight overlay: `data-tour-step` selector з `act-${tourStep}` замість числових
6. `npx tsc --noEmit` → 0 errors
7. Commit: `feat(tour): ActivationTourBanner — progress bar + cross-page spotlight`

### Task 5 — data-tour-step attributes
**Час:** ~25 хв

Додати `data-tour-step="act-N"` на 7 компонентів (таблиця з розділу 8). Кожен — один Edit.
- Commit: `feat(tour): add data-tour-step attributes for activation tour`

### Task 6 — Master Layout Integration
**Час:** ~20 хв

1. Відкрити `src/app/(master)/layout.tsx`
2. Додати import `ActivationTourProvider` + `ActivationTourBanner`
3. Передати `initialStep={masterProfile?.activation_tour_step}` + `seenTours`
4. Wrap children в `<ActivationTourProvider>`
5. Видалити `DashboardTourProvider` з dashboard layout (або закоментувати)
6. `npx tsc --noEmit` → 0 errors
7. `npm run build` → clean
8. Commit: `feat(tour): integrate ActivationTour into master layout`

### Task 7 — QA & Deploy
**Час:** ~30 хв

**Тест-кейси:**
- [ ] Новий майстер: wizard → SUCCESS → /dashboard → тур стартує через 1.2s
- [ ] Крок 0: spotlight на FreeSlots видно
- [ ] Крок 1→2: router.push('/dashboard/settings') спрацьовує, spotlight на TG
- [ ] Закрити PWA на кроці 3, перезайти → продовжується з кроку 3
- [ ] Пройти всі 7 кроків → `seen_tours.activation_v1 = true`, `activation_tour_step = null`
- [ ] Старий майстер (has_seen_tour=true): тур НЕ показується
- [ ] Skip (X кнопка): тур закривається, `activation_tour_step = null`, `activation_v1 = true`
- [ ] Desktop: банер у bottom-right corner, spotlight коректний
- [ ] Mobile: банер над bottom nav, spotlight коректний

Commit: `feat(tour): T23 activation tour — 7 steps, cross-page, PWA-safe`
Deploy: `vercel --prod`

---

## 10. Decision Log

| Рішення | Альтернативи | Чому обрали |
|---|---|---|
| Замінити Dashboard Tour (17 steps) | Залишити паралельно | 17 кроків = cognitive overload, пусті графіки демотивують нових майстрів |
| 7 кроків (Beta) | 5 кроків (Alpha) | CRM і Flash Sale дають повну картину product value, Вітос обрав Beta |
| Тур стартує на /dashboard (не SUCCESS) | Старт на SUCCESS | SUCCESS вже має share/stories блоки, не конкурувати |
| `activation_tour_step` нова колонка | Розширити `seen_tours` JSONB | Queryable для аналітики, тип чистий, без TS hacks |
| Provider у master layout | Provider у dashboard layout | Тур навігує між сторінками — потрібен глобальний скоп |
| DB-first persistence | localStorage | PWA-safe: майстер закрив додаток на 4 год, повертається до того ж кроку |
| Скопіювати DashboardTourBanner | Нова компонент з нуля | DRY — 90% логіки однакова, мінімальні зміни |
| Progress bar замість dots | Залишити dots | 7 dots = візуально важко розрізнити активний; bar = прогрес зрозуміліший |

---

## 11. Open Questions (не блокують реалізацію)

1. **Крок 2 (TG) — якщо майстер вже підключив TG під час wizard:** Показувати крок з "Вже підключено" або пропустити? → Рекомендація: показувати з "Підключено" badge + кнопка "Далі"
2. **Skip-to-step:** Чи потрібна можливість клікнути на конкретний крок і перейти? → Рекомендація: ні для v1, можна додати пізніше
3. **Studio tier:** Олена (3 майстри) отримає Solo tour. Прийнятно для v1 — Studio = waitlist

---

*Spec затверджений: 2026-06-17 | Статус: Ready for implementation*
