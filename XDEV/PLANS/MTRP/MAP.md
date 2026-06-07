# 🧭 MAP.md — «Де я зупинився» (resume-pointer)

> **Читати ПЕРШИМ на старті сесії** (після mempalace_status + SYSTEM_MAP). Повний контекст → [HANDOFF.md](./HANDOFF.md).
> **Updated:** 2026-06-06 (Session 18)

---

## ▶️ НАСТУПНА ДІЯ (точка входу)

```
PHASE 1 ~87% · PHASE 2 ~95% ✅ · PHASE 4 ✅ 100% · NEXT → P2.8/P2.9 або Phase 1 залишок (P0.12 blocked)
```

**Phase 2 — залишилось:**
- ~~**P2.7**~~ ✅ DONE S17 — Sheet.tsx unified primitive; 3 old files deleted; 13 PopUpModal + 2 MicaModal + 5 BottomSheet migrated. tsc 0 · build clean.
- ~~**P2.12**~~ ✅ DONE S16 — 79 inputs, aria-label на всіх, 30+ файлів
- ~~**P2.15**~~ ✅ DONE S15 — `invalidateBookingQueries.ts`, 7 sites
- ~~**P2.3**~~ ✅ DONE S18 — StoryGenerator 1545L→617L; story/ subfolder (StoryCanvas·types·constants·hooks·export); React.memo + useMemo. tsc 0 · build clean.
- ~~**P2.4/P2.5**~~ ✅ DONE S19 — useWindowVirtualizer (list view) + React.memo ClientListRow/ClientGridCard; clientsUtils.tsx leaf; backward compat re-exports. tsc 0 · build clean.

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
► Phase 2  LIMITED DRY     [███████░]  ~80% ← P2.1·P2.2·P2.3·P2.6·P2.7·P2.10·P2.11·P2.12·P2.13·P2.14·P2.15 ✅ | next: P2.4/P2.5
  Phase 3  TESTS & TYPES   [████████] 100% ← P1.11 ✅ · P1.10 ✅ · P2.1 ✅ — COMPLETE
✅ Phase 4  POLISH          [████████] 100% ← P3.2·P3.3·P3.4·P3.5·P3.6·P3.7·P3.8·P3.10·P3.11 ALL DONE
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
**S12:** P2.1 ✅ (70 `as any` → explicit types, 21 files; Promise<never> race pattern; tsc 0; build clean)
**S13:** P2.6 ✅ (9 queries: hooks+actions+RSC explicit fields) · P3.2 ✅ (pluralize unused import) · P3.10 ✅ (WAYFORPAY env) · MorningBriefing types fix · .env.local created
**S14:** P3.4 ✅ (BottomSheet drag handle role="presentation") · P3.3 ✅ (9 SVGs: 7 aria-hidden + 2 role="img") · P3.5 ✅ (focus:ring, 11 files) · P3.7 ✅ (StepServices tabs aria-controls+tabpanel) · P3.8 ✅ (file inputs aria-hidden+tabIndex, 11 files) · P3.6 ✅ (aria-pressed tabs, 4 files: AnalyticsPage/ModerationHub/AcademyPage/SystemLogsViewer)
**S15:** P2.11 ✅ (WCAG AA contrast: 25 files, /30-50→/60-80 на readable text labels) · P2.15 ✅ (invalidateBookingQueries.ts, 7 sites)
**S16:** P2.12 ✅ (79 inputs aria-label/htmlFor, 30+ файлів)
**S17:** P2.7 ✅ (Sheet.tsx unified primitive; 3 old files deleted; 13 PopUpModal + 2 MicaModal + 5 BottomSheet migrated)
**S18:** P2.3 ✅ (StoryGenerator 1545L→617L; story/ subfolder; React.memo + useMemo. tsc 0 · build clean)
**S19:** P2.4 ✅ (useWindowVirtualizer list view; clientsUtils.tsx; ClientListRow+ClientGridCard React.memo) · P2.5 ✅ (local note state; backward compat re-exports. tsc 0 · build clean)

---

## 🔁 Quick-resume

```bash
mempalace_status
Read XDEV/MAPS/SYSTEM_MAP.md (last 50)
Read XDEV/PLANS/MTRP/MAP.md

# Phase 2 next:
# P2.4 — react-virtual (virtual lists, 6h)
# P2.5 — React.memo ClientCard+BookingRow (4h)

# PENDING: npx supabase db push (P0.1 + migration 140)
```

---

## 📊 Лічильник

```
Items closed: 48 / 71
P0.1·P0.2·P0.3·P0.5·P0.6·P0.7·P0.8·P0.9·P0.10·P0.11
P1.1·P1.3·P1.4·P1.5·P1.6·P1.7·P1.8·P1.9·P1.10·P1.11·P1.12·P1.13·P1.14·P1.15·P1.16
P2.1·P2.2·P2.3·P2.6·P2.7·P2.10·P2.11·P2.12·P2.13·P2.14·P2.15
P3.2·P3.3·P3.4·P3.5·P3.6·P3.7·P3.8·P3.10·P3.11 + N-01
Next: P2.4 (react-virtual, 6h) · P2.5 (React.memo cards, 4h)
Deferred: 2 (P0.4, P1.2) · Blocked: 1 (P0.12)
```

---

*Updated: 2026-06-07 S19 · P2.4 ✅ (useWindowVirtualizer) · P2.5 ✅ (ClientListRow+ClientGridCard React.memo; clientsUtils.tsx) · 48/71 closed · Next: Phase 1 залишок або P2.8/P2.9*
