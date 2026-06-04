# 🧭 MAP.md — «Де я зупинився» (resume-pointer)

> **Читати ПЕРШИМ на старті сесії** (після mempalace_status + SYSTEM_MAP).
> **Updated:** 2026-06-04 (Session 03c)

---

## ▶️ НАСТУПНА ДІЯ (точка входу)

```
PHASE 0 · P0.6 (icon-only aria-label, ~100 лишилось) → потім P0.1 (security). dead-code ✅ P0.5 ✅
```

**P0.6 — icon-only кнопки без `aria-label`** (батчами по файлах):
1. **Свіжий список:** з `bookit/` →
   `node ../XDEV/PLANS/MTRP/tools/scan-icon-buttons.cjs`
   (247 кандидатів, але heuristic over-flags — реально ~120; ~21 вже зроблено).
2. **VERIFY кожну** перед правкою: чи справді icon-only (без тексту, навіть через `{cond ? <Icon/> : 'текст'}`). Пропускати текстові false-positives.
3. Додати `aria-label="..."` після `type="button"` (вже є з P0.5 codemod). UA, технічні — **без humanizer**.
4. Батч → `npx tsc --noEmit` + `npm run build` → commit. ⚠️ edit_counter_guard: 6-й Edit/файл блокується → 5+ змін/файл = **Write**.

**Конвенції лейблів (UA):** close→"Закрити" · prev/next місяць→"Попередній/Наступний місяць" · prev/next період→"Попередній/Наступний період" · refresh→"Оновити" · −/+→"Зменшити/Збільшити" · delete→"Видалити …" · copy→"Скопіювати" · eye/eyeOff→"Показати/Сховати".

**Потім P0.1 — booking hijack (рішення прийнято):** phone-match + `link_attempts` + rate-limit.
- ⚠️ Прочитати **поточний** `src/app/[slug]/actions.ts`. Перевірити схему `bookings.client_phone`, `profiles.phone`.
- Міграція `139_booking_link_security.sql` → `npx supabase db push`. E2E: hijack blocked / matching phone ok / rate-limit. magic-link=future.

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
► Phase 0  HOT FIXES        ~82%  ← dead-code ✅ · P0.5 ✅ · P0.6 🔄(21/~120) · P0.1 🔒
  Phase 1  SECURITY & A11Y    0%  (P0.1, P0.2 admin-leak, P0.7 MicaModal, P0.8/9, P1.x)
  Phase 2  LIMITED DRY        0%
  Phase 3  TESTS & TYPES ⭐    0%  ← USER PRIORITY
  Phase 4  POLISH             0%
```

---

## ✅ Що вже закрито

**S01:** хаб `XDEV/PLANS/MTRP/` · P0.3 · P0.11 (9 файлів) · P0.10 (5 widgets)
**S02:** N-01 (blocks-test + 6 widgets → P0.10 ✅) · P0.11 ✅ (export-trim; broadcastUtils/pricing KEPT) · ~2,400 рядків / 22 файли видалено
**S03:** P0.5 **✅ DONE** (204 typed: codemod +192, ClientAuthSheet +7, primitives +3, manual +2) · виправив власну C-07 · P0.6 21/~120 (batches 1-3) · 3 інструменти аудиту в хабі (scan-buttons, fix-button-type, scan-icon-buttons)
**CHECK кожної сесії:** tsc 0 · build 0 · mojibake clean

---

## 🔁 Quick-resume

```bash
mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/MAP.md          # цей файл
Read XDEV/PLANS/MTRP/TRACKER.md      # статуси + corrections C-01..C-08
cd bookit && node ../XDEV/PLANS/MTRP/tools/scan-icon-buttons.cjs   # свіжий P0.6 список
# WORKFLOW: verify icon-only → add aria-label → tsc + build → commit
# ⚠️ видалення роуту: rm -rf .next перед build
```

---

## 📊 Лічильник

```
Items closed: 6 / 71   (P0.3 · P0.5 · P0.10 · P0.11 · P1.13 · P3.11) + N-01
In progress: P0.6 (21/~120 icon-only aria-labels)
Deferred: 2 (P0.4, P1.2) · Blocked: 2 (P0.1 ready, P0.12)
Dead code removed: ~2,400 рядків (22 файли)
Plan corrections: 8 (C-01..C-08) + N-01 + StatsMosaicWidget
Tools: scan-buttons.cjs · fix-button-type.cjs · scan-icon-buttons.cjs
Commits: ~16 (infra · dead-code · P0.5 codemod · P0.6 batches · docs)
```

---

*Updated: 2026-06-04 S03c · Next: P0.6 батчі (scan-icon-buttons.cjs, verify each) → P0.1 security*
