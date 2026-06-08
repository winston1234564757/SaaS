# Audit: Growth Hub (`/dashboard/growth`)

> **Product:** BookIT — beauty/salon booking SaaS  
> **Audience:** Ukrainian beauty professionals (mobile-first, mid-session)  
> **Route:** `/dashboard/growth`  
> **Scope:** GrowthHubClient, LoyaltyPage (503 lines), ReferralPage (560 lines), PartnersPage (260 lines), page.tsx  
> **Audited:** Nov 6, 2026

---

## 1. Critique

### AI Slop Verdict

**Score: 2/10 (moderate slop, not catastrophic)**

| Pattern | Location | Verdict |
|---------|----------|---------|
| "Growth Hub" | `GrowthHubClient.tsx:91` | English management-speak. Should be "Розвиток" or "Зростання" |
| `Sparkles` icon | `ReferralPage.tsx:392` | Free month card — textbook AI "magic" indicator |
| "Bounty" term | `ReferralPage.tsx:276,544` | Gaming jargon from AI corpus, not salon culture |
| "Cartel" brand | `PartnersPage.tsx:74` | "Мережа партнерів (Cartel)" — edgy but culturally tone-deaf |
| Emoji in tours | `LoyaltyPage.tsx:230,262` | 🎁 and 🔒 in tour titles — inconsistent (Referral tour has none) |

**Verdict: Moderate slop.** The Ukrainian copy is human (Поділися лінком вище з майстрами-знайомими), but product naming carries AI residue.

### Heuristic Scores

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | **1** | Mutations have no `onError` — silent failures. Loading is text spinners, not skeletons. No toast/snackbar. |
| 2 | Match System / Real World | **2** | "Growth Hub", "Bounty", "Cartel" not user language. "Запас %" is financial jargon. |
| 3 | User Control and Freedom | **1** | No undo on toggles. PartnersPage uses native `confirm()` dialog. No retry on failed operations. |
| 4 | Consistency and Standards | **3** | Tour: Loyalty has emojis + 2 steps, Referral has none + 1 step, Partners has none. Tab vs inner segmented controls differ visually. |
| 5 | Error Prevention | **2** | Form validation on save. C2C discount allows typing >50 despite `max={50}`. No toggle confirmation. |
| 6 | Recognition vs Recall | **1** | ReferralPage shows 6+ percentage values simultaneously — cannot visually prioritize. |
| 7 | Flexibility and Efficiency | **1** | No keyboard tab switching. No bulk operations. Dynamic imports help performance. |
| 8 | Aesthetic and Minimalist | **2** | ReferralPage re-displays same percentages across 3 blocks. PartnersPage is clean. |
| 9 | Error Recovery | **1** | **Critical:** All 4 TanStack mutations in LoyaltyPage have NO `onError`. Referral code generation failure = permanent spinner. |
| 10 | Help and Documentation | **3** | Tour on first visit (3 steps total). Partners has "How it works". Info banners. Hard cap notice. |
| **Total** | | **17/40** | **Poor** |

### Cognitive Load

**ReferralPage is the problem.** 6 percentage values simultaneously:
1. `reservePct` — Discount Bank
2. `lifetimePct` — Lifetime Status
3. `totalPct`/`discountPct` — Invoice total
4. `newReservePct` — carry-over
5. Tier progress %
6. 4 tier chips (5%/10%/25%/50%)

User only needs: "How much do I pay?" and "How to get more discount?" — the intermediate math is over-exposed.

LoyaltyPage and PartnersPage: LOW cognitive load — clear CRUD, simple toggles.

---

## 2. Animation Audit

| Component | Animation | Quality |
|-----------|-----------|---------|
| GrowthHubClient tab | `layoutId="growth-active-tab"` spring | Good — 0.35s, bounce:0 |
| Tab content | `AnimatePresence` y slide (12px) | Good — direction-aware |
| ReferralPage stats/block | Staggered spring entrance (delay: 0.05/0.08/0.1) | Good |
| ReferralPage progress bars | `motion.div width` animation | Good — 0.8s easeOut |
| LoyaltyPage program list | Staggered spring entrance (4ms per item) | Good |
| ProgramForm | Height slide + fade | Good |
| PartnersPage partner cards | `motion.div layout` = scale reveal | Good |

**Issues:**
1. **ProgramForm exit animation** (`LoyaltyPage.tsx:48`): Exit uses same direction as entrance (`y: 8`). Should reverse direction for exit.
2. **No loading skeletons** — All 3 pages use text spinners instead of skeleton layouts.

---

## 3. Polish & Accessibility

### DIV→BUTTON: PASS (structural)

All interactive elements use `<button>`. No `<div>` with `onClick`. ✓

### type="button": CRITICAL FAIL

| Finding | Count |
|---------|-------|
| `<button>` elements across all 4 files | ~20+ |
| Buttons with `type="button"` | **0** |
| Buttons missing `type="button"` | **All** |

**Same systemic issue as Settings page.** All `onClick` buttons default to `type="submit"`.

### ARIA: FAIL

| Attribute | Count |
|-----------|-------|
| `role="switch"` | 0 |
| `aria-checked` | 0 |
| `aria-label` | 0 |
| `role="tablist"` | 0 |
| `role="tab"` | 0 |
| `aria-selected` | 0 |
| `aria-disabled` | 2 (LoyaltyPage) |
| `role="tabpanel"` | 0 |

**Toggle switches are invisible to screen readers** — LoyaltyPage program active toggle + C2C enable toggle use `<button>` with no semantic role.

**Tab switcher has no ARIA** — GrowthHubClient pill switcher is `<div>` with `<button>` children, no `role="tablist"` or `aria-selected`.

### Touch Targets

- Stat cards: 44px+ ✓
- Tab buttons: `py-2.5` ≈ 36px — borderline
- Toggle switches: ~24px — **FAIL** (< 44px)
- Share/copy buttons: `py-3.5` ≈ 56px ✓
- Delete button: `size-9` = 36px — borderlines
- Delete in PartnerPage: `size-9` = 36px — borderline

---

## 4. Layout Audit

### Structure
- GrowthHubClient: flex column with header + tab switcher + content
- LoyaltyPage: stacked bento cards (info → add → list → C2C section)
- ReferralPage: header → referral link → stats row → tab switcher → content blocks
- PartnersPage: hero header → partner list grid → alliances → instructions

All use `bento-card` pattern — consistent with rest of app.

### Issues
1. **ReferralPage scroll length**: 560 lines, 6+ data blocks on the overview tab. On mobile (375px), user scrolls through Discount Bank → Lifetime Status → Next Invoice before reaching actionable info.
2. **Stat row on mobile (3 columns)**: `grid-cols-3` on 375px with stat text labels — tight layout, text may wrap.
3. **PartnersPage hero gradient**: `bg-primary` full-width header with `text-primary-foreground` — high contrast, good. But the "Cartel" brand takes visual focus from the actual partner list.

---

## 5. Color & Themes

### Hardcoded Colors: 2 total

| File | Value | Location |
|------|-------|----------|
| LoyaltyPage | `#A8928D` | Input placeholder (line 58) |
| LoyaltyPage | `#a84a4a` | Delete confirm button hover (line 362) |

Very low — growth pages are mostly theme-compliant.

### Gradients: 2

| File | Location | Type |
|------|----------|------|
| ReferralPage:344 | Tier progress bar | `bg-gradient-to-r from-primary to-primary/80` |
| ReferralPage:443 | Free month progress bar | `bg-gradient-to-r from-primary to-success/80` |

Both are functional (progress bar fills), not decorative. Acceptable.

### Emoji: 2

| File | Line | Content |
|------|------|---------|
| LoyaltyPage:230 | Tour title | 🎁 — inconsistent with Referral tour |
| LoyaltyPage:262 | Tour title | 🔒 — stretch for "retention" concept |

---

## 6. Microcopy

### What's Good
- "Запорука якісної роботи — якісний відпочинок" — warm, human
- "Клієнт ніколи не піде до іншого майстра, якщо у вас на нього чекають накопичені бонуси" — compelling
- All operation labels in Ukrainian (Створити, Зберегти, Скасувати, Видалити)
- Partners instructions: clear, structured, useful

### What Needs Work
- "Growth Hub" → "Розвиток" or "Зростання"
- "Банк знижок" → "Накопичена знижка" (less metaphorical)
- "Bounty" → "Бонус" or "Нагорода"
- "Cartel" — consider removing; "Партнерська мережа" is clear enough
- "Запас %" → "% знижки" — more descriptive

---

## 7. Performance & Optimization

### What's Healthy
- Dynamic imports for all 3 tabs (`next/dynamic` with `ssr: false`)
- Parallel server-side data fetching with `Promise.all`
- TanStack Query with caching (`staleTime: 60_000`)
- `keepPreviousData` on loyalty programs query

### What's Not
- Referral code generation in raw `useEffect` with no TanStack Query — no retry, no caching, no error boundary
- `navigator.share` failure silently caught with empty `catch {}` — swallowed exception
- All mutations have `onSuccess` but **none have `onError`** — divergent UI/DB state on failure

---

## 8. Interaction Audit

### Primary Actions
| Action | Feedback | Issues |
|--------|----------|--------|
| Create loyalty program | Optimistic list update | No error feedback |
| Toggle program active | Spring switch animation | No error feedback, no aria |
| Delete program | 2-step confirm (AnimatePresence) | No error feedback |
| Copy referral link | Check icon + "Скопійовано!" (2s) | Good |
| Share referral | Web Share API → fallback copy | Empty catch on failure |
| Remove partner | Native confirm() → server action | Breaks app design language |
| Toggle alliance visibility | Optimistic toggle | No error feedback |

### Missing
- No loading skeletons (text spinners only)
- No toast/snackbar for mutation results
- No retry mechanism on failed operations
- No keyboard navigation for tabs

---

## 9. Priority Issues

### P0 — Silent Mutation Failures (LoyaltyPage:172-217)
- All 4 TanStack mutations have `onSuccess` but zero `onError` handlers
- **Fix:** Add `onError` to every mutation, surface via toast

### P0 — Referral Code Generation Failure = Permanent Spinner (ReferralPage:75-82)
- `getOrGenerateReferralCode` in raw `useEffect` — failure never resolves `loading`
- **Fix:** Use TanStack Query with retry + error boundary, or add error state + retry button

### P1 — Custom Toggles Inaccessible (LoyaltyPage:386-397, 416-426)
- `<button>` toggles with no `role="switch"`, `aria-checked`, or `aria-label`
- **Fix:** Add `role="switch"` + `aria-checked` + `aria-label`

### P1 — Tab Switcher No ARIA (GrowthHubClient:96-123)
- No `role="tablist"`, `role="tab"`, `aria-selected`, `role="tabpanel"`
- **Fix:** Add full ARIA tab pattern

### P1 — All Buttons Missing `type="button"`
- Zero `type="button"` across all 4 files
- **Fix:** Add `type="button"` to all `<button>` elements

### P2 — ReferralPage Cognitive Overload (6 percentage values)
- reservePct, lifetimePct, totalPct, newReservePct, tierProgress, tier chips — all visible at once
- Same numbers repeated across Discount Bank, Lifetime Status, Next Invoice blocks
- **Fix:** Collapse intermediate math into expandable sections. Show only "Your discount: X%" + "Next payment: Y UAH" as primary.

### P2 — "Growth Hub" English Name
- Not user language for Ukrainian beauty professionals
- **Fix:** Rename to "Розвиток"

### P3 — Native confirm() in PartnersPage
- `confirm('Видалити майстра з мережі партнерів?')` breaks app's Vaul Drawer design language
- **Fix:** Use inline confirmation (similar to LoyaltyPage's AnimatePresence pattern)

---

## 10. Summary

| Metric | Score |
|--------|-------|
| Heuristic Total | 17/40 (Poor) |
| Cognitive Load | ReferralPage HIGH, others LOW |
| AI Slop | Moderate (2/10) — "Growth Hub", "Bounty", "Cartel" |
| Hardcoded Hex | 2 values |
| Gradients | 2 (both functional progress bars) |
| Emoji | 2 (tour titles) |
| type="button" | **0 / ~20+ buttons** — CRITICAL |
| aria-label | 0 |
| role="switch" | 0 |
| role="tablist" | 0 |
| Mutation error handling | 0/4 mutations have onError |
| Loading States | Text spinners only — no skeletons |
| Tour Coverate | Loyalty (2 steps) + Referral (1 step) + Partners (none) |
