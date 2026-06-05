# 09 — Client Portal Domain Map

## 1. Domain Overview

Особистий кабінет клієнта `/my/*` — управління записами, профілем, лояльністю, майстрами та сповіщеннями.

### Key Files
- `src/app/my/layout.tsx` — Server layout with auth guard + channel check
- `src/app/my/bookings/page.tsx` — Unified orders (bookings + shop)
- `src/app/my/bookings/actions.ts` — cancelBooking, submitReview
- `src/app/my/profile/page.tsx` — Profile page
- `src/app/my/profile/actions.ts` — updateClientProfile, disconnectTelegram
- `src/app/my/notifications/page.tsx` — Notifications + portfolio consent
- `src/app/my/loyalty/page.tsx` — Loyalty + referrals
- `src/app/my/masters/page.tsx` — Saved masters
- `src/app/my/setup/phone/page.tsx` — Phone setup
- `src/app/my/portfolio-consent/actions.ts` — approve/decline consent
- `src/components/client/MyBookingsPage.tsx`
- `src/components/client/MyProfilePage.tsx`
- `src/components/client/MyLoyaltyPage.tsx`
- `src/components/client/MyMastersPage.tsx`
- `src/components/client/ClientNotificationsPage.tsx`
- `src/components/client/ChannelBanner.tsx`
- `src/components/client/MyBottomNav.tsx`
- `src/components/client/PhoneSetupForm.tsx`
- `src/components/client/MasterModeBanner.tsx`

### DB Tables
- `bookings` (filtered by client_id)
- `orders` (filtered by client_id)
- `profiles` — full_name, phone, telegram_chat_id, health_notes
- `client_master_relations` — visits, spent, loyalty
- `notifications` — In-app notifications
- `portfolio_items` — items tagged with client_id (consent)
- `loyalty_programs` — Master's loyalty config
- `c2c_referrals`, `client_promocodes` — Referral data

---

## 2. State Machine

### 2.1 MyBookingsPage (Unified Orders)

```
[LOADING] → fetch bookings + orders
  → [READY] → tab: "Записи" / "Магазин"
    → grouped: "Найближчі" (upcoming) / "Минулі" (past)
  → [EMPTY] → no bookings or orders → empty state
  → [ERROR] → fetch failed

Per booking card:
  → avatar + name + service + date/time + status badge
  → CANCEL → booking.status = cancelled → notify master
  → REVIEW → star rating + comment → submitReview → notify master
  → MAPS → Google Maps route to master
```

**Booking Statuses visible to client:**
| Status | Client Action |
|---|---|
| `pending` | Cancel |
| `confirmed` | Cancel, Add to calendar |
| `completed` | Review |
| `cancelled` | Rebook? |
| `no_show` | — |

### 2.2 MyProfilePage

```
[LOADING] → fetch profile
  → [READY] → edit form:
    → name (editable)
    → phone (editable, with OTP verification)
    → medical notes (editable)
    → health notes (editable)
    → TG connect button
    → Push subscribe card
    → Sign out button
  → [SAVING] → updateClientProfile → debounced
    → [SUCCESS] → toast
    → [ERROR] → toast
```

### 2.3 MyLoyaltyPage

```
[LOADING] → fetch loyalty data per master
  → [READY] → tabs:
    → "Лояльність" — progress bars per master (tiers)
    → "Запросити та заробляй" — referral:
      → C2C: share links per master
      → C2B: invite your master
  → [EMPTY] → "Ще не відвідали жодного майстра"
```

**Loyalty Widget States:**
- UNAUTH — not logged in → teaser
- IN_PROGRESS — has progress → progress bar
- MAX_TIER — reached max → "Ви досягли максимуму"

### 2.4 ClientNotificationsPage

```
[LOADING] → fetch 50 recent notifications + portfolio consent requests
  → [READY] → sections:
    1. PENDING CONSENT: cards with photos, Approve/Decline
    2. NOTIFICATION FEED: contextual icons
  → [EMPTY] → empty state

Notification Types → Icon:
  → CalendarDays → booking status change
  → Star → new review
  → Megaphone → broadcast from master
  → Image → portfolio consent request

Actions:
  → approvePortfolioConsent(itemId) → consent_status = 'approved'
  → declinePortfolioConsent(itemId) → consent_status = 'declined'
  → Click notification → navigate (/my/bookings or external URL)
```

### 2.5 MyMastersPage

```
[LOADING] → fetch masters with booking history
  → [READY] → list: avatar, name, categories, city, visits, last visit
  → [EMPTY] → "Ще не записувались до майстрів" + CTA to /explore
```

### 2.6 ChannelBanner

```
Server check in layout:
  → profiles.telegram_chat_id exists?
  → push_subscriptions.length > 0?
  → MISSING_ANY → show banner
  → BOTH_OK → no banner
  → DISMISSED (session cookie) → hidden
```

---

## 3. Environment Matrix

| Environment | Portal Behavior |
|---|---|
| Desktop | Full layout with sidebar |
| Mobile | Bottom nav, sheet navigation |
| Tablet | Hybrid |
| PWA | Like mobile, install banner |

### Auth States
| State | Access |
|---|---|
| Authenticated client | Full portal |
| Authenticated master | MasterModeBanner "Режим клієнта" |
| Guest | Redirect to /login |
| No phone | Redirect to /my/setup/phone |

---

## 4. Load & Concurrency Vectors

| Vector | Risk |
|---|---|
| Many bookings (100+) | Render performance |
| Realtime subscription + page load | Double refresh |
| Portfolio consent approval + notification read | Race? |

---

## 5. Data Variations

| Variation | Effect |
|---|---|
| 0 bookings | Empty state → no upcoming/past |
| 0 orders | Shop tab empty |
| No loyalty program | Loyalty section hidden |
| No phone | Redirect to setup |
| No TG connected | ChannelBanner shows |
| No Push subscribed | ChannelBanner shows |
| 50+ notifications | Paginate? (currently 50) |
| Pending consent with no photo | Show placeholder |
| Master deleted profile | Booking shows "Недоступний" |

---

## 6. Test Vectors

### E2E Tests
- [ ] My bookings: upcoming bookings listed
- [ ] My bookings: past bookings listed
- [ ] My bookings: cancel booking
- [ ] My bookings: submit review (star + comment)
- [ ] My bookings: switch to "Магазин" tab
- [ ] My bookings: empty state → text visible
- [ ] My profile: edit name → save → updated
- [ ] My profile: edit phone → OTP → updated
- [ ] My profile: medical notes edit → save
- [ ] My profile: sign out → redirect to /
- [ ] My loyalty: progress bars per master
- [ ] My loyalty: share C2C link → navigator.share/clipboard
- [ ] My loyalty: C2B invite → promocode visible
- [ ] My loyalty: empty state (no masters)
- [ ] My masters: list with visit count
- [ ] My masters: empty → CTA to /explore
- [ ] My notifications: feed renders
- [ ] My notifications: portfolio consent approve
- [ ] My notifications: portfolio consent decline
- [ ] ChannelBanner: appears when TG missing
- [ ] ChannelBanner: dismiss → hidden (session)
- [ ] ChannelBanner: auto-hides when both connected

### Security Tests
- [ ] Client A cannot see Client B's data
- [ ] Guest cannot access /my/ → redirect
- [ ] Master in client mode → MasterModeBanner visible
- [ ] Portfolio consent: client can only see own items

---

## 7. File Inventory

### Pages
- `src/app/my/layout.tsx`
- `src/app/my/bookings/page.tsx`
- `src/app/my/bookings/actions.ts`
- `src/app/my/profile/page.tsx`
- `src/app/my/profile/actions.ts`
- `src/app/my/notifications/page.tsx`
- `src/app/my/loyalty/page.tsx`
- `src/app/my/masters/page.tsx`
- `src/app/my/setup/phone/page.tsx`
- `src/app/my/setup/phone/actions.ts`
- `src/app/my/portfolio-consent/actions.ts`

### Components
- `src/components/client/MyBookingsPage.tsx`
- `src/components/client/MyProfilePage.tsx`
- `src/components/client/MyLoyaltyPage.tsx`
- `src/components/client/MyMastersPage.tsx`
- `src/components/client/ClientNotificationsPage.tsx`
- `src/components/client/ChannelBanner.tsx`
- `src/components/client/MyBottomNav.tsx`
- `src/components/client/PhoneSetupForm.tsx`
- `src/components/client/MasterModeBanner.tsx`
- `src/components/client/B2CRouteGuard.tsx`
- `src/components/client/ClientRealtimeSync.tsx`

### Existing Tests
- `e2e/tests/14-client-journey.spec.ts`
