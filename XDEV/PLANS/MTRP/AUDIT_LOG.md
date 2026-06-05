# 📒 AUDIT_LOG.md — Журнал виконання MTRP (append-only)

> Append-only. Кожен завершений/частковий item = entry. Найновіше — зверху.
> Формат: дата · session · item(s) · що зроблено · VERIFY · CHECK (tsc/build/test) · commit · drawer.

---

## 2026-06-05 · Session 09 · P1.9 · P1.14 · P2.2 · P2.13

**Контекст:** MTRP Phase 1→2. 4 items закрито.

### Зроблено
1. **P1.9 ✅** — `PublicMasterPage.tsx` C2C balance: `useState+useEffect` → `useQuery` (staleTime 5min, enabled guard).
2. **P1.14 ✅** — `useDashboardStore` → `useShallow`: BentoWidget + BentoGrid (5-val) + WidgetLibraryModal. Import: `zustand/shallow`.
3. **P2.2 ✅** — 6 unused npm deps видалено: marked+isomorphic-dompurify+html-to-image+sonner+@radix-ui/react-slot+class-variance-authority → 50 pkgs removed, ~440KB.
4. **P2.13 ✅** — `<th scope="col">` на 15 `<th>` у 3 admin tables. LandingBentoFeatures пропущено: `role="presentation"` (C-19).

### Plan Correction (C-19)
- C-19: P2.13 — LandingBentoFeatures.tsx має `role="presentation"` на table → `scope="col"` семантично не потрібен.

### VERIFY
tsc 0 · build clean · 4 commits.

---

## 2026-06-05 · Session 09 · P1.8 StoryGenerator useEffect→useQuery

**Контекст:** MTRP Phase 1. Anti-pattern: manual useEffect+useState для data fetching.

### Зроблено
1. **P1.8 ✅** — `StoryGenerator.tsx` 3 inline hooks → useQuery:
   - `useServices(masterId)` → `queryKey: ['story-services', masterId]`, staleTime 60s
   - `useActiveFlashDeals(masterId)` → `queryKey: ['story-flash-deals', masterId]`, staleTime 30s
   - `useStarReviews(masterId)` → `queryKey: ['story-star-reviews', masterId]`, staleTime 60s
   - Import: `useQuery` від `@tanstack/react-query` додано
   - Не перетинається з існуючими query keys (`story-` prefix)

### VERIFY
tsc 0 · build clean · Drawer: `drawer_bookit_technical_7d236b69d8ec959112153ec4`

---

## 2026-06-05 · Session 09 · P1.5 Tour docs · P1.6 Mojibake audit · P1.7 Migration rename

**Контекст:** MTRP Phase 1. 3 items закрито.

### Зроблено
1. **P1.5 ✅** — Tour system documented in `XDEV/MAPS/SYSTEM_MAP.md`:
   - `useTour.ts` — single-component hook, 6 consumers (AnalyticsPage + 5 сторінок)
   - `DashboardTourContext.tsx` — React Context (8 кроків), 4 components, mounted by DashboardLayout
   - Правило вибору: одна сторінка → `useTour`; multi-widget → `DashboardTourContext`
2. **P1.6 ✅ FALSE ALARM (C-18)** — `═══` в SQL файлах = Unicode box-drawing chars (U+2550), не mojibake. `file` cmd: all UTF-8. No fix needed.
3. **P1.7 ✅** — `137_product_type_and_emoji.sql` → `137a_product_type_and_emoji.sql` (duplicate prefix з `137_client_health_notes.sql`). Comment + DB fallback note додано.

### Plan Correction (C-18)
- C-18: P1.6 "mojibake" = valid Unicode box-drawing. U+2550 `═` в SQL comments — intentional art. False alarm.

### VERIFY
tsc 0 · build clean · commit pending (SYSTEM_MAP + 137a migration + TRACKER + MAP).

---

## 2026-06-05 · Session 08 · P1.3 Heatmap roving tabindex (3 themes)

**Контекст:** MTRP Phase 1 A11y. Задача: PeakHoursWidget — roving tabindex + div→button.

### Зроблено
1. **Studio PeakHoursWidget** — `div[role="button"]` → `button[type="button"]` + roving tabindex + arrow key nav (handleKeyDown).
2. **Frost PeakHoursWidget** — вже мав `button`, додано roving tabindex + `onKeyDown` + `onFocus`.
3. **Blossom PeakHoursWidget** — `div[role="button"]` → `button[type="button"]` + roving tabindex + arrow key nav.
4. **BONUS fix** — `ProductFormDrawer.tsx:156` pre-existing tsc error: `saveProductLinks` очікувало `{serviceId,quantity}[]` але стан `string[]` → маппінг на call site `.map(id => ({ serviceId: id, quantity: 1 }))`.

### Plan Correction (C-17)
- C-17: Plan said 168 cells (24h×7 days). Реально 91 cells: `HOURS = [8..20]` = 13h × 7d = 91.

### Roving tabindex pattern
```
focusedCell = { dIdx: 0, hIdx: 0 }  // initial top-left
cellRefs = useRef<(HTMLButtonElement|null)[][]>(7×13 grid)
tabIndex={isFocused ? 0 : -1}
onFocus={() => setFocusedCell({dIdx, hIdx})}
onKeyDown: ArrowRight/Left→dIdx±1%7, ArrowDown/Up→hIdx±1%13, Enter/Space→handleCell, wraps
```

### VERIFY
tsc 0 · build clean · commit pending.
Drawer: `35e71ca2f16c1955a6a3ae00`

---
## 2026-06-05 · Session 07 · P1.16 Touch targets ≥44px (13 files)

**Контекст:** MTRP Phase 1 A11y. Задача: всі кнопки мобільного ≥44px (WCAG 2.5.5).

### Зроблено
1. **Studio/Frost/Blossom MonthlyCalendarWidget** — prev/next nav: size-6/7→size-11.
2. **Studio/Frost close buttons** — ghost buttons (лише opacity, без size-*) → додано size-11 flex items-center justify-center rounded-full.
3. **Blossom close day detail** — size-6→size-11.
4. **AnalyticsPage DateRangeBar** — size-8→size-11 (prev/next), size-9→size-11 (refresh). ⚠️ Паралельний агент повністю переписав AnalyticsPage після цього.
5. **WidgetLibraryModal** — size-10→size-11.
6. **ProductFormDrawer / RestockDrawer** — size-8→size-11.
7. **VacationManager** — size-6→size-11 (inline delete button).
8. **BookingCard** — h-7→h-11 (4 action buttons: підтвердити/завершити/не прийшов/скасувати).
9. **БОНУС fix** — 7 analytics files (ChannelDonut + 6 sections) мали `formatPrice from '@/lib/utils/currency'` → виправлено на `@/components/master/services/types`.

### Plan Corrections (C-13..C-16)
- C-13: Root MonthlyCalendarWidget.tsx не існує
- C-14: Studio/Frost close = ghost buttons (без size-*) — додано size-11
- C-15: AnalyticsPage was size-9 not size-8
- C-16: WidgetLibraryModal=size-10, VacationManager=size-6

### VERIFY
tsc 0 (до оновлення AnalyticsPage агентом) · 13 Edit calls (per-file ≤2, guard не спрацював).
⚠️ AnalyticsPage паралельно оновлено аналітика-агентом з новою архітектурою (має власні tsc errors, не мій scope).
Commit: окремий від analytics agent коміту.

---
## 2026-06-05 · Session 06 · P1.4 WeeklyChart aria-pressed (3 themes)

**Контекст:** MTRP Phase 1. Задача: додати aria-pressed на bar + mode tab buttons.

### Зроблено
1. **Mode tab buttons** (`bookings`/`revenue`) — всі 3 теми → `aria-pressed={mode === m}`.
2. **Bar buttons** (Studio + Blossom) → `aria-label={ariaLabel}` + `aria-pressed={isActive}`.
   - `ariaLabel = \`${DAYS[i]}: ${...}\`` — патерн з Frost (вже мав обидва).
3. **Frost bar buttons** — вже мали `aria-label` + `aria-pressed` з попередньої сесії, не чіпали.

### VERIFY
tsc 0 · build clean · commit `8d8fc4e`.

---

## 2026-06-05 · Session 06 · P1.12 timingSafeEqual CRON_SECRET (5 routes)

**Контекст:** MTRP Phase 1 security. Задача: замінити `===` на timing-safe порівняння.

### Зроблено
1. **NEW** `src/lib/utils/verifyCronSecret.ts` — HMAC sha256, нормалізує до 32 байт → no length leak.
2. **5 cron routes** → `!verifyCronSecret(authHeader)` / `!verifyCronSecret(req.headers.get(...))`.
3. PowerShell bulk edit через `[System.IO.File]::ReadAllText/WriteAllText` (UTF-8 no BOM).
   - ⚠️ УРОК: перший спробував Set-Content без -Encoding utf8 → mojibake Cyrillic. Відновлено з git, повторено правильно.

### VERIFY
tsc 0 · build clean · diff: 3±1 рядки на файл (import + comparison only) · commit `eaa1920`.

---
## 2026-06-05 · Session 06 · P0.7 MicaModal → Radix Dialog (focus trap)

**Контекст:** MTRP Phase 1. P0.2 ✅ з S05. Задача: P0.7 — MicaModal без focus trap → Radix Dialog.

### Зроблено
1. **`src/components/ui/MicaModal.tsx`** — повна заміна на Radix Dialog pattern.
   - `Dialog.Root` + `AnimatePresence` + `Dialog.Portal` (no forceMount).
   - `Dialog.Overlay asChild` → motion.div backdrop (opacity 0→1→0).
   - Plain `div` centering wrapper (fixed inset-0 flex center).
   - `Dialog.Content asChild` → modal motion.div — focus trap на box, backdrop click close зберігся.
   - `Dialog.Title` (visible або sr-only), `Dialog.Description` (sr-only), `Dialog.Close asChild`.
   - Видалено: `mounted` state, manual `document.body.style.overflow`.
   - Зберігається: spring animation, всі props, `maxWidth`, зовнішній вигляд.
2. **Consumers** — 0 змін (API ідентичний): `BookingDetailsModal.tsx` + `BookingWizard.tsx`.

### VERIFY
- tsc 0 · build clean
- 2 consumers — no prop changes needed
- Backdrop click ✓ · Escape key ✓ · Focus trap ✓ · Scroll lock ✓ (Radix native)

**Drawer:** `drawer_bookit_decisions_297dec01fe276b1ba9b65364`

---

## 2026-06-05 · Session 06 · P1.1 useIsDesktop merge

**Контекст:** MTRP Phase 1. Задача: усунути дублікат useIsDesktop хука.

### Зроблено
1. `src/lib/hooks/useIsDesktop.ts` → оновлено до matchMedia реалізації (краща: change events лише на breakpoint cross).
2. `src/hooks/useIsDesktop.ts` + директорія → ВИДАЛЕНО.
3. 10 Landing компонентів → `@/hooks/` → `@/lib/hooks/` (PowerShell bulk replace).
4. 2 app consumers (BookingWizard, BookingDetailsModal) вже були на `@/lib/hooks/` — без змін.

### VERIFY
tsc 0 · build clean · 12 consumers тепер на єдиному canonical хуку.

---

## 2026-06-05 · Session 05 · P0.2 admin client leaks (17 files)

**Контекст:** Продовження MTRP Phase 1. P0.1 ✅ з S04. Задача: P0.2 — видалити admin client з forbidden zones.

### Зроблено
1. **`src/lib/supabase/public.ts`** — новий `createPublicClient()` (anon-key, no session persistence).
2. **Master dashboard pages** (5 files) → `createClient()` (server auth, self-queries, RLS): marketing/page, marketing/new/page, portfolio/page, portfolio/[id]/page, revenue/page.
3. **`growth/page.tsx`** — витягнуто весь data fetch до `growth/actions.ts` (`'use server'`), яке використовує admin легітимно (cross-user referral count). Page.tsx став ~15 рядків.
4. **Client pages** → `createClient()`: my/layout.tsx (push_subscriptions), my/notifications/page.tsx (notifications + portfolio consent).
5. **Public pages** → `createPublicClient()`: [slug]/data.ts · [slug]/page.tsx (generateStaticParams + C2C + occupancy) · [slug]/portfolio/page.tsx · [slug]/portfolio/[id]/page.tsx · [slug]/shop/page.tsx · studio/join/page.tsx · studio/[slug]/page.tsx.
6. **partners/join/page.tsx** → `createPublicClient()` для inviter lookup (публічні дані майстра).
7. **ESLint rule** у `eslint.config.mjs` — `no-restricted-imports` на createAdminClient у page/layout/components/**. Дає compile-time error при нових порушеннях.

### VERIFY
- `grep -rn "createAdminClient" src/app/ | grep -v "api/\|cron/\|webhook\|actions.ts\|admin.ts\|route.ts"` → **0 results** ✓
- Перевірено кожен файл перед правкою (урок C-10: VERIFY first)
- Ключовий висновок: `growth/page.tsx` має cross-user query (referred_by count) → admin only у actions.ts

### CHECK
- tsc: **0 errors** · build: **clean** · lint: **0 errors**
- Commits: `3ae2104`, `4980f67`, `7fc67ca`, `d095205`

### Drawers
- `drawer_bookit_decisions_3d4efc2df9b8dbfe7e83f4b8` — P0.2 full implementation notes

---

## 2026-06-04 · Session 04 · Plan audit + corrections C-09..C-12

**Контекст:** Новий чат. Після startup (mempalace + SYSTEM_MAP + HANDOFF) — аудит плану MTRP vs реальний код перед продовженням виконання.

### Зроблено
1. **Plan audit** — верифіковано 4 ключові items проти реального коду.
2. **C-09** — `StatsMosaicWidget.tsx` відсутній (видалено S02). P0.9 scope: ~7 violations not 11.
3. **C-10** — P0.8 реальних порушень **3** (не 9): `TodaySchedule.tsx:121`, `blossom/InsightsRow.tsx:89`, `SegmentConfigWidget.tsx:45`. frost/studio InsightsRow + blossom/WeeklyChart/Monthly вже `<button>`.
4. **C-11** — P0.6 scanner: **210 кандидатів** (не ~120). Після 42 done → ~70-80 реальних залишилось.
5. **C-12** — P0.2: `auth/callback/route.ts`, `r/[code]/route.ts` — route handlers (API zone, законно). Реальних leaks ~12 not 18.
6. **P0.1 confirmed** — `linkBookingToClient` вразливий: код ідентичний плану (`.is('client_id', null)` без phone-match).

### VERIFY
- `grep linkBookingToClient` → код confirmed vulnerable (line 12-29 actions.ts)
- `scan-icon-buttons.cjs` → 210 candidates (42 done)
- manual grep `<div onClick>` → 3 real violations confirmed
- `grep <a.*onClick` → 0 classic a-tag violations (P0.9 line-numbers in plan stale)

### CHECK
- tsc/build: N/A (тільки документи оновлено)

### Оновлено файли
- `TRACKER.md` — corrections C-09..C-12 додано; P0.8/P0.9 effort/count оновлено
- `MAP.md` — Phase 0 % + candidate counts оновлено; лічильник corrections 12

---

## 2026-06-04 · Session 01 · Setup + Phase 0 dead-code

**Контекст:** Перша сесія виконання MTRP. Ціль: побудувати інфраструктуру трекінгу + старт Phase 0 (рішення Вітоса).

### Зроблено
1. **Інфраструктура `XDEV/PLANS/MTRP/`** — створено хаб: `README.md`, `WORKFLOW.md`, `TRACKER.md`, `AUDIT_LOG.md`, `MAP.md`. Модель процесу запозичена з завершеного `XDEV/RELEASE/`.
2. **P0.3** — видалено `old_BookingsPage.tsx` (0-byte stub). ✅
3. **P0.11 (partial)** — видалено 9 dead-файлів:
   - `onboarding/steps/{StepChannels,StepServicesPrompt,StepSchedulePrompt}.tsx`
   - `settings/widgets/ScheduleDrawer.tsx` (235L)
   - `lib/supabase/hooks/useVacation.ts`
   - `bookings/dashboard/BulkActionToolbar.tsx`
   - `dashboard/ProfileStrengthWidget.tsx`
   - `scratch_test_new_portfolio.ts` (58L) · `supabase/tests/referral_system_test.sql` (353L)
   - **Лишилось:** trim експортів у currency.ts / dates.ts / broadcastUtils.ts / pricing.ts → наступна сесія.
4. **P0.10 (partial + corrected)** — видалено 5 верифіковано-мертвих root-widgets (WeeklyChart, MonthlyCalendar, PeakHours, NextFreeDays, CancellationRate; разом ~1002 рядки).

### VERIFY (чому довіряти не плану, а коду)
- `Grep "widgets/<Name>\b"` + `Grep "import.*<Name>"` по `bookit/src`.
- **Знайдено 2 помилки плану + 1 нова проблема** (див. TRACKER → Plan Corrections C-01..C-04, N-01):
  - `ScheduleWidget` (root) — **живий** (SettingsPage + BentoGrid), НЕ видалено.
  - 5 root-widgets живі лише через dev-сторінку `(public)/auth/blocks-test/page.tsx` → 🔒 N-01.
  - `ScheduleDrawer` — план суперечив собі (P0.6 vs P0.11); код підтвердив 0 importers → видалено.

### CHECK
- `npx tsc --noEmit` → **exit 0** ✅ (видалення нічого не зламало статично).
- `npm run build` → запущено (фон, ID `b4fqzpuv7`). Результат — у наступному entry / MAP.
- Тести: N/A (видалення мертвого коду, без логіки).

### COMMIT
- `chore(mtrp): tracking infrastructure` — 5 файлів хабу.
- `chore(dead-code): delete 15 verified-dead files (P0.3, P0.10 partial, P0.11 partial)` — явні файли, не `-A`.

### DRAWER
- `mempalace_add_drawer` — підсумок сесії 01 + методологія VERIFY-before-delete + plan corrections.

### Наступна дія
→ Дочекатись build (ID `b4fqzpuv7`). Потім: **P0.11 export-trim** (verify importers кожного експорту) → **P0.5 type="button" sweep**. Деталі — у MAP.md.

---

## 2026-06-04 · Session 02 · Phase 0 — N-01 + export-trim + P0.5 verified

**Контекст:** Продовження автономно. Мандат Вітоса: «роби все що треба, на виборі — архітектурно найкраще; найголовніше — нічого не зламати, зробити стабільніше».

### Зроблено
1. **N-01 RESOLVED** — видалено dev-харнес `(public)/auth/blocks-test/page.tsx` (публічний роут) + **6 орфан-віджетів** (root): InsightsRow, QuickActionsWidget, FreeSlotsWidget, TopServicesWidget, ChannelHealthWidget, **StatsMosaicWidget**. → завершує **P0.10**.
2. **P0.11 export-trim (safe part)** — видалено лише верифіковано-мертві експорти:
   - `lib/utils/currency.ts` → `formatPrice` (0 importers; `formatCurrency` лишено — живий, 4 importers)
   - `lib/utils/dates.ts` → `formatTime`, `formatDayFull` (0 importers)
3. **P0.5 — verified ALREADY DONE** (план застарів).

### VERIFY (нові корекції плану — C-05..C-08)
- **C-05:** `broadcastUtils.ts` — план «видалити 5 експортів». РЕАЛЬНІСТЬ: усі 4 функції юзає `marketing/actions.ts` + є `broadcastUtils.test.ts`. **ЖИВИЙ → не чіпано.** (Видалення зламало б розсилки + тести.)
- **C-06:** `pricing.ts` `BillingInput`/`TierProgress` — план «видалити». РЕАЛЬНІСТЬ: `BillingInput` — param type внутрішньо; `TierProgress` — return type `getLifetimeTierProgress` (юзає `ReferralPage` + тести). **Публічний API → лишено.**
- **C-07:** `P0.5` (209 кнопок без type) — мультилайн-grep `<button` без `type=` → **0** на 599 кнопок/154 файли. Закрито в STEP 5-13. **P0.5 ✅ без правок.**
- **C-08:** `dates.ts pluralize` — план «видалити». РЕАЛЬНІСТЬ: юзає `FlashDealPage.tsx`. **Відкладено → P3.2** (спершу міграція на `pluralUk`, потім видалення; різні сигнатури — pluralUk вертає лише слово, pluralize — «N слово»).
- **StatsMosaicWidget** — нова знахідка (не в плані): орфан, лише blocks-test → видалено разом.

### CHECK
- `npx tsc --noEmit` → **exit 0** ✅ (після чистого ребілда).
- `npm run build` → **exit 0** ✅.
- ⚠️ **Урок:** видалення **роуту** (blocks-test) лишає stale `.next/types` + `.next/dev/types` → tsc/build падають на фантомному модулі. Фікс: `rm -rf .next && npm run build`. **Записано у WORKFLOW.** (Видалення лише компонентів цього не потребує.)

### COMMIT
- `chore(dead-code): remove blocks-test dev route + 6 orphan widgets + dead utils (N-01, P0.10, P0.11)`
- `docs(mtrp): update tracker/map/log — Phase 0 dead-code complete`

### SYSTEM_MAP
- Не потребує змін: видалені root-віджети та `blocks-test` не фігурують у SYSTEM_MAP (там лише theme-віджети frost/blossom/studio).

### Наступна дія
→ **P0.6** (aria-label на icon-only кнопках) — спершу VERIFY (можливо частково зроблено STEP 5-13). Потім **P0.1** security (phone-match + міграція 139). Деталі — MAP.md.

---

## 2026-06-04 · Session 03 · P0.5 reopened + P0.6 start (3 UI primitives)

### Зроблено
1. **C-07 ВІДКЛИКАНО** — я хибно закрив P0.5 минулої сесії (grep дав false-negative).
2. **Створено AST-сканер** `XDEV/PLANS/MTRP/tools/scan-buttons.cjs` (brace-aware, ігнорує `>` у `=>`).
3. **Точний результат:** **204** з 595 `<button>` — без `type=`.
4. **P0.5/P0.6 батч 1** — 3 UI-примітиви (переюзані десятками консюмерів):
   - `ui/BottomSheet.tsx` — close: +`type="button"` +`aria-label="Закрити"`
   - `ui/MicaModal.tsx` — close: +`type="button"` +`aria-label="Закрити"`
   - `ui/PopUpModal.tsx` — close: +`type="button"` (aria вже був)

### VERIFY / урок
- **C-07 root cause:** flat ripgrep multiline `<button` без `type=` дав 0 матчів, хоча `BottomSheet:47` явно без type. Причина: ненадійність multiline-lookahead для JSX зі стрілками. **Висновок:** для атрибутів `<button>` використовувати `tools/scan-buttons.cjs`, не grep.
- **Safety rule (don't break):** НЕ ставити `type="button"` сліпо — submit-кнопка форми має лишитись `type="submit"`. Сканер хінтить `[onClick]`/`[NO-onClick]`/`[file-has-form]`. Кнопки з onClick → type=button безпечно.

### CHECK
- `npx tsc --noEmit` → **0** ✅
- `npm run build` → **0** ✅ (route-summary present)

### COMMIT
- `fix(a11y): type=button + aria-label on 3 UI primitives (P0.5/P0.6)`
- `docs(mtrp): reopen P0.5 (204 untyped, AST-scan) + scan-buttons tool`

### Наступна дія
→ Продовжити P0.5/P0.6 батчами по файлах (`scan-buttons.cjs` дає список). Правило type= за хінтами. Потім P0.1 security. Деталі — MAP.md.

---

## 2026-06-04 · Session 03b · P0.5 COMPLETE (codemod) + 2 NO-onClick

### Зроблено
1. **Сканер хінти:** у всьому кодбейсі лише **2 файли** мають `<form>` (NavLoginSheet, SupportWidget) і лише **2 NO-onClick кнопки** → submit-ризик майже нульовий.
2. **ClientAuthSheet.tsx** — 7 кнопок (всі onClick, форми нема) → `type="button"` через `perl` (ASCII-insert, кирилиця ціла).
3. **Codemod `tools/fix-button-type.cjs`** (brace-aware, той самий парсер) — додав `type="button"` до **192** onClick-кнопок у ~100 файлах. Пропустив NO-onClick + вже-типізовані. Pure ASCII insert → кирилиця не зачеплена.
4. **2 NO-onClick вручну:**
   - `BillingPage.tsx:380` — `disabled` плейсхолдер «Перехід недоступний» (форми нема) → `type="button"`.
   - `PortfolioPhotoUploader.tsx:34` — drag-handle (icon-only) → `type="button"` + `aria-label="Перетягнути фото"`; :40 delete → `aria-label="Видалити фото"` (P0.6).
5. → **P0.5 = DONE** (re-scan: 0 missing на 595 кнопок).

### VERIFY / safety
- Re-scan `scan-buttons.cjs`: **0** missing type ✅
- Mojibake/replacement-char scan по src: **clean** (codemod через Node utf8 round-trip, lossless) ✅
- tsc --noEmit: **0** ✅ · build: (фон, перевіряється)
- ⚠️ git diff src «забруднений» pre-existing незакоміченими змінами (STEP 12/13: changelog, invite BENEFITS, my/* auth guards) — вони були в tree ДО сесії, codemod додав type=button і в них. Коміт включить і їх (нічого не втрачено).

### COMMIT
- `fix(a11y): type="button" on all 204 untyped buttons — P0.5 complete (codemod)` + tools/fix-button-type.cjs

### Наступна дія
→ **P0.6** — icon-only кнопки без aria-label (~22 лишилось). Потрібен content-aware прохід (не codemod — треба розрізнити icon-only від текстових). Потім P0.1 security. MAP.md.

---

## 2026-06-04 · Session 03c · P0.6 batch 2 (6 icon-only aria-labels)

### Зроблено
- **Детектор `tools/scan-icon-buttons.cjs`** — знаходить icon-only кнопки без aria-label (247 кандидатів, але heuristic over-flags `{текст-через-вираз}` напр. `[Loader2,ArrowRight]`="Далі →" → реально ~120). **Verify each before edit.**
- **6 aria-label** (всі verified icon-only, вже мали type=button):
  - `AnalyticsPage.tsx` :80 "Попередній період" · :85 "Наступний період" · :457 "Оновити"
  - `WidgetLibraryModal.tsx`:46 "Закрити" · `UpgradePromptModal.tsx`:63 "Закрити" · `AnchoredTooltip.tsx`:99 "Закрити"
- Пропущено false-positives: WidgetLibrary:57 (Icon+text), Tooltip:91 (primaryButtonText) — мають текст.

### VERIFY / CHECK
- aria-label = технічні рядки (RULE 0.5 виняток, без humanizer). Кольори не чіпав (a11y-color хуки — skip).
- tsc 0 ✅ · build (фон).

### COMMIT
- `fix(a11y): aria-label on 6 icon-only buttons (P0.6 batch 2)` + scan-icon-buttons tool

### Прогрес P0.6
11 / ~120 done (S03 primitives 3 + portfolio 2 + цей батч 6). Лишилось ~110 — кілька проходів.

### Наступна дія
→ Продовжити P0.6 батчами (`scan-icon-buttons.cjs`, verify each). Найчастіші: X close, Chevron nav, Copy/Check, Eye/EyeOff, Trash2. Потім P0.1 security.

---

## 2026-06-04 · Session 03d · P0.6 batches 3-5 (31 кнопок) + HANDOFF

### Зроблено
- **P0.6 batch 3 (10):** MonthlyCalendarWidget ×3 теми (prev/next місяць + close-day) + RestockDrawer (close/−/+).
- **P0.6 batch 4 (10):** SharePageCard (QR/close), BentoGrid (remove-widget), NotificationsBell (close), ProductFormDrawer (close/remove-photo), VacationManager (remove), ImageUploader (clear), BroadcastEditor (close), SystemLogsViewer (refresh).
- **P0.6 batch 5 (11):** AdminSupportConsole (remove-file/add-image/send-submit), ModerationHub (publish toggles — динамічний aria-label), MyBookingsPage (close), ProfileHero (close), ScheduleWidget (remove-break), DashboardTopBar (back), ProductMixWidget (prev/next місяць).
- **P0.6 разом: 42/~120.**
- **Створено `HANDOFF.md`** — повний контекст для наступного чату (стан, кроки, 8 уроків, конвенції, plan corrections).

### CHECK
- Кожен батч: `npx tsc --noEmit` 0 + `npm run build` 0. Кольори не чіпав (a11y-color хуки skip).

### COMMITS
- `fix(a11y): aria-label batch 3/4/5` (×3) + `docs(mtrp): HANDOFF + MAP/README`.

### Наступна дія
→ P0.6 tail (~78 icon-only) батчами (scan-icon-buttons.cjs, verify each) → P0.1 security. Повний план — HANDOFF.md §4.

---

<!-- НОВІ ENTRIES ДОДАВАТИ ВИЩЕ ЦІЄЇ ЛІНІЇ -->
