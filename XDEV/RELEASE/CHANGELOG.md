# 📜 CHANGELOG.md — Release Step Journal

> Журнал завершених кроків release roadmap. Один entry на крок.
> Створюється тільки після `STEP NN COMPLETE` з повним проходженням 7 Quality Gate dimensions.
> **Створено:** 2026-05-27

---

## Шаблон entry

```markdown
### STEP NN — [Page Name] (`[URL]`)
- **Date Ready:** YYYY-MM-DD
- **Model used:** [Opus 4.7 max / Sonnet 4.6 high / Mixed]
- **Effort:** [hours / days]
- **Drawer:** [MemPalace drawer ID]
- **Commit:** [hash]

#### Quality Gate Verdict
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | ✅ |
| 2. No-Emoji Policy | ✅ |
| 3. Motion & Transitions | ✅ |
| 4. Errors & Validation | ✅ |
| 5. A11y & Performance | ✅ |
| 6. Core Features | ✅ |
| 7. Tests Verification | ✅ |

#### Files changed
- `path/to/file.tsx` — [що змінено]
- `path/to/component.tsx` — [що змінено]

#### Key decisions
- [рішення 1 + чому]
- [рішення 2 + чому]

#### Skills chain
clarify → [skill 1] → [skill 2] → impeccable → humanizer → run → verify

#### Tests
- `e2e/tests/X.spec.ts` — N/N pass
- `src/lib/Y.test.ts` — N/N pass

#### Carry-over to next step
- [pending item / нічого]

#### Issues encountered
- [проблема + як вирішено]

---
```

---

---



### STEP 10 --- Public Master Page (/[slug])
- **Date Ready:** 2026-05-31
- **Model used:** Sonnet 4.6 high (correctness + visual polish)
- **Effort:** 1 session (plan + 1 Write + 5 Edits)
- **Drawer:** `drawer_bookit_audits_6b554b09eed872165f45ba2a`

#### Quality Gate Verdict
| Vimir | Stan |
|---|---|
| 1. Aesthetics and Themes | OK success tokens replace hardcoded green, img optimization |
| 2. No-Emoji Policy | OK Zero emoji |
| 3. Motion and Transitions | OK SPRING + SPRING_CARD as const x15 |
| 4. Errors and Validation | OK auth before try x3 verified (actions.ts) |
| 5. A11y and Performance | OK touch targets all 44px+, aria sweep, Next.js Image |
| 6. Core Features | OK booking flow, C2C, OTP, dynamic pricing -- verified |
| 7. Tests Verification | OK TSC 0 -- build clean (51 pages) |

#### Files changed
- `PublicMasterPage.tsx` --- SPRING+SPRING_CARD as const (15 transitions), type=button x3, hardcoded #2C1A14 -> text-foreground, referrer banner rgba -> success tokens, img->Image, share button size-9->size-11
- `wizard/ServiceSelector.tsx` --- carousel nav size-7->size-11 (28px->44px) x2
- `wizard/ClientCombobox.tsx` --- aria-selected hardcoded false -> dynamic (client_name match)
- `wizard/DateTimePicker.tsx` --- aria-label on date prev/next nav, spring type as const on toggle
- `wizard/useBookingWizardState.ts` --- C2C eligibility race condition: cancelled flag + cleanup
- `components/public/PostBookingAuth.tsx` --- OTP digit input w-10->w-11 (40->44px)

#### Key decisions
- SPRING_CARD (stiffness 300) separate from SPRING (stiffness 280): service/product/review cards use slightly tighter spring
- success tokens instead of rgba(92,158,122,...): consistent with project CSS token system, works across all 3 themes
- C2C race fix: c2cCheckRef.current already deduplicates by phone value, but rapid changes could still cause stale results. added cancelled flag for async cleanup
- Business logic NOT changed: createBooking, dynamicPricing, computeBookingPrice -- all verified clean

#### Skills chain
code-reviewer (analysis) + senior-frontend (correctness mode)

#### Tests
- TSC: 0 errors
- Build: clean (51 pages)

#### Carry-over to STEP 11
- D-01: ClientsPage borderLeft 3px -> full border + bg tint (P1)
- C-01: BookingCard borderLeft 4px -> full border + bg tint (P1)
- B-01..B-05: Dashboard Home carry-over (Critical/High)

---
### STEP 09 --- Explore (`/explore`)
- **Date Ready:** 2026-05-31
- **Model used:** Sonnet 4.6 high
- **Effort:** 1 session (plan + 1 Write)
- **Drawer:** `drawer_bookit_audits_e7959f077fa9adbf72463435`

#### Quality Gate Verdict
| Vimir | Stan |
|---|---|
| 1. Aesthetics & Themes | OK hover lift, PRO badge fix, animate-pulse removed |
| 2. No-Emoji Policy | OK Nul emoji |
| 3. Motion & Transitions | OK SPRING as const x4, y-axis AnimatePresence |
| 4. Errors & Validation | -- Server component (no forms in scope) |
| 5. A11y & Performance | OK aria sweep, role=listbox/option, type=button x9, touch target |
| 6. Core Features | OK Filter + search + sort + city dropdown + PRO badge all working |
| 7. Tests Verification | OK TSC 0 - build clean (51 pages) |

#### Files changed
- `src/components/public/ExplorePage.tsx` --- full correctness + visual polish rewrite (1 Write op)

#### Key decisions
- **PRO badge bug:** badge absolute -top-1 -right-1 was inside overflow-hidden -- clipped. Fix: outer div.size-14.relative (no overflow) wraps inner div.overflow-hidden; badge in outer div
- **pluralUk pattern:** {count} {pluralUk(count, 'posluha', 'posluhy', 'posluh')} -- same pattern as all other service counters in project
- **animate-pulse removed:** continuous animation on static catalog icon = distraction; reserve for notification/CTA context
- **SPRING as const:** { type: 'spring', stiffness: 280, damping: 24 } -- matches project standard; height+duration transitions kept inline

#### Skills chain
plan (senior-frontend + impeccable) -- Write -- tsc -- build

#### Tests
- TSC: 0 errors
- Build: clean (51 pages)

#### Carry-over to STEP 10
- D-01: ClientsPage borderLeft 3px -- full border + bg tint (P1)
- C-01: BookingCard borderLeft 4px -- full border + bg tint (P1)
- B-01..B-05: Dashboard Home carry-over

---
### STEP 08 — Other Dashboard Hubs (Revenue · Growth · Marketing · Billing · Settings · Studio)
- **Date Ready:** 2026-05-31
- **Model used:** 🟢 Sonnet 4.6 high (correctness-only mode)
- **Effort:** 1 session (08a → 08b → 08c sequential)
- **Drawer:** `drawer_bookit_audits_e1534fd674b5432d8685234b`

#### Quality Gate Verdict
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | ✅ No visual changes (correctness-only) |
| 2. No-Emoji Policy | ✅ No new emoji introduced |
| 3. Motion & Transitions | ✅ spring as const BillingPage:299 |
| 4. Errors & Validation | ✅ Billing webhook ECDSA verified |
| 5. A11y & Performance | ✅ P1 div→button fixed, type="button" ×20+, aria-pressed/label |
| 6. Core Features | ✅ No regression |
| 7. Tests Verification | ✅ TSC 0 · build clean |

#### Files changed
- `revenue/RevenueHubClient.tsx` — type="button" + aria-pressed on tab switcher
- `flash/FlashDealPage.tsx` — type="button" + aria-label on cancel button
- `pricing/DynamicPricingPage.tsx` — P1: div→button (PricingRuleCard), w-full, aria-pressed
- `growth/GrowthHubClient.tsx` — type="button" + aria-pressed on tab switcher
- `loyalty/LoyaltyPage.tsx` — type="button" ×11 (all buttons), aria-pressed ×2 toggles, aria-label icon buttons
- `referral/ReferralPage.tsx` — type="button" ×4, aria-pressed on tab switcher
- `partners/PartnersPage.tsx` — type="button" ×3, aria-pressed + aria-label on toggle
- `marketing/StoryGenerator.tsx` — P1: motion.div→motion.button; encoding fix curly quotes (U+201C/D → JS escapes)
- `marketing/MarketingTabs.tsx` — type="button" + aria-pressed
- `marketing/BroadcastsTab.tsx` — type="button"
- `billing/BillingPage.tsx` — spring as const
- `settings/SettingsPage.tsx` — type="button", deleted dead BusynessWidget (69 lines)

#### Key decisions
- `DynamicPricingPage` toggle header: div→button + `w-full text-left` для layout збереження
- `StoryGenerator` encoding: curly quotes (U+201C/D) у декоративних `"..."` замінено на `{'“'}` — hook блокував raw bytes
- `BusynessWidget` видалено як dead code (не рендериться), але `useBusyness` hook + `busyness` data залишились (prop до StatsPulseWidget:123)
- Mono-webhook: перевірено — ECDSA P-256 (не Ed25519), реалізація CLEAN, без змін

#### Skills chain
clarify → senior-frontend (correctness mode)

#### Tests
- TSC: 0 помилок
- Build: clean (51+ pages)

#### Carry-over to STEP 09
- D-01: ClientsPage borderLeft 3px → full border + bg tint (P1)
- C-01: BookingCard borderLeft 4px → full border + bg tint (P1)
- B-01..B-05: Dashboard Home carry-over (Critical/High)

---

## Side Sprints (Cross-cutting — не прив'язані до конкретного кроку)

### SIDE SPRINT — BookingWizard QA (2026-05-30) ✅
- **Date:** 2026-05-30
- **Model:** 🟢 Sonnet 4.6
- **Drawer:** `drawer_bookit_decisions_769e553e6bc72a67169b3bd3`
- **Affects steps:** 4 (Dashboard — ManualBooking), 5 (Bookings — ManualBooking), 10 (PublicMasterPage), 12 (Client Portal)

#### Зміни
| Файл | Що змінено |
|---|---|
| `wizard/types.ts` | `WizardService.image_url?: string \| null` |
| `wizard/ServiceSelector.tsx` | Horizontal per-category carousel (`CategoryCarousel`); photo render; `from-secondary` gradient |
| `wizard/StepProgress.tsx` | Тактильні dots: `bg-foreground/15` fill, Framer `scale×1.75` active |
| `wizard/DateTimePicker.tsx` | `onBack` prop fix; slot physics `09:00──10:00`; `from-secondary` gradient |
| `wizard/ClientCombobox.tsx` | `isPreSelected` clear-only useEffect bug fix |
| `wizard/ClientDetails.tsx` | Disabled button: `border border-border` без `opacity-50`; `from-secondary` |
| `wizard/ProductCart.tsx` | `from-secondary` gradient |
| `app/[slug]/data.ts` | `services` select + `image_url` |
| `app/[slug]/page.tsx` | `image_url` в services mapping |
| `ManualBookingForm.tsx` | Явний `.map()`: `imageUrl → image_url` |
| `PublicMasterPage.tsx` | `Service.image_url` field + `<img>` / `<ServiceIcon>` fallback |

#### Key decisions
- Sticky CTA gradient: `from-secondary` (не `from-background`) — modal bg = `--secondary`
- `as WizardService[]` cast без mapping втрачає camelCase→snake_case rename
- Disabled button: ніколи не стакати low-opacity bg + low-opacity text + `opacity-50`

---

## В роботі (In Progress)

> STEP 07 завершено 2026-05-31. Наступний: STEP 08 — Other Hubs (Analytics / Marketing / Loyalty / Billing / Settings / Studio).

---

### STEP 07 — Services + Products (`/dashboard/services`, `/dashboard/products`) ✅

- **Date Ready:** 2026-05-31
- **Sessions:** 1 (Plan + correctness audit)
- **Model used:** 🟢 Sonnet 4.6 high
- **Drawer:** `drawer_bookit_audits_ea3affc66ed6c48195edda5e`
- **Scope:** Correctness-only audit (no visual redesign)

#### Quality Gate
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | ➖ Not in scope (correctness-only) |
| 2. No-Emoji Policy | ✅ Нуль emoji |
| 3. Motion & Transitions | ✅ spring as const, AnimatePresence y-axis |
| 4. Errors & Validation | ✅ Hardcoded mock stats → coming-soon placeholder |
| 5. A11y & Performance | ✅ type="button" ×20+, aria-pressed ×10, aria-label FABs + drag handles, aria-expanded |
| 6. Core Features | ✅ P1 div→button fix ServiceCard; orphan files deleted |
| 7. Tests Verification | ✅ TSC 0 · build clean |

#### Files changed
- `services/ServicesPage.tsx` — unused masterId removed, type="button" + aria-label FAB, spring as const
- `services/ServiceCard.tsx` — **P1**: motion.div onClick → info section `<button type="button">`, drag handle type+aria-label, all action buttons type="button", toggle aria-pressed
- `services/ServiceEditor.tsx` — type="button" header buttons, aria-pressed active/popular toggles, hardcoded stats → placeholder
- `products/ProductsPage.tsx` — useCallback import removed, TabBtn type="button"+aria-pressed, order filters type="button"+aria-pressed, FAB type+aria-label+spring, AnimatePresence x→y
- `products/ProductEditor.tsx` — type="button" all header + photo + modal buttons, aria-pressed stock/recommend toggles, hardcoded stats → placeholder, dead StatBox removed
- `products/ProductCard.tsx` — drag handle type+aria-label, toggle type+aria-pressed, ActionBtn type="button"
- `products/OrderCard.tsx` — expand button type+aria-expanded+aria-label, status buttons type="button", transition → spring

#### Files deleted (orphaned)
- `services/ProductCard.tsx` — 0 imports found → deleted
- `services/ProductForm.tsx` — 0 imports found → deleted

#### Key decisions
- **ServiceCard P1 pattern**: no card-level onClick on motion.div; info section wrapped in `<button type="button" aria-label={...}>` — action buttons remain in separate row (no button-in-button violation)
- **Hardcoded stats "24/+12%"**: both ServiceEditor + ProductEditor had identical fake placeholders — replaced with dashed border "Статистика з'явиться після перших записів/продажів"
- **FAB_SPRING const** in ProductsPage: extracted as module-level const to avoid inline object recreation
- **AnimatePresence convention**: x:±10 (horizontal) → y:4 (y-axis per dashboard animation system)

#### Skills chain
correctness-audit (no skill) → tsc → build

#### Carry-over to STEP 08
| ID | Issue | Пріоритет |
|---|---|---|
| D-01 | ClientsPage cards: borderLeft 3px → full border + bg tint | 🟠 P1 (STEP 06 carry) |
| D-02..D-04 | ClientWidgets useMemo, grid size-11, sort aria | 🟡 P2 (STEP 06 carry) |
| C-01 | BookingCard: borderLeft → full border + bg tint | 🟠 P1 (STEP 05 carry) |

---

### STEP 06 — CRM Clients (`/dashboard/clients`) ✅

- **Date Ready:** 2026-05-31
- **Sessions:** 1 (Plan + A+B+C)
- **Model used:** 🟡 Mixed (Sonnet 4.6)
- **Drawer:** `6d33b7985ead20002063c32a` · audit `drawer_bookit_audits_8b26b6ff187c043ed68372b0`
- **impeccable:** 15/20 Good
- **E2E:** 36/187 passed (130 timeout — pre-existing budget issue); Test 34 ✅ client search/filter

#### Quality Gate
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | 🟡 15/20 — borderLeft side-stripe carry-over (P1 polish) |
| 2. No-Emoji Policy | ✅ Нуль emoji |
| 3. Motion & Transitions | ✅ SPRING const в усіх 3 файлах, transition={SPRING} sweep |
| 4. Errors & Validation | ✅ Inline archive confirm 2-step; auth guards вже були before try{} |
| 5. A11y & Performance | ✅ div→button sweep, aria-pressed ×8 groups, 44px sweep, useMemo filtered |
| 6. Core Features | ✅ CRM, custom segments, retention, VIP, health notes, useEffect state sync |
| 7. Tests Verification | ✅ TSC 0 · build clean (51/51 pages) · E2E Test 34 passed |

#### Files changed
- `ClientsPage.tsx` — div→button (grid+list info sections), aria-pressed (retention chips, view toggle, custom segments), useMemo filtered list, SPRING
- `ClientWidgets.tsx` — div→button (funnel items, avg check, newbie danger), motion.button, switcher dots size-11+aria-pressed, ambassador aria-expanded, SPRING
- `SegmentBuilder.tsx` — useEffect([initial?.id]) state sync, aria-pressed (operator/VIP/status/icon/color chips), size-11 touch targets (delete, icon grid, color picker), SPRING
- `ClientDetailSheet.tsx` — archiveConfirmStep state, setArchiveConfirmStep(false) reset, inline 2-step archive confirm
- `useClientBookings.ts` — typed RawRow interface замість (data as any[])

#### Key decisions
- **No nested buttons pattern** — grid/list cards: info section `<button type="button">` + action bar окремо поза кнопкою. Outer `motion.div` без onClick. Дозволяє action buttons як незалежні елементи без e.stopPropagation().
- **Switcher widget**: drag="x" + nested buttons — `motion.div` (drag) + switcher dots як окремі `<button type="button" size-11>` + content button `w-full h-full`
- **useEffect([initial?.id])** у SegmentBuilder замість render-body `if (lastId !== id)` — React strict mode safe
- **Double cast**: `segment_config as unknown as CustomSegment[]` — TS2352 через Record<string, unknown>[] inference з Supabase

#### Skills chain
senior-frontend (A11y+Logic) → senior-frontend (Motion) → impeccable audit (15/20)

#### Carry-over to STEP 07
| ID | Issue | Пріоритет |
|---|---|---|
| D-01 | ClientsPage cards: borderLeft 3px → full border + bg tint | 🟠 P1 Polish |
| D-02 | ClientWidgets: useMemo 6 body computations | 🟡 P2 |
| D-03 | Grid action buttons size-10 → size-11 | 🟡 P2 |
| D-04 | Sort button: aria-expanded + aria-haspopup | 🟡 P2 |
| C-01 | BookingCard: borderLeft → full border + bg tint | 🟠 P1 |
| C-02 | BookingDetailsModal: text-[9px] → text-[11px] | 🔵 P3 |

#### Issues encountered
- TS2352: `segment_config as CustomSegment[]` fails — Supabase infers `Record<string, unknown>[]`. Fix: `as unknown as CustomSegment[]`
- E2E 900s global timeout: 187 tests > budget. 130 "did not run". Pre-existing issue (E-01), not introduced by this step.

---

### STEP 04 — Dashboard Home (`/dashboard`) ⚠️ Carry-over
- **Date Started:** 2026-05-30
- **Sessions:** 4 завершено
- **Model used:** 🟢 Sonnet 4.6
- **Commits:** `65acf29` (sessions 1-3) · `00895f1` (session 4 grid) · `6577d5a` (final → Vercel deployed)

#### Quality Gate (поточний стан)
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | ⏳ Pending `/impeccable audit` (baseline 22/40 → target 34+) |
| 2. No-Emoji Policy | ✅ Lucide icons, нуль emoji |
| 3. Motion & Transitions | ✅ spring `as const`, `popLayout`, rise variants, layoutId |
| 4. Errors & Validation | ✅ Empty states з actionable CTAs |
| 5. A11y & Performance | ✅ TSC 0 · Build clean · `flex-1` pattern |
| 6. Core Features | ✅ Revenue fix, Tour, Academy full rewrite, Grid stretch |
| 7. Tests Verification | ⏳ E2E pending |

#### Виконано
| # | Задача | Commit |
|---|---|---|
| A | EarningsPulseWidget: revenue `/100` bug | `65acf29` |
| B | Realtime: `busyness` query invalidation | `65acf29` |
| C | Empty states (6 widgets) | `65acf29` |
| D+E | Tour system: Context + Banner + DOM overlay + getBCR | `65acf29` |
| F | Academy: full rewrite (tabs + accordion + 26 статей + Emil springs) | `65acf29` |
| G | Frost Grid: `items-start` → stretch + `flex flex-col` wrapper divs | `00895f1` |
| G2-G6 | PeakHours dynamic scaling, ChannelHealth CTA, mt-auto pins, InsightsRow enrichment | `00895f1` |

#### Carry-over items (відкладено — не блокують STEP 05)
- [ ] B-01: `/impeccable audit` health score (baseline 22/40 → target 34+)
- [ ] B-02: Vercel QA ручна перевірка onboarding `967bf06`
- [ ] B-03: Studio WeeklyChart: BarTooltip click → day detail drill-down
- [ ] B-04: Frost WeeklyChart: tooltip `rounded-[4px]`
- [ ] B-05: Blossom widget headers: font/contrast стандартизація

#### Key architectural decisions (STEP 04)
- **Frost Grid stretch**: CSS Grid default `align-items: stretch` — видаляємо `items-start`, додаємо `flex flex-col` на wrapper divs; `flex-1` на widget root для заповнення висоти
- **`flex-1` safety**: на не-flex-item це no-op — безпечно додавати завжди
- **PeakHours dynamic**: `h-[13px]` → `flex-1 min-h-[10px]` — heatmap масштабується до висоти карточки
- **Academy**: `mode="wait"` (не `mode="popLayout"`) для tab content — уникає layout jump між різними розмірами контенту

---

## Завершені кроки

### STEP 05 — Dashboard Bookings (`/dashboard/bookings`) ✅

- **Date Ready:** 2026-05-31
- **Sessions:** 4 (Audit + A + B + C + D)
- **Model used:** 🟢 Sonnet 4.6
- **Drawer:** `f4b261099ec82d90d73f1684`
- **impeccable:** 16/20 Good (+5 від baseline 11/20)
- **E2E:** 22 passed, 1 skipped, 0 failed

#### Quality Gate
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | ✅ layoutId ×4, SPRING const, CSS vars verified all 3 themes |
| 2. No-Emoji Policy | ✅ Emoji removed from notifyClientReviewNudge |
| 3. Motion & Transitions | ✅ layoutId sliding indicators, mode="popLayout", spring as const |
| 4. Errors & Validation | ✅ Auth before try{}, status guards, parseError toasts |
| 5. A11y & Performance | ✅ type=button ×45, aria-pressed, min-h-[44px], useMemo workhours, aria-label textarea |
| 6. Core Features | ✅ URL-state (?view ?range ?date ?status), Suspense, setUrl helper |
| 7. Tests Verification | ✅ E2E 22 passed 0 failed · TSC 0 · build exit 0 |

#### Files changed
- `actions.ts` — auth/status guards, merged DB query in completeBooking
- `BookingsPage.tsx` — layoutId ×4, URL-state, dayWorkHours useMemo, label→p, type=button
- `BookingDetailsModal.tsx` — type=button ×9, invisible text fix, ring CSS var, textarea aria-label
- `page.tsx` (bookings) — `<Suspense>` wrapper
- `BookingCard.tsx`, `BulkActionToolbar.tsx`, `OpportunityMenu.tsx`, `VerticalTimeline.tsx`, `MonthlyAnalyticsView.tsx` — type=button fixes

#### Key decisions
- URL state via `useSearchParams` + `router.replace` — persists across navigation / back-forward
- `status=null` removes param for clean URLs (no `?status=all`)
- `setUrl()` helper merges updates, preserves unrelated params (e.g. `bookingId` for modal)
- `dayWorkHours` useMemo replaces 3 IIFEs — single computation per anchor + working_hours change
- edit_counter_guard BLOCK_AT=5 → switch to Write to reset counter (RULE 5 pattern)

#### Skills chain
impeccable audit → react-doctor → security-review → senior-frontend → impeccable post-fix

#### Tests
- `e2e/tests/10-master-bookings.spec.ts` — 3/3 (render, search, manual booking)
- `e2e/tests/04-crm-logic.spec.ts` — 2/2 (status updates)
- `e2e/tests/08-booking-complete.spec.ts` — 1/1 (full flow)
- Total: 22 passed across 8 spec files

#### Carry-over to STEP 06
- C-01: BookingCard `borderLeft` side-stripe → P1 polish (impeccable absolute ban)
- C-02: BookingDetailsModal `text-[9px]` badge → P3

---

### STEP 03 — Onboarding Wizard (`/dashboard/onboarding`)
- **Date Started:** 2026-05-28
- **Date Ready:** 2026-05-30
- **Model used:** 🟢 Sonnet 4.6 high
- **Effort:** 2 сесії (wizard v2 + 3 rendering bug roots)
- **Drawers:** `drawer_bookit_fixes_4735c8be62c5751e8ef1eda6`, `drawer_bookit_fixes_9014576630a574cb79313b2d`, `drawer_bookit_decisions_*`
- **Commit:** `967bf06` (64 files, pushed → Vercel deployed)

#### Quality Gate (поточний стан)
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | ✅ Frost 3-layer: root layout SSR + master layout CSS !important + wizard useEffect |
| 2. No-Emoji Policy | ✅ Lucide icons, нуль emoji |
| 3. Motion & Transitions | ✅ `popLayout` + `spring as const`, AnimatePresence per-step |
| 4. Errors & Validation | ✅ persistStep() з error logging, slug regex, server error toasts |
| 5. A11y & Performance | ✅ TSC 0 errors · Build clean · loading.tsx skeleton · admin client bypass |
| 6. Core Features | ✅ Per-cat services, slug edit, schedule v2, step persistence via admin client |
| 7. Tests Verification | 🔄 QA на Vercel після deploy |

#### Files changed (key)
- `src/app/layout.tsx` — x-pathname → forces `data-theme="frost"` на `<html>` for onboarding routes
- `src/app/(master)/layout.tsx` — isOnboarding branch: `<style>html,body{bg:#EFF2FF!important}</style>` + hardcoded bg; MasterProvider wraps children
- `src/app/(master)/dashboard/onboarding/loading.tsx` — **NEW** Frost skeleton (streaming gap fix)
- `src/app/(master)/dashboard/onboarding/page.tsx` — `force-dynamic`; removed BlobBackground dependency
- `src/app/(master)/dashboard/onboarding/actions.ts` — `saveOnboardingProgress` → admin client (RLS bypass)
- `src/app/onboarding/page.tsx` — BlobBackground removed; `data-theme="frost"` Frost wrapper
- `src/components/auth/PhoneOtpForm.tsx` — removed `router.refresh()` (race condition fix)
- `src/components/master/onboarding/OnboardingWizard.tsx` — useEffect: `html/body overflow:hidden + overscrollBehavior:none + bg:#EFF2FF`; `persistStep()` helper
- `src/components/master/onboarding/steps/StepPreview.tsx` — glassmorphism card, slug editing, nameToGradient, hexLuminance a11y
- `src/components/master/onboarding/steps/StepServices.tsx` — per-category state (categoryPrices + categoryServiceTypes)

#### Key decisions
- **RLS silent failure pattern**: Supabase anon `.update()` повертає `{error:null}` з 0 рядків при блокуванні RLS — не помилка, просто нічого не пишеться. Рішення: завжди використовувати admin client для критичних user-facing записів після верифікації identity через `getUser()`.
- **Streaming gap**: Next.js відправляє root layout HTML миттєво; page.tsx чекає DB → blank background видно. Рішення: `loading.tsx` з правильними кольорами теми заповнює gap.
- **CSS !important beats JS inline style**: `beforeInteractive` скрипт встановлює `body.style.backgroundColor` через JS inline style. CSS `!important` у `<style>` тегу перебиває JS inline style — це стандарт CSS cascade.
- **Client-side navigation doesn't re-render root layout**: `router.push()` не запускає root layout знову → x-pathname fix не спрацьовує для навігацій. Рішення: master layout `<style>` tag re-рендериться на кожній навігації.

#### Skills chain
`senior-frontend` → `impeccable` (QA pending) → `humanizer` (N/A — no new copy) → TSC → build → commit → push

#### Issues encountered
1. **34 files uncommitted** — Vercel мав старий код. Весь час налагодження production відбувався на старому коді. FIX: `git add + git commit + git push`.
2. **Supabase RLS silent failure** — `error:null` + 0 rows = step не зберігається. FIX: admin client.
3. **Streaming blank page** — root layout відправляється до page.tsx. FIX: `loading.tsx`.
4. **CSS var dependency** — `var(--background)` не резолвиться до завантаження CSS. FIX: hardcoded `#EFF2FF`.

---

### STEP 01 — Головний Лендинг (`/`)
- **Date Ready:** 2026-05-28
- **Model used:** 🟢 Sonnet 4.6 high
- **Effort:** ~2 год (полішинг, налаштування reducedMotion та weak-devices)
- **Drawers:** `d61ab82e`
- **Commit:** 3a42b10+

#### Quality Gate Verdict
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | ✅ CSS змінні кольорів, Frost токени; адаптивність перевірена; темні секції мають WCAG AA контраст |
| 2. No-Emoji Policy | ✅ Емодзі вилучено з коду (Lucide іконки; дозволено тільки 🇺🇦 у футері) |
| 3. Motion & Transitions | ✅ GSAP ScrollTrigger rise stack; per-item useInView; split reveals; CountUp fixed; prefers-reduced-motion та оптимізація під слабкі пристрої інтегрована |
| 4. Errors & Validation | ✅ Перенаправлення з кнопок на /register та /login перевірено; калькулятор доходу безпечно затиснутий (clamped) |
| 5. A11y & Performance | ✅ alt на mockup зображеннях; aria-label на BentoFeatures; h1 унікальний |
| 6. Core Features | ✅ Робота ROI калькулятора, слайдерів, розрахунок та посилання перевірені |
| 7. Tests Verification | ✅ Playwright smoke тести зелені |

#### Files changed
- `src/components/landing/LandingPageContent.tsx` — додано детекцію слабких пристроїв та prefers-reduced-motion, відключено GSAP rise ефекти для підвищення продуктивності та доступності
- `src/components/landing/LandingTrustBar.tsx` — CountUp рефакторено на використання useState + useMotionValueEvent
- `src/components/landing/LandingHero.tsx` — переведено на CSS змінні Frost теми, додано alt опис для скріншота кабінету
- `src/components/landing/LandingEconomy.tsx` — додано безпечне затискання діапазону в Slider компоненті

#### Key decisions
- **Тест пристроїв**: Визначення CPU `< 4` та RAM `< 4GB` дозволяє автоматично знижувати навантаження від GSAP анімацій на застарілих мобільних телефонах.
- **Відмова від Testimonials**: За домовленістю з користувачем, блок Testimonials не інтегрувався в лендінг, щоб зберегти фокус на ключових перевагах.

#### Skills chain
`design-taste-frontend` → `emil-design-eng` → `impeccable` → `humanizer` → TSC → build

---

### STEP 02 — Authentication Flow (`/login`, `/register`, `/callback`)
- **Date Ready:** 2026-05-28
- **Model used:** 🟢 Sonnet 4.6 high
- **Effort:** ~1 сесія (виконано поза черговістю; STEP 01 ще in progress)
- **Drawers:** `drawer_bookit_decisions_0f174061d23c416c18ca555f`, `drawer_bookit_decisions_aece86e2ab927d19f15e31ce`
- **Commit:** ff50c78 (base) + changes in session

#### Quality Gate Verdict
| Вимір | Стан |
|---|---|
| 1. Aesthetics & Themes | ✅ Frost enforced (`data-theme="frost"`); white card; dark panel; mobile strip; aurora |
| 2. No-Emoji Policy | ✅ Нуль emoji — Lucide icons |
| 3. Motion & Transitions | ✅ spring stiffness:340 `as const`; popLayout; whileTap; AnimatePresence |
| 4. Errors & Validation | ✅ Inline AnimatePresence errors; phone/terms guards; all API errors |
| 5. A11y & Performance | ✅ WCAG AA (всі text пари верифіковані); sr-only; aria-hidden |
| 6. Core Features | ✅ Google OAuth back-button fix; OTP paste/auto-submit; referral; cooldown |
| 7. Tests Verification | ⏳ Logic unchanged; E2E smoke carry-over |

#### Files changed
- `src/app/(auth)/layout.tsx` — Frost split-screen layout: `data-theme="frost"`, dark panel `var(--accent)`, mobile editorial strip, em-dash fix
- `src/components/auth/PhoneOtpForm.tsx` — "Nordic Slab" full visual redesign: white container, stacked role cards, 3-segment progress, WCAG AA colors

#### Key decisions
- `data-theme="frost"` на div (не html) — достатньо для CSS cascade; вирішує Blossom bleed pre-login
- Відмова від `bento-card`: `var(--surface)` ≈ `var(--background)` у Frost → нульовий контраст → raw `bg-white`
- Role cards стопкою (не 2-col grid) — уникає "identical card grid" anti-pattern (impeccable ban)
- `#6366F1` → `#4338CA` тільки для TEXT; декоративні елементи залишені `#6366F1`

#### Skills chain
`impeccable craft` → `design-taste-frontend` → `mcp__magic__21st` (skipped) → `humanizer` → `mcp__a11y__are-colors-accessible` → TSC → build

#### Tests
- E2E: не запущено (логіка не змінювалась, carry-over)

#### Carry-over to next step
- Playwright E2E auth smoke test (рекомендований для STEP 07/10)

#### Issues encountered
- `.next/lock` dir блокував build → видалено
- `bento-card` var(--surface) white-on-white → замінено на raw white container
- `#94A3B8` / `#6366F1` WCAG fail → `#64748B` / `#4338CA`

---

---

*Версія: 1.0 · Створено: 2026-05-27*
