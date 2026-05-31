# IMPECCABLE Documents Audit

> Generated: 2026-05-31 | Source: `LegalHubPage.tsx`, `page.tsx`, `legal.ts`

## 1. Heuristics (Nielsen 10 × 0–4 = /40)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Framer entrance + clear header. Static content = no confusion |
| 2 | Match System / Real World | 3 | Good UA labels, contact section adds trust |
| 3 | User Control and Freedom | 3 | External links open in new tab. No form = no lock-in |
| 4 | Consistency and Standards | 2 | 4 hardcoded accent colors instead of theme tokens |
| 5 | Error Prevention | 4 | Static content only. No error surface |
| 6 | Recognition Rather Than Recall | 4 | Icon + label + desc per card. Clear |
| 7 | Flexibility and Efficiency | 1 | 4 items — no search needed. But also no text zoom or print |
| 8 | Aesthetic and Minimalist | 3 | Clean bento grid. Color-coded cards look premium |
| 9 | Error Recovery | 4 | Not applicable (static) |
| 10 | Help and Documentation | 2 | No help section. Contact link is the only support |
| **Total** | | **30/40** | **B+** |

## 2. Cognition (X/20)

Minimal cognitive load. 4 cards, each identical in structure. Color-coding aids scanning without adding noise. Contact bar is separated visually.

| Metric | Score | Notes |
|--------|-------|-------|
| Decision options per screen | 5 | 4 docs + contact = 5 choices |
| Progressive disclosure | 5 | Nothing to disclose |
| Cognitive consistency | 4 | Hardcoded colors = slight theme mismatch |
| Information density | 5 | Sparse, comfortable |
| **Total** | **17/20** | **B+** |

## 3. Code Quality (X/20)

**LegalHubPage.tsx** (127 lines): Well-structured. SPRING constant extracted. Staggered entrance via delay formula `0.08 + i * 0.07`. Contact bar with email link.
- 5 hardcoded colors (4 doc accents + 1 `#C4A89E` external icon)
- `bg` uses rgba strings instead of theme variables
- `min-h-[140px]` arbitrary value
- `'use client'` only for Framer animation — could be RSC
- No `prefers-reduced-motion` — 6/10

**page.tsx** (9 lines): Clean RSC wrapper. — 10/10

**legal.ts** (15 lines): Clean constants. — 10/10

| File | Score | Issues |
|------|-------|--------|
| LegalHubPage.tsx | 6/10 | 5 hardcoded colors, no reduced motion, rgba strings |
| page.tsx | 10/10 | Clean |
| legal.ts | 10/10 | Clean |
| **Total** | **15/20** | **B+** |

## 4. Accessibility

| Issue | Severity | Location | Detail |
|-------|----------|----------|--------|
| External icon no `aria-label` | P2 | LegalHubPage.tsx:89 | `<ExternalLink>` has no text alternative |
| No `prefers-reduced-motion` | P2 | LegalHubPage.tsx:49-69 | Framer entrance animations ignore reduced motion |
| Hardcoded colors no contrast check | P2 | LegalHubPage.tsx:15-41 | Accent colors on custom backgrounds not verified |
| `mailto:` email in DOM | P3 | LegalHubPage.tsx:119 | Exposed for scraping. Acceptable for legal page |
| No `dangerouslySetInnerHTML` in dashboard | P3 | [slug]/page.tsx | Public page concern, not dashboard |

**Score: 3/4** — no blockers. Card links are semantic `<Link>` elements (good).

## 5. Animations

| Element | Pattern | Issue |
|---------|---------|-------|
| Header | Framer spring (stiffness 280, damping 24), delay 0.05 | No reduced-motion |
| 4 cards | Staggered entrance, 70ms intervals, spring config | No reduced-motion |
| Hover/active | CSS scale 1.01/0.98, 200ms duration | Clean. No transform-origin set |
| External icon | `group-hover` color transition | Good |

**Assessment**: Clean, restrained animations. The staggered card entrance is premium. Missing reduced-motion is the only gap.

## 6. Systemics

| Issue | Scope | Cross-module |
|-------|-------|-------------|
| `#789A99` (public-offer accent) | LegalHubPage.tsx:15 | Same systemic green across Clients, Analytics, Services, Studio |
| `#5C9E7A` (privacy accent) | LegalHubPage.tsx:32 | Same retention green from Analytics/Clients |
| `#D4935A` (terms accent) | LegalHubPage.tsx:24 | Same amber from Analytics/Clients |
| `#C4A89E` (external icon) | LegalHubPage.tsx:89 | New hardcoded color, not in token system |
| `#6B5750` (refund accent) | LegalHubPage.tsx:40 | New hardcoded color |
| `rgba()` background strings | LegalHubPage.tsx:16,24,32,40 | Deprecated pattern — all 4 cards use hardcoded rgba |
| No theme tokens used | LegalHubPage.tsx (entire file) | **Worst theming compliance in the project** — 0 CSS variables used for colors |

**Worst theming score confirmed.** This page uses 6 hardcoded colors, 4 deprecated rgba backgrounds, and zero CSS variables. Three of the 6 colors match the systemic retention palette from other modules.

## 7. Findings

### What's working
1. **Clean bento grid layout** — 2×2 on desktop, full-width on mobile. `col-span-2 md:col-span-3` is correct responsive design.
2. **Staggered entrance animation** — `delay: 0.08 + i * 0.07` is a clean delay formula. First card starts at 80ms, last at 290ms. Subtle and effective.
3. **Color-coded cards** — each document type gets a semantic accent color (green=financial, amber=terms, teal=privacy, brown=refund). Good information scent.

### Priority issues
- **[P1] Zero theme token usage** — 6 hardcoded colors, 4 rgba backgrounds. This page is completely disconnected from the design system.
- **[P2] No prefers-reduced-motion** — Framer animations fire regardless of accessibility preference.
- **[P2] Missing aria-label on external icon** — decorative icon needs screen reader alternative.
- **[P3] `min-h-[140px]`** — prefer `h-full` or Tailwind spacing scale.

## 8. Summary

| Dimension | Score | Rating |
|-----------|-------|--------|
| Heuristics | 30/40 | B+ |
| Cognition | 17/20 | B+ |
| Code Quality | 15/20 | B+ |
| **Total** | **62/80** | **B** |

The Documents hub is a well-structured static page with the cleanest information architecture in the project. Its main weakness is complete reliance on hardcoded colors — worst theme token compliance across all 24 audited pages.
