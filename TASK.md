**SYSTEM ROLE & CONTEXT:**
You are a Principal Backend Engineer & Auth Specialist for "BookIT". We are fixing a critical funnel leak in the Client Post-Booking Registration flow.


**MISSION:**
Ensure 100% reliable linkage between a newly created guest booking and the client's newly provisioned account via SMS OTP. Zero orphaned bookings allowed.

**TASKS (EXECUTE IN ORDER):**

1. **Audit Post-Booking Auth Flow:**
   - Review `src/components/public/PostBookingAuth.tsx`, `src/app/api/auth/verify-sms/route.ts`, and `src/app/api/auth/link-booking/route.ts`.
   - Currently, a guest creates a booking (saved with `client_phone` but `client_id = null`). Then they verify via SMS.
   - Ensure that inside the `verify-sms` route, immediately after creating/fetching the user via Supabase Auth Admin, the backend ATOMICALLY links the pending `bookingId` to the `user.id`. Do not rely on the client to send a second `link-booking` request, as network drops will cause orphaned bookings.

2. **Implement Fallback Auto-Linkage (The "Safety Net"):**
   - What if the user books as a guest, ignores the SMS prompt, closes the tab, and registers directly tomorrow? 
   - Implement a robust auto-linkage mechanism. When a user logs in or registers successfully (via Phone or Google), the system must search the `bookings` table for any records where `client_phone` matches the user's verified phone AND `client_id IS NULL`, and automatically attach them to this `user.id`. (This can be done via a Supabase DB Trigger on `profiles` creation/login or inside the core auth callback).

3. **Session & Redirect Polish:**
   - Ensure that after successful Post-Booking Auth, the Next.js session is fully established, and the user is seamlessly redirected to `/my/bookings`.
   - Ensure `react-query` cache is invalidated so the newly linked booking appears instantly on the screen without a manual page reload.

**REQUIREMENTS:**
- Do not break the existing master auth flow or Google OAuth flow.
- Focus heavily on fault tolerance (handling edge cases like closed tabs or dropped connections during OTP).
- Output a summary of how you solved the auto-linkage problem before committing.