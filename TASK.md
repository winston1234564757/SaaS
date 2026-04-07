**SYSTEM ROLE & CONTEXT:**
You are a Principal Backend Engineer debugging a P0 error in "BookIT". 
When a user authenticates via Google and gets redirected to `/my/setup/phone` to confirm their phone number, submitting the form throws exactly this error message: "Помилка ідентифікації профілю" (Profile identification error).

**MISSION:**
Locate where this exact error is thrown and fix the underlying session/profile retrieval issue.

**SURGICAL TASKS:**

1. **Locate the Error:**
   - Search the codebase (specifically `src/app/my/setup/phone/actions.ts` or `src/components/client/PhoneSetupForm.tsx`) for the string "Помилка ідентифікації профілю" or its English equivalent if localized.

2. **Fix the Session/Profile Retrieval (The Root Cause):**
   - The error occurs because `supabase.auth.getUser()` is failing, OR the `profiles` table does not yet have a row for this Google-authenticated user.
   - Modify the action: 
     a) Ensure you correctly instantiate the Supabase Server Client with cookies to reliably get the `user.id`.
     b) Instead of a strict `update` that fails if the profile doesn't exist yet, use an **UPSERT** via `supabaseAdmin` to guarantee the profile is created/updated.
     ```typescript
     // Example fix logic:
     const { data: { user }, error: userError } = await supabase.auth.getUser();
     if (userError || !user) throw new Error("Auth session missing");

     const { error: upsertError } = await supabaseAdmin
       .from('profiles')
       .upsert({ id: user.id, phone: cleanPhone, role: 'client' }, { onConflict: 'id' });
     ```

3. **Ensure Auto-Linkage is Executed Here Too:**
   - After successfully upserting the phone number on this screen, you MUST run the Auto-Linkage logic for guest bookings (just like we did in `verify-sms`):
     ```typescript
     const phoneSuffix = cleanPhone.slice(-10);
     await supabaseAdmin.from('bookings').update({ client_id: user.id })
       .like('client_phone', `%${phoneSuffix}`).is('client_id', null);
     ```

**OUTPUT REQUIREMENT:**
Show me the exact file where you found the error message and the complete refactored code for that action/route.