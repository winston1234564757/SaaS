**SYSTEM ROLE & CONTEXT:**
You are a Principal Next.js App Router Expert. We are debugging an infinite Client-Side navigation loop in "BookIT". 
The user previously fixed the backend profile creation (setting `role: 'client'`), but the browser is still endlessly spamming requests to `/dashboard/onboarding?_rsc=...` after a B2C Client successfully enters their SMS OTP.

**THE BUG:**
This `?_rsc=` parameter means Next.js is trapped in a client-side layout/router loop. A Client is somehow being pushed into the Master's route group (`/dashboard/*`), where the Master layout rejects them, or a `useEffect` in the auth component is infinitely triggering `router.push()`/`router.refresh()`.

**TASKS TO FIX THIS FOREVER:**

1. **Fix the Post-Booking Redirect (The Trigger):**
   - Inspect `src/components/public/PostBookingAuth.tsx` or wherever the SMS OTP success mutation is handled.
   - ENSURE that upon success, the router EXPLICITLY pushes to `/my/bookings` (the B2C portal). Do NOT use a generic `router.refresh()` or push to `/dashboard`.

2. **Audit `(master)/layout.tsx` Guard:**
   - Look at `src/app/(master)/layout.tsx`. If a user with `role === 'client'` accidentally lands here, DO NOT redirect them to `/dashboard/onboarding`. Redirect them to `/my/bookings`. The onboarding redirect should ONLY happen for users who are officially `role: 'master'` but lack a complete profile.

3. **Audit Global Middleware / Auth Guards:**
   - If there is a `middleware.ts` or a hook like `useSessionWakeup.ts` / `useProtectedRoute`, check its redirection logic. Prevent it from forcing B2C users into B2B onboarding.

**REQUIREMENT:**
Do not change the backend `verify-sms` logic again. Find the frontend/layout routing bug causing the `?_rsc=` spam and neutralize it. Show me the exact lines you change.