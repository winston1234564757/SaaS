# C4: `/my/profile` — Impeccable Audit (Skill Workflow)

**Route**: `/my/profile` (client profile settings)
**Files**: `MyProfilePage.tsx` (423 lines), `page.tsx` (44 lines), `actions.ts` (73 lines)
**Total**: 540 lines
**Register**: Product (client zone)
**Date**: 2026-06-01
**Methodology**: critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## critique — Combined Report

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Spinner, toasts, disabled states, success state — solid |
| 2 | Match System / Real World | 3/4 | Mixed "Safety & Health" English heading |
| 3 | User Control and Freedom | 3/4 | No undo after save; no cancel for in-progress edits |
| 4 | Consistency and Standards | **2/4** | Live theme save vs explicit form save — two patterns |
| 5 | Error Prevention | 3/4 | Phone prefix + numeric inputMode; name empty blocks save |
| 6 | Recognition Rather Than Recall | 4/4 | All options visible, well-labeled |
| 7 | Flexibility and Efficiency | 2/4 | No keyboard shortcuts, long single scroll |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean bento, but very long page (11 sections) |
| 9 | Error Recovery | **2/4** | Toast errors + duplicate phone handling excellent elsewhere |
| 10 | Help and Documentation | 3/4 | No tooltips, medical disclaimer present |
| **Total** | | **28/40** | **Good** |

### Anti-Patterns Verdict

**LLM Assessment (sub-agent)**: MODERATE — 2 P0 issues found

| Violation | Line | Severity |
|-----------|------|----------|
| `setTimeout` with no cleanup on unmount | 95 | **P0** |
| `try/finally` without `catch` in Telegram disconnect | 99-107 | **P0** |
| `window.location.href` hard reload on logout | 414 | P1 |
| `new Date().toLocaleDateString()` SSR/CSR mismatch | 75-79 | P1 |
| Theme cookie flash before hydration | 47-51 | P1 |
| Direct DOM in event handlers | 62-70 | P2 |
| `@bookit.app` domain literal leaked in UI | 141, 193 | P2 |
| "Safety & Health" English heading in Ukrainian UI | 224 | P2 |

**Deterministic scan**: `npx impeccable detect` → `[]` — no patterns detected.

### Overall Impression

Feature-rich profile page with excellent backend patterns (double-layer phone dedup, auth metadata sync) but two genuine P0 bugs in the client component: a `setTimeout` without cleanup and a `try/finally` without `catch` that can crash on Telegram disconnect failure. The theme selector with live DOM manipulation and the logout hard reload are architectural concerns. The Safety & Health section with conditional destructive theming is a standout feature.

### What's Working

1. **Double-layer phone dedup** (actions.ts:21-48) — explicit SELECT pre-check + Postgres 23505 race fallback. Best-in-class defensive pattern.
2. **Safety & Health conditional theming** (lines 215-242) — entire section, icon, and textarea shift to `destructive` palette when medical notes exist. Excellent visual affordance.
3. **Auth metadata sync** (actions.ts:52-55) — `auth.updateUser` alongside profile table keeps session fresh. Prevents stale name after refresh.

### Priority Issues

| ID | P | What | Why | Fix |
|----|---|------|-----|-----|
| C4-I1 | **P0** | `setTimeout` no cleanup (line 95) | Component unmounts during 2.5s → `setSaved(false)` on unmounted component | `useEffect` cleanup or `useRef` guard |
| C4-I2 | **P0** | `try/finally` no catch in Telegram disconnect (lines 99-107) | API throw → unhandled promise rejection, potential crash. User sees `disconnecting` reset but no error. | Add `catch` with error toast like `handleSave` does |
| C4-I3 | **P1** | `window.location.href` hard reload on logout (line 414) | Destroys React state, full page load. Should be `router.push('/login')` | Replace with `router.push()` |
| C4-I4 | **P1** | `new Date().toLocaleDateString()` SSR/CSR mismatch (line 75-79) | Intl formatting differs between Node SSR and browser → hydration mismatch | Format on server, pass string |
| C4-I5 | **P1** | Theme cookie flash (line 47-51) | SSR renders 'default', CSR re-renders actual theme → layout shift | Use cookie in middleware or server component |
| C4-I6 | **P2** | "Safety & Health" English heading (line 224) | Only English string in an otherwise Ukrainian UI | Translate to "Безпека та здоров'я" |
| C4-I7 | **P2** | `@bookit.app` domain literal exposed (lines 141, 193) | Internal convention leaked to UI. Changes with domain = brittle. | Pass `showEmail: boolean` from server |
| C4-I8 | **P2** | Inconsistent save model — theme saved live, form needs explicit click | Two patterns on one page. User confusion. | Align to one model |

---

## audit — Technical Quality

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 3/4 | `label` elements, `aria-label` on back button. Theme selector uses `button`. |
| 2 | Performance | 3/4 | No heavy computations. `setTimeout` is only memory concern. |
| 3 | Theming | 3/4 | 3-theme selector with data-theme attribute. Uses CSS variables. |
| 4 | Responsive | 4/4 | All touch targets ≥44px. Flex layout. |
| 5 | Anti-Patterns | **2/4** | Direct DOM manipulation, SSR hydration risk, no catch on async |
| **Total** | | **15/20** | **Good** |

---

## animate — Motion Analysis

**Score**: 5/10

| Element | Current | Verdict |
|---------|---------|---------|
| Section mount | `easeOut` 0.25s, y: 16→0 | Clean. Consistent stagger. |
| Missing: exit animations | No AnimatePresence anywhere | Sections just vanish. |
| Save button state | Loading spinner + success check | Correct. |
| Logout button | No animation | Fine. |
| Missing: `prefers-reduced-motion` | Not handled | Should be added. |

Consistent 0.25s easeOut on all sections, but no exit animations and no `prefers-reduced-motion`.

---

## overdrive — Push Limits

```
──────────── ⚡ OVERDRIVE ─────────────
》》》 Entering overdrive mode...
```

### Direction A: Theme Preview Gallery
Replace theme color swatches with live preview thumbnails (screenshots of how the app looks in each theme). User sees the actual look before committing. Generated at build time or via CSS containment preview.

### Direction B: Optimistic Save + Undo
All form fields save on change (debounced) with an undo snackbar. The current explicit-save model feels dated. Optimistic updates with `useTransition` + undo toast would match modern product patterns.

### Direction C: Section Reordering
Pin frequent sections (personal data, theme) to top, reorder less-used ones (legal, logout). Let users drag-reorder or use frequency-based auto-sort.

---

## polish — Final Quality

### Design System Alignment

| Location | Value | Expected | Status |
|----------|-------|----------|--------|
| Line 224 | "Safety & Health" | "Безпека та здоров'я" | English drift |
| Lines 47-51 | Cookie-based theme | Server-side theme | SSR hydration risk |
| Lines 62-70 | Direct DOM | React `useEffect` | Anti-pattern |
| Lines 141,193 | `@bookit.app` literal | Server boolean | Leak |

### Copy
"Safety & Health" English heading. Everything else Ukrainian. Humanizer: needs translation on line 224.

### Missing States
- Telegram disconnect error state (no catch)
- `setTimeout` cleanup on unmount
- Theme flash on first load
- Exit animations on section unmount

---

## layout — Spatial Design

**Score**: 8/10

```
┌──────────────────────────────────┐
│ [←]  Мій профіль                │ header
├──────────────────────────────────┤
│ [AB] Full Name     ✉ email       │ avatar + meta
│   З 1 січня 2026                  │
├──────────────────────────────────┤
│ Особисті дані                     │
│   Ім'я: [__________]             │
│   Телефон: +38 [___]             │
│   Email: (conditional)           │
├──────────────────────────────────┤
│ ⚠ Safety & Health (EN)           │
│   Алергії: [textarea]            │
│   Нотатки: [textarea]            │
├──────────────────────────────────┤
│ 🎨 Оформлення                     │
│   [Blossom] [Studio] [Frost]     │ theme picker
├──────────────────────────────────┤
│ Telegram: [Підключити/Відкл]      │
├──────────────────────────────────┤
│ PushSubscribeCard                 │
├──────────────────────────────────┤
│ [          Зберегти зміни        ]│ save
├──────────────────────────────────┤
│ Мої записи →                     │ nav
├──────────────────────────────────┤
│ Юридична інформація               │ legal
├──────────────────────────────────┤
│ [         Вийти з акаунту        ]│ logout
└──────────────────────────────────┘
```

11 sections in a single scroll. Clean bento-card separation but very long. The Safety & Health section with conditional destructive theming is visually distinct.

---

## optimize — Performance

**Score**: 7/10

- `setTimeout` without cleanup = memory leak risk (P0)
- `Cookies.get` / `document.documentElement` — synchronous DOM reads
- `router.refresh()` on theme change + on save = 2x server re-render
- No image optimization needed (emoji-only)
- No unnecessary re-renders detected

---

## Summary — All 7 Commands

| Command | Result |
|---------|--------|
| critique | 28/40 — Good. 2 P0 (setTimeout, try/finally no catch) |
| audit | 15/20 — Good. Anti-Patterns 2/4 (DOM manipulation) |
| animate | 5/10 — Consistent 0.25s easeOut. No exit animations. |
| overdrive | 3 directions: Theme preview, Optimistic save+undo, Section reorder |
| polish | 2 drifts + 2 anti-patterns: "Safety & Health" EN, direct DOM, @bookit.app |
| layout | 8/10 — 11 sections, clean spacing, very long |
| optimize | 7/10 — setTimeout leak, synchronous DOM reads |

**Priority fix**: `setTimeout` cleanup → `try/finally` add catch → Hard reload → Date mismatch → Cookie flash → "Safety & Health" → `@bookit.app` leak
