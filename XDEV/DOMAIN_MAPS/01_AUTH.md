# 01 — Auth & Identity Domain Map

## 1. Domain Overview

Система автентифікації BookIT підтримує 4 методи входу, 2 ролі (master/client), guest flow без реєстрації, та PostBookingAuth для прив'язки анонімного запису.

### Key Files
- `src/app/(auth)/layout.tsx` — Frost split-screen layout
- `src/components/auth/PhoneOtpForm.tsx` — "Nordic Slab" 3-step flow
- `src/app/auth/callback/route.ts` — OAuth callback handler
- `src/app/api/auth/send-sms/route.ts` — SMS OTP send
- `src/app/api/auth/verify-sms/route.ts` — SMS OTP verify
- `src/app/api/auth/set-role-intent/route.ts` — Pre-OAuth role lock
- `src/app/api/auth/telegram/route.ts` — Telegram OAuth
- `src/app/api/auth/telegram/link-phone/route.ts` — TG phone linking
- `src/components/public/PostBookingAuth.tsx` — 4-step post-booking auth
- `src/components/public/ClientAuthSheet.tsx` — Post-booking registration sheet
- `src/components/public/NavLoginSheet.tsx` — Bottom sheet login
- `src/components/client/PhoneSetupForm.tsx` — Phone setup
- `src/proxy.ts` — Routing guard
- `src/components/providers/TelegramProvider.tsx` — TMA provider

### DB Tables
- `profiles` — full_name, phone, role, telegram_chat_id, onboarding_step
- `sms_otps` — OTP codes (TTL 10 min, used flag)
- `sms_verify_attempts` — Rate-limit (10/15 min)
- `sms_ip_logs` — Rate-limit by IP (10/h)

### API Routes
- `POST /api/auth/send-sms` — Send OTP
- `POST /api/auth/verify-sms` — Verify OTP → magiclink
- `POST /api/auth/set-role-intent` — Role cookie
- `GET/POST /api/auth/telegram` — TG OAuth
- `POST /api/auth/telegram/link-phone` — Link phone via TG
- `POST /api/auth/telegram/intent` — TG auth intent

---

## 2. State Machine

### 2.1 SMS OTP Flow

```
[IDLE] → phone_input → [PHONE_ENTERED]
  → POST send-sms (rate-limit check)
    → [OTP_SENT] → otp_input
      → POST verify-sms (atomic RPC check)
        → [VERIFIED] → session created → redirect
        → [FAILED]   → show error → retry
    → [RATE_LIMITED] → block N min → show timer
  → [INVALID_PHONE] → format error → retry
```

**States:**
- IDLE — initial form, no input
- PHONE_ENTERED — phone typed, validation pending
- SENDING — API call in flight
- OTP_SENT — code sent, OTP input active
- VERIFYING — OTP submit in flight
- VERIFIED — success, session created
- FAILED — wrong OTP / expired
- RATE_LIMITED — phone block (3/15min) or IP block (10/h)
- INVALID_PHONE — wrong format / missing country code
- RESEND_COOLDOWN — 60s timer before resend allowed

**Edge Cases:**
- Paste 6-digit OTP
- Auto-submit on 6 digits
- Resend before cooldown expires
- Expired OTP (>10 min)
- OTP consumed in another tab
- Phone number already registered
- Phone number format: E.164 required
- Virtual email generation: `phone.replace('+', '') + '@bookit.app'`

### 2.2 Google OAuth Flow

```
[GUEST] → click Google OAuth
  → set-role-intent (master/client cookie)
  → Google consent screen
  → /auth/callback
    → code exchange → session
    → check role_intent cookie
      → master → upsert master_profiles → check onboarding
        → onboarding incomplete → /onboarding
        → onboarding complete → /dashboard
      → client → upsert client_profiles → check phone
        → has phone → /my/bookings
        → no phone → /my/setup/phone
    → ??bid= (booking ID from PostBookingAuth)
    → ??bookingId= (booking ID from ClientAuthSheet)
    → ??plan= (intended plan on master registration)
```

**States:**
- GUEST — unauthenticated
- OAUTH_INITIATED — role intent cookie set
- OAUTH_PENDING — waiting for Google callback
- CALLBACK_RECEIVED — code exchange
- SESSION_CREATED — auth established
- PROFILE_UPSERT — profiles row created/updated
- PHONE_CHECK — redirect or setup
- ONBOARDING_CHECK — redirect or setup

**Edge Cases:**
- Back button after Google consent (state mismatch)
- Multiple rapid clicks on Google button
- Role intent cookie missing (no role)
- OAuth code already used
- Network failure during callback
- Popup blocked by browser
- Drifted identity (auth.users exists but profiles missing)
- bookit_reg_role=client but user is already master

### 2.3 Telegram Mini App Auth

```
[TMA_OPEN] → Telegram.initData verification
  → /api/auth/telegram
    → verify hash (HMAC-SHA256)
    → find or create user (by telegram_id)
    → session
  → link-phone (optional, for identity recovery)
    → match E.164 phone
    → link to existing auth.users
```

**Edge Cases:**
- initData expired (>24h)
- Wrong bot token in hash verification
- User has no phone linked
- Multiple TG accounts same user
- Webhook contact path: E.164 matching
- Drifted identity recovery (auth.users exists, profiles missing)

### 2.4 PostBookingAuth (Guest Booking → Registered)

```
[ANONYMOUS_BOOKING] → BookingSuccess
  → PostBookingAuth
    → STEP 1: choose (Google / SMS / Skip)
      → Google → OAuth flow + booking link
      → SMS → STEP 2: phone input
        → STEP 3: OTP verify (supabase.auth.verifyOtp)
          → STEP 4: channels (TG deep-link + Push subscribe)
            → redirect to /my/bookings
      → Skip → continue as guest (limited)
```

**States:**
- CHOOSE — method selection
- PHONE_INPUT — phone number entry
- OTP_VERIFY — code entry
- CHANNELS — channel setup
- COMPLETE — done, redirect

**Edge Cases:**
- User already has account
- User already has session
- Booking already linked to another user
- Skip → no notifications (guest)
- Google OAuth flow overlaps channels step
- masterId, masterC2cEnabled, masterC2cDiscountPct values change between booking and auth

### 2.5 Routing Guard (proxy.ts)

```
[REQUEST] → proxy(request)
  → /dashboard/* → check session
    → authenticated + role=master → allow
    → authenticated + role!=master → redirect /my/bookings
    → unauthenticated → redirect /login
  → /my/* → check session
    → authenticated → allow
    → unauthenticated → redirect /login
  → /login | /register → check session
    → authenticated → redirect /dashboard (master) or /my/bookings (client)
    → unauthenticated → allow
  → /* public → allow
```

**Edge Cases:**
- Session expired mid-session
- Multiple tabs with different auth states
- WebKit vs Chrome cookie behavior
- Mobile browser storage differences

---

## 3. Environment Matrix

| Environment | Auth Variant | Key Difference |
|---|---|---|
| Desktop Chrome | Full flow | Popup OAuth works |
| Mobile iOS Safari | OAuth | Can't use popup, full page redirect needed |
| Mobile Android Chrome | OAuth | Popup may work, but redirect safer |
| Telegram Mini App | TMA only | No OTP, no Google OAuth |
| PWA standalone | OTP + OAuth | Full screen, no address bar |
| Disabled JS | SMS OTP | Form submit without JS enhancement |
| Slow network (3G) | All | Timeouts, retry logic |
| Offline | None | Offline page only |

### Theme Variants
| Theme | Auth Layout | Visual |
|---|---|---|
| Frost | Split-screen: dark panel + form | `#EFF2FF` bg, white card |
| Blossom | Not used for auth | — |
| Studio | Not used for auth | — |

### Network Conditions
| Condition | Behavior |
|---|---|
| Normal | Full flow |
| Slow (3G) | Loading spinners, timeout 10s+ |
| Offline | Cannot auth at all |
| Intermittent | Retry logic on send-sms, verify-sms |
| High latency | OTP resend may overlap with delayed first send |

---

## 4. Load & Concurrency Vectors

| Vector | Risk | Mitigation |
|---|---|---|
| 2FA: same phone rapid send | Rate-limit bypass | Advisory lock RPC `check_and_log_sms_attempt` |
| 3 SMS / 15 min | Hard block | Phone-level rate limit |
| 10 SMS / hour / IP | Hard block | IP-level rate limit |
| OTP brute force | 10 verify attempts / 15 min | `sms_verify_attempts` table |
| Same user multi-tab login | Race on session | Supabase session management |
| PostBookingAuth race | Double booking link | Idempotency check |
| CSRF on OAuth callback | Session hijack | State param validation |

---

## 5. Data Variations

| Variation | Input | Expected |
|---|---|---|
| Invalid phone | `123` | Format error |
| Missing country code | `501234567` | Add +38? Or error? |
| E.164 with spaces | `+38 050 123 45 67` | Normalize to `+380501234567` |
| Wrong OTP | `000000` | Error, attempt counter++ |
| Expired OTP | Code >10 min old | Error, resend required |
| OTP all zeros | `000000` | Valid code (edge case) |
| Phone already exists | +380501234567 | "Already registered" → login flow |
| Virtual email collision | Unlikely but possible | UUID suffix? |
| Empty referral code | `?ref=` | Ignore, no crash |
| Invalid role intent | `role=superadmin` | Default to client |
| OAuth code replayed | Same code twice | Auth error |

---

## 6. Test Vectors

### Unit Tests
- [ ] Phone normalization (E.164, spaces, country code)
- [ ] Virtual email generation
- [ ] Role intent cookie parsing
- [ ] OTP expiry calculation (>10 min)
- [ ] Rate-limit window calculation (3/15 min, 10/h)
- [ ] SMS attempt logging (success/fail counts)

### Integration Tests
- [ ] POST /api/auth/send-sms → rate-limit → OTP insert
- [ ] POST /api/auth/verify-sms → atomic RPC → magic link
- [ ] POST /api/auth/set-role-intent → cookie set
- [ ] GET /auth/callback → code exchange → session
- [ ] POST /api/auth/telegram → hash verify → user create
- [ ] POST /api/auth/telegram/link-phone → E.164 match

### E2E Tests
- [ ] Full SMS OTP: phone → OTP → dashboard (master)
- [ ] Full SMS OTP: phone → OTP → /my/bookings (client)
- [ ] Google OAuth master → /dashboard
- [ ] Google OAuth client → /my/bookings
- [ ] Google OAuth client no phone → /my/setup/phone
- [ ] PostBookingAuth: book → SMS OTP → channels → /my/bookings
- [ ] PostBookingAuth: book → Google OAuth → redirect
- [ ] PostBookingAuth: skip → stay guest
- [ ] Routing guard /dashboard → unauthenticated → /login
- [ ] Routing guard /my → unauthenticated → /login
- [ ] Routing guard /login → authenticated → redirect
- [ ] Resend OTP after cooldown → works
- [ ] Resend OTP before cooldown → blocked
- [ ] Wrong OTP x3 → block → correct OTP on retry
- [ ] Expired OTP → resend → verify → works

### Security Tests
- [ ] SMS OTP brute force (10 attempts / 15 min) → lockout
- [ ] SMS OTP rate-limit bypass via IP rotation
- [ ] OAuth CSRF via state param manipulation
- [ ] TMA hash replay attack
- [ ] Phone enumeration via OTP timing
- [ ] Virtual email collision
- [ ] Cookie tampering (role_intent)

### Load Tests
- [ ] 100 concurrent SMS OTP requests (rate-limit)
- [ ] 50 concurrent OAuth callbacks
- [ ] 20 concurrent PostBookingAuth completions

---

## 7. File Inventory

### Pages
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/auth/callback/route.ts`

### Components
- `src/components/auth/PhoneOtpForm.tsx`
- `src/components/public/PostBookingAuth.tsx`
- `src/components/public/ClientAuthSheet.tsx`
- `src/components/public/NavLoginSheet.tsx`
- `src/components/client/PhoneSetupForm.tsx`
- `src/components/providers/TelegramProvider.tsx`

### API Routes
- `src/app/api/auth/send-sms/route.ts`
- `src/app/api/auth/verify-sms/route.ts`
- `src/app/api/auth/set-role-intent/route.ts`
- `src/app/api/auth/telegram/route.ts`
- `src/app/api/auth/telegram/link-phone/route.ts`
- `src/app/api/auth/telegram/intent/route.ts`

### Lib
- `src/proxy.ts` — routing guard
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/context.tsx`
- `src/lib/turbosms.ts`
- `src/lib/telegram.ts`
- `src/lib/utils/phone.ts`

### DB Migrations
- `019_atomic_sms_rate_limit.sql`
- `018_ip_rate_limiting.sql`
- `027_atomic_sms_send_rate_limit.sql`
- `003_auth_trigger_and_grants.sql`
- `059_fix_handle_new_user_phone.sql`
- `060_profiles_phone_unique.sql`
- `061_normalize_phone_e164.sql`
