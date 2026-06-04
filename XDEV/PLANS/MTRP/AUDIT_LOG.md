# 📒 AUDIT_LOG.md — Журнал виконання MTRP (append-only)

> Append-only. Кожен завершений/частковий item = entry. Найновіше — зверху.
> Формат: дата · session · item(s) · що зроблено · VERIFY · CHECK (tsc/build/test) · commit · drawer.

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

<!-- НОВІ ENTRIES ДОДАВАТИ ВИЩЕ ЦІЄЇ ЛІНІЇ -->
