# P7: `/studio/join` — Impeccable Audit (Skill Workflow)

**Route**: `/studio/join` (studio invite join)
**Files**: `page.tsx` (29 lines), `StudioJoinPage.tsx` (110 lines)
**Total**: 139 lines
**Register**: Brand (public — invite)
**Date**: 2026-06-01
**Methodology**: critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## critique — Combined Report

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Button pending text, success message, auto-redirect notice |
| 2 | Match System / Real World | 4/4 | Ukrainian copy, familiar invite flow |
| 3 | User Control and Freedom | 2/4 | "Скасувати" link. No stop for 2s auto-redirect. |
| 4 | Consistency and Standards | **2/4** | Gradient/shadow hard-coded. 🎉 emoji breaks policy. |
| 5 | Error Prevention | **1/4** | `.single()` throws instead of null — page crashes on invalid token |
| 6 | Recognition Rather Than Recall | 4/4 | Minimal UI, clear states |
| 7 | Flexibility and Efficiency | 4/4 | Simple single-purpose page |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean but generic hard-coded gradient |
| 9 | Error Recovery | 3/4 | Inline error banner for server action errors |
| 10 | Help and Documentation | 4/4 | Self-explanatory |
| **Total** | | **30/40** | **Good** |

### Anti-Patterns Verdict

**LLM Assessment (sub-agent)**: LOW — 1 P0

| Violation | Line | Severity |
|-----------|------|----------|
| `.single()` throws on no row — page crashes instead of showing error | page.tsx:26 | **P0** |
| 🎉 emoji in text (banned by No-Emoji Policy) | 56 | P1 |
| Hard-coded gradient background, no theme tokens | 42 | P2 |
| Hard-coded box-shadow `rgba(92,158,122,0.35)` | 97 | P2 |
| `transition-all` duplicated | 96 | P3 |

**Deterministic scan**: `npx impeccable detect` → `[]`

### Overall Impression

Clean, simple invite page with a **real P0 bug**: `.single()` instead of `.maybeSingle()` means an invalid or expired token crashes the server component instead of showing the "Посилання недійсне" UI. Hard-coded gradient and shadow need tokens. Security pattern (SHA-256 token hashing) is solid.

### What's Working

1. **Security**: SHA-256 token hashing server-side with `invite_token_expires_at` check. Correct pattern.
2. **Effect cleanup**: `useEffect` returns `clearTimeout(t)` — proper cleanup.
3. **Server/client split**: Thin server fetches data → client handles 3 states. Clean Next.js 15 pattern.

### Priority Issues

| ID | P | What | Why | Fix |
|----|---|------|-----|-----|
| P7-I1 | **P0** | `.single()` throws on no match (page.tsx:26) | Invalid/expired token → PostgrestError → Next.js error boundary. User never sees the error UI. | `.maybeSingle()` |
| P7-I2 | **P1** | 🎉 emoji (line 56) | Violates UI standards | Remove emoji |
| P7-I3 | **P2** | Hard-coded gradient background (line 42) | No dark mode, no theme token | Use CSS variable |
| P7-I4 | **P2** | Hard-coded box-shadow (line 97) | No theme token | Use shadow token |
| P7-I5 | **P3** | `transition-all` duplicated (line 96) | Sloppy | Clean up |

---

## audit — Technical Quality

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 3/4 | Missing `aria-label` on error icons. Button properly labeled. |
| 2 | Performance | 4/4 | Minimal. No heavy work. |
| 3 | Theming | **2/4** | No theme tokens for gradient/shadow |
| 4 | Responsive | 4/4 | `max-w-sm`, centered. Mobile-first. |
| 5 | Anti-Patterns | **2/4** | `.single()` crash, hard-coded values |
| **Total** | | **15/20** | **Good** |

---

## animate — Motion Analysis

**Score**: 7/10

| Element | Current | Verdict |
|---------|---------|---------|
| Card mount | spring(300,24), y:20→0, scale:0.97→1 | Clean. |
| Missing: state transition | No animation between states | States snap. |
| Missing: `prefers-reduced-motion` | Not handled | Minor. |

---

## overdrive — Push Limits

### Direction A: Animated State Morph
Use AnimatePresence + layout animation to morph the card between states (join → success) instead of snapping. Shared element (icon) animates from Building2 → CheckCircle.

### Direction B: Studio Preview
Show studio cover image or master count in the invite card. Make the invite feel like joining a community, not just clicking a button.

---

## polish — Final Quality

| Location | Value | Expected | Status |
|----------|-------|----------|--------|
| page.tsx:26 | `.single()` | `.maybeSingle()` | **P0 crash** |
| Line 42 | Hard-coded gradient | CSS variable | No theme |
| Line 97 | Hard-coded shadow | Token | No theme |
| Line 56 | 🎉 emoji | None | Policy violation |

### Copy
"Приєднатися до студії", "Посилання недійсне", "Ви у команді! 🎉". Humanizer: remove 🎉.

---

## layout — Spatial Design

**Score**: 8/10

```
┌──────────────────────────────────┐
│  (gradient background)           │
│                                  │
│    ┌─── bento-card ─────────┐    │
│    │  [Building2 icon]       │    │
│    │  ЗАПРОШЕННЯ ДО СТУДІЇ   │    │
│    │  Studio Name            │    │
│    │  Description text       │    │
│    │                         │    │
│    │  [Приєднатися →]        │    │
│    │     Скасувати           │    │
│    └─────────────────────────┘    │
│                                  │
└──────────────────────────────────┘
```

Clean centered card on gradient background. Three-state content fits in same card.

---

## optimize — Performance

**Score**: 9/10

- Minimal. 110 lines, no heavy computation.
- `useEffect` cleanup present.
- Server component is thin.

---

## Summary — All 7 Commands

| Command | Result |
|---------|--------|
| critique | 30/40 — Good. 1 P0 (.single() crash) |
| audit | 15/20 — Good. Theming 2/4. |
| animate | 7/10 — Clean mount. No state transition anim. |
| overdrive | 2 directions: State morph, Studio preview |
| polish | 1 P0 drift + 2 P2 hard-coded values |
| layout | 8/10 — Clean centered card. |
| optimize | 9/10 — Minimal. Effect cleanup present. |
