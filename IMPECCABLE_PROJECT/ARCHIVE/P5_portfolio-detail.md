# P5: `/[slug]/portfolio/[id]` — Impeccable Audit (Skill Workflow)

**Route**: `/[slug]/portfolio/[id]` (public portfolio detail page)
**File**: `src/app/[slug]/portfolio/[id]/page.tsx` — 310 lines
**Type**: Server Component (Next.js App Router)
**Register**: Product (app UI, public profile)
**Date**: 2026-06-01
**Methodology**: critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## critique — Combined Report

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1/4 | No loading/error.tsx. No photo count. No skeleton during data fetch. |
| 2 | Match System / Real World | 4/4 | Ukrainian labels, formatDateFull. Scissors icon for beauty. Clean metaphors. |
| 3 | User Control and Freedom | 1/4 | Back link only. No photo zoom, no lightbox, no "view all" gallery. |
| 4 | Consistency and Standards | **1/4** | 9 inline `style={}` blocks. Hardcoded hex (#FFE8DC, #2C1A14, #FFD4BE) mixed with tokenized `var(--surface)`. |
| 5 | Error Prevention | 4/4 | `if (!data) notFound()`. Guarded queries. Null-safe chaining everywhere. |
| 6 | Recognition Rather Than Recall | 4/4 | Service chips with icons, client avatar, star ratings — all visual. |
| 7 | Flexibility and Efficiency of Use | 2/4 | No shortcuts. No multiple photo view modes. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Warm palette. Clean layout. Hardcoded colors not in theme. |
| 9 | Error Recovery | 2/4 | `notFound()` only. No `error.tsx`. No helpful message on failure. |
| 10 | Help and Documentation | 0/4 | Not applicable. |
| **Total** | | **22/40** | **Acceptable** |

### Anti-Patterns Verdict

**LLM Assessment (sub-agent)**: CRITICAL — 9 inline `style={}` blocks

| Violation | Line | Severity |
|-----------|------|----------|
| `style={{ background: '#FFE8DC' }}` — page background hardcoded | 135 | **P1** |
| `radial-gradient(circle, #FFD4BE 0%, transparent 70%)` — hardcoded blob | 139 | **P1** |
| `color-mix(in srgb, var(--background) 92%, transparent)` + `backdropFilter` + `borderBottom` inline | 145 | P2 |
| `boxShadow: '0 4px 24px rgba(44,26,20,0.10)'` — hardcoded | 161 | **P1** |
| `background, border, boxShadow` inline mix (token + rgba) | 186 | P2 |
| Same `var(--surface)` + `var(--border)` pattern repeated ×3 | 210,234,258 | P2 |
| `style={{ background: '#2C1A14' }}` — CTA bar hardcoded brown | 279 | **P1** |
| No `WebkitBackdropFilter` | 145 | P3 |
| `as unknown as` type escape ×2 | 69,82 | P3 |

**Deterministic scan**: `npx impeccable detect --json --gpt` → `[]` — no patterns detected by CLI scanner.

### Overall Impression

Solid data-fetching architecture with good concurrency (`Promise.all`, conditional queries). Defensive null handling is thorough. But the styling approach is the textbook AI-generation pattern: use Tailwind until it's inconvenient, then fall back to inline styles with hardcoded values. Nine inline style blocks make this page a theming liability. The missing `loading.tsx` and `error.tsx` are operational gaps. Most critically: no photo lightbox on a portfolio page — users can't actually browse the photos.

### What's Working

1. **Defensive null handling** — Every optional field (`description`, `taggedClientName`, etc.) has a conditional render. No crash paths from missing data.
2. **Consent-aware client display** — `approved`/`pending`/`declined` states with semantic icons (CheckCircle green, Clock amber). Transparent UX.
3. **Efficient data fetching** — Correct `Promise.all` parallelism, conditional queries, `count: 'exact' head: true` for lightweight count.

### Priority Issues

| ID | P | What | Why | Fix |
|----|---|------|-----|-----|
| P5-I1 | **P1** | 9 inline `style={}` mix of hardcoded hex + tokens (lines 135,139,145,161,186,210,234,258,279) | Breaks all 3 themes. Dark mode impossible. Colors #FFE8DC, #2C1A14, #FFD4BE, rgba(44,26,20,*) not in any theme. | Extract all to Tailwind classes. Add page-level CSS tokens if needed. |
| P5-I2 | **P2** | No photo lightbox/gallery interaction — thumbnails at L171-178 decorative only | Portfolio page where you can't view photos = broken core UX. | Add lightweight lightbox (dynamic import client island) or hero-swap on thumbnail click |
| P5-I3 | **P2** | Missing `loading.tsx` + `error.tsx` in route directory | No skeleton during data fetch. DB error crashes page without recovery. | Add `loading.tsx` (pulsing skeleton) + `error.tsx` ("try again" + back link) |
| P5-I4 | **P2** | CTA not sticky on mobile (line 277-306) | Users must scroll past all content to book. Hurts mobile conversion. | `sticky bottom-0` or fixed-bottom bar pattern |
| P5-I5 | **P3** | No `WebkitBackdropFilter` for Safari (line 145) | Safari fallback missing for backdrop blur | Add `WebkitBackdropFilter` alongside |
| P5-I6 | **P3** | No photo count indicator | Users don't know total photos | Add `<p>N фото</p>` label |

### Persona Red Flags

**Olena (Client browsing portfolio)**:
- Sees portfolio detail → wants to see more photos → thumbnails exist but don't respond to tap → frustrated (P2)
- Scrolls long page → CTA is at bottom → must scroll back up after reading reviews (P2)

**Mykola (Safari user)**:
- Opens page → sticky header has no backdrop blur → looks jagged (P3)
- Browser → portfolio → same non-interactive thumbnails + no blur

### Minor Observations

- `color-mix(in srgb, var(--background) 92%, transparent)` — creative hybrid approach. Works but fragile.
- `as unknown as` casts (lines 69, 82) — indicate `supabase gen types` not fully wired.
- `item.created_at` uses `formatDateFull` — correct. Linked reviews also use it.

### Questions to Consider

- "What if the hero photo was swappable by tapping the thumbnails, with zero modal overhead?"
- "Does the page background need a distinct warm tone, or should it default to `bg-background`?"

---

## audit — Technical Quality

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 3/4 | Semantic HTML ✓. No loading.tsx for screen readers. No keyboard nav for photos. |
| 2 | Performance | 4/4 | Server Component = zero JS. `priority` on hero. Dynamic import for BookingFlow. ISR 300s. |
| 3 | Theming | **1/4** | 9 inline styles with hardcoded values. None in theme definitions. |
| 4 | Responsive | 4/4 | `max-w-lg mx-auto`. `aspect-square` photos. Thumbnail scroll. CTA card flex. |
| 5 | Anti-Patterns | 3/4 | Mixed token usage. No glassmorphism, no gradient text, no side-stripe borders. |
| **Total** | | **15/20** | **Good** |

### Executive Summary

**15/20** — Good, dragged by Theming (1/4). Fix the 9 inline styles and this reaches 18+.

### Detailed Findings

- **[P1]** 9 inline `style={}` — theming, pages 135-306
- **[P1]** Hardcoded hex (#FFE8DC, #2C1A14, #FFD4BE) — theming
- **[P2]** No loading.tsx — a11y, route directory missing
- **[P2]** No error.tsx — a11y, route directory missing
- **[P3]** No WebkitBackdropFilter — browser support, line 145

### Positive Findings

- Server Component = zero JS bundle
- `priority` + `sizes` on hero Image — correct LCP optimization
- ISR revalidate=300 — good balance

---

## animate (Server Component)

**Score**: N/A — Server Component. No client-side motion. This is correct for product register.

The only animation-adjacent element is `backdropFilter: 'blur(16px)'` on sticky header (line 145) — native frosted glass, zero JS, correct.

If animation were desired: a lightweight client island for fade-in. But for a detail page that users navigate TO, not scroll-past, static is correct.

---

## overdrive — Push Limits

### Direction A: Photo Hero Swap
Make thumbnails clickable to replace main hero Image. No modal. Use `'use client'` wrapper with `useState` for selected photo URL. Low effort, high impact for portfolio UX.

### Direction B: View Transitions API Lightbox
Add URL-based lightbox (`?photo=N`). Use View Transitions API for morph animation between thumbnail and fullscreen. Shareable URLs, zero extra JS for basic case.

### Direction C: "More works by master" strip
After CTA, show 2-3 more portfolio items as horizontal scroll strip (reuse P4 pattern). Keeps user on site, increases page views.

---

## polish — Final Quality

### Design System Alignment

**Root cause**: No component-level CSS module or Tailwind utilities for the card patterns used across this page.

| Location | Value | Expected |
|----------|-------|----------|
| Lines 186,210,234,258 | `var(--surface)` + `var(--border)` inline ×4 | One reusable `CardShell` component |
| Line 135 | `#FFE8DC` | `bg-background` with warm overlay token |
| Line 279 | `#2C1A14` | `bg-primary/90` or `--color-cta` token |
| Line 161 | `rgba(44,26,20,0.10)` | `shadow-md` |
| Line 139 | `#FFD4BE` | `--color-blob` token |

### Copy
All Ukrainian: "Портфоліо", "Всі роботи", "Майстер", "Записатись", "Відгуки про цю роботу", "Клієнт", "Підтверджено", "Очікує". Humanizer: clean.

### Missing States
- No hover on thumbnail images
- No focus-visible on back button (chevron)
- Interactive states complete on CTA button (via PortfolioBookingButton)

---

## layout — Spatial Design

**Score**: 7/10

```
┌──────────────────────────────┐
│ ← [sticky header: title]     │
├──────────────────────────────┤
│     ┌──────────────────┐     │
│     │   HERO PHOTO     │     │  aspect-square
│     └──────────────────┘     │
│     ┌──┐ ┌──┐ ┌──┐          │  thumbnails (decorative)
│                              │
│  ┌──────────────────────┐    │
│  │ Title + meta         │    │  var(--surface) card
│  └──────────────────────┘    │
│  (Client card — conditional) │
│  (Reviews — conditional)     │
│  ┌ [Avatar] Master [Записатись] ┐  CTA
│  └──────────────────────────────┘  static, buried
└──────────────────────────────┘
```

Logical Z-pattern flow. `space-y-5` generous. `max-w-lg` correctly constrains. CTA at absolute bottom — on long pages users must scroll past everything. Conditional client/reviews sections cause layout shift.

---

## optimize — Performance

**Score**: 9/10 — Near perfect for a Server Component.

- `priority` on hero Image ✓
- `sizes` attribute correct ✓
- Dynamic import BookingFlow ✓
- ISR revalidate=300 ✓
- Parallel `Promise.all` ✓
- Conditional queries (reviews only if IDs exist) ✓

Only gaps: no `loading.tsx` (blank page during fetch), no `error.tsx` (crash on DB error).

---

## Summary — All 7 Commands

| Command | Result |
|---------|--------|
| critique | 22/40 heuristics — Acceptable. 9 inline styles, 1 P0-style pattern cluster |
| audit | 15/20 — Good. Theming 1/4 is critical |
| animate | N/A — Server Component. Correct default |
| overdrive | 3 directions: Hero swap, View Transitions lightbox, More works strip |
| polish | 4× repeated inline card pattern. 5 token drifts. Copy clean |
| layout | 7/10 — Logical Z-pattern. CTA buried, conditional sections shift |
| optimize | 9/10 — Efficient. Missing loading/error.tsx |

**Priority fix order**: 9 inline styles → loading/error.tsx → photo lightbox → sticky CTA → WebkitBackdropFilter → photo count
