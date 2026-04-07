# Fixed B2C Identity Flow

This plan addresses the two critical vulnerabilities in the B2C Auth Flow, ensuring that phone numbers are strictly required and that Google-authenticated users can attach their phone records successfully, seamlessly syncing with all guest bookings.

## Proposed Changes

### 1. Server-Side Layout Guard (The Iron Gate)

#### [MODIFY] [layout.tsx](file:///C:/Users/Vitossik/SaaS/bookit/src/app/my/layout.tsx)
- We will securely fetch the user's profile right after authentication is confirmed.
- If `profile.phone` is missing, we will immediately `redirect('/my/setup/phone')`.
- To prevent infinite redirect loops (since `/my/setup/phone` uses this layout), we will detect the current pathname via the `x-pathname` header (injected by `proxy.ts`). If the user is already on the setup phone path, we allow the layout to render the setup UI.

### 2. Force Profile Phone Persistence & Google Handshake

#### [MODIFY] [route.ts](file:///C:/Users/Vitossik/SaaS/bookit/src/app/api/auth/verify-sms/route.ts)
- We will retrieve the currently authenticated user server-side (`await createClient().auth.getUser()`).
- If a session is present (e.g., Google user), we bypass creating a `virtualEmail` new user to avoid clashing or downgrading their session. Instead, we use their existing `currentUser.id`.
- Proceed explicitly with synchronous `upsert` via `supabaseAdmin` ensuring exactly `{ id: user.id, phone: cleanPhone, role: 'client' }`. 
- We add the **Atomic Booking Linkage** via a direct UPDATE call on `bookings` where `client_phone = cleanPhone AND client_id IS NULL`. Proper error handling will log any faults silently rather than breaking the sequence.
- Include a flag `isExistingSession` in the JSON response so the frontend knows that it doesn't need to perform the standard virtual email session OTP exchange.

### 3. Cleanup Frontend Handlers

#### [MODIFY] [PostBookingAuth.tsx](file:///C:/Users/Vitossik/SaaS/bookit/src/components/public/PostBookingAuth.tsx)
- Check the `isExistingSession` flag returned from `verify-sms`. If true, the user is already natively authenticated with Google, so we bypass the `supabase.auth.verifyOtp` step.
- Ensure that upon success (200 OK), the form executes `router.push('/my/bookings')`.

#### [MODIFY] [PhoneOtpForm.tsx](file:///C:/Users/Vitossik/SaaS/bookit/src/components/auth/PhoneOtpForm.tsx)
- Apply the same `isExistingSession` logic to bypass `verifyOtp` when applicable (since this form might also be hit by an authenticated user unexpectedly). Ensure fallback standard redirections are kept tidy.

## Open Questions

- Just to confirm: the explicit instruction says `role: 'client'`. I am stripping the existing `role ?? 'client'` assignment payload logic in `verify-sms` when handling this UPSERT, and strictly applying plain `'client'`. Is this exactly what you prefer, or should it inherit the `role` enum from the Zod body if supplied by `PhoneOtpForm` masters logging in?

## Verification Plan

### Automated/Manual Verification
- Authenticate via Google, verify the redirect sends the user precisely to `/my/setup/phone`.
- Provide a phone & OTP. Observe network response for 200 OK.
- Validate `profiles` table to see the explicit upsert row.
- Ensure no `verifyOtp` errors appear in the console.
- Refreshing should lock the user on `/my/bookings` natively.
- Validate DB for guest linkage to see a new `client_id` assigned.
