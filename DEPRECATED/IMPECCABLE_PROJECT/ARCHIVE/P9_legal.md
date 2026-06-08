# P9: `/legal` — Impeccable Audit (Skill Workflow)

**Route**: `/legal` (index) + `/legal/[slug]` (detail)
**Files**: `legal/page.tsx` (21 lines), `legal/[slug]/page.tsx` (133 lines)
**Total**: 154 lines
**Register**: Product (public — legal)
**Date**: 2026-06-01
**Methodology**: critique (split assessment) → audit → animate → overdrive → polish → layout → optimize

---

## critique — Combined Report

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility | 4/4 | Static pages, expected |
| 2 | Real-world match | 4/4 | Legal language appropriate |
| 3 | User control/freedom | **3/4** | No back nav from detail to index |
| 4 | Consistency/standards | **2/4** | `border-[#E8D0C8]` hard-coded. Bilingual gap in ToS. |
| 5 | Error prevention | 4/4 | SSG + `notFound()` |
| 6 | Recognition | 4/4 | Clear index list |
| 7 | Flexibility | 4/4 | OK for static content |
| 8 | Aesthetic/minimalist | 3/4 | Clean prose layout |
| 9 | Error recovery | 4/4 | `notFound()` for bad slugs |
| 10 | Help/docs | 3/4 | Footer disclaimer present |
| **Total** | | **35/40** | **Excellent** |

### Anti-Patterns Verdict

**LLM Assessment**: LOW — no P0

| Violation | Line | Severity |
|-----------|------|----------|
| `border-[#E8D0C8]` ×2 — hard-coded hex, no theme token | 122, 127 | **P1** |
| No `prose-invert` → dark mode prose contrast risk | 110 | P2 |
| Dual source of truth (inline HTML vs `content/legal/*.md`) | both | P2 |
| No back-navigation from detail to index | detail | P2 |
| ToS §2 missing ENG translation | terms-of-service | P2 |

**Deterministic scan**: `[]`

### Overall Impression

**35/40 — Excellent.** Clean SSG legal pages. The SSG strategy with `generateStaticParams` and inline HTML is intentional and documented. Main issue is hard-coded border colors that break in dark mode. Dual source of truth (inline HTML vs markdown files) risks drift.

### What's Working

1. **SSG strategy** — `generateStaticParams` + `generateMetadata` + `notFound()` is clean, robust, zero-runtime.
2. **Bento card wrapper** — visual consistency with app layout.
3. **Consistent metadata** — `LEGAL_META` record gives each doc proper SEO.

### Priority Issues

| ID | P | What | Fix |
|----|---|------|-----|
| P9-I1 | **P1** | `border-[#E8D0C8]` ×2 (lines 122, 127) | Use `border-border` |
| P9-I2 | **P2** | No `prose-invert` in dark mode | Add `dark:prose-invert` |
| P9-I3 | **P2** | Dual source: inline HTML vs `content/*.md` | Delete unused markdown or inline sync |
| P9-I4 | **P2** | No back-nav from detail → index | Add `<Link href="/legal">` |

---

## audit — Technical Quality

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 4/4 | Semantic HTML, proper heading hierarchy |
| 2 | Performance | 4/4 | SSG, zero runtime |
| 3 | Theming | **2/4** | Hard-coded border, no prose-invert |
| 4 | Responsive | 4/4 | `prose` handles mobile |
| 5 | Anti-Patterns | 3/4 | Dual source, hard-coded colors |
| **Total** | | **17/20** | **Good** |

---

## animate — Motion Analysis

**Score**: N/A (Server Component — SSG, no client motion)

---

## overdrive — Push Limits

### Direction A: Table of Contents Sidebar
For long documents (public-offer), add a sticky TOC sidebar that highlights current section on scroll. Pure CSS with `position: sticky` + scroll-margin on headings.

### Direction B: Version History
Show document version dates from `LEGAL_VERSIONS` constant. "Останнє оновлення: 01.05.2025" badge above each document.

---

## polish — Final Quality

| Location | Value | Expected | Status |
|----------|-------|----------|--------|
| Lines 122, 127 | `border-[#E8D0C8]` | `border-border` | P1 drift |
| Line 110 | `prose-stone` | +`dark:prose-invert` | Missing |
| `content/legal/` | 4 markdown files | Delete or use | Dead code |

---

## layout — Spatial Design

**Score**: 8/10

```
┌──────────────────────────────────┐
│      Юридичні документи          │
│                                  │
│  • Публічна оферта               │
│  • Умови надання послуг          │
│  • Політика конфіденційності     │
│  • Політика повернення коштів    │
└──────────────────────────────────┘
          ↓ click
┌──────────────────────────────────┐
│  [Legal document content]        │
│  prose-stone typography          │
│                                  │
│  Contact footer                  │
│  [border-[#E8D0C8] divider]      │
└──────────────────────────────────┘
```

Clean index → detail flow. Missing back-link from detail.

---

## optimize — Performance

**Score**: 10/10

- SSG — pre-built at build time. Zero runtime execution. Zero JS.
- `generateStaticParams` — 4 static pages.

---

## Summary — All 7 Commands

| Command | Result |
|---------|--------|
| critique | **35/40** — Excellent. No P0. |
| audit | 17/20 — Good. Theming 2/4. |
| animate | N/A — SSG |
| overdrive | 2 directions: TOC sidebar, Version history |
| polish | 2 drifts (hard-coded border, no prose-invert) |
| layout | 8/10 — Clean. Missing back-link. |
| optimize | **10/10** — Perfect. SSG, zero JS. |
