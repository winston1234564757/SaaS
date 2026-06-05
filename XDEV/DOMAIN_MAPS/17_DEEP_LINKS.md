# 17 — Deep Links & URL Action Bus Domain Map

## 1. Domain Overview

Система глибоких посилань (deep links) через URL-параметри та програмний Command Bus (URL Action Bus). Дозволяє будь-якому посиланню (ззовні чи всередині) відкривати складний UI-flow, минаючи проміжні кліки.

### Key Files
- `src/lib/actions/UrlActionBus.ts` — Core: `useUrlActionBus`, `buildActionUrl`, Zod schemas
- All page files with `searchParams.get()` or `useQueryState` consumers
- `src/app/r/[code]/route.ts` — Short link resolver
- `src/lib/utils/broadcastUtils.ts` — Short link generation
- `src/lib/notifications/constants/notifMap.ts` — Notification URLs

---

## 2. URL Action Bus

### 2.1 Architecture

```
Pattern: ?_action=<type>&<param1>=<value1>&<param2>=<value2>

Registration (UrlActionBus.ts):
  → schema per action type (Zod validation)
  → handler registration per consumer component

Execution:
  → URL loads with ?_action=...
  → useUrlActionBus hook detects action
  → validates payload via Zod
  → calls registered handler
  → cleans up URL via window.history.replaceState
```

### 2.2 Registered Actions

| `_action` | Payload | Consumer | Status |
|---|---|---|---|
| `booking:create` | `serviceId?`, `clientId?`, `date?`, `startTime?` | `PublicMasterPage`, `BookingsPage` | ✅ |
| `booking:reschedule` | `bookingId`, `date?` | — | ⏳ Schema ready |
| `client:open` | `clientId` | `ClientsPage` | ✅ |
| `marketing:broadcast` | `clientIds?` (comma-sep), `templateId?` | `BroadcastsTab` | ✅ |
| `ui:open_drawer` | `drawerId`, `targetId?` | — | ⏳ Schema ready |
| `flash:create` | `serviceId?` | — | ⏳ Schema ready |
| `product:edit` | `productId` | `ProductsPage` | ✅ |

### 2.3 Action States

```
[PAGE_LOAD] → useSearchParams() / useQueryState()
  → CHECK: ?_action exists?
    → YES: validate via Zod
      → VALID: call handler → execute UI flow
      → INVALID: ignore, clean URL
      → HANDLER: may open modal, select item, navigate
    → NO: normal page load
  → CLEANUP: window.history.replaceState removes params
```

### 2.4 Action Lifecycle

```
1. URL enters: either external (notification, email, TG link) or internal (buildActionUrl)
2. Router navigates to page
3. Client component mounts → useUrlActionBus hook fires
4. Hook reads search param, validates schema
5. On valid → executes handler function
6. After handler execution → cleans URL query params
7. User sees result (modal open, item selected, etc)
```

---

## 3. URL Parameters per Route

### 3.1 Public Master Page (`/[slug]`)

| Param | Type | Action | File |
|---|---|---|---|
| `?serviceId={id}` | string | Auto-open BookingFlow with service | `PublicMasterPage.tsx` |
| `?services={id1,id2}` | comma-sep | Multi-service pre-selection | `PublicMasterPage.tsx` |
| `?ref={code}` | string | Capture C2C referral code → localStorage | `RefCapture.tsx` |
| `?code={code}` | string | Alternate referral param | `RefCapture.tsx` |

**States:**
- No params → normal page
- serviceId valid → booking flow opens immediately
- serviceId invalid → booking flow shows error or no pre-select
- serviceId + ref → booking with C2C discount
- ref stored → localStorage persists across page reloads (until used?)

### 3.2 Client Portal (`/my/bookings`)

| Param | Type | Action | Status |
|---|---|---|---|
| `?bookingId={id}` | string | Focus on specific booking | ⏳ Planned |
| `?bookingId={id}&review=1` | string | Open review form for booking | ⏳ Planned |

**States (when implemented):**
- No params → normal bookings list
- bookingId valid → scroll to + highlight
- bookingId invalid → ignore, show all
- bookingId + review → scroll + open review UI

### 3.3 Master Bookings (`/dashboard/bookings`)

| Param | Type | Action | File |
|---|---|---|---|
| `?bookingId={id}` | string | Open BookingDetailsModal | `BookingDetailsModal.tsx` |

**States:**
- bookingId valid → modal opens with booking
- bookingId invalid → modal shows error
- bookingId for different master → RLS blocks → error

### 3.4 Master CRM (`/dashboard/clients`)

| Param | Type | Action | File |
|---|---|---|---|
| `?clientPhone={phone}` | string | Open ClientDetailSheet | `ClientsPage.tsx` |
| `?sort={key}` | visits/alpha/check/recent | Sort list | `ClientsPage.tsx` |
| `?view={mode}` | list/grid | View mode | `ClientsPage.tsx` |

**States:**
- clientPhone valid → detail sheet opens
- clientPhone invalid → ignore
- sort param → list sorted
- view param → layout switched

### 3.5 Master Billing (`/dashboard/billing`)

| Param | Type | Action | File |
|---|---|---|---|
| `?paid=1` | flag | Show success state | `BillingPage.tsx` |
| `?plan={id}` | string | Pre-select plan | `BillingPage.tsx` |

**States:**
- paid=1 → success banner, confetti
- plan=pro → pro card highlighted, checkout ready
- both → pro selected + success state (edge: only on return)

### 3.6 Growth Hub (`/dashboard/growth`)

| Param | Type | Action | File |
|---|---|---|---|
| `?drawer=loyalty` | string | GrowthHubClient → open loyalty tab | `GrowthHubClient.tsx` |
| `?drawer=referral` | string | Open referral tab | `GrowthHubClient.tsx` |
| `?drawer=partners` | string | Open partners tab | `GrowthHubClient.tsx` |

**States:**
- drawer param → tab selected
- param invalid → fallback to default tab

### 3.7 Revenue Hub (`/dashboard/revenue`)

| Param | Type | Action | File |
|---|---|---|---|
| `?tab=flash_deals` | string | Open flash deals inline | `RevenueHubClient.tsx` |
| `?tab=dynamic_pricing` | string | Open dynamic pricing inline | `RevenueHubClient.tsx` |

### 3.8 Dashboard Home (`/dashboard`)

| Param | Type | Action | File |
|---|---|---|---|
| `?drawer=flash_deals` | string | Open flash deal drawer | `DashboardDrawers.tsx` |
| `?drawer=dynamic_pricing` | string | Open pricing drawer | `DashboardDrawers.tsx` |

### 3.9 OAuth Callback (`/auth/callback`)

| Param | Type | Action |
|---|---|---|
| `?next={path}` | string | Redirect after auth (default: /my/bookings) |
| `?role=client|master` | string | Intent role |
| `?bid={bookingId}` | string | Booking ID (PostBookingAuth) |
| `?bookingId={id}` | string | Booking ID (ClientAuthSheet) |
| `?plan={id}` | string | Intended plan (master reg) |
| `?code={oauthCode}` | string | OAuth authorization code (system) |

---

## 4. Short Links (`/r/[code]`)

### 4.1 Flow

```
Broadcast sends link: bookit.com.ua/r/AbCdEf
  → Client clicks
  → GET /r/[code]/route.ts
  → Lookup broadcast_links WHERE code = 'AbCdEf'
  → broadcast_links.clicks++
  → 302 redirect to target_url (e.g., /[slug]?serviceId=xxx)
  → target page processes serviceId → BookingWizard opens
  → phone_discounts matched by phone → discount at checkout
```

### 4.2 States

| State | Behavior |
|---|---|
| Valid code | Redirect + click tracked |
| Invalid/expired code | 404 or redirect to home |
| Code with serviceId | Pre-selects service in wizard |
| Code with broadcast_id | Discount applied |
| Code click (first) | clicks: 0 → 1 |
| Code click (100th) | clicks: 99 → 100 |

---

## 5. Notification URLs

All notification URLs are generated in `notifMap.ts` template:

```typescript
url: d.bookingId
  ? `/my/bookings?bookingId=${d.bookingId}`
  : '/my/bookings'
// review nudge:
url: `/my/bookings?bookingId=${d.bookingId}&review=1`
```

Notification types → URL:
- Booking events → `/my/bookings?bookingId=...`
- Portfolio consent → `/my/notifications`
- Broadcast → `/my/bookings` or external URL
- Review nudge → `/my/bookings?bookingId=...&review=1`

---

## 6. Test Vectors

### Unit Tests
- [ ] `buildActionUrl` — generates correct URL with encoded params
- [ ] `buildActionUrl` — empty payload → no extra params
- [ ] `buildActionUrl` — special chars → properly encoded
- [ ] Zod schema: booking:create valid → pass
- [ ] Zod schema: booking:create missing required → fail
- [ ] Zod schema: client:open valid → pass
- [ ] Zod schema: invalid action type → ignored
- [ ] Short code generation: 6-char unique
- [ ] Short code collision: retry generation

### Integration Tests
- [ ] `?_action=booking:create&serviceId=X` → BookingWizard opens with service
- [ ] `?_action=client:open&clientId=X` → ClientDetailSheet opens
- [ ] `?_action=marketing:broadcast&templateId=X` → Broadcast editor opens
- [ ] `?_action=product:edit&productId=X` → Product editor opens
- [ ] `?clientPhone=X` → ClientDetailSheet opens
- [ ] `?paid=1` → Billing success state
- [ ] `?plan=pro` → Pro plan pre-selected
- [ ] Short link `/r/AbCdEf` → redirect + click tracked
- [ ] Short link invalid → 404
- [ ] Notification URL → navigates to correct page

### E2E Tests
- [ ] Deep link from external → page loads with action
- [ ] URL action bus: cleanup params after execution
- [ ] Tabs via URL: ?tab=flash_deals → Revenue Hub opens flash tab
- [ ] Drawer via URL: ?drawer=referral → Growth Hub opens referral
- [ ] notification click → /my/bookings?bookingId=... → booking highlighted

### Security Tests
- [ ] Action bus: unregistered action → ignored
- [ ] Action bus: malformed payload → ignored, not crashed
- [ ] Action bus: cleaning URL uses replaceState (not pushState)
- [ ] Short link: cannot enumerate codes (random)
- [ ] Booking ID: user can only open own bookings (RLS)
- [ ] Client phone: current master's clients only (RLS)

---

## 7. Backlog (Unfinished Deep Links)

| Priority | Param | Page | What's Needed |
|---|---|---|---|
| 🔴 HIGH | `?bookingId={id}` | `/my/bookings` | Scroll to + highlight specific booking |
| 🔴 HIGH | `?bookingId={id}&review=1` | `/my/bookings` | + Auto-open review form |
| 🟡 MEDIUM | `?add_product={id}` | `/[slug]/shop` | Auto-add product to cart |
| 🟡 MEDIUM | `?flashDealId={id}` | `/[slug]` | Auto-open BookingWizard for flash deal |
| 🟢 LOW | `?albumId={id}` | `/[slug]/portfolio` | Highlight specific album |
| 🟡 MEDIUM | `booking:reschedule` | Action Bus | Schema ready, no consumer yet |
| 🟢 LOW | `ui:open_drawer` | Action Bus | Schema ready, no consumer |
| 🟢 LOW | `flash:create` | Action Bus | Schema ready, no consumer |

---

## 8. File Inventory

### Core
- `src/lib/actions/UrlActionBus.ts`

### Consumers (existing)
- `src/components/public/PublicMasterPage.tsx`
- `src/components/master/bookings/BookingsPage.tsx`
- `src/components/master/clients/ClientsPage.tsx`
- `src/components/master/marketing/BroadcastsTab.tsx`
- `src/components/master/products/ProductsPage.tsx`
- `src/components/master/growth/GrowthHubClient.tsx`
- `src/components/master/revenue/RevenueHubClient.tsx`
- `src/components/master/billing/BillingPage.tsx`
- `src/app/auth/callback/route.ts`
- `src/components/master/dashboard/DashboardDrawers.tsx`

### Short Links
- `src/app/r/[code]/route.ts`
- `src/lib/utils/broadcastUtils.ts`

### Notification URLs
- `src/lib/notifications/constants/notifMap.ts`
