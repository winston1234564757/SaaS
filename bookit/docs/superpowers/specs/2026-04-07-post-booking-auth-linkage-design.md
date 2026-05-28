# Post-Booking Auth Linkage — Design Spec
**Date:** 2026-04-07  
**Status:** Approved  
**Author:** Principal Backend Engineer / Auth Specialist

---

## Problem

Guest bookings are created with `client_phone` but `client_id = NULL`. After the client verifies via SMS OTP, the current flow relies on a **second client-side fetch** to `/api/auth/link-booking` to set `client_id`. This second request can silently fail (network drop, tab close, `.catch(() => {})` swallowing errors), producing orphaned bookings that the client can never see in their account.

Additionally, there is no mechanism to link past guest bookings when a user registers later via Google OAuth (since Google OAuth has no phone — only email, which is not the canonical identifier in BookIT).

---

## Core Design Decision

**Phone is the single canonical identifier.** Email exists only as a Supabase Auth technical requirement (virtual email `{phone}@bookit.app` for SMS auth, or real email for Google OAuth). All booking linkage logic is phone-based.

---

## Architecture

### 1. DB Trigger — Single Source of Truth (Migration 063)

A PostgreSQL trigger fires on every `INSERT OR UPDATE OF phone ON profiles`. When a profile gets a phone number (for the first time, or changed), it atomically links all unlinked guest bookings with the matching `client_phone`.

```sql
CREATE OR REPLACE FUNCTION public.link_bookings_by_phone()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND (OLD IS NULL OR OLD.phone IS DISTINCT FROM NEW.phone) THEN
    UPDATE bookings
    SET client_id = NEW.id
    WHERE client_phone = NEW.phone
      AND client_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_link_bookings_on_phone
AFTER INSERT OR UPDATE OF phone ON profiles
FOR EACH ROW EXECUTE FUNCTION public.link_bookings_by_phone();
```

**Coverage:**
| Scenario | Linkage mechanism |
|---|---|
| SMS OTP (PostBookingAuth) | `verify-sms` upserts `profiles.phone` → trigger fires |
| SMS OTP (direct register/login) | same upsert → trigger fires |
| Google OAuth + phone onboarding | `/my/setup/phone` upserts `profiles.phone` → trigger fires |
| Any future auth method | any profile upsert with phone → trigger fires |

### 2. PostBookingAuth — Remove Client-Side Link Request

Remove the fire-and-forget `fetch('/api/auth/link-booking', ...)` from `PostBookingAuth.handleVerify()`. The trigger has already run during `verify-sms` (step 8b upserts profile with phone). No second network request needed.

**Before:**
```ts
await supabase.auth.verifyOtp({ email, token, type: 'email' });
await fetch('/api/auth/link-booking', { ... }).catch(() => {});  // ← REMOVE
router.push('/my/bookings');
```

**After:**
```ts
await supabase.auth.verifyOtp({ email, token, type: 'email' });
router.push('/my/bookings?linked=1');  // linked=1 triggers cache invalidation
```

### 3. Delete `/api/auth/link-booking` Route

The route is no longer needed. Delete `src/app/api/auth/link-booking/route.ts`.

### 4. Google OAuth → Mandatory Phone Onboarding

**`auth/callback/route.ts`** — after `client_profiles.upsert`, check if profile has phone:

```ts
const { data: profile } = await admin
  .from('profiles').select('phone').eq('id', user.id).single();

if (!profile?.phone) {
  return NextResponse.redirect(new URL('/my/setup/phone', origin));
}
```

**New page: `src/app/my/setup/phone/page.tsx`**
- Server component wrapper, renders `<PhoneSetupForm />` client component
- Reuses SMS OTP flow (PhoneOtpForm or stripped PostBookingAuth without `choose` step)
- After successful OTP → server action upserts `profiles.phone` → trigger links bookings
- Redirects to `/my/bookings`
- **No skip button** — phone is mandatory for all clients

**`src/app/my/setup/phone/actions.ts`** — server action:
```ts
'use server';
// Requires authenticated session
// Calls admin.from('profiles').upsert({ id: userId, phone: cleanPhone }, { onConflict: 'id' })
// Trigger fires automatically
// Returns { success: true }
```

### 5. Session & React Query Cache Invalidation

- `PostBookingAuth` redirects to `/my/bookings?linked=1` after `verifyOtp()` success
- `MyBookingsPage` (or its query hook): on mount, if `linked=1` in searchParams → `queryClient.invalidateQueries({ queryKey: ['my-bookings'] })`
- This ensures the newly linked booking appears immediately without manual reload
- TanStack Query `refetchOnWindowFocus: true` (default) handles subsequent tab switches

---

## Data Flow

```
[SMS OTP Flow]
BookingFlow → guest booking (client_id=NULL, client_phone=380...)
PostBookingAuth → verify-sms → upsert profiles.phone
                                      ↓
                             trg_link_bookings_on_phone
                                      ↓
                             bookings.client_id = user.id  ✅
PostBookingAuth → verifyOtp() → router.push('/my/bookings?linked=1')

[Google OAuth Flow]
Google OAuth → auth/callback → upsert profiles (no phone)
                             → profile.phone IS NULL?
                                      ↓ YES
                             redirect /my/setup/phone
                                      ↓
                             PhoneSetupForm → SMS OTP → upsert profiles.phone
                                                                ↓
                                                       trg_link_bookings_on_phone
                                                                ↓
                                                       bookings.client_id = user.id  ✅
                             router.push('/my/bookings')
```

---

## Files Changed

| File | Action |
|---|---|
| `supabase/migrations/063_link_bookings_on_phone_set.sql` | CREATE — trigger + function |
| `src/app/api/auth/link-booking/route.ts` | DELETE |
| `src/components/public/PostBookingAuth.tsx` | MODIFY — remove link-booking fetch, add `?linked=1` |
| `src/app/auth/callback/route.ts` | MODIFY — add phone check → redirect to /my/setup/phone |
| `src/app/my/setup/phone/page.tsx` | CREATE — mandatory phone onboarding page |
| `src/app/my/setup/phone/actions.ts` | CREATE — server action to upsert phone |
| `src/components/client/PhoneSetupForm.tsx` | CREATE — reused OTP UI without choose/skip steps |
| `src/app/my/bookings/page.tsx` (or hook) | MODIFY — invalidate cache on `?linked=1` |

---

## Edge Cases

| Case | Handling |
|---|---|
| User has two guest bookings with same phone → verifies once | Trigger updates ALL matching rows in one UPDATE |
| Phone already in profiles (returning user) | `upsert` with `onConflict: 'id'` → trigger fires, no new orphans |
| Two users try to claim same phone simultaneously | `idx_profiles_phone_unique` partial index blocks second upsert with 23505 error |
| Google user already has phone (future, added manually) | `auth/callback` check passes → no redirect → normal flow |
| Master registers via Google | Already has separate onboarding flow at `/dashboard/onboarding` — no change |

---

## What Is NOT Changed

- Master auth flow (unaffected — masters go through `/dashboard/onboarding`)
- Google OAuth for masters (unaffected)
- `verify-sms` core logic (OTP check, user creation, magiclink token — unchanged)
- `send-sms` route (unchanged)
- Rate limiting, security checks (unchanged)
