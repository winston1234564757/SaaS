# 🧭 MAP.md — «Де я зупинився» (resume-pointer)

> **Читати ПЕРШИМ на старті сесії** (після mempalace_status + SYSTEM_MAP). Повний контекст → [HANDOFF.md](./HANDOFF.md).
> **Updated:** 2026-06-05 (Session 10)

---

## ▶️ НАСТУПНА ДІЯ (точка входу)

```
PHASE 1 ~87% · PHASE 2 ~20% · PHASE 3 ~20% · P1.10 ✅ · NEXT → P2.1 (as any → types)
```

**Phase 3 — Tests (USER PRIORITY):**
- **P2.1** — 100+ `as any` → типи (12h) — частково вже зроблено через P1.15
- **P2.6** — `.select('*')` cleanup (2h)
- **P3.2** — `pluralize`→`pluralUk` (30m)

**Або Phase 2 (швидкі wins):**
- **P2.6** — `.select('*')` cleanup (2h)
- **P3.2** — `pluralize`→`pluralUk` (30m)
- **P3.10** — unused `WAYFORPAY_*` env (5m)

**Pending (потрібен ще supabase db push):**
```bash
cd bookit && npx supabase db push  # P0.1 (link_attempts) + migration 140 (FK index)
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
► Phase 1  SECURITY & A11Y [███████░]  ~87% ← done: P0.1·P0.2·P0.7·P1.1·P1.3·P1.4·P1.5·P1.6·P1.7·P1.8·P1.9·P1.12·P1.13·P1.14·P1.15·P1.16 | blocked: P0.12
► Phase 2  LIMITED DRY     [███░░░░░]  ~20% ← P2.2 ✅ · P2.10 ✅ · P2.13 ✅ · P2.14 ✅ | next: P2.6 (2h)
★ Phase 3  TESTS & TYPES   [░░░░░░░░]   0%  ← USER PRIORITY → P1.11 createBooking tests
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
**S09:** P1.5 ✅ · P1.6 ✅ · P1.7 ✅ · P1.8 ✅ · P1.9 ✅ · P1.14 ✅ · P2.2 ✅ · P2.13 ✅ · P2.14 ✅
**S10:** P2.10 ✅ (sanitizePhone cron) · P1.15 ✅ (MasterData types, 18+ as any removed)
**S11:** P1.11 ✅ (createBooking+referrals 44 tests) · P1.10 ✅ (top-5 hooks 32 tests, 867 total)

---

## 🔁 Quick-resume

```bash
mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/MAP.md
Read XDEV/PLANS/MTRP/TRACKER.md

# Phase 3 — createBooking tests:
Read bookit/src/lib/actions/createBooking.ts
Read bookit/src/lib/actions/referrals.ts

# Phase 2 quick wins:
grep -rn "\.select\('\*'\)" bookit/src/lib/ bookit/src/app/ | grep -v node_modules

# PENDING: npx supabase db push (P0.1 + migration 140)
```

---

## 📊 Лічильник

```
Items closed: 31 / 71
P0.1·P0.2·P0.3·P0.5·P0.6·P0.7·P0.8·P0.9·P0.10·P0.11
P1.1·P1.3·P1.4·P1.5·P1.6·P1.7·P1.8·P1.9·P1.10·P1.11·P1.12·P1.13·P1.14·P1.15·P1.16
P2.2·P2.10·P2.13·P2.14·P3.11 + N-01
Next: P2.1 (100+ as any → types, 12h) або P2.6 (.select('*') cleanup, 2h)
Deferred: 2 (P0.4, P1.2) · Blocked: 1 (P0.12)
```

---

*Updated: 2026-06-05 S11 · P1.10 ✅ top-5 hooks 32 tests (867 total) · 31/71 closed · Next: P2.1 as any → types*
