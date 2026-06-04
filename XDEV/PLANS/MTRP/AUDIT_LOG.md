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

<!-- НОВІ ENTRIES ДОДАВАТИ ВИЩЕ ЦІЄЇ ЛІНІЇ -->
