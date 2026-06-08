# Audit Report: `/dashboard/clients`

> Date: 2026-05-31 · Auditor: impeccable (v8.3.0)
> Files: ClientsPage.tsx (1060 lines), ClientDetailSheet.tsx (482), ClientWidgets.tsx (552), SegmentBuilder.tsx (662), actions.ts (178), page.tsx (8)
> Total: ~2,762 lines · 56KB+ source

---

## Heuristics: 24/40 (Weak)

| # | Heuristic | Score | Key Issues |
|---|-----------|-------|------------|
| 1 | Visibility of status | 3/4 | Filter/search applies instantly with no debounce/loading; no feedback while segment match count re-calculates |
| 2 | Real-world match | 2/4 | "Safety & Health", "Ambassador", "Vibe" — English terms mixed into Ukrainian UI; Telegram deep link format is incorrect |
| 3 | User control & freedom | 3/4 | FAB dismiss is permanent per session (no restore); no undo for VIP toggle or archive; no way to navigate back from detail sheet |
| 4 | Consistency & standards | 2/4 | Hardcoded hex retention colors ignore all 3 themes; script font heading violates design system; 4 radius levels with no hierarchy |
| 5 | Error prevention | 3/4 | VIP toggle is one-click irreversible; no validation before smart action opens Telegram; vibe tags look saved but aren't |
| 6 | Recognition vs recall | 3/4 | ClientIconStack icons have no tooltips or meaning; 4-layer filter requires user to remember stacking state |
| 7 | Flexibility & efficiency | 2/4 | List actions hidden under hover (invisible on mobile); no bulk select; no keyboard shortcuts for CRM power users |
| 8 | Aesthetic & minimalism | 2/4 | Overlapping icon badges create visual noise; script heading fights the editorial register; swipe gesture is completely undiscoverable |
| 9 | Error recovery | 2/4 | Generic error messages ("Не вдалося зберегти нотатку"); no retry mechanism; console.error silently swallows failures |
| 10 | Help & documentation | 2/4 | No explanation of retention calculation; no tooltips on icon badges; no FAQ or help link for CRM features |

## Cognition: 13/20 (MODERATE)

Load factors: 4-layer filtering (search → retention → smart → custom segment) with stacking interactions; hidden hover actions require spatial memory; overlapping icon badges on grid cards require decoding; AND/OR logic in SegmentBuilder is non-trivial for non-technical users; swipe gesture on sidebar widget has zero affordance; ephemeral vibe tags look identical to persistent data.

## Code Quality: 14/20 (Fair)

### Strengths
- All buttons (`<button>`) include `type="button"` correctly (systemic issue from Settings/Growth audits is NOT present here)
- `aria-pressed` used consistently on 12 toggle buttons (retention filters, view toggle, segment chips, icon/color selectors)
- `aria-label` on 15 icon-only buttons (note, call, message, smart-action, delete condition, icon picker)
- Spring animations consistent with SPRING const throughout
- useMemo properly scopes filter computation
- segment evaluator is well-tested pure logic (no side effects)
- No glassmorphism as default (backdrop-blur is used on cards, not floating elements)
- No div→button violations (only 1 valid `<div onClick>` — click-away overlay)
- No `<img>` without alt (no images at all — appropriate)
- No gradient text (1 gradient background on LTV card is acceptable)

### Weaknesses
- **55 buttons × 0 `role` attributes** — no `role="switch"` on toggle buttons, no `role="tablist"` on filter groups
- **31 hardcoded hex colors** — `#5C9E7A`, `#789A99`, `#D4935A`, `#C05B5B` appear across all files; cannot adapt to 3 themes
- **9 `var(--btn-primary-bg)` instances** — custom token outlier continues from earlier audits
- **1 emoji violation** — `👋` in `actions.ts:52` Telegram churn reminder
- **1 font violation** — `var(--font-great-vibes, cursive)` at 60-100px instead of Cormorant Garamond
- **Mock data** — referral modal has hardcoded names (`ClientWidgets.tsx:326-328`)
- **Broken Telegram deep link** — `https://t.me/+${phone}` format is incorrect
- **0 `useMutation`** — uses `startTransition` + manual `invalidateQueries` instead; no `onError` handler
- **No search debounce** — filters on every keystroke for large client lists
- **No AnimatePresence `mode`** — some `AnimatePresence` instances lack `mode="popLayout"`

### Accessuality Assessment

| Criterion | Score | Notes |
|-----------|-------|-------|
| type="button" | ✅ PASS | All buttons have it (unlike Settings/Growth — systemic issue fixed here) |
| aria-pressed | ✅ GOOD | 12 toggle buttons with proper pressed state |
| aria-label | ⚠️ FAIR | 15 labels, but gap on stat cards, bar segments, icon stack items |
| role attributes | ❌ POOR | 0 roles — no switch, tab, tablist, or region landmarks |
| Touch targets ≥44px | ⚠️ FAIR | Action buttons pass, but inline note textarea, sort dropdown items, stat values are <44px |
| div onClick | ✅ PASS | Only click-away overlay (acceptable pattern) |
| Keyboard navigation | ❌ POOR | Custom select, dropdown, swipe widget — no keyboard handling |

---

## AI Slop Anchors

| Term | Location | Assessment |
|------|----------|------------|
| "Smart-дія" | ClientsPage.tsx:987 | Accepatble — translates "Smart Action" directly |
| "Vibe-мiтки" | ClientDetailSheet.tsx:292 | Mixed EN/UK — "Вайб-мітки" would be better |
| "Cleanup Wizard" | ClientWidgets.tsx:240 | English term in Ukrainian CRM — inconsistency |
| "Ambassador" | ClientDetailSheet.tsx:144 | English term for VIP referral concept |
| `var(--font-great-vibes)` | ClientsPage.tsx:305 | Script font is outside the design system |
| Gradient card (LTV) | ClientDetailSheet.tsx:268 | Single gradient-to-br — acceptable for special section |
| backdrop-blur × 9 | All files | Used on card surfaces — decorative but consistent with existing patterns |

---

## Systemic Issues (Carry-Forward)

| ID | Severity | Issue | Location | Details |
|----|----------|-------|----------|---------|
| CLIENTS-01 | P1 | Hex retention colors | RETENTION_CONFIG, getAutoTags, empty state, templates | 31 hex codes — `#5C9E7A`, `#789A99`, `#D4935A`, `#C05B5B` repeated everywhere |
| CLIENTS-02 | P1 | Script font violation | ClientsPage.tsx:305 | Great Vibes instead of Cormorant Garamond for heading |
| CLIENTS-03 | P2 | Emoji in action | actions.ts:52 | `👋` in churn reminder message |
| CLIENTS-04 | P2 | Hover-locked actions | ClientsPage.tsx:868 | `group-hover:opacity-100` — mobile users can't access list actions |
| CLIENTS-05 | P2 | Mock referral data | ClientWidgets.tsx:326-328 | Hardcoded names/revenue — no backend integration |
| CLIENTS-06 | P2 | Broken Telegram link | ClientsPage.tsx:1020 | `t.me/+${phone}` is not valid |
| CLIENTS-07 | P2 | var(--btn-primary-bg) | 9 occurrences | Custom token not in theme spec; continues from previous audits |
| CLIENTS-08 | P2 | Vibe tags are ephemeral | ClientDetailSheet.tsx:297-322 | Local state, no save, looks identical to persistent data |
| CLIENTS-09 | P2 | No AnimatePresence mode | ClientWidgets.tsx:187 | `mode` prop missing (should be `popLayout`) |
| CLIENTS-10 | P2 | No search debounce | ClientsPage.tsx:467-473 | Re-computes filtered list on every keystroke |
| CLIENTS-11 | P2 | No role attributes | All files | 0 role="switch", role="tab", role="tablist" — screen reader gaps |
| CLIENTS-12 | P3 | backdrop-blur decorative | 9 instances | Consistent with other pages but overused as default surface treatment |
| CLIENTS-13 | P3 | No mutation error handling | All | Uses startTransition + invalidateQueries — no explicit onError for DB failures |
| CLIENTS-14 | P3 | Radius hierarchy missing | All | rounded-lg / xl / 2xl / 3xl used arbitrarily with no system |
| CLIENTS-15 | P3 | "Зрозумів" button copy | ClientWidgets.tsx:382,531 | Informal — "Закрити" is standard |

---

## Fixed Issues vs Systemic

| Systemic Issue (from audit-plan.md) | Status in Clients | Notes |
|-------------------------------------|-------------------|-------|
| var(--surface) ≈ var(--background) | ⚠️ PRESENT | Cards blend in Studio/Frost as expected |
| div→button | ✅ FIXED | Only 1 click-away overlay (acceptable) |
| Hardcoded hex colors | ❌ PRESENT | 31 instances — worst of all audited pages |
| Emoji violations | ✅ SOME | 1 emoji found (actions.ts) — much better than Marketing(15) |
| Missing type="button" | ✅ FIXED | All buttons have it — Setting's 40/41 issue resolved |
| aria-label gap | ⚠️ MODERATE | 15 labels — better than Settings(1) but 0 roles |
| var(--btn-primary-bg) outlier | ❌ PRESENT | 9 instances |

---

## Summary

**Overall Score: 24/40 Heuristics + 13/20 Cognition + 14/20 Code Quality = 51/80**

The Clients section is the most feature-complete CRM in BookIT. Its primary weakness is **theme-system isolation** — 31 hardcoded hex colors make the entire module blind to the 3-theme system. The retention color palette (`#5C9E7A` / `#789A99` / `#D4935A` / `#C05B5B`) is hardcoded as JS constants in RETENTION_CONFIG, duplicated in getAutoTags, SegmentBuilder templates, and empty state cards.

Secondary concerns: script font heading violates the editorial register, hover-locked actions exclude mobile users, and the Telegram deep link is broken.

**Strong points**: comprehensive `aria-pressed` coverage, all buttons properly typed, consistent spring animation, well-structured filter logic with useMemo, and thorough segment builder with live match counting.

### Action Items (Priority Order)

1. **P1** Refactor RETENTION_CONFIG to use CSS `var()` tokens instead of hardcoded hex
2. **P1** Replace `font-great-vibes` with Cormorant Garamond for `font-display`
3. **P2** Fix Telegram deep link format (`tg://resolve?phone=...` or correct `t.me` format)
4. **P2** Add `role` attributes to toggle groups (retention filters as `role="radiogroup"`, segment chips)
5. **P2** Replace mock referral data with real query or remove the section
6. **P2** Add keyboard handling for custom select and swipe gesture
7. **P3** Remove `👋` emoji from churn reminder message
8. **P3` Add `mode="popLayout"` to remaining AnimatePresence instances
9. **P3** Add search debounce for large client lists (>500)
10. **P3** Standardize button radius hierarchy (pill actions → rounded-xl, cards → rounded-3xl)
