# Academy — Full Audit

> **Date:** 2026-05-31 | **Scope:** 2 files — 1 route page (12 lines), 1 client component (657 lines)
> **Commands:** audit ✅ | critique ✅ | animate ✅ | polish ✅ | layout ✅ | overdrive ✅ | live ⚠️ (no browser) | optimize ✅

---

## A — Audit (8-block)

### 1. Heuristics (33/40)

| # | Principle | Score | Evidence |
|---|---|---|---|
| 1 | Visibility of system status | 3/4 | Accordion open/close animated. Tab switch with layoutId. -1: No reading progress tracking, no "articles read X of Y" |
| 2 | Match system to real world | 4/4 | Full Ukrainian. Business concepts map perfectly (Записи, Клієнти, Виручка). Article format matches real how-to guides |
| 3 | User control & freedom | 4/4 | Free tab switching. Independent accordion open/close. Restart tour button |
| 4 | Consistency & standards | 2/4 | **3/3 buttons miss `type="button"` (100%).** 7 micro-sizes (`text-[10px]` to `text-[22px]`). Zero `role` attributes |
| 5 | Error prevention | 4/4 | Static content — no forms, no user input |
| 6 | Recognition vs recall | 3/4 | Section icons + labels. Article title + description visible. -1: No tooltips on CTA action buttons |
| 7 | Flexibility & efficiency | 1/4 | **No search (P1 for a knowledge base).** No keyboard shortcuts. No expand all/collapse all. No bookmark/favorites. No recent history |
| 8 | Aesthetic & minimalist | 4/4 | Clean bento-card layout. 0 hardcoded hex. No glassmorphism. No AI slop patterns. Theme tokens throughout |
| 9 | Error diagnosis & recovery | 4/4 | No errors possible (static content) |
| 10 | Help & documentation | 4/4 | The page IS the help system |

### 2. Cognition (15/20)

| Factor | Score | Notes |
|---|---|---|
| Information Architecture | 4/5 | 2-tab split (Функції / Цілі). 10 sections, 26 articles. Clear taxonomy: functional vs goal-oriented |
| Data Density | 4/5 | Title + description per article. Numbered steps. Clean, readable |
| Scannability | 4/5 | Section icons, bold article titles, numbered `01/02` style steps |
| Visual Hierarchy | 4/5 | Page title → Tab bar → Section label → Article title → Steps. Consistent depth |
| Chunking | 3/5 | Articles grouped by section. No visual boundary between sections except the label line |
| Consistency | 4/5 | All articles use same accordion pattern. Predictable behavior |
| Learning Curve | 5/5 | Standard UI pattern. Zero learning required |
| Memory Load | 2/5 | 26 articles across 10 sections. No search, no recents, no way to find articles except browsing |

### 3. Code Quality (16/20)

| Factor | Score | Notes |
|---|---|---|
| TypeScript usage | 5/5 | Clean interfaces: `Step`, `Article`, `Section`. Proper `React.ElementType` for icons |
| Component Architecture | 5/5 | Clean 3-level composition: AcademyPage → SectionGroup → ArticleItem. Single responsibility |
| Code Duplication | 5/5 | Zero — all content is data-driven arrays |
| Content Architecture | 3/5 | 26 articles hardcoded in TypeScript arrays. Not scalable; should be a separate data file |
| Theme Discipline | 5/5 | Zero hardcoded hex. All via `var(--text-primary)`, `var(--accent)`, `var(--border)`, etc |
| A11y (type/role) | 2/5 | 3/3 buttons miss `type="button"`. Tab bar no `role="tablist"`. No `aria-selected`. Accordion has `aria-expanded` ✅ |
| Spring Configs | 3/5 | 5 named constants (good) but different bounce values with no rationale comment |
| Animation Code | 4/5 | Emil Kowalski patterns: layoutId tab pill, overflow:hidden + AnimatePresence accordion. Correct spring config structure |

### 4. Accessibility

| Metric | Count | Notes |
|---|---|---|
| `type="button"` | **0/3 (0%)** | Worst among all audited modules. Products had 69%, clients had 100% |
| `aria-label` | 0 | Section icons decorative (next to label text) — acceptable. CTA arrows decorative |
| `aria-expanded` | 1 | `ArticleItem` button line 434 ✅ |
| `aria-selected` | 0 | Tab buttons lack this |
| `role="tablist"` | 0 | Tab container line 590 |
| `role="tab"` / `role="tabpanel"` | 0 | Tab buttons |
| `div → button` | 0 violations | All `<button>` elements |
| Touch targets | **All fail** | Tab py-2.5 (~33px), Accordion py-3.5 (~41px), CTA py-2.5 (~33px), Restart py-3 (~37px). All below 44px |
| Focus rings | ❌ | `outline-none` likely default from Tailwind |
| Emoji | 0 violations | Clean |

### 5. Animations

| Aspect | Score | Notes |
|---|---|---|
| Emil spring configs | 5/5 | 5 named `SPRING_*` constants with `as const`, zero bounce on 4/5 |
| Tab switch | 5/5 | `layoutId="academy-tab-pill"` with `SPRING_TAB`. `AnimatePresence mode="wait"` |
| Accordion | 5/5 | Emil's overflow:hidden wrapper + AnimatePresence height animation. Opacity delay for content |
| Section stagger | 4/5 | `index * 0.04` delay. Works but no gap tolerance |
| Chevron rotation | 4/5 | Spring animated |
| Restart tour | 2/5 | Solid button with `active:scale-[0.97]` only — no entry animation |
| `prefers-reduced-motion` | ❌ | Missing |

### 6. Systemics (Cross-zone)

| Pattern | Academy | vs Products (best) | vs Clients/Avg |
|---|---|---|---|
| `type="button"` | 0% (0/3) | **Worst** — Products 69%, Clients 100% | Worst ever |
| Hardcoded hex | **0** | Match — best in project | Best |
| CSS variables | All `var(--*)` | Match | Match |
| `aria-label` | 0 | Worse than products (8) | Poor |
| Touch targets | All fail | Match (Products also has 32px) | Consistent fail |
| Emoji | **0** | Better than products (1) | Best |
| Loading skeletons | N/A (static) | Products has them | — |
| React Query | N/A | Products uses | — |
| Revalidation | N/A | Products 9 calls | — |
| Search | **Missing** | Products also missing | Consistent gap |
| Spring constants | **5 named** | Better — Products has 0 shared | Best |

### 7. Findings

**P1:** No search in a knowledge base (26 articles, 10 sections — user must scroll and remember) | 3/3 buttons miss `type="button"` | Tab bar lacks `role="tablist"`/`role="tab"`/`aria-selected` | All touch targets below 44px

**P2:** Content hardcoded in arrays (657-line file — should split into data file) | 7 micro-sizes (`text-[10px]` to `text-[22px]`) | No keyboard navigation | No `prefers-reduced-motion`

**P3:** No expand all / collapse all | No article bookmarking | No recent article history | No CTA tooltips

### 8. Summary

| Dimension | Score |
|---|---|
| Heuristics | 33/40 |
| Cognition | 15/20 |
| Code Quality | 16/20 |
| **Total** | **64/80 (B)** |

**Cleanest theme + token compliance. Worst button accessibility.** Zero hardcoded hex, zero emoji, zero glassmorphism — best visual discipline. But 0% `type="button"` compliance beats even admin's 15% for worst accessibility score. Missing search is the single biggest UX gap for a knowledge base.

**vs Products (63/80):** Academy scores 1 point higher on visual discipline (no emoji, no hardcoded hex at all) but worse on accessibility and missing search eliminates the flexibility heuristic entirely.

---

## B — Critique

**Design Health Score: 30/40 (Nielsen)**

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | No progress tracking across 26 articles |
| 2 | Match System / Real World | 4 | Clean Ukrainian, familiar concepts |
| 3 | User Control and Freedom | 4 | Free accordion/tab navigation |
| 4 | Consistency and Standards | 2 | 0% type="button", no roles |
| 5 | Error Prevention | 5 | Static content |
| 6 | Recognition Rather Than Recall | 3 | No search, 26 items to browse |
| 7 | Flexibility and Efficiency | 1 | Worst: knowledge base without search |
| 8 | Aesthetic and Minimalist Design | 4 | Clean, token-based |
| 9 | Error Recovery | 5 | Not applicable |
| 10 | Help and Documentation | 5 | The help system itself |

**Anti-Patterns Verdict:** CLEAN (0/7 flags). No glassmorphism, no gradient text, no side-stripe borders, no hero metrics. Best anti-pattern compliance across all audited modules.

**Persona Red Flags:**
- **Sasha (mobile-first master):** All touch targets fail 44px. No search. 10px text borderline.
- **Olena (desktop boutique owner):** No keyboard navigation. No expand all. No way to print or save articles.

---

## C — Animate

**Score: 8/10**

| Component | Animation | Quality |
|---|---|---|
| Tab switch | layoutId pill, AnimatePresence mode="wait" | 5/5 — excellent |
| Accordion open/close | Emil overflow:hidden + height spring, opacity delay | 5/5 — textbook |
| Chevron rotation | SPRING_CHEVRON, 180deg | 5/5 |
| Section stagger | index * 0.04, SPRING_SECTION | 4/5 |
| Restart tour | active:scale only | 2/5 — minimal |
| Tab text color | CSS transition 200ms ease (not spring) | 3/5 |

**Gaps:** No entry animation for the page itself | Restart tour button lacks entry motion | No `prefers-reduced-motion` | Tab text color uses CSS transition instead of spring (inconsistency with the rest)

---

## D — Polish

**Score: 17/22 checks pass**

| Check | Status |
|---|---|
| Theme tokens used | ✅ |
| Hardcoded hex | ✅ 0 |
| Emoji violations | ✅ 0 |
| IA matches neighbors | ✅ Consistent with bento-card pattern |
| Typography consistent | ❌ 7 sizes (10px-22px) |
| Forms labeled | ✅ No forms |
| Touch targets >= 44px | ❌ All fail |
| Contrast WCAG AA | ⚠️ `text-tertiary` on large surfaces borderline |
| Focus rings | ❌ `outline-none` without fallback |
| `prefers-reduced-motion` | ❌ Missing |
| Consistent button styles | ✅ CTA links use consistent color-mix pattern |
| Color-mix uses variables | ✅ 3 places, all use `var(--accent)` |

**Actionable:** P2 — Add `focus-visible:ring-2` | P2 — Touch targets to 44px | P3 — Consolidate to 4 text sizes max

---

## E — Layout

**Score: 4/5**

| Check | Verdict |
|---|---|
| Primary action visible | ✅ Tab bar immediately visible |
| Secondary actions distinct | ✅ CTA buttons use accent color, stand out |
| Clear groupings | ✅ Sections clearly labeled |
| Rhythm | ✅ Max-w-2xl centered, consistent internal spacing |

**Issues:** P3 — `pb-28` excessive on desktop (mobile-first OK but desktop could use `md:pb-12`) | P3 — Section boundaries rely only on label line + bento-card gap, no visual dividers between sections

---

## F — Overdrive

**6 proposals:**

1. **Full-text Search** — filter 26 articles in real-time. Knowledge base killer feature.
2. **Reading Progress** — "3/16 прочитано" per tab, localStorage-persisted.
3. **Expand All / Collapse All** — toggle at section level and page level.
4. **Bookmark Articles** — heart icon per article, show "Збережене" filter.
5. **Keyboard Navigation** — `j`/`k` for prev/next article, `/` to focus search.
6. **Article Sharing** — "Поділитись статтею" generates direct deep link.

**Focus:** Search + Reading Progress (Items 1+2) — biggest knowledge base impact.

---

## G — Live

**SKIPPED** — requires browser automation.

**Proposed variants:** Compact (section columns 2-up on tablet), Focused (hide section labels, show filter chips only), Guided (sequential "next article" flow).

---

## H — Optimize

**Score: 8/10**

| Concern | Verdict |
|---|---|
| Component re-renders | P3 — Each ArticleItem has own `useState`. 26 separate state instances fine |
| Content file size | 657 lines — should split data to separate file, component stays lean |
| Server components | Route page is server component ✅ |
| Framer Motion footprint | P3 — `AnimatePresence` + `motion.div` per article — acceptable for static page |
| `next/image` | N/A — no images |
| Bundle impact | Academy only loads when navigated to (route-based code splitting) ✅ |

---

## Summary

| Section | Score |
|---|---|
| Audit (8-block) | 64/80 B |
| Critique (Nielsen) | 30/40 |
| Animate | 8/10 |
| Polish | 17/22 checks pass |
| Layout | 4/5 |
| Overdrive | 6 proposals |
| Live | skipped (no browser) |
| Optimize | 8/10 |

**Top fixes:** Add `type="button"` to 3 buttons | Add `role="tablist"`/`role="tab"` to tab bar | Implement article search | Touch targets to 44px | Split content to data file

**Deep links verified:** 15/15 valid against DEEP_LINK_MAP.md (all 4 drawer params match `?drawer=flash_deals|dynamic_pricing|loyalty|referral`). Routes `/dashboard/reviews` and `/dashboard/services/new` confirmed valid.

**Progress:** 19/25 done. Remaining: Analytics, Landing Page, Services, Studio, Documents, Support, More.
