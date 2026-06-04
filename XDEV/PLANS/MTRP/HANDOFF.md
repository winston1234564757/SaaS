# 🤝 HANDOFF — MTRP Execution (для наступного чату)

> **Прочитай це ПЕРШИМ** (разом з [MAP.md](./MAP.md)). Це повний контекст виконання плану [MTRP-2026-06-02](../MTRP-2026-06-02.md).
> **Дата handoff:** 2026-06-04 (Sessions 01-04) · **Гілка:** `main` · **Стан:** tsc 0 · build clean · все закомічено.
> ⚠️ **PENDING:** `npx supabase db push` для P0.1 міграції (`20260604000000_booking_link_security.sql`)

---

## 0. TL;DR — звідки продовжувати

```
PHASE 0 COMPLETE ✅. PHASE 1 почато.
ЗРОБЛЕНО S04: P0.6 ✅(72 aria-labels) · P0.8 ✅(3 div→button) · P0.9 ✅(0 real) · P0.1 ✅(security)
НАСТУПНА ДІЯ: npx supabase db push → потім P0.2 (admin client leaks ~12 zones + ESLint rule)
```

**Перший хід наступного чату:**
```bash
# 1. контекст
mcp__mempalace__mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/HANDOFF.md   # цей файл
Read XDEV/PLANS/MTRP/MAP.md       # resume-pointer
Read XDEV/PLANS/MTRP/TRACKER.md   # статуси

# 2. Deploy P0.1 migration
cd bookit && npx supabase db push   # застосувати link_attempts table

# 3. Verify P0.1
npx tsc --noEmit && npm run build
```

---

## 1. Що це за задача

Виконання **MTRP-2026-06-02** — Master Technical Remediation Plan: **71 item**, 5 фаз (Phase 0→4).
**Мандат користувача (Вітос):** «роби все що треба; на виборі — архітектурно найкращий варіант; **НАЙГОЛОВНІШЕ — нічого не зламати, зробити стабільнішим і кращим**».

---

## 2. Хаб виконання `XDEV/PLANS/MTRP/`

| Файл | Роль |
|---|---|
| `HANDOFF.md` | Цей файл — повний контекст для нового чату |
| `MAP.md` | Resume-pointer: наступна дія, блокери, лічильник |
| `TRACKER.md` | Статус усіх 71 item + **Plan Corrections C-01..C-12** |
| `WORKFLOW.md` | Per-item цикл (verify→fix→tsc→build→log→commit) |
| `AUDIT_LOG.md` | Append-only журнал сесій |
| `tools/scan-buttons.cjs` | Детектор `<button>` без `type=` |
| `tools/fix-button-type.cjs` | Codemod: `type="button"` на onClick-кнопки |
| `tools/scan-icon-buttons.cjs` | Детектор icon-only кнопок без `aria-label` |

---

## 3. Що ЗРОБЛЕНО (Sessions 01-04, усе в `main`)

### Phase 0 — ALL COMPLETE ✅
- **P0.3** — видалено `old_BookingsPage.tsx` (stub). ✅
- **P0.10 ✅** — 11 root dead-widgets видалено (~2,400 рядків / 22 файли).
- **P0.11 ✅** — 9 dead-файлів + 3 dead-експорти.
- **P0.5 ✅** — 204 кнопки типізовано `type="button"`.
- **P0.6 ✅** — 72 icon-only кнопки → aria-label (12 батчів, ~35 файлів). 180 scanner залишок = false-positives.
- **P0.8 ✅** — 3 div→button: TodaySchedule · blossom/InsightsRow · SegmentConfigWidget.
- **P0.9 ✅** — 0 реальних порушень (усі `<a href onClick>` — легітимні посилання).

### Phase 1 — STARTED
- **P0.1 ✅** — booking hijack security fix:
  - `src/app/[slug]/actions.ts` — `linkBookingToClient()` тепер: rate-limit (5/15хв) + phone-match (last 10 digits) + audit log
  - Migration `supabase/migrations/20260604000000_booking_link_security.sql` — таблиця `link_attempts` + RLS + indexes
  - ⚠️ **`npx supabase db push` ще НЕ запущено** — потрібна підтвердження/виконання наступним чатом

### Plan Corrections знайдено (C-01..C-12 + N-01)
Детально → TRACKER.md §Corrections.

---

## 4. НАСТУПНІ КРОКИ (у порядку)

### 4.1 Deploy P0.1 migration (PENDING)
```bash
cd bookit && npx supabase db push
```
Verify: таблиця `link_attempts` з'явилась у Supabase Dashboard.

### 4.2 P0.2 — admin client leaks (~12 files)
Реальні non-API порушення (route handlers `auth/callback` + `r/[code]` виключено per C-12):
- `src/app/(master)/dashboard/*/page.tsx` (6 files) → перенести в `actions.ts` + `createClient()`
- `src/app/my/layout.tsx` + `my/notifications/page.tsx` → `createClient()` + RLS
- `src/app/[slug]/data.ts` + `[slug]/page.tsx` → `publicSupabase()` (anon key)
- `src/app/studio/join/page.tsx` + `studio/[slug]/page.tsx` → `publicSupabase()` або action
- **Потім:** ESLint rule `no-restricted-imports` для `@/lib/supabase/admin` (forbidden zones)
- ⚠️ VERIFY кожен файл перед правкою — план міг бути неточним (урок C-10)

### 4.3 P0.7 — MicaModal → Radix Dialog (focus trap)
- `src/components/ui/MicaModal.tsx` (99 рядків) — замінити на Radix Dialog pattern
- 8+ consumers: BookingDetailsModal, StatsModals, UpgradePromptModal etc.

### 4.4 Решта Phase 1: P1.1(useIsDesktop merge), P1.3(heatmap tabindex), P1.4(WeeklyChart aria-pressed), P1.12(timingSafeEqual CRON), P1.16(touch targets)

---

## 5. ⚠️ КРИТИЧНІ УРОКИ (hard-won)

1. **VERIFY-BEFORE-DELETE/FIX.** 12 plan corrections знайдено. Завжди Grep/read перед дією.
2. **Grep НЕнадійний для `<button>` атрибутів** → `tools/scan-buttons.cjs` (AST).
3. **Видалення РОУТУ** → `rm -rf .next && npm run build` (stale types).
4. **P0.9 виявилась false alarm** — всі `<a href onClick>` були легітимні.
5. **edit_counter_guard: 6-й Edit/файл/сесія** → Write повну версію.
6. **aria-label = технічні рядки** → humanizer НЕ потрібен (RULE 0.5 виняток).
7. **phone-match: last 10 digits** — нормалізація E.164 варіюється (+38... vs 0...).

---

## 6. Конвенції aria-label (UA, технічні)

| Контекст | aria-label |
|---|---|
| Закрити модал/дровер (X) | `Закрити` |
| Видалити файл/фото/перерву | `Видалити файл` / `Видалити фото` / `Видалити перерву` |
| Назад (ChevronLeft/ArrowLeft) | `Назад` |
| Попередній/Наступний місяць | `Попередній місяць` / `Наступний місяць` |
| Попередня/Наступна категорія | `Попередня категорія` / `Наступна категорія` |
| Refresh | `Оновити` |
| Stepper −/+ | `Зменшити` / `Збільшити` |
| Toggle visibility | `{x ? 'Сховати' : 'Показати'}` |
| Copy | `{copied ? 'Скопійовано' : 'Скопіювати'}` |
| Надіслати (Send) | `Надіслати` |
| Expand/collapse | `{open ? 'Згорнути' : 'Розгорнути'}` |
| Завантажити зображення | `Додати зображення` / `Завантажити аватар` |

---

## 7. Plan Corrections (задокументовано в TRACKER)

C-01..C-04: P0.10 dead-widgets · N-01 (blocks-test dev-route) · C-05/C-06 (kept live utils) · C-07 (P0.5 grep false-neg) · C-08 (pluralize→P3.2) · **C-09** (P0.9 = 0 violations) · **C-10** (P0.8 3 not 9) · **C-11** (P0.6 210 candidates) · **C-12** (P0.2 ~12 not 18).

---

## 8. Verification protocol (кожен батч/item)

```bash
cd bookit
npx tsc --noEmit                 # 0 errors — ОБОВ'ЯЗКОВО перед commit
npm run build                    # clean (для видалень — ловить barrel/dynamic; роут → rm -rf .next)
npm test                         # якщо торкнувся логіки (Phase 3 — завжди)
```
**Після item:** AUDIT_LOG entry · TRACKER статус · MAP лічильник · commit · `mempalace_add_drawer`.

---

## 9. Open decisions / pending

- ⚠️ **P0.1 migration** — `npx supabase db push` для `20260604000000_booking_link_security.sql`
- 🔒 **P0.12** — телеметрія onboarding (Phase 1) — user-decision
- **P0.2 ESLint rule** — `no-restricted-imports` для `@/lib/supabase/admin`

---

## 10. MemPalace drawers (S04)

Шукати: `mempalace_search "MTRP P0.6"` / `"P0.1 booking hijack"` / `"P0.8 div button"`. Ключові drawers:
- P0.6 progress (72 buttons, false-positive detection patterns)
- P0.8 + P0.9 (div→button lessons, P0.9 was false alarm)
- P0.1 (phone-match impl, link_attempts schema, caller analysis)

---

*Створено: 2026-06-04 · Sessions 01-04 · Наступне: supabase db push → P0.2 admin leaks*
