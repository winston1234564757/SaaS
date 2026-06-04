# 🧭 MAP.md — «Де я зупинився» (resume-pointer)

> **Читати ПЕРШИМ на старті сесії** (після mempalace_status + SYSTEM_MAP). Повний контекст → [HANDOFF.md](./HANDOFF.md).
> **Updated:** 2026-06-04 (Session 04)

---

## ▶️ НАСТУПНА ДІЯ (точка входу)

```
PHASE 0 COMPLETE ✅ → PHASE 1 · P0.1 (booking hijack security) ← NEXT
dead-code ✅ · P0.5 ✅ · P0.6 ✅(72) · P0.8 ✅(3) · P0.9 ✅(0 real)
```

**P0.1 — booking hijack (CRITICAL SECURITY) — рішення прийнято:**
1. ⚠️ Прочитати **поточний** `src/app/[slug]/actions.ts` (~30 рядків linkBookingToClient)
2. Перевірити схему: `bookings.client_phone` + `profiles.phone` (чи є ці колонки)
3. Реалізація: fetch booking → if client_id != null AND != user.id → throw; звірити `profile.phone === booking.client_phone`; mismatch → throw `PHONE_MISMATCH_REQUIRES_OTP`; link + audit
4. Міграція `139_booking_link_security.sql`: таблиця `link_attempts` + RLS (service-role only) → `npx supabase db push`
5. E2E: hijack blocked · matching phone ok · rate-limit (5/15хв)
6. ⚠️ Feature flag `FEATURE_STRICT_BOOKING_LINK` для canary deploy

**Після P0.1:** P0.2 (admin client leaks ~12, ESLint rule) → P0.7 (MicaModal→Radix Dialog focus trap)

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
  Phase 0  HOT FIXES       [████████] ~100% ← dead-code ✅ · P0.5 ✅ · P0.6 ✅ · P0.8 ✅ · P0.9 ✅
► Phase 1  SECURITY & A11Y [░░░░░░░░]    0%  ← P0.1 NEXT (critical) · P0.2 · P0.7 · P1.x
  Phase 2  LIMITED DRY     [░░░░░░░░]    0%
  Phase 3  TESTS & TYPES ⭐ [░░░░░░░░]    0%  ← USER PRIORITY
  Phase 4  POLISH          [░░░░░░░░]    0%
```

---

## ✅ Що вже закрито

**S01:** хаб `XDEV/PLANS/MTRP/` · P0.3 · P0.11 (9 файлів) · P0.10 (5 widgets)
**S02:** N-01 (blocks-test + 6 widgets → P0.10 ✅) · P0.11 ✅ (export-trim) · ~2,400 рядків / 22 файли видалено
**S03:** P0.5 **✅ DONE** (204 typed: codemod +192, ClientAuthSheet +7, primitives +3, manual +2) · P0.6 21/~120 (batches 1-3)
**S04:** P0.6 **✅ DONE** (72 buttons, batches 4-12, ~35 files) · P0.8 **✅ DONE** (3 div→button) · P0.9 **✅ DONE** (0 real violations — all legit links) · C-09..C-12 corrections
**CHECK кожної сесії:** tsc 0 · build 0 · mojibake clean

---

## 🔁 Quick-resume

```bash
mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/MAP.md          # цей файл
Read XDEV/PLANS/MTRP/TRACKER.md      # статуси + corrections C-01..C-12

# P0.1: Read src/app/[slug]/actions.ts (linkBookingToClient ~30 lines)
# Check DB: select * from bookings limit 1; -- has client_phone?
#           select * from profiles limit 1; -- has phone?
# Implement phone-match + link_attempts table + rate-limit
# npx supabase db push → tsc → build → E2E tests
# ⚠️ HIGH RISK item — test thoroughly before commit
```

---

## 📊 Лічильник

```
Items closed: 9 / 71   (P0.3 · P0.5 · P0.6 · P0.8 · P0.9 · P0.10 · P0.11 · P1.13 · P3.11) + N-01
Next: P0.1 (booking hijack — CRITICAL)
Deferred: 2 (P0.4, P1.2) · Blocked: 2 (P0.1 ready, P0.12)
Dead code removed: ~2,400 рядків (22 файли)
aria-label fixed: 72 buttons (~35 files, 12 batches)
div→button fixed: 3 (TodaySchedule · blossom/InsightsRow · SegmentConfigWidget)
Plan corrections: 12 (C-01..C-12) + N-01
Commits: ~32 (infra · dead-code · P0.5 · P0.6 batches 1-12 · P0.8 · docs)
```

---

*Updated: 2026-06-04 S04 · Phase 0 COMPLETE · Next: P0.1 booking hijack security*
