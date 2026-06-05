# 🧭 MAP.md — «Де я зупинився» (resume-pointer)

> **Читати ПЕРШИМ на старті сесії** (після mempalace_status + SYSTEM_MAP). Повний контекст → [HANDOFF.md](./HANDOFF.md).
> **Updated:** 2026-06-05 (Session 09)

---

## ▶️ НАСТУПНА ДІЯ (точка входу)

```
PHASE 2 ACTIVE · P2.13 ✅ · P2.14 (FK index c2c_referrals.master_id) ← NEXT
```

**P2.14 — FK index `c2c_referrals.master_id` [1h]:**
Migration `141_c2c_referrals_master_id_index.sql`:
```sql
CREATE INDEX IF NOT EXISTS idx_c2c_referrals_master_id 
  ON public.c2c_referrals(master_id);
```
Лише composite `(referrer_id, master_id)` є — bare `master_id` queries = full table scan.

**Після P2.14:** P1.15 (working_hours types, 4h+) → Phase 3 (тести — user priority)

**Pending (потрібен ще supabase db push):**
```bash
cd bookit && npx supabase db push  # P0.1 + P2.14 migrations
```

---

## 🔒 Блокери / рішення користувача

| ID | Статус | Деталь |
|---|---|---|
| ✅ N-01 | RESOLVED | blocks-test + 6 орфан-віджетів видалено |
| ✅ Q1 | DECIDED | P0.1 = phone-match + audit table + rate-limit |
| 🔒 P0.12 | pending | Телеметрія onboarding — user-decision |

---

## 📍 Фазова мапа

```
  Phase 0  HOT FIXES       [████████] 100% ← ✅ COMPLETE
► Phase 1  SECURITY & A11Y [███████░]  ~73% ← done: P0.1·P0.2·P0.7·P1.1·P1.3·P1.4·P1.5·P1.6·P1.7·P1.8·P1.9·P1.12·P1.14·P1.16 | next: P1.15
► Phase 2  LIMITED DRY     [██░░░░░░]  ~10% ← P2.2 ✅ · P2.13 ✅ | P2.14 NEXT
  Phase 3  TESTS & TYPES ⭐ [░░░░░░░░]   0%  ← USER PRIORITY
  Phase 4  POLISH          [░░░░░░░░]   0%
```

---

## ✅ Що вже закрито

**S01-S02:** хаб · P0.3 · P0.10 · P0.11 · N-01 · ~2,400 рядків dead-code
**S03:** P0.5 ✅ (204 buttons) · P0.6 batches 1-3
**S04:** P0.6 ✅(72 aria) · P0.8 ✅(3 div→btn) · P0.9 ✅(0 real) · P0.1 ✅(security)
**S05:** P0.2 ✅ (17 files: publicClient+createClient+ESLint) · growth/actions.ts · public.ts
**S06:** P0.7 ✅ · P1.1 ✅ · P1.12 ✅ · P1.4 ✅ (WeeklyChart aria-pressed, 3 themes)
**S07:** P1.16 ✅ (touch targets ≥44px, 13 files)
**S08:** P1.3 ✅ (heatmap roving tabindex, 3 themes)
**S09:** P1.5 ✅ · P1.6 ✅ · P1.7 ✅ · P1.8 ✅ · P1.9 ✅ · P1.14 ✅ · P2.2 ✅ · P2.13 ✅

---

## 🔁 Quick-resume

```bash
mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/MAP.md
Read XDEV/PLANS/MTRP/TRACKER.md

# P2.14: create bookit/supabase/migrations/141_c2c_referrals_master_id_index.sql
# BEFORE: npx supabase db push (P0.1 + P2.14 migrations pending)
```

---

## 📊 Лічильник

```
Items closed: 26 / 71  (P0.1·P0.2·P0.3·P0.5·P0.6·P0.7·P0.8·P0.9·P0.10·P0.11·P1.1·P1.3·P1.4·P1.5·P1.6·P1.7·P1.8·P1.9·P1.12·P1.13·P1.14·P1.16·P2.2·P2.13·P3.11 + N-01 corrected)
Next: P2.14 (FK index, 1h)
Deferred: 2 (P0.4, P1.2) · Blocked: 1 (P0.12)
```

---

*Updated: 2026-06-05 S09 · P2.13 ✅ th scope (3 admin tables, C-19) · Next: P2.14 FK index*
