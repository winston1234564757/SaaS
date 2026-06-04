# 🧭 MAP.md — «Де я зупинився» (resume-pointer)

> **Читати ПЕРШИМ на старті сесії** (після mempalace_status + SYSTEM_MAP). Повний контекст → [HANDOFF.md](./HANDOFF.md).
> **Updated:** 2026-06-04 (Session 04)

---

## ▶️ НАСТУПНА ДІЯ (точка входу)

```
PHASE 0 · P0.6 ✅ · P0.8 (3 div→button) → P0.9 (~7 a→button) → P0.1 (security). dead-code ✅ P0.5 ✅
```

**P0.8 — 3 реальних `<div onClick>` → `<button>`** (C-10: решта вже виправлено):
1. `TodaySchedule.tsx:121` — `<div onClick={() => onOpen(b.id)}>` — рядок букінгу → `<button type="button">`
2. `blossom/InsightsRow.tsx:89` — `<div onClick={handleOpen} className="cursor-pointer">` → `<button type="button">`
3. `SegmentConfigWidget.tsx:45` — `<div onClick={openNew}>` empty-state CTA → `<button type="button">`

**Потім P0.9 — ~7 `<a href onClick>` → `<button>`** (C-09: StatsMosaicWidget видалено)

**Потім P0.1 — booking hijack (рішення прийнято):** phone-match + `link_attempts` + rate-limit.
- ⚠️ Прочитати **поточний** `src/app/[slug]/actions.ts`. Перевірити схему `bookings.client_phone`, `profiles.phone`.
- Міграція `139_booking_link_security.sql` → `npx supabase db push`. E2E: hijack blocked / matching phone ok / rate-limit. magic-link=future.

**P0.6 — DONE ✅.** 72 кнопки у ~35 файлах (batches 1-12, S01-S04). Scanner 210→180 (180 залишок = false-positives: all have visible text).
- Конвенції: close→"Закрити" · back→"Назад" · prev/next місяць→"Попередній/Наступний місяць" · refresh→"Оновити" · copy→"Скопіювати" · delete→"Видалити …"

---

## 🔒 Блокери / рішення користувача

| ID | Статус | Деталь |
|---|---|---|
| ✅ N-01 | RESOLVED | blocks-test + 6 орфан-віджетів видалено |
| ✅ Q1 | DECIDED | P0.1 = phone-match + audit table + rate-limit |
| 🔒 P0.12 | pending | Телеметрія onboarding (Phase 1) — міграція `140_*` + API route |

---

## 📍 Фазова мапа

```
► Phase 0  HOT FIXES        ~93%  ← dead-code ✅ · P0.5 ✅ · P0.6 ✅(72) · P0.8 ⏳(3) · P0.1 🔒
  Phase 1  SECURITY & A11Y    0%  (P0.1, P0.2 ~12 real, P0.7 MicaModal, P0.9, P1.x)
  Phase 2  LIMITED DRY        0%
  Phase 3  TESTS & TYPES ⭐    0%  ← USER PRIORITY
  Phase 4  POLISH             0%
```

---

## ✅ Що вже закрито

**S01:** хаб `XDEV/PLANS/MTRP/` · P0.3 · P0.11 (9 файлів) · P0.10 (5 widgets)
**S02:** N-01 (blocks-test + 6 widgets → P0.10 ✅) · P0.11 ✅ (export-trim; broadcastUtils/pricing KEPT) · ~2,400 рядків / 22 файли видалено
**S03:** P0.5 **✅ DONE** (204 typed: codemod +192, ClientAuthSheet +7, primitives +3, manual +2) · виправив власну C-07 · P0.6 21/~120 (batches 1-3) · 3 інструменти аудиту в хабі
**S04:** P0.6 **✅ DONE** (72 buttons batches 4-12, ~35 files) · C-09..C-12 corrections · plan audit
**CHECK кожної сесії:** tsc 0 · build 0 · mojibake clean

---

## 🔁 Quick-resume

```bash
mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/MAP.md          # цей файл
Read XDEV/PLANS/MTRP/TRACKER.md      # статуси + corrections C-01..C-12

# P0.8: verify 3 div→button → fix → tsc + build → commit
# P0.9: grep '<a.*href.*onClick' → verify ~7 files → fix → tsc + build → commit
# P0.1: read src/app/[slug]/actions.ts current code → implement phone-match fix
# ⚠️ видалення роуту: rm -rf .next перед build
```

---

## 📊 Лічильник

```
Items closed: 7 / 71   (P0.3 · P0.5 · P0.6 · P0.10 · P0.11 · P1.13 · P3.11) + N-01
Next: P0.8 (3 div→button) → P0.9 (~7) → P0.1 security
Deferred: 2 (P0.4, P1.2) · Blocked: 2 (P0.1 ready, P0.12)
Dead code removed: ~2,400 рядків (22 файли)
aria-label fixed: 72 buttons (~35 files, 12 batches)
Plan corrections: 12 (C-01..C-12) + N-01
Tools: scan-buttons.cjs · fix-button-type.cjs · scan-icon-buttons.cjs
Commits: ~28 (infra · dead-code · P0.5 · P0.6 batches 1-12 · docs)
```

---

*Updated: 2026-06-04 S04 · Next: P0.8 (3 divs) → P0.9 → P0.1*
