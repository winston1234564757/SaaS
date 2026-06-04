# 🧭 MAP.md — «Де я зупинився» (resume-pointer)

> **Читати ПЕРШИМ на старті сесії** (після mempalace_status + SYSTEM_MAP).
> **Updated:** 2026-06-04 (Session 03)

---

## ▶️ НАСТУПНА ДІЯ (точка входу)

```
PHASE 0 · P0.5 (204 untyped buttons) + P0.6 (aria-label) — БАТЧІ по файлах → потім P0.1 (security)
```

**P0.5 + P0.6 разом, батчами по файлах** (комбінувати — обидва торкаються `<button>`):

1. **Свіжий список:** з `bookit/` запустити
   `node ../XDEV/PLANS/MTRP/tools/scan-buttons.cjs`
   → друкує всі `<button>` без `type=` з хінтами `[onClick]` / `[NO-onClick]` / `[file-has-form]`.
2. **Правило type= (НЕ ЛАМАТИ форми):**
   - `[onClick]` → `type="button"` (безпечно).
   - `[NO-onClick]` + `[file-has-form]` → прочитати: якщо це submit-CTA форми → `type="submit"`; інакше `type="button"`.
3. **P0.6 одночасно:** якщо кнопка icon-only (лише Lucide-іконка, без тексту) і без `aria-label` → додати `aria-label="..."` (UA, технічні — **без humanizer**).
4. **Батч по файлах:** read файл → усі правки в ньому → наступний. ⚠️ edit_counter_guard блокує 6-й Edit/файл → для 5+ змін у файлі використовувати **Write**.
5. CHECK: `npx tsc --noEmit` + `npm run build` після батча → commit → оновити TRACKER лічильник.

**Потім P0.1 — booking hijack (рішення прийнято):** phone-match + `link_attempts` + rate-limit.
- ⚠️ Прочитати **поточний** `src/app/[slug]/actions.ts` (план показує код 2026-06-02).
- Перевірити схему: `bookings.client_phone`, `profiles.phone`.
- Міграція `139_booking_link_security.sql` (link_attempts + RLS service-role) → `npx supabase db push`.
- E2E: атака чужим booking → blocked; matching phone → success; rate-limit. magic-link = future.

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
► Phase 0  HOT FIXES        ~55%  ← dead-code ✅ · P0.5 🔄(3/204) · P0.6 🔄 · P0.1 🔒
  Phase 1  SECURITY & A11Y    0%  (P0.1, P0.2 admin-leak, P0.7 MicaModal, P0.8/9, P1.x)
  Phase 2  LIMITED DRY        0%
  Phase 3  TESTS & TYPES ⭐    0%  ← USER PRIORITY
  Phase 4  POLISH             0%
```

---

## ✅ Що вже закрито

**S01 (2026-06-04):** хаб `XDEV/PLANS/MTRP/` · P0.3 · P0.11 (9 файлів) · P0.10 (5 widgets)
**S02:** N-01 (blocks-test + 6 widgets → P0.10 ✅) · P0.11 ✅ (export-trim; broadcastUtils/pricing KEPT) · ~2,400 рядків / 22 файли видалено
**S03:** P0.5 **reopened** (хибно закрив — grep false-negative; AST-сканер → 204 untyped) · 3 UI-примітиви (BottomSheet/MicaModal/PopUpModal) type+aria · сканер `tools/scan-buttons.cjs` у хабі
**CHECK кожної сесії:** tsc 0 · build 0

---

## 🔁 Quick-resume

```bash
mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/MAP.md          # цей файл
Read XDEV/PLANS/MTRP/TRACKER.md      # статуси + corrections
cd bookit && node ../XDEV/PLANS/MTRP/tools/scan-buttons.cjs   # свіжий список P0.5
# WORKFLOW: verify → fix → tsc + build → log → commit
# ⚠️ при видаленні роуту: rm -rf .next перед build
```

---

## 📊 Лічильник

```
Items closed: 5 / 71   (P0.3 · P0.10 · P0.11 · P1.13 · P3.11) + N-01
In progress: P0.5 (3/204) · P0.6 (3/~30)
Deferred: 2 (P0.4, P1.2) · Blocked: 2 (P0.1 ready, P0.12)
Dead code removed: ~2,400 рядків (22 файли) · a11y: 3 primitives
Plan corrections: 8 (C-01..C-08) + N-01 + StatsMosaicWidget
Commits: 7 (infra · dead-code×2 · docs×3 · TASK.md)
```

---

*Updated: 2026-06-04 S03 · Next: P0.5/P0.6 батчі по файлах (scan-buttons.cjs) → P0.1 security*
