# R2 Performance Audit — 06-performance

Date: 2026-07-07 · Launch: 2026-07-10
Scope: Runtime + load performance. Server/Client boundaries, data-fetching waterfalls & N+1, DB index/query shape on hot paths, list virtualization & render cost, next/image usage, caching / revalidation strategy, bundle & dynamic-import coverage, cron/serverless serial loops. Focus on public money paths (master page `[slug]`, shop, booking wizard) and dashboard data loads. Recent fix batch (createBooking stock RPC, createOrder rollback loop, `after()` notify wraps, turbosms budget-check RPC) assessed, not undone.
Mode: READ-ONLY. No project files edited. Every finding verified by reading the actual code.

## Headline
The engineering baseline is strong: React Compiler is on (`next.config.ts:25` — auto-memoization neutralizes most "unmemoized render" concerns), `optimizePackageImports` covers lucide/framer, heavy deps (`@hello-pangea/dnd`, recharts, pricing/flash/booking flows) are consistently behind `dynamic()`, react-query lists are bounded (`limit 500`/`30`) with `staleTime` + `keepPreviousData`, the reminders cron is properly batched (`BATCH 30` + `Promise.allSettled`), and the master page fans its 10 secondary queries through a single `Promise.all`. The real costs are **caching, not compute**: (1) the highest-traffic public page `[slug]` reads `searchParams` + `cookies()` + `headers()` + `auth.getUser()`, so it is **fully dynamic** — `export const revalidate = 300` and `generateStaticParams` (prerender top 50) are dead code, and every visitor pays ~11 DB round-trips; (2) `createBooking` and `my/profile` call `revalidatePath('/', 'layout')`, purging the **entire** site data + router cache on every booking; (3) the marketing broadcast sends via a **serial per-client loop of ~5 awaited round-trips** — a serverless-timeout risk past ~40-50 recipients. Everything else is small: a shop-page await waterfall, raw `<img>` on a few public surfaces, and an over-fetched column.

---

## Findings

### P0
None. No launch-blocking runtime cost on the public request path — the master/shop queries are parallelized and Supabase-fast; the serial loops are master-triggered and low-frequency.

---

### P1

`[P1] src/app/[slug]/page.tsx:15,89-98,147-304` — The busiest public page is fully dynamic, so its ISR config is inert. The default export reads `searchParams` (`:150`, for `?ref=`), `headers()` (`:156`), `cookies()` (`:184`) and `supabase.auth.getUser()` (`:189`) — **any one of these opts the route into dynamic rendering in the App Router**. Therefore `export const revalidate = 300` (`:15`) and `generateStaticParams()` prerendering the top-50 masters (`:89-98`) provide **zero caching** — every visit re-runs `getMaster` (1 query) + the `Promise.all` block of 10 queries (`:221-304`) + an optional 11th C2C lookup (`:196-201`), on-demand, per request. On launch day with real mobile traffic this is the dominant TTFB/LCP risk. `getMaster` is `cache()`-wrapped (`data.ts:48`) but that only dedupes within one request (it's called in both `generateMetadata` and the page — a genuine win), not across requests. Fix: split the personalized/dynamic slice (auth-gated loyalty `relationRes`, `?ref=` resolution, UA-based `mapUrl`) into a Suspense-streamed client island fed by a light endpoint, and let the master profile shell render statically with real ISR; or at minimum move the `?ref=`/auth work out of the critical render so the shell can be cached.

`[P1] src/lib/actions/createBooking.ts:685` (+ `src/app/my/profile/actions.ts:57`) — `revalidatePath('/', 'layout')` on every booking. This invalidates the **entire** Next data cache and full client router cache for all routes under the root layout — the broadest possible revalidation, fired on the highest-frequency write of the whole product. Booking creation only changes `/${slug}` (occupancy/monthly-count), `/dashboard/bookings` and `/my/bookings`; scope it to those exact paths. `my/profile` does the same site-wide purge for a profile edit. (Note the interaction with the P1 above: because `[slug]` is already dynamic, the *data-cache* half of this purge is partly moot there, but the router-cache invalidation and the purge of every other statically-generatable route are real and unnecessary.)

`[P1] src/app/(master)/dashboard/marketing/actions.ts:293-353` — Broadcast send is a serial `for (const client of filtered)` loop where each iteration awaits, in sequence: `broadcast_recipients` insert (`:314`), `broadcast_links` insert (`:321`), a conditional `phone_discounts` insert (`:329`), `notifyClientBroadcast` (`:336` — itself push+telegram+SMS, each a network call), and a `broadcast_recipients` update (`:348`). That is ~5 awaited round-trips × N recipients with no batching. At ~40-50 clients this approaches the Vercel serverless function timeout and the whole broadcast fails mid-flight (leaving `status:'sending'`). The reminders cron already demonstrates the right shape (`api/cron/reminders/route.ts:105-163`: `BATCH 30` + `Promise.allSettled`) — port that here, and pre-generate codes/rows in bulk inserts.

---

### P2

`[P2] src/app/[slug]/shop/page.tsx:62-79` — Request waterfall on the public shop page. Three independent awaits run sequentially: products (`:63`), then `supabase.auth.getUser()` (`:72-73`), then `schedule` (`:76-79`). None depends on another's result, so this is 3 serial round-trips where 1 would do. Wrap in `Promise.all([products, auth.getUser(), schedule])`. (Same dynamic-page caveat as P1 applies — `auth.getUser()` makes this page dynamic too, so `revalidate = 60` at `:9` is also inert; the waterfall is the actionable part.)

`[P2] Raw <img> on public/booking surfaces bypasses the configured image pipeline` — `next.config.ts:27-43` configures `images.remotePatterns` for `*.supabase.co` storage, yet several public/wizard surfaces render source-resolution `<img>` instead of `next/image`: `shared/wizard/ServiceDetailSheet.tsx:77` (full-bleed service cover in the booking flow), `shared/wizard/ServiceSelector.tsx:345` (partner avatars), `app/invite/[code]/page.tsx:160,240,311` (public invite avatars), `shared/MobileHub.tsx:162`. On mobile these ship full-size originals (no resize, no WebP/AVIF, no responsive `sizes`) — wasted bandwidth on the exact device class the launch targets. Convert the public/wizard ones to `next/image` with `sizes`. (Admin-only raw `<img>` in `ModerationHub`/`AdminSupportConsole` is low-traffic — see P3.)

`[P2] src/app/(master)/dashboard/products/actions.ts:410-441` — `createOrder` decrements stock in a **serial** `for` loop: per cart item, an awaited `decrement_product_stock_atomic` RPC (`:413`) then an awaited `product_transactions` insert (`:426`) — 2 sequential round-trips × items. Its sibling `createBooking.ts:605-612` does the same decrement via `Promise.all` (parallel). The serial ordering is only needed to build the `reserved[]` rollback list *on failure*; the happy-path transaction inserts can be parallelized, or the decrements batched into one RPC. Bounded by cart size (usually a handful) so not urgent, but it's an inconsistent, avoidable waterfall on a money path.

`[P2] Public master page is one giant 'use client' tree — 353/368 component files are client components` — `components/public/PublicMasterPage.tsx:1` (`'use client'`) hydrates the whole public profile (framer-motion, tanstack-query, dozens of subcomponents) even though most of it — services, reviews, schedule, loyalty — is static content already fetched on the server and passed as props. Only the booking flow needs heavy interactivity, and it's correctly lazy (`:42-45 dynamic(ssr:false)`). Shipping the static content as Server Components would cut the hydration payload on the launch's primary landing surface. Systemic (near-total client density is an architecture choice, not a one-file bug), hence P2 not P1, but it's the biggest bundle lever on the public path.

`[P2] src/lib/turbosms.ts:12-23` — The new budget guard adds a fresh `createAdminClient()` **and** a `check_notification_sms_budget` RPC round-trip before *every* SMS. Correct for spend safety and fail-open, but on the broadcast path (P1) it compounds the serial loop with one more sequential network hop per recipient, and `createAdminClient()` is re-instantiated on each call rather than reused. Acceptable as-is for critical-only SMS; if broadcast SMS volume grows, hoist the client and batch the budget check. Assess-only per brief — not a regression to undo.

---

### P3

`[P3] src/app/[slug]/page.tsx:224` — Over-fetch: the products select pulls `photos` (a jsonb array of image URLs) but the `ProductRow` mapping (`:323-333`) never reads `p.photos` — the public page shows icon-only product chips. Dropping `photos` from this select trims payload on a hot query. (The shop page at `shop/page.tsx:65` legitimately needs `photos`.)

`[P3] Bookings/notifications lists are unvirtualized but bounded` — Only `master/clients/ClientsPage.tsx` uses `useWindowVirtualizer` (verified — it's the one file). `BookingsPage.tsx:527-546` renders `groupedBookings → dayBookings.map(BookingCard)` with a per-row framer-motion `index` stagger, and `NotificationsBell.tsx:195-240` maps notifications with per-item `delay: i*0.03`. Neither is virtualized, but both are hard-capped upstream (`useBookings` `limit 500`, `useNotifications` `limit 30`) and scoped by date range, so real-world counts stay small. Acceptable for launch; if a power-master hits a 500-booking month view, the motion-per-row cost (not the DOM count) would be the first thing to feel it — consider dropping the stagger on large sets.

`[P3] src/app/[slug]/page.tsx:297-303` — The occupancy query pulls up to 300 bookings (`start_time, end_time, status`) for the current month via the public client purely to compute one `occupancyRate` number in `computeOccupancy`. Correct but heavy for a scalar; a small `count`/aggregate RPC would replace a 300-row transfer on every (dynamic) page load.

`[P3] Admin raw <img> — low traffic` — `admin/ModerationHub.tsx:345`, `admin/AdminSupportConsole.tsx:393,509`, and the marketing `story/steps/StepLook.tsx:61,69` render unoptimized `<img>`. Admin/editor-only surfaces, negligible traffic — cleanup, not launch-critical. Grouped separately from the public P2.

---

## Re-verified strengths (no findings)
- **React Compiler on** (`next.config.ts:25 reactCompiler:true`) — auto-memoizes components/hooks, so the classic "missing `useMemo`/`memo`" class of findings largely does not apply here. `BookingsPage` still hand-memoizes derived data (`useMemo` on filters/groups) — belt-and-suspenders, fine.
- **Dynamic imports for heavy deps are thorough** — `@hello-pangea/dnd` (products, portfolio, services), recharts (`AdminOverviewChartsWrapper`, analytics via `AnalyticsClientLoader`), and the pricing/flash/loyalty/referral/partners/booking flows are all behind `dynamic()`. recharts is never in the initial public bundle.
- **Master page fan-out is parallel** — `[slug]/page.tsx:221-304` runs 10 secondary queries in one `Promise.all`; `getMaster` is `cache()`-deduped across `generateMetadata` + page render.
- **Cron is batched** — `api/cron/reminders/route.ts:105-163` chunks due bookings into `BATCH 30` with `Promise.allSettled`; morning briefings group by master and settle in parallel. No serial-await timeout risk here (contrast the broadcast loop).
- **react-query hooks are bounded & cached** — `useBookings` `limit 500` + `keepPreviousData`; `useNotifications` `limit 30` + `staleTime 30s`; `useMonthlyBookingCount` head-only `count` + `staleTime 60s`. Optimistic `onMutate` on status updates. No unbounded `select *` on the hot client hooks.
- **createBooking stock path is parallel & atomic** — `:605-612` `Promise.all` of `decrement_product_stock_atomic`; the recent N+1 removal (stock-alert threshold now read from the initial fetch, per the code comment at `products/actions.ts:435`) is a real improvement.
- `optimizePackageImports: ['lucide-react','framer-motion']` + `images.remotePatterns` configured. `notify*` calls use `after()` to defer off the response path (createOrder `:439,449`).

---

## Severity counts

| Severity | Count |
|----------|-------|
| P0       | 0     |
| P1       | 3     |
| P2       | 5     |
| P3       | 4     |

**Top pre-launch picks: (1) `[slug]` page is fully dynamic — ISR/generateStaticParams are dead, every visit = ~11 live queries (P1, the launch TTFB/LCP risk); (2) `revalidatePath('/', 'layout')` on every booking/profile-edit nukes the whole-site cache — scope it (P1); (3) broadcast serial per-client loop = serverless-timeout risk past ~40-50 recipients — batch it like the reminders cron (P1).**
