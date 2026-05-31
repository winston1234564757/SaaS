# Audit Report: `/dashboard/portfolio`

> Date: 2026-05-31 · Auditor: impeccable (v8.3.0)
> Register: product (dashboard — design serves the tool)
> Files: PortfolioPage.tsx (219), PortfolioItemCard.tsx (97), PortfolioItemEditor.tsx (434), PortfolioItemPage.tsx (435), PortfolioPhotoUploader.tsx (217), actions.ts (529), main page.tsx (27), new/page.tsx (22), [id]/page.tsx (43)
> Total: ~2,023 lines · ~72KB source

---

## 1. Heuristics: 24/40 (Weak)

| # | Heuristic | Score | Key Issues |
|---|-----------|-------|------------|
| 1 | Visibility of system status | 3/4 | No per-file upload progress bar; no save confirmation toast on Editor; no character count near limits |
| 2 | Real-world match | 4/4 | Clean Ukrainian labels (except "Сторіз"); good Lucide icon semantics for beauty professionals |
| 3 | User control & freedom | **1/4** | **P0: Delete fires with zero confirmation** — one click destroys item + all photos. Back on `?draft=true` silently deletes. No undo. |
| 4 | Consistency & standards | 2/4 | "Готово" (Editor) vs "Зберегти" (Page) for same action; `cn()` vs template strings; two parallel editors with duplicated form logic (~100 identical lines) |
| 5 | Error prevention | 2/4 | No character counters (title=120, description=1000); no client-side photo type/size check; no delete confirmation |
| 6 | Recognition vs recall | 3/4 | No character hints; drag handles invisible on mobile; no photo count shown before upload |
| 7 | Flexibility & efficiency | 3/4 | DnD grid + DnD photos + StoryGenerator integration are strong; no keyboard accelerators for power users |
| 8 | Aesthetic & minimalism | 3/4 | Clean bento cards, restrained palette; redundant "Фото" label in photo-only upload context |
| 9 | Error recovery | 2/4 | Generic "Не вдалося створити роботу" (PortfolioPage.tsx:58); no retry; no billing link in error toast when limit reached |
| 10 | Help & documentation | **1/4** | No onboarding/empty state tooltip; consent flow has 1-line explanation; no help links; no FAQ |

## 2. Cognition: 14/20 (MODERATE)

Factors: no delete confirmation forces hyper-vigilance on every destructive action; two parallel editor paths (modal vs full-page) with inconsistent buttons ("Готово" vs "Зберегти"); invisible draft lifecycle (`?draft=true`); hidden drag handles on mobile — zero affordance for reorder; review state loss risk (no auto-save on selection). SSR flash in photo uploader causes unexpected layout shift.

## 3. Code Quality: 15/20 (Good)

### Strengths
- **No div→button** — zero `onClick` on divs across all 5 components
- **No emoji** — clean Lucide icons only (first page to achieve this)
- **No `var(--btn-primary-bg)`** — uses `bg-primary` consistently (Clients had 9 instances)
- **Server actions** — all with Zod schemas, ownership verification (`master_id` checks), proper error returns
- **Storage cleanup** — `deletePortfolioItem` removes storage files before DB records (actions.ts:262-270)
- **Optimistic updates** — publish toggle reverts on error (PortfolioItemEditor.tsx:136-147 + 170-179)
- **Draft lifecycle** — clean design: create draft → redirect to editor → validate on save → auto-delete empty drafts
- **Image alt text** — `alt={item.title}` on all portfolio images
- **Error states** — loading spinners on create/upload/delete; error bubbles on upload failure

### Weaknesses
- **P0 — No delete confirmation** — `deletePortfolioItem` fires in single click, irreversible (Editor:150-156, Page:186-192)
- **P0 — Silent draft deletion** — Back button with `?draft=true` deletes without user prompt (PortfolioItemPage.tsx:129-138)
- **P1 — aria-label: 1 across 5 components** — only drag handle; 25+ icon-only buttons have zero labels
- **P1 — aria-pressed: 0** — publish toggle, review selectors have no pressed state
- **P1 — role attributes: 0** — no `role="switch"`, `role="tablist"`, `role="radiogroup"` anywhere
- **P2 — type="button" missing on many buttons** — ~15 buttons lack `type="button"` (default to `type="submit"` in forms)
- **P2 — Hardcoded hex ×6** — `#789A99` (×2), `#C8B8B2` (×2), `#EBD5CC`, `#E8D5CF` — all break on Studio/Frost themes
- **P2 — Duplicate form logic** — Editor + Page have ~100 identical lines (title, description, service, client tag, reviews)
- **P2 — `?draft=true` URL leakage** — param persists after save; refresh/stale bookmark shows stale state
- **P2 — No character counters** — no `maxLength` feedback on 120-char title or 1000-char description
- **P2 — `cursor-pointer` on buttons ×16** — redundant (buttons already have pointer cursor), but not a violation

## 4. Accessibility Assessment

| Criterion | Score | Details |
|-----------|-------|---------|
| `type="button"` | ❌ ~40% | Only 10 of ~26 buttons have it; ~15 missing |
| `aria-pressed` | ❌ 0/26 | None on toggle or multi-select buttons |
| `aria-label` | ❌ 1/26 | Only drag handle (PortfolioItemCard.tsx:34) |
| `role` attributes | ❌ 0 | No switch, tab, radiogroup anywhere |
| Touch targets ≥44px | ⚠️ FAIR | Drag handles (24px) + delete buttons (24px) under minimum; add-photo buttons (96px) pass |
| `div onClick` | ✅ 0 | Zero violations |
| Keyboard nav | ❌ POOR | Custom selects, DnD — no keyboard handling |
| Image `alt` text | ✅ GOOD | Proper descriptive alt on all portfolio images |

**Critical gap**: 25+ icon-only buttons (close, delete, drag, tag, publish, trash, save reviews) are invisible to screen readers.

## 5. Animations Assessment

| Pattern | Score | Findings |
|---------|-------|----------|
| `spring as const` | ⚠️ | **No SPRING const defined** — Editor uses inline `{ type: 'spring', stiffness: 300, damping: 32 }` (project standard is 30). Page uses simple fade-in with no transition config. Grid items use delay only, no spring. |
| `AnimatePresence mode` | ❌ | `AnimatePresence` at PortfolioItemEditor.tsx:166 — **no `mode="popLayout"`** (violates Rule 4) |
| `transition-colors` + `transition-all` | ❌ | **16+ instances** of `transition-colors` + `transition-all` on same element — violates Rule 4 ban. Example: PortfolioItemEditor.tsx:194, 393, 410 |
| `active:scale` pattern | ✅ | Consistent `active:scale-[0.95]` or `active:scale-95` on all interactive elements |
| `group-hover:opacity-100` | ❌ | Drag handles + delete buttons use `opacity-0 group-hover:opacity-100` — invisible on touch devices (no hover) |
| CSS layout animation | ⚠️ | `transition-all` used broadly, may animate layout properties (gap, padding, margin) |
| Motion structure | ⚠️ | No shared transition constants; Editor has spring, Page has fade, grid has delay — three different animation languages on the same page |
| `hover:scale` | ✅ | Only on `hover:shadow-md` for cards; no transform scale on hover (correct) |

## 6. Systemics (Carry-Forward vs Previous Audits)

| Issue | Portfolio | Clients | Marketing | Settings |
|-------|-----------|---------|-----------|----------|
| Hardcoded hex | **6** ⭐ | 31 | 88 | — |
| `var(--btn-primary-bg)` | **0** ⭐ | 9 | — | — |
| Emoji violations | **0** ⭐ | 1 | 15 | — |
| `div→button` | **0** ⭐ | 1 | — | — |
| `type="button"` missing | **MANY** ❌ | 0 | — | 40/41 |
| `aria-label` count | **1** ❌ | 15 | — | 1 |
| Delete confirmation | **NONE** ❌ | confirm step | — | — |
| Duplicate form logic | **~100 lines** ⚠️ | — | — | — |
| `backdrop-blur` decorative | **5** | 9 | 11 | — |
| `role` attributes | **0** ❌ | 0 | — | — |
| SPRING const | **missing** ❌ | defined | defined | — |
| `AnimatePresence mode` | **missing** ❌ | missing | — | — |

## 7. Findings (Prioritized)

### P0 — Data Loss Risk
1. **Delete without confirmation** — `PortfolioItemEditor.tsx:150`, `PortfolioItemPage.tsx:186` — one click destroys item + photos
2. **Silent draft deletion on Back** — `PortfolioItemPage.tsx:129-138` — no "Are you sure?"

### P1 — Accessibility Blockers
3. **aria-label gap on 25+ icon buttons** — screen readers blind to close, delete, drag, publish, tag, trash actions
4. **aria-pressed = 0** — publish toggle, review selectors give no state to assistive tech
5. **role attributes = 0** — no `role="switch"`, `role="tablist"`, `role="radiogroup"`
6. **type="button" missing on ~15 buttons** — default to `type="submit"` when inside any form parent

### P2 — Quality & Maintainability
7. **6 hardcoded hex colors** — `#789A99`, `#C8B8B2`, `#EBD5CC`, `#E8D5CF` — theme-blind
8. **Duplicate form logic** — Editor + Page share ~100 lines of identical JSX
9. **`?draft=true` URL leakage** — param not stripped after save
10. **No character counters** — 120-char title, 1000-char description have no live feedback
11. **`AnimatePresence mode` missing** — `mode="popLayout"` required by Rule 4

### P3 — Polish
12. **Drag handles invisible on mobile** — `opacity-0 group-hover` with no touch fallback
13. **SSR flash in photo uploader** — `mounted` state toggle causes DnD re-mount
14. **No SPRING const** — inline damping=32 instead of project-constant damping=30
15. **`transition-colors` + `transition-all` co-located** — 16+ instances violating animation best practices

## 8. AI Slop Anchors

| Term | Location | Verdict |
|------|----------|---------|
| "Сторіз" | PortfolioPage.tsx:78 | Borrowed English "Stories" — acceptable in UA beauty context |
| `backdrop-blur` ×5 | Editor + buttons | Decorative but consistent with existing page patterns |
| `#789A99` button color | PortfolioPage.tsx:94,149 | Hardcoded accent color — breaks on Studio (teal) / Frost (lavender) |
| No glassmorphism | — | ✅ No blur-as-default on cards — only editor backdrop |
| No gradient text | — | ✅ Clean |
| No hero-metric | — | ✅ No SaaS cliché pattern |

## Summary

**Overall: 24/40 Heuristics + 14/20 Cognition + 15/20 Code Quality = 53/80**

Cleanest codebase audited so far — zero emoji, zero `div→button`, zero `var(--btn-primary-bg)`, only 6 hex colors. Server actions are well-structured with Zod + ownership verification. Draft lifecycle is well-designed.

But it has the **worst accessibility of any page** (1 `aria-label` across 5 components, zero roles, zero `aria-pressed`, missing `type="button"` on 60% of buttons). The **P0 delete issue** is a real data-loss vector. Animations are fragmented — three different patterns across Editor, Page, and Grid with no shared SPRING const.

**Phase 2 High-Impact B2B: COMPLETE** ✅ (clients + growth + portfolio)

**Next: Phase 3 — Admin Zone**
