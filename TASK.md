**SYSTEM ROLE & CONTEXT:**
You are a Principal Backend & Security Engineer for "BookIT". 
We have discovered two critical vulnerabilities in the B2C Client Auth flow:
1. Google-authenticated users who are asked for a phone number can simply navigate away (change the URL) and browse the B2C app (`/my/*`) with a `null` phone number. There is no strict server-side layout guard enforcing phone collection.
2. The SMS OTP verification fails/errors out when attempting to attach a phone number to an existing Google-authenticated user. Consequently, guest bookings are never linked.

**MISSION:**
Implement a 100% strict, inescapable Identity Flow and Auto-Linkage system.

**SURGICAL TASKS (EXECUTE IN ORDER):**

1. **The Iron Gate (Server-Side Layout Guard):**
   - Edit `src/app/my/layout.tsx` (The B2C layout).
   - Fetch the current user profile. If the user is authenticated BUT `profile.phone` is `null` or empty, strictly `redirect()` them to the dedicated phone collection page/modal (e.g., `/onboarding` or `/my/profile` depending on where our client phone setup lives). 
   - They MUST NOT be able to render `children` in `/my/bookings` or any other protected route until `phone` is populated in the DB.

2. **Force Profile Phone Persistence (The Source of Truth):**
   - Locate `src/app/api/auth/verify-sms/route.ts`.
   - Fix the error occurring when a Google user submits an OTP. Ensure the Supabase Auth user is updated, and then you MUST explicitly UPSERT the `profiles` table using `supabaseAdmin` (Service Role Key).
   - Payload must be exactly: `{ id: user.id, phone: cleanPhone, role: 'client' }`. Do NOT rely on Database Triggers. Do it synchronously here.

3. **Atomic Booking Linkage (Auto-Linkage):**
   - Immediately after the `profiles` UPSERT is successful in `verify-sms/route.ts`, execute an `UPDATE` on the `bookings` table.
   - Logic: `UPDATE bookings SET client_id = user.id WHERE client_phone = cleanPhone AND client_id IS NULL;`
   - Wrap this in proper error handling/logging so it doesn't silently fail.

4. **Cleanup Frontend Redirect:**
   - In the frontend component that submits the OTP (e.g., `PostBookingAuth.tsx` or `PhoneOtpForm.tsx`), ensure that upon receiving a 200 OK, it performs `router.push('/my/bookings')`. 

**REQUIREMENTS:**
- Ensure you use `supabaseAdmin` for the `profiles` and `bookings` DB updates in the API route to bypass RLS constraints during the auth state transition.
- Output the exact code changes for `src/app/my/layout.tsx` and `verify-sms/route.ts`.