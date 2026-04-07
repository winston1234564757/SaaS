# SMS Authentication Loop Fix 

This walkthrough documents the successful resolution of an issue where users authenticating via SMS were erroneously directed into the onboarding loop.

## Changes Made
This problem was tackled across two key areas in the authentication paths:

1. **Fixed Central Callback Guard Condition:**
   - Modified `src/app/auth/callback/route.ts`.
   - Before: Any client accessing the guard without a persisted `profile.phone` got pushed back to `/my/setup/phone`.
   - Now: By checking specifically whether the user login corresponds to SMS/Phone characteristics (`user.app_metadata.provider === 'phone'` or `user.email?.endsWith('@bookit.app')`), the system accurately classifies native SMS users and skips placing them in the mandatory profile entry flow if phone isn't fetched due to race conditions.

```diff
-      if (!clientProfile?.phone) {
+      const isSmsAuth = user.email?.endsWith('@bookit.app') || user.app_metadata?.provider === 'phone';
+      const needsOnboarding = !clientProfile?.phone && !isSmsAuth;
+
+      if (needsOnboarding) {
         return NextResponse.redirect(new URL('/my/setup/phone', origin));
       }
```

2. **Resolved User Profile Creation Race Condition:**
   - Modified `src/app/api/auth/verify-sms/route.ts`.
   - Prevented potential role collision when `profiles` table inserts out of sequence: `upsert` explicitly sets `{ role: role ?? 'client' }` rather than only upserting `{ id, phone }`. This maintains the `client` role fallback and prevents users from facing permission blocks.

```diff
     const { error: upsertError } = await supabaseAdmin
       .from('profiles')
       .upsert(
-        { id: linkData.user.id, phone: cleanPhone },
+        { id: linkData.user.id, phone: cleanPhone, role: role ?? 'client' },
         { onConflict: 'id', ignoreDuplicates: false },
       );
```

### Validation
With these safety nets, native SMS users will safely enter the main UI dashboard with matching internal auth parameters seamlessly without being pulled back onto the Phone Setup views.
