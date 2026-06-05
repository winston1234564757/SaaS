# Auth Domain — Test Report

**Date:** 2026-06-05
**Status:** ✅ 118/118 passed (4 files, 0 failed)
**Duration:** 1.34s

---

## Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `src/lib/utils/phone.test.ts` | 34 | normalizeToE164, e164ToInputPhone, formatPhoneDisplay, normalizePhoneInput, toFullPhone, generateVirtualEmail |
| `src/app/api/auth/send-sms/route.test.ts` | 21 | OTP generation (entropy, range), TurboSMS response codes (800/801/0/SUCCESS/OK), phone normalization inline |
| `src/app/api/auth/verify-sms/schema.test.ts` | 23 | Zod pipe transform, phone validation, OTP 6-digit, role enum, combined edge cases |
| `src/app/auth/callback/route.test.ts` | 40 | SEC-CRIT-1 (open redirect), SEC-HIGH-1 (dual role), SMS user detection, role protection, slug generation, V-10 plan allowlist |

---

## Key Findings

### Bug Found: `isAltSuccess` returns `undefined` instead of `false`
**File:** `send-sms/route.ts`
**Line:** `smsData?.response_status?.includes('SUCCESS') || smsData?.response_status?.includes('OK')`
**Impact:** Low — `!isSuccess` correctly handles `undefined` as falsy, but TypeScript type is inaccurate.
**Severity:** Cosmetic (no runtime bug)

### Bug Found: Zod schema rejects numbers, send-sms accepts them
**File:** `verify-sms/route.ts` vs `send-sms/route.ts`
**Detail:** `z.string()` rejects `{ phone: 380501234567 }` while send-sms calls `String(rawPhone)` and accepts it.
**Impact:** Low — both routes receive `req.json()` which always parses phone as string from form input.
**Severity:** Inconsistency

### Vulnerability Check: SEC-CRIT-1 Open Redirect ✅
- `//evil.com` → pathname=`/` (safe)
- `/%2F%2Fevil.com` → URL preserves encoding, no decode (safe)
- `https://evil.com` → startsWith `/` check catches it (safe)

### Security Check: SEC-HIGH-1 Dual Role ✅
- param=master + cookie=master → master (correct)
- param=master + no cookie → client (correct)
- param=anything + admin profile → admin (cannot downgrade)

### Coverage Gaps (not yet tested)
- OTP expiry check (10 min) — requires mocking Date.now
- Timing-safe OTP comparison — crypto.timingSafeEqual
- SMS user creation via supabaseAdmin.auth.admin.createUser
- Profile upsert + client_profiles creation
- C2C ref code validation in public page
- Booking linking by phone suffix

---

## File Locations
```
src/lib/utils/phone.test.ts
src/app/api/auth/send-sms/route.test.ts
src/app/api/auth/verify-sms/schema.test.ts
src/app/auth/callback/route.test.ts
```

## Commands
```bash
npx vitest run src/lib/utils/phone.test.ts
npx vitest run "src/app/api/auth/send-sms/route.test.ts"
npx vitest run "src/app/api/auth/verify-sms/schema.test.ts"
npx vitest run "src/app/auth/callback/route.test.ts"
npx vitest run src/lib/utils/phone.test.ts "src/app/api/auth/send-sms/route.test.ts" "src/app/api/auth/verify-sms/schema.test.ts" "src/app/auth/callback/route.test.ts"
```
