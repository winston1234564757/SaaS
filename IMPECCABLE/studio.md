# IMPECCABLE Studio Audit

> Generated: 2026-05-31 | Source: `page.tsx`, `WaitlistButton.tsx`, `StudioJoinPage.tsx`, `loading.tsx`, `actions.ts`

## 1. Heuristics (Nielsen 10 × 0–4 = /40)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Badge, skeleton, 3 button states, toast. Clear throughout |
| 2 | Match System / Real World | 3 | "Waitlist" = English in Ukrainian UI. Minor |
| 3 | User Control and Freedom | 3 | Cancel link on invite page. Studio page has only 1 action |
| 4 | Consistency and Standards | 2 | Hardcoded rgba breaks theme. Duplicate `transition-all` across 2 components. Emoji in join page |
| 5 | Error Prevention | 4 | Optimistic lock, hash verification, compensation transaction. Best in project |
| 6 | Recognition Rather Than Recall | 4 | Simple hero + 3 cards + 1 CTA. No recall needed |
| 7 | Flexibility and Efficiency | 1 | Single action path. No shortcuts. Expected for coming-soon |
| 8 | Aesthetic and Minimalist | 3 | Clean but 3 identical card pattern is repetitive |
| 9 | Error Recovery | 4 | Toast errors, graceful error states in join form |
| 10 | Help and Documentation | 2 | No help text. Coming-soon page so expected |
| **Total** | | **30/40** | **B+** |

## 2. Cognition (X/20)

Lowest cognitive load in project. Pages have at most 1-2 decision points. Feature cards are homogeneous (icon + title + description repeated 3×) which is unexciting but frictionless.

| Metric | Score | Notes |
|--------|-------|-------|
| Decision options per screen | 5 | Simple |
| Progressive disclosure | 5 | N/A — nothing to disclose |
| Cognitive consistency | 4 | Hardcoded colors = theme mismatch |
| Information density | 5 | Sparse, comfortable |
| **Total** | **16/20** | **B+** |

## 3. Code Quality (X/20)

**page.tsx**: Clean 75-line RSC. Bentocard + mapped features. 2 hardcoded rgba (systemic green). No `type="button"` needed (no buttons). — 9/10

**WaitlistButton.tsx**: Clean 3-state pattern. Missing `type="button"`. Duplicate `transition-all` (line 33: appears twice). Hardcoded shadow rgba. — 6/10

**StudioJoinPage.tsx**: 3-state flow. Missing `type="button"`. Duplicate `transition-all` (line 96). Emoji `🎉` line 56. Hardcoded gradient background. — 5/10

**loading.tsx**: Proper skeleton mirroring layout. — 10/10

**actions.ts**: Production-grade. Optimistic lock via hash rotation. Compensation transaction. Clean `sha256Hex`, `generateSecureToken`. — 10/10

| File | Score | Issues |
|------|-------|--------|
| page.tsx | 9/10 | 2 hardcoded rgba |
| WaitlistButton.tsx | 6/10 | No type, duplicate class |
| StudioJoinPage.tsx | 5/10 | No type, duplicate class, emoji, gradient |
| loading.tsx | 10/10 | Clean |
| actions.ts | 10/10 | Excellent pattern |
| **Total** | **17/20** | **A-** |

## 4. Accessibility

| Issue | Severity | Location | Detail |
|-------|----------|----------|--------|
| Missing `type="button"` | P2 | WaitlistButton.tsx:30 | `<button>` defaults to `submit` in forms |
| Missing `type="button"` | P2 | StudioJoinPage.tsx:93 | Same |
| Emoji as decoration | P3 | StudioJoinPage.tsx:56 | `🎉` not read by screen readers predictably |
| No focus-visible | P3 | All | No custom `focus-visible:` styles visible |
| No prefers-reduced-motion | P2 | StudioJoinPage.tsx:47 | Framer spring animation ignores reduced motion |

**Virtual score: 3/4** (minor gaps, no blockers)

## 5. Animations

| Element | Pattern | Issue |
|---------|---------|-------|
| StudioJoinPage card | Framer `spring` (stiffness:300, damping:24) | No `prefers-reduced-motion` |
| WaitlistButton | CSS `transition-all` + `active:scale-95` | Duplicate class declaration |
| page.tsx | No animations | Correct for static content |

**Assessment**: Minimal animation surface. The Framer spring on the invite card is polished (good coefficients) but missing reduced-motion protection.

## 6. Systemics

| Issue | Scope | Cross-module |
|-------|-------|-------------|
| `rgba(120,154,153,0.12)` icon backgrounds | page.tsx:41,59 | Same green as Clients #789A99, Analytics retention, Services rgba FAB shadow |
| `rgba(120,154,153,0.35)` button shadow | WaitlistButton.tsx:34 | Same systemic green family |
| `linear-gradient(135deg, #FFD2C2…D4E8E7)` | StudioJoinPage.tsx:42 | No theme token — breaks in dark mode |
| Duplicate `transition-all` | WaitlistButton:33, StudioJoinPage:96 | Typo pattern in 2 components |
| Missing `type="button"` | WaitlistButton:30, StudioJoinPage:93 | Systemic project-wide issue (Services is the only exception at 100%) |

## 7. Findings

### What's working
1. **actions.ts is the best server action in the project.** Optimistic lock pattern (hash rotation with WHERE match), compensation transaction, clean error paths, proper token hashing. Production-grade.
2. **Loading skeleton mirrors layout exactly** — correct visual continuity during navigation.
3. **3-state button UX** — WaitlistButton has distinct default/pending/joined visuals with toast feedback. Joined state is persistent.

### Priority issues
- **[P1] Hardcoded systemic green** — page.tsx and WaitlistButton use `rgba(120,154,153,*)` directly. Same color (#789A99) appears in Clients, Analytics, Services. Must be a CSS variable.
- **[P2] Duplicate `transition-all`** — appears in 2 files. Harmless visually but signals copy-paste.
- **[P2] Missing `type="button"`** — 2 buttons lack it. Project-wide pattern.
- **[P2] No prefers-reduced-motion** — Framer spring animation in StudioJoinPage ignores accessibility preference.
- **[P3] Emoji in invite page** — `🎉` line 56. Minor but project policy bans emoji in UI.

## 8. Summary

| Dimension | Score | Rating |
|-----------|-------|--------|
| Heuristics | 30/40 | B+ |
| Cognition | 16/20 | B+ |
| Code Quality | 17/20 | A- |
| **Total** | **63/80** | **B** |

Studio is a thin "coming soon" page — the smallest audit target. The server action (`actions.ts`) is excellent and should be the template for all future CRUD operations. The main concern is the persistent systemic green hardcoding, now confirmed across 4 modules (Clients, Analytics, Services, Studio).
