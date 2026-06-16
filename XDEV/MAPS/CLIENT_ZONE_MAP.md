# B2C Client Zone — Complete Map

> **Updated**: 2026-05-27 | **Scope**: All `/my/*` routes, client-facing public pages, auth flow
> **Corresponds to**: `XDEV/MAPS/SYSTEM_MAP.md` — Client Zone section

---

## 1. Route Hierarchy

```
/my/*                              — Client portal (auth required)
  /my/bookings                     — Unified orders (bookings + shop) [redesigned T17, vaul Sheets]
  /my/messages                     — Direct messages list (client-master chat) [T-chat, 2026-06-15]
  /my/messages/[id]                — Direct chat with specific master (Realtime, read receipts, image attachments)
  /my/masters                      — My masters list
  /my/loyalty                      — Loyalty + C2C/C2B referrals
  /my/notifications                — Notification feed + portfolio consent
  /my/profile                      — Profile editor [T21: avatar upload, social fields, identity card]
  /my/setup/phone                  — Phone setup (post-OAuth)

Public pages (client-facing):
  /[slug]                          — Master public profile
  /[slug]/shop                     — Master shop
  /explore                         — Master discovery
  /studio/[slug]                   — Studio/collective page
  /r/[code]                        — Referral landing → redirect to /[slug]

Auth:
  /login                           — Login page
  /auth/callback                   — OAuth callback
  /api/auth/send-sms               — SMS OTP send
  /api/auth/verify-sms             — SMS OTP verify
  /api/auth/set-role-intent        — Pre-OAuth role lock
  /api/push/subscribe              — Push subscription
```

---

## 2. Pages — Server Component Data Fetching

### `src/app/my/layout.tsx`
- Auth check (getUser → getSession fallback)
- Fetches: `full_name, phone, push_sub { id }`, `telegram_chat_id`
- Renders: `PublicNavbar`, `SmartBackButton`, `BlobBackground`, `MasterModeBanner`, `ChannelBanner`
- Wraps `<B2CRouteGuard>` (redirects to `/my/setup/phone` if no phone)
- `pb-32` for mobile nav

### `src/app/my/bookings/page.tsx`
- **Query**: `bookings` filtered by `client_id` with joins: `master_profiles!inner ( slug, business_name, avatar_emoji )`, `booking_services ( name, price )`, `booking_products ( name, price, qty )`, `reviews ( id )`
- **Query**: `orders` filtered by `client_id` with joins: `master_profiles ( slug, business_name, avatar_emoji )`, `order_items ( name, price, qty )`
- **Output**: Normalized `UnifiedOrder[]` → `<MyBookingsPage>`
- **Actions**: `cancelBooking(bookingId)`, `submitReview({bookingId?, orderId?, masterId, rating, comment})`

### `src/app/my/messages/page.tsx` (T-chat, 2026-06-15)
- **Query**: `getConversations(userId)` → list of conversations з `last_message`, `unread_count`
- **Output**: `<MessagesListPage>`
- **Entry points**: MasterGroup header + MasterCard у `/my/bookings` та `/my/masters`

### `src/app/my/messages/[id]/page.tsx` (T-chat, 2026-06-15)
- **Query**: `getOrCreateConversation(masterId)` → conversation + messages history
- **Realtime**: `useDMChat(conversationId)` — Supabase Realtime INSERT+UPDATE on `direct_messages`
- **Actions**: `sendDirectMessage(conversationId, text, imageUrl?)`, `markConversationRead(conversationId)`
- **Output**: `<DirectChatPage>` (iOS keyboard push-up via visualViewport resize, check/checkcheck read receipts)

### `src/app/my/profile/page.tsx`
- **Query**: `profiles` → `full_name, phone, email, telegram_chat_id, medical_notes, health_notes, avatar_url, social_links`
- **Query**: last booking's `master_id` from `bookings`
- **Output**: `<MyProfilePage>` [T21: Identity Card redesign, avatar upload → `avatars` bucket, social fields]
- **Actions**: `updateClientProfile(name, phone, medicalNotes?, healthNotes?)`, `disconnectClientTelegram()`, `updateAvatar(file)`

### `src/app/my/notifications/page.tsx`
- **Query**: `notifications` (50 most recent) via admin client
- **Query**: portfolio items where `tagged_client_id = userId AND consent_status = 'pending'`
- **Side-effect**: Marks all notifications as read
- **Output**: `<ClientNotificationsPage>`
- **Actions**: `approvePortfolioConsent(itemId)`, `declinePortfolioConsent(itemId)`

### `src/app/my/loyalty/page.tsx`
- **Query**: `client_master_relations` for visit/loyalty data
- **Query**: `loyalty_programs` for each master
- **Query**: `getOrGenerateProfileReferralCode(id, 'client')`
- **Query**: `client_promocodes` for C2B referral discounts
- **Query**: `c2c_referrals` (grouped by master_id) for C2C stats
- **Output**: `<MyLoyaltyPage>`

### `src/app/my/masters/page.tsx`
- **Query**: All non-cancelled bookings grouped by `master_id`
- **Query**: `master_profiles` for each master (slug, business_name, avatar_emoji, categories, city)
- **Output**: `<MyMastersPage>`

### `src/app/my/setup/phone/page.tsx`
- Renders `<PhoneSetupForm>` in glass card
- **Actions**: `confirmPhone(phone, otp)` — validates OTP from `sms_otps` table, creates `client_profiles` row

---

## 3. Client Components

### `src/components/client/B2CRouteGuard.tsx`
Redirects to `/my/setup/phone` if phone missing. Renders nothing until guard passes.

### `src/components/client/ClientRealtimeSync.tsx`
Subscribes to Realtime `bookings` table. On UPDATE with matching `client_id`, calls `router.refresh()`.

### `src/components/client/MyBookingsPage.tsx`
- Tabs: "Записи" / "Магазин"
- Groups: "Найближчі" (upcoming), "Минулі" (past)
- Per-item: avatarEmoji/avatarUrl, service details, Google Maps route, status badge
- Actions: cancel (pending/confirmed), submit star-rating review
- Calls `cancelBooking`, `submitReview` from `@/app/my/bookings/actions`

### `src/components/client/MyProfilePage.tsx`
- Edit name, phone, medical notes, health notes
- Telegram connect via `@botName?start=userId`
- Push subscription via `<PushSubscribeCard>`
- Sign out
- Phone formatting: `e164ToInputPhone`, `formatPhoneDisplay`, `normalizePhoneInput`, `toFullPhone`

### `src/components/client/MyLoyaltyPage.tsx`
- Tab "Лояльність" — progress bars per master
- Tab "Refer & Earn":
  - "Для подруг" (C2C) — share links per master
  - "Запросити майстра" (C2B) — invite link, promocode cards
- Share via `navigator.share` or clipboard fallback

### `src/components/client/MyMastersPage.tsx`
- Master list: avatarEmoji/avatarUrl, name, categories, city, visit count, last visit
- Empty state → CTA to `/explore`

### `src/components/client/ClientNotificationsPage.tsx`
- Portfolio consent cards (approve/decline with image)
- Notification list with contextual icons:
  - `CalendarDays` → booking status
  - `Star` → review
  - `Megaphone` → broadcast
- Broadcast body parsing (text + URL link)
- Click → `/my/bookings` or external URL
- `timeAgo` formatting

### `src/components/client/MasterModeBanner.tsx`
Sticky banner: "Режим клієнта" + "До дашборду" (clears `view_mode` → `/dashboard`)

### `src/components/client/ChannelBanner.tsx`
Dismissible banner for Telegram connect + Push subscribe setup. Inline push via `navigator.serviceWorker.pushManager.subscribe`.

### `src/components/client/MyBottomNav.tsx`
Mobile bottom nav (5 tabs):
- CalendarDays → `/my/bookings`
- Users → `/my/masters`
- Gift → `/my/loyalty`
- Bell → `/my/notifications`
- User → `/my/profile`

For unauthenticated: Catalog + Login via `NavLoginSheet`.

### `src/components/client/PhoneSetupForm.tsx`
Two-step: phone input → OTP input. Calls `POST /api/auth/send-sms`, then `confirmPhone`. 6-digit OTP with auto-submit, paste support, resend timer.

---

## 4. Public Components Serving Clients

### `src/components/public/PublicMasterPage.tsx`
Master's `/[slug]` landing page. Sections:
- Hero: avatar (Image or emoji fallback), name, verification badge, specialty, rating, location
- **LoyaltyWidget** — progress bar
- **MasterLocationCard** — Google Maps
- Shop banner → `/[slug]/shop`
- **PublicPortfolioGallery** — work examples
- Service cards by category + flash deals strip (countdown timer)
- Product previews, reviews, **TrustedPartnersBlock**
- C2C referral banners
- Floating "Записатися" CTA → opens `BookingFlow`

### `src/components/public/BookingFlow.tsx`
Adapter for `BookingWizard` in `mode="client"`. Resolves flash deal fast-track, passes C2C params. Lazy-loaded.

### `src/components/public/ClientAuthSheet.tsx`
Post-booking registration sheet. Offers Google OAuth or email. Lists benefits. Calls `linkBookingToClient`. Appears in bottom sheet for non-auth users.

### `src/components/public/PostBookingAuth.tsx`
4-step post-booking auth: choose → phone → OTP → channels.
- Calls `POST /api/auth/send-sms`, `POST /api/auth/verify-sms`
- Fetches loyalty programs for the master
- Telegram + Push setup after registration

### `src/components/public/ExplorePage.tsx`
Master discovery at `/explore`. Features:
- Search bar, category chips (with category emoji — see #Hardcoded)
- City filter dropdown
- Sort: popular / rating / newest
- Master cards: avatar (Image or emoji), rating, categories, city, PRO badge

### `src/components/public/StudioPublicPage.tsx`
Studio/collective page. Shows members with services, ratings, direct booking links.

### `src/components/public/ShopPage.tsx`
Full shop at `/[slug]/shop`:
- Category filtering, cart, Nova Poshta delivery
- Checkout form → order creation
- Product stock qty display

### `src/components/public/NavLoginSheet.tsx`
Bottom sheet login: Google OAuth + email/password.

### `src/components/public/PublicNavbar.tsx` (Server Component)
Desktop top nav: logo, Каталог, Майстри/Бонуси (auth), Мої записи/Профіль (auth), Увійти/Стати майстром (guest).

### `src/components/public/PublicMobileHeader.tsx` (Server Component)
Mobile header: back button, logo, profile/login icon.

### `src/components/public/LoyaltyWidget.tsx`
Three states: unauth (teaser), in-progress (progress bar), max tier (constant discount).

### `src/components/public/MasterLocationCard.tsx`
Google Maps static map + address. Navigation link.

### `src/components/public/TrustedPartnersBlock.tsx`
Trusted partner masters list with avatars (Image or emoji), specialties.

### `src/components/public/portfolio/PublicPortfolioGallery.tsx`
Portfolio gallery section. Cover images with lightbox.

### `src/components/public/portfolio/PortfolioBookingButton.tsx`
"Хочу так само" → opens BookingWizard with pre-selected service.

---

## 5. Wizard / Shared Components (Client-Mode)

### `src/components/shared/BookingWizard.tsx`
4-step: services → datetime → products → details → success.
- `mode="client"` enables C2C, loyalty, flash, phone broadcast discounts
- Calls `createBooking()` server action
- Starter plan limit: 40 bookings/month

### `src/components/shared/wizard/ServiceSelector.tsx`
Service picker with dynamic pricing labels, flash deal indicators.

### `src/components/shared/wizard/DateTimePicker.tsx`
Calendar + time slot picker. Fluid Anchor algorithm.

### `src/components/shared/wizard/ProductCart.tsx`
Product selection + cart for combined booking.

### `src/components/shared/wizard/ClientDetails.tsx`
Name/phone/email input + notes + price breakdown (all discounts computed).

### `src/components/shared/wizard/BookingSuccess.tsx`
Confirmation + C2C share link + `PostBookingAuth` for non-auth clients.

### `src/components/shared/wizard/PushPrompt.tsx`
Push subscription prompt after booking.

### `src/components/shared/wizard/useBookingWizardState.ts`
State management: step nav, selection, react-hook-form + Zod, C2C/loyalty logic.

### `src/components/shared/wizard/useBookingPricing.ts`
Calls `computeBookingPrice` server action.

### `src/components/shared/wizard/useBookingScheduleData.ts`
Fetches available slots.

### `src/components/shared/wizard/types.ts`
Types: `WizardService`, `WizardProduct`, `BookingWizardProps`, `WizardStep`

### `src/components/shared/PushSubscribeCard.tsx`
Push subscription with all states (checking/prompt/subscribing/subscribed/blocked/pwa-hint/unsupported).

### `src/components/shared/SmartBackButton.tsx`
Floating back button with history awareness.

### `src/components/shared/ServiceWorkerRegistration.tsx`
PWA service worker registration.

### `src/components/shared/InstallBanner.tsx`
PWA install banner.

---

## 6. Client Actions & Server Actions

| File | Function | Purpose |
|---|---|---|
| `src/app/my/bookings/actions.ts` | `cancelBooking(bookingId)` | Client cancels → notify master (Telegram + Push) |
| `src/app/my/bookings/actions.ts` | `submitReview({...})` | Submit rating + comment → notify master |
| `src/app/my/profile/actions.ts` | `updateClientProfile(...)` | Update name/phone/notes + Auth metadata |
| `src/app/my/profile/actions.ts` | `disconnectClientTelegram()` | Remove telegram_chat_id |
| `src/app/my/setup/phone/actions.ts` | `confirmPhone(phone, otp)` | Verify SMS OTP → create client_profiles |
| `src/app/my/portfolio-consent/actions.ts` | `approvePortfolioConsent(itemId)` | Approve portfolio photo |
| `src/app/my/portfolio-consent/actions.ts` | `declinePortfolioConsent(itemId)` | Decline portfolio photo |
| `src/lib/actions/createBooking.ts` | `createBooking(payload)` | Unified booking creation (client + master) |
| `src/lib/actions/computeBookingPrice.ts` | `computeBookingPrice(input)` | Price with dynamic/loyalty/flash/C2C/barter |
| `src/lib/actions/referrals.ts` | `getOrGenerateProfileReferralCode(...)` | C2C/C2B referral codes |
| `src/lib/actions/referrals.ts` | `getOrCreateReferralLink()` | Share link generation |
| `src/lib/actions/referrals.ts` | `applyReferralRewards()` | C2B bonus awards |
| `src/lib/actions/referrals.ts` | `checkC2cEligibility()` | Validate C2C friend discount |
| `src/lib/actions/UrlActionBus.ts` | `useUrlActionBus`, `buildActionUrl` | Deep-link action bus (`booking:create`, `client:open`) |
| `src/app/[slug]/actions.ts` | `linkBookingToClient(bookingId)` | Link anonymous booking to authenticated client |
| `src/app/[slug]/actions.ts` | `ensureClientProfile()` | Ensure client_profiles row exists |
| `src/app/[slug]/actions.ts` | `createPublicOrder(...)` | Create shop order from public page |

---

## 7. Notification System (Client-Facing)

### Event Types
| Event | Critical (SMS) | Template |
|---|---|---|
| `booking_created` | ✅ | Confirmation + details |
| `booking_confirmed` | ✅ | Master confirmed |
| `booking_cancelled` | ✅ | Cancellation notice |
| `booking_rescheduled` | ✅ | Time changed |
| `booking_completed` | ❌ | Review nudge |
| `reminder_24h` | ❌ | 24h reminder |
| `reminder_2h` | ✅ | 2h reminder (SMS) |
| `reminder_30m` | ❌ | 30min reminder |
| `rebooking_reminder` | ❌ | Retention nudge |
| `portfolio_consent_request` | ❌ | Photo approval |
| `order_shipped` | ❌ | Shop order shipped |
| `order_completed` | ❌ | Shop order completed |

### Dispatch: `NotificationOrchestrator`
Cascade: In-App + Push (parallel) → Telegram (if push fails) → SMS (critical only)

### Notification Senders
| Function | Sender | To |
|---|---|---|
| `notifyClientOnStatusChange` | Master | Client |
| `notifyClientOnReschedule` | Master | Client |
| `notifyClientPortfolioConsent` | Master | Client |
| `notifyClientOrderStatus` | Master | Client |
| `notifyClientBroadcast` | Master | Client |
| `notifyMasterBookingCancelled` | Client | Master |
| `notifyMasterNewReview` | Client | Master |

---

## 8. Data Flow

```
Public (unauth):
  /explore → fetch masters + profiles → ExplorePage (avatarUrl support)
  /[slug] → getMaster() → PublicMasterPage → BookingFlow → BookingWizard
  /studio/[slug] → fetch studio members → StudioPublicPage
  /[slug]/shop → fetch products → ShopPage

Client portal (auth required):
  OAuth → /auth/callback → client_profiles upsert → phone check
    → /my/setup/phone (if no phone) → /my/bookings (if has phone)

  /my/bookings → fetch unified orders → MyBookingsPage
    → cancelBooking → notify master
    → submitReview → notify master

  /my/loyalty → fetch relations/programs/promocodes → MyLoyaltyPage
    → share C2C/C2B links

  /my/notifications → fetch notifications + portfolio consents
    → ClientNotificationsPage
    → approvePortfolioConsent / declinePortfolioConsent

  /my/profile → fetch profile → MyProfilePage
    → updateClientProfile / disconnectTelegram

  Booking flow:
    BookingWizard (mode=client) → computeBookingPrice → createBooking
    → NotificationOrchestrator (In-App + Push + Telegram + SMS)
    → BookingSuccess → PostBookingAuth (if unauth)
```

---

## 9. Auth Flow Detail

```
1. User clicks "Записатися" or "Увійти"
2. Google OAuth or Email/Password or SMS OTP
3. POST /api/auth/set-role-intent → cookie bookit_reg_role=client
4. OAuth → /auth/callback → code exchange → session
5. Check role_intent cookie:
   - client → upsert client_profiles row
   - check phone: has phone? → /my/bookings : /my/setup/phone
6. SMS OTP path:
   - PhoneSetupForm → POST /api/auth/send-sms → SMS with code
   - PhoneSetupForm → POST /api/auth/verify-sms → virtual email + magic link
   - confirmPhone action → create client_profiles + link bookings → /my/bookings
7. PostBookingAuth (after booking, no session):
   - Step 1: choose (Google / SMS / Skip)
   - Step 2: phone input
   - Step 3: OTP verify (supabase.auth.verifyOtp)
   - Step 4: channels (Telegram + Push)
```

---

## 10. File Index

### Page files (7 pages + actions)
| File | Type |
|---|---|
| `src/app/my/layout.tsx` | Server Component layout |
| `src/app/my/bookings/page.tsx` | Server Component page |
| `src/app/my/bookings/actions.ts` | Server Actions |
| `src/app/my/profile/page.tsx` | Server Component page |
| `src/app/my/profile/actions.ts` | Server Actions |
| `src/app/my/notifications/page.tsx` | Server Component page |
| `src/app/my/loyalty/page.tsx` | Server Component page |
| `src/app/my/masters/page.tsx` | Server Component page |
| `src/app/my/setup/phone/page.tsx` | Server Component page |
| `src/app/my/setup/phone/actions.ts` | Server Actions |
| `src/app/my/portfolio-consent/actions.ts` | Server Actions |

### Client Components (`src/components/client/`, 11 files)
| File | Export |
|---|---|
| `B2CRouteGuard.tsx` | `B2CRouteGuard` |
| `ClientRealtimeSync.tsx` | `ClientRealtimeSync` |
| `MyBookingsPage.tsx` | `MyBookingsPage` |
| `MyProfilePage.tsx` | `MyProfilePage` |
| `MyLoyaltyPage.tsx` | `MyLoyaltyPage` |
| `MyMastersPage.tsx` | `MyMastersPage` |
| `ClientNotificationsPage.tsx` | `ClientNotificationsPage` |
| `MasterModeBanner.tsx` | `MasterModeBanner` |
| `ChannelBanner.tsx` | `ChannelBanner` |
| `MyBottomNav.tsx` | `MyBottomNav` |
| `PhoneSetupForm.tsx` | `PhoneSetupForm` |

### Public Components Serving Clients (`src/components/public/`, 15 files)
| File | Export |
|---|---|
| `PublicMasterPage.tsx` | `PublicMasterPage` |
| `BookingFlow.tsx` | `BookingFlow` |
| `ClientAuthSheet.tsx` | `ClientAuthSheet` |
| `PostBookingAuth.tsx` | `PostBookingAuth` |
| `ExplorePage.tsx` | `ExplorePage` |
| `StudioPublicPage.tsx` | `StudioPublicPage` |
| `ShopPage.tsx` | `ShopPage` |
| `NavLoginSheet.tsx` | `NavLoginSheet` |
| `PublicNavbar.tsx` | `PublicNavbar` |
| `PublicMobileHeader.tsx` | `PublicMobileHeader` |
| `LoyaltyWidget.tsx` | `LoyaltyWidget` |
| `MasterLocationCard.tsx` | `MasterLocationCard` |
| `TrustedPartnersBlock.tsx` | `TrustedPartnersBlock` |
| `portfolio/PublicPortfolioGallery.tsx` | `PublicPortfolioGallery` |
| `portfolio/PortfolioBookingButton.tsx` | `PortfolioBookingButton` |

### Wizard Components (`src/components/shared/wizard/`, 8 files)
| File | Export |
|---|---|
| `BookingWizard.tsx` | `BookingWizard` (re-export from `src/components/shared/`) |
| `ServiceSelector.tsx` | `ServiceSelector` |
| `DateTimePicker.tsx` | `DateTimePicker` |
| `ProductCart.tsx` | `ProductCart` |
| `ClientDetails.tsx` | `ClientDetails` |
| `BookingSuccess.tsx` | `BookingSuccess` |
| `PushPrompt.tsx` | `PushPrompt` |
| `types.ts` | Types |
| `useBookingWizardState.ts` | `useBookingWizardState` |
| `useBookingPricing.ts` | `useBookingPricing` |
| `useBookingScheduleData.ts` | `useBookingScheduleData` |

### Actions & Lib
| File | Export |
|---|---|
| `src/lib/actions/createBooking.ts` | `createBooking`, `CreateBookingPayload`, `CreateBookingResult` |
| `src/lib/actions/computeBookingPrice.ts` | `computeBookingPrice` |
| `src/lib/actions/referrals.ts` | Referral functions |
| `src/lib/actions/UrlActionBus.ts` | URL action bus |
| `src/app/[slug]/actions.ts` | `linkBookingToClient`, `ensureClientProfile`, `createPublicOrder` |

---

## 11. Remaining Hardcoded Values (not yet refactored)

> Found during 2026-05-23 audit of all client/public files.

### Emoji in UI (must use Lucide icons)
| File | Line | Issue |
|---|---|---|
| `src/components/client/MyProfilePage.tsx` | 177 | `⚠️` in comment only (harmless) |
| `src/components/public/PublicMasterPage.tsx` | 468 | `🎁` emoji in flash deal card |
| `src/components/public/PostBookingAuth.tsx` | 284,289,331,344,391,397-399,560,581,611 | ~12 emoji (⭐🔔💎🎁✨✈️✅) |
| `src/components/public/ClientAuthSheet.tsx` | 130 | `✨` emoji |
| `src/app/my/bookings/actions.ts` | 188 | `⭐` in notification title |
| `src/app/my/bookings/page.tsx` | 55 | `💅` fallback |
| `src/app/my/loyalty/page.tsx` | 54,88,118 | `💅` fallback |
| `src/app/my/masters/page.tsx` | 47 | `💅` fallback |
| `src/lib/constants/categories.ts` | 2-8 | Category emoji (💅💇💁💄💆🪒) — used by ExplorePage |
| `src/components/public/ExplorePage.tsx` | 179,376 | `{cat.emoji}` from categories constants |

### Hardcoded Hex Colors (not using CSS vars)
| File | Line(s) | Colors |
|---|---|---|
| `src/components/public/LoyaltyWidget.tsx` | 36,50,70,73,77,95,104,109 | `#D4935A`, `#5C9E7A` — should be `var(--warning)`, `var(--success)` |
| `src/components/public/PublicMasterPage.tsx` | 230,439-444,459-460,466,497-498,503,548-549,735,783,785,799,815,882,1062,1065 | `#2C1A14`, `#6B5750`, `#A8928D`, `#5C9E7A`, `#F5E8E3` — theme-dark logic dynamic colors |
| `src/components/public/PublicMasterPage.tsx` | 1062 | `shadow-[0_12px_40px_rgba(0,0,0,0.18)]` |
| `src/components/public/ShopPage.tsx` | 128,175-176,183,242,349,364,652,711 | `#FFE8DC`, `#A87C5C`, `#C2739A`, `#5FA89A`, `#2C1A14` — category colors + gradient |
| `src/components/public/PostBookingAuth.tsx` | 580,595 | `#229ED9` — should be `var(--accent)` |
| `src/components/public/ExplorePage.tsx` | 91 | `#FFD2C2`, `#F0EAE8`, `#D4E8E7` gradient |
| `src/components/public/StudioPublicPage.tsx` | 179 | `shadow-[0_4px_14px_rgba(120,154,153,0.3)]` |
| `src/components/public/PublicNavbar.tsx` | 13 | `shadow-[0_8px_40px_rgba(44,26,20,0.12)]` |
| `src/components/public/ClientAuthSheet.tsx` | 17-20 | Google SVG brand colors (`#4285F4`, `#34A853`, `#FBBC05`, `#EA4335`) — acceptable |
| `src/components/public/NavLoginSheet.tsx` | 16-19 | Google SVG brand colors — acceptable |

### Hardcoded `rounded-[Npx]`
| File | Line(s) | Issue |
|---|---|---|
| `src/components/public/PublicMasterPage.tsx` | 457,495,545,780 | `rounded-[28px]`, `rounded-[24px]` — should be `rounded-xl` (card 24px) |

### `shadow-[...]`
| File | Line(s) |
|---|---|
| `PublicMasterPage.tsx:1062` | `shadow-[0_12px_40px_rgba(0,0,0,0.18)]` |
| `PublicNavbar.tsx:13` | `shadow-[0_8px_40px_rgba(44,26,20,0.12)]` |
| `StudioPublicPage.tsx:179` | `shadow-[0_4px_14px_rgba(120,154,153,0.3)]` |
| `ShopPage.tsx:652,711` | `shadow-[#2C1A14]/20` |

### `rgba()` inline styles
| File | Line(s) | Issue |
|---|---|---|
| `PublicMasterPage.tsx` | 439-444,459-460,466,497-498,503,548-549,735,783,785,799,815,882,1062,1065 | ~20 rgba() — theme-dark dynamic logic |
| `PostBookingAuth.tsx` | 300,318,358,378,578,595,608 | ~10 rgba() — inline styles in auth flow |
| `LoyaltyWidget.tsx` | 36,73,101,104 | ~4 rgba() — loyalty progress bar |

> **Note**: `PublicMasterPage.tsx` has the most complex theme-dark dynamic logic (isDark ? darkValue : lightValue). These are intentional — dark theme uses raw rgba values that can't easily be CSS vars. The `ShopPage` category colors (#A87C5C, #C2739A etc) are a dynamic mapping from category IDs to brand colors, not static overrides.
