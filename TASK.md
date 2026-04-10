**SYSTEM ROLE & CONTEXT:**
You are a Principal Backend Engineer. The founder has correctly identified that the virtual email logic in our custom SMS Auth flow is fragile and causing 409 Conflict errors and login hangs due to formatting mismatches (e.g., `+380...` vs `380...`).
We need to abstract the virtual email generation into a single, bulletproof utility function and completely decouple the client's mental model from emails.

**SURGICAL FIX REQUIREMENTS:**

1. **Create the Core Utility:**
   - Open or create `src/lib/utils/phone.ts` (or similar utility file).
   - Create and export a function: `export const generateVirtualEmail = (phone: string): string => { ... }`.
   - **Crucial Logic:** This function MUST strip ALL non-numeric characters (remove `+`, spaces, dashes, parentheses). It must return ONLY digits appended with `@bookit.app`. (e.g., `+380 99 123-45-67` becomes `380991234567@bookit.app`).

2. **Refactor `send-sms/route.ts`:**
   - Import and use `generateVirtualEmail(body.phone)` to define the `virtualEmail`.
   - Update the conflict check query: `.eq('email', virtualEmail)` so it perfectly matches the standardized format.

3. **Refactor `verify-sms/route.ts`:**
   - Import and use `generateVirtualEmail(body.phone)` to define the `virtualEmail`.
   - Ensure `admin.auth.admin.createUser` uses exactly this `virtualEmail`.
   - Ensure the response passed back to the frontend (`{ email: virtualEmail, ... }`) perfectly matches so `PhoneOtpForm` can successfully call `verifyOtp`.

4. **Verify Client Form:**
   - Ensure `PhoneOtpForm.tsx` (or wherever the frontend calls `verifyOtp`) just passes the email received from `verify-sms` blindly. It should not try to construct the email itself.

**OUTPUT REQUIREMENT:**
Output the code for the new `generateVirtualEmail` function, and the updated sections of BOTH `send-sms/route.ts` and `verify-sms/route.ts`.