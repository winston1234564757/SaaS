# R2 Mobile Audit — 13-mobile

Date: 2026-07-07 · Launch: 2026-07-10 (mobile-first product)
Scope: Shop + ShopCartBar + Nova Poshta checkout, /my/* client cabinet, BookingWizard (editorial), dashboard mobile after C-DESK-01, orders UI, dynamic pricing sheets. Viewport target: 360–390px.
Mode: READ-ONLY. No project files edited. Evidence = className/code analysis; items marked "device-confirm" need a live phone/emulator pass.

## Headline
No body-level horizontal overflow and no C-DESK-01 mobile regression — the desktop work consistently uses split `lg:` trees, mobile markup untouched. The real problem is a **fractured z-index system for bottom sheets vs bottom navs**: the master-side MobileHub bar (`z-[75]`) floats **on top of** four product/finance drawers that stayed at `z-50`, covering their save/action zones, and the client MyBottomNav (`z-50`, later in DOM) stays visible and tappable over the open shop checkout whose overlay is only `z-40`. Second theme: the shop checkout is a hand-rolled sheet (not vaul) with no scroll lock, and the shared vaul Sheet ships `repositionInputs={false}` + `max-h-[96vh]` — both keyboard/viewport hazards on iOS.

---

## Findings

### P1

`[P1] src/components/master/products/ProductFormDrawer.tsx:200-205 + src/components/shared/MobileHub.tsx:95` — Product create/edit drawer is a custom (non-portaled) sheet: overlay `z-40`, content `z-50`, `max-h-[92dvh]`. The dashboard mobile nav (MobileHub) is `fixed bottom-0 z-[75]` with a `pointer-events-auto` pill bar ~72–88px tall. z-75 > z-50, so on a 375px viewport the hub bar renders **on top of the open drawer**, over the "Додати товар / Зберегти зміни" button (last element of the scroll body, only `pb-6` clearance — it cannot be scrolled above the bar). Taps in that zone hit the nav, not the save button; the overlay (z-40) also does not dim the nav, so the master can navigate away mid-edit. Symptom: adding/editing a product on a phone is blocked or requires pixel-hunting the button's top edge. Device-confirm exact overlap, but the stacking math is unambiguous. Same class as RestockDrawer, which was already bumped to `z-[80]` (RestockDrawer.tsx:95-96) — the fix pattern exists in the same folder.

`[P1] same stacking bug in three more dashboard sheets (all z-50 < hub z-[75]):`
- `src/components/master/products/TransactionHistoryDrawer.tsx:57` — history list bottom rows under the hub bar (has safe-area padding but only 0.75rem + inset, far less than bar height).
- `src/components/master/revenue/ExpensesTab.tsx:241` — add-expense drawer (with inputs) `z-50`; hub covers its lower controls.
- `src/components/master/services/ServiceEditor.tsx:699-700` — add-consumable sheet `z-50`, body padding is the **undefined** `pb-safe` class (see P2), so its last tappable rows sit flush at the covered bottom edge.
The shared `Sheet` BottomVariant already solved this with `z-[100]` (Sheet.tsx:110) — these four hand-rolled drawers never followed.

`[P1] src/components/public/shop/ShopCartBar.tsx:168-177 + src/components/client/MyBottomNav.tsx:137 + src/app/layout.tsx:151-156` — Shop checkout drawer: overlay `z-40`, sheet `z-50`, rendered inside `<main>`; MyBottomNav is `z-50` and rendered **after** `<main>` in the root layout, so on mobile the client bottom nav paints above the open checkout sheet and above its undimmed overlay — the nav stays fully tappable during checkout (one mis-tap on «Профіль» abandons a filled cart with NP city/warehouse selected). The sheet body's `pb-28` pushes the confirm CTA above the bar, so the flow is completable, but the checkout is not modal: the glass nav bar visually floats over the sheet's bottom band ("Оплата готівкою…" hint zone). Device-confirm the visual, but z/DOM order is definitive for the tappable-nav part.

### P2

`[P2] src/components/ui/Sheet.tsx:104,113 — BookingWizard container` — BottomVariant (used by BookingWizard, BookingDetailsModal, FlashOnCancelConfirmSheet, PricingRuleStatsSheet on mobile) has two viewport hazards: (a) `max-h-[96vh]` uses **vh, not dvh** — on iOS Safari with the URL bar visible the visual viewport is ~10-12% shorter than 100vh, so a full-height wizard sheet's top (drag handle) can sit behind browser chrome; (b) `repositionInputs={false}` disables vaul's keyboard avoidance, and the wizard's name/phone/notes inputs (ClientDetails.tsx:159-196, step 4 of 5) live in the lower half of the sheet — on iOS the keyboard overlays a `fixed bottom-0` sheet and the focused input can stay hidden under it. `interactiveWidget: 'resizes-content'` (app/layout.tsx:71) covers Android only; the comment there admits iOS is only handled for the auth shell. Device-confirm on a real iPhone; the slot grid, step transitions and sticky CTAs themselves are clean (see OK notes).

`[P2] src/components/public/shop/ShopCartBar.tsx:164-196` — The checkout sheet is a hand-rolled `motion.div`, not vaul and not Radix: **no body scroll lock and no `overscroll-contain`** on its scroll body (`flex-1 overflow-y-auto px-5 pb-28`). On iOS, overscrolling the cart list or dragging the dimmed backdrop scrolls the shop page underneath; combined with no focus trap, keyboard-driven scroll on input focus can land on the background page. Every other sheet in the codebase gets this from vaul/Radix for free — this is the only money-path surface without it.

`[P2] src/components/public/shop/NovaPoshtaPicker.tsx:126-143,164-180` — City/warehouse dropdowns are `absolute … max-h-60 overflow-y-auto` rendered **inside** the checkout sheet's own scroll container. On a 375×667 viewport with the keyboard open (~300px), the visible sheet area above the keyboard is ~250-300px; the input sits mid-sheet and the 240px dropdown extends below the fold of the visible band — the user must scroll the sheet (while the dropdown is anchored to the input) to see options, and the keyboard covers most of the warehouse list (typically 20+ «Відділення №N» rows). Functional but hostile exactly where the task brief predicted (long lists + keyboard). Needs live-device confirmation of severity; consider full-screen picker or vaul-nested sheet.

`[P2] src/components/shared/MobileHub.tsx:95 + src/components/master/services/ServiceEditor.tsx:702` — `pb-safe` / `pb-safe-bottom` are **not defined anywhere** (no tailwind safe-area plugin in package.json, no `@utility` in globals.css — only `@plugin "@tailwindcss/typography"`). Tailwind v4 silently generates nothing for unknown classes. Result: the master mobile nav bar relies on `pb-4` alone and sits ~16px from the screen edge — on iOS with a home indicator (34px inset) the bar's touch zone collides with the system swipe area; ServiceEditor's sheet body ends with zero bottom padding. `body { padding-bottom: env(safe-area-inset-bottom) }` (globals.css:398) does not help `position:fixed` elements. Contrast: MyBottomNav does it correctly with `pb-[max(env(safe-area-inset-bottom),12px)]` (MyBottomNav.tsx:167).

`[P2] src/components/public/shop/ShopCartBar.tsx:207-225` — Checkout quantity steppers are `size-7` (28px) with a 24px number between them — the tightest touch cluster in the money path, well under the project's own 44px rule; adjacent minus/plus mis-taps change order quantity at the moment of payment commitment. (Other undersized targets are listed at P3; this one is P2 because it edits the order total.)

### P3

`[P3] touch targets < 44px (project rule: 44px min, pills py-2 min):`
- `src/components/public/ShopPage.tsx:148` — category FilterChip `py-1.5 text-xs` ≈ 30px.
- `src/components/master/products/OrderCard.tsx:196` — order status action buttons `py-2 text-xs` ≈ 33px (orders management, priority surface — but full-width flex-1, so mis-taps are vertical only).
- `src/components/client/MyLoyaltyPage.tsx:260` — reward action `py-2` ≈ 33px.
- `src/components/master/pricing/DynamicPricingPage.tsx:63` — rule chips `min-w-[36px] min-h-[36px]`.

`[P3] src/components/master/dashboard/StatsStrip.tsx:113 + src/components/ui/Tooltip.tsx` — Stat-card breakdowns (підтверджено/очікує/завершено etc.) are delivered only through Radix `Tooltip`, which is hover/focus-only — Radix tooltips do not open on touch. On mobile the card is `cursor-default` with no tap equivalent, so the breakdown data is unreachable on the primary platform. Hover-only, no functional loss (sub-line shows a summary).

`[P3] src/app/layout.tsx:64-69` — `maximumScale: 1, userScalable: false`. This is currently **load-bearing**: it is the only thing preventing iOS zoom-on-focus, because virtually every input in checkout/wizard is `text-sm` (14px) (ShopCartBar.tsx:247,258,345; NovaPoshtaPicker.tsx:102; ClientDetails.tsx:165,193). Trade-off: WCAG 1.4.4 violation (pinch-zoom disabled). If a11y review ever removes it, all these inputs must go to 16px first or iOS will zoom the sheet on every focus. Flagged so the dependency is explicit.

`[P3] src/components/client/MyProfilePage.tsx:493` — Dirty-state save bar sits at `bottom: safe-area + 4rem` (64px) while `--bottom-nav-height` is 76px (globals.css:122): on zero-inset devices (most Androids) the pill's bottom ~12px can underlap the nav's top edge, and the nav (same z-50, later in DOM) paints above. Cosmetic clip of the button's shadow/edge; device-confirm.

`[P3] vh instead of dvh in secondary drawers` — RestockDrawer.tsx:96 `max-h-[90vh]`, ExpensesTab.tsx:241 `max-h-[90vh]`, ServiceEditor.tsx:700 `max-h-[80vh]`, DialogVariant Sheet.tsx:60 `max-h-[90vh]` (desktop-mostly). Lower caps make clipping unlikely; ProductFormDrawer already uses `92dvh` correctly.

`[P3] src/app/[slug]/shop/page.tsx:50` — Non-Pro shop fallback renders a literal 🔒 emoji (`<p className="text-4xl mb-4">🔒</p>`) — violates the No-Emoji law on a public client-facing page. Not a layout bug; noting for the copy sweep.

`[P3] src/components/shared/BottomNav.tsx + BentoBottomNav.tsx` — dead code (no imports anywhere); both also use the undefined `pb-safe-bottom`. Delete rather than fix.

---

## Verified-safe ([OK])

`[OK] C-DESK-01 did not regress mobile.` Every touched surface uses split trees, not overridden base classes: MyBookingsPage.tsx:894 (`hidden lg:block`) / :1036 (`lg:hidden`), MyMastersPage.tsx:48/215, ClientNotificationsPage.tsx:321/334, my/layout.tsx:129-134 (mobile `max-w-lg px-4 pb-32` preserved verbatim, `lg:` only widens). M-DASH-09's unresponsive inline `gridTemplateColumns: 'minmax(0,480px) 1fr'` lives inside `FrostDesktop` only; the mobile tree is a separate `frost-mobile-view lg:hidden` (FrostDashboard.tsx:275).

`[OK] Viewport config` (app/layout.tsx:64-72) — `viewportFit: 'cover'`, `interactiveWidget: 'resizes-content'`, dynamic theme-color script. `min-h-dvh` used in /my layout and body (`min-height:100dvh`, `overflow-x:hidden`, `overscroll-behavior-y:none` — body-level horizontal leaks are masked by design).

`[OK] Client bottom nav` (MyBottomNav.tsx:167) — correct `pb-[max(env(safe-area-inset-bottom),12px)]`; hides on chat routes where the composer owns the bottom (ChatComposer.tsx:37 also handles safe-area).

`[OK] Wizard slot grid + sticky CTAs` — slots are `grid grid-cols-3` with `py-3/py-4` chips (≥44px, `aria-pressed`, DateTimePicker.tsx:255-291); every step's CTA is `sticky bottom-0` with a gradient scrim inside the sheet scroll body (DateTimePicker.tsx:378, ServiceSelector.tsx:421, ProductCart.tsx:131, ClientDetails.tsx:390) — correct pattern, no fixed-in-transformed-ancestor risk. Step transitions use keyed `AnimatePresence mode="popLayout"` on non-fixed children.

`[OK] Wide analytics grids are contained` — HeatmapGrid.tsx:74-75 (`overflow-x-auto` around `min-w-[480px]`), CohortHeatmap.tsx:90-91 (`min-w-[560px]`), chips everywhere via the shared ScrollStrip (`overflow-x-auto`, ScrollStrip.tsx:193). No table/grid found that lacks an overflow container.

`[OK] Shop grid + images` — `grid-cols-2 sm:3 lg:4` base-first (ShopPage.tsx:75); `next/image` with `fill` + explicit `sizes` on tiles (ShopPage.tsx:107), gallery (ProductDetailView.tsx:77) and thumbs (:148); aspect-ratio boxes prevent CLS. Product gallery swipes via framer `drag="x"` with dot targets padded to 44px (`p-3 -m-3`, ProductDetailView.tsx:126); prev/next arrows are `hidden md:flex` — hover-only affordance correctly desktop-gated.

`[OK] Long Ukrainian strings` — service chips in dark booking cards wrap (`flex flex-wrap` MyBookingsPage.tsx:352), OrderCard uses `min-w-0` + `truncate` + `flex-wrap` throughout, WizardHero heading has `min-w-0`, checkout item names truncate (ShopCartBar.tsx:204). No unguarded nowrap-in-flex overflow found.

`[OK] Dashboard content clearance` — DashboardLayout.tsx:91 pads main by `var(--bottom-nav-height) + 1rem`; ProductEditor's sticky save bar handles safe-area (ProductEditor.tsx:936); PhotoLightbox, SupportWidget, SmartBackButton, MobileHub open-state all use `env(safe-area-inset-*)`.

`[OK] Dynamic pricing surfaces` — DynamicPricingPage is single-column with wrap-safe chips; PricingRuleStatsSheet and dashboard PricingDrawer ride the shared Sheet (z-[100], above both navs).

---

## Summary

| Priority | Count | Theme |
|----------|-------|-------|
| P0 | 0 | — |
| P1 | 3 | bottom-nav z-index over open sheets: MobileHub z-75 vs 4 dashboard drawers at z-50 (product form save blocked); MyBottomNav over shop checkout (undimmed, tappable) |
| P2 | 5 | Sheet 96vh + repositionInputs=false (wizard keyboard/iOS); checkout sheet no scroll lock; NP dropdowns vs keyboard; undefined pb-safe utilities; 28px qty steppers in checkout |
| P3 | 8 | sub-44px targets ×4 surfaces; hover-only stat tooltips; userScalable trade-off; profile save-bar overlap; vh drawers; shop 🔒 emoji; dead nav components |
| OK | 10 | C-DESK-01 mobile intact, viewport config, wizard grid/CTAs, overflow containers, images, UA-string wrapping, safe-area on client nav |

Fix order for 2026-07-10: (1) bump the four z-50 dashboard drawers to z-[80]+ (RestockDrawer already shows the pattern) or hide MobileHub while any sheet is open; (2) raise ShopCartBar overlay above MyBottomNav (or hide the nav when the checkout is open); (3) define a real `pb-safe` utility and swap `max-h-[96vh]` → `dvh` in Sheet; (4) device-pass the NP picker + wizard details step with the iOS keyboard.
