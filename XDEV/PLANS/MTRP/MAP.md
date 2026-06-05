# 🧭 MAP.md — «Де я зупинився» (resume-pointer)

> **Читати ПЕРШИМ на старті сесії** (після mempalace_status + SYSTEM_MAP). Повний контекст → [HANDOFF.md](./HANDOFF.md).
> **Updated:** 2026-06-05 (Session 09)

---

## ▶️ НАСТУПНА ДІЯ (точка входу)

```
PHASE 1→2 ACTIVE · P1.9 ✅ · P1.14 ✅ · P1.15 (working_hours types) ← NEXT
```

**P1.15 — Inline `working_hours as any` [4h+]:**
`src/app/[slug]/page.tsx` — 18× `as any` for working_hours field. Define proper types.
Scope великий — можливо відкласти до Phase 3.

**Або перейти до Phase 2:**
- **P2.2** (30m): Видалити 6 unused npm deps (~440KB)
- **P2.13** (5m): `<th scope="col">` (5 файлів)
- **P2.14** (1h): FK index `c2c_referrals.master_id`

**Pending (потрібен ще supabase db push):**
```bash
cd bookit && npx supabase db push  # P0.1 migration: link_attempts table
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
► Phase 1  SECURITY & A11Y [███████░]  ~73% ← P0.1 ✅ · P0.2 ✅ · P0.7 ✅ · P1.1 ✅ · P1.12 ✅ · P1.14 ✅ · P1.16 ✅ · P1.3 ✅ · P1.4 ✅ · P1.5 ✅ · P1.6 ✅ · P1.7 ✅ · P1.8 ✅ · P1.9 ✅ · P1.15 NEXT
  Phase 2  LIMITED DRY     [░░░░░░░░]   0%
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
**S09:** P1.5 ✅ · P1.6 ✅ (false alarm) · P1.7 ✅ · P1.8 ✅ · P1.9 ✅ · P1.14 ✅ (useShallow)

---

## 🔁 Quick-resume

```bash
mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/MAP.md
Read XDEV/PLANS/MTRP/TRACKER.md

# P1.9: grep -n "useEffect\|c2c\|C2C" bookit/src/components/public/PublicMasterPage.tsx | head -20
# BEFORE: npx supabase db push (P0.1 migration pending)
```

---

## 📊 Лічильник

```
Items closed: 24 / 71  (P0.1·P0.2·P0.3·P0.5·P0.6·P0.7·P0.8·P0.9·P0.10·P0.11·P1.1·P1.3·P1.4·P1.5·P1.6·P1.7·P1.8·P1.9·P1.12·P1.13·P1.14·P1.16·P3.11 + N-01 corrected)
Next: P1.15 (working_hours as any) or P2.2 (unused deps 30m)
Deferred: 2 (P0.4, P1.2) · Blocked: 1 (P0.12)
```

---

*Updated: 2026-06-05 S09 · P1.9 ✅ C2C useQuery · P1.14 ✅ useShallow (3 selectors) · Next: P1.15 or P2.2*
