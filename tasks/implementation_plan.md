# IRON MACHINE — Implementation Plan
## Enterprise Referral Suite: Bulletproof C2B Barter Fix

---

## 1. ROOT CAUSE ANALYSIS

### Critical Bug: Foreign Key Violation (FK 23503) — C2B Path

**File:** `bookit/src/app/(auth)/register/actions.ts` — `claimMasterRole()`

**Schema (from migration 066):**
```sql
CREATE TABLE client_promocodes (
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  master_id UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,  -- ← КРИТИЧНО
  ...
);
```

**Current execution order in `claimMasterRole`:**
```
Step 1: upsert profiles (role='master')       ← OK
Step 2: Prepare data (slug, referral_code)    ← OK
Step 3: [SECONDARY] Referral lookup + reward  ← ❌ BUG HERE
  └─ C2B path: INSERT client_promocodes {
       client_id: cReferrer.id,
       master_id: user.id               ← FOREIGN KEY VIOLATION!
     }
Step 4: [PRIMARY] upsert master_profiles      ← Runs AFTER Step 3
```

**Why it fails:** At the moment of `client_promocodes.insert()`, `master_profiles` row for `user.id` does NOT yet exist. The FK `master_id → master_profiles(id)` throws PostgreSQL error `23503 (foreign_key_violation)`. 

The error is logged (`console.error`) but not returned — yet the PRIMARY transaction at Step 4 still runs and creates the master. Result: new master gets PRO subscription but the client gets NO promocode. **Silent reward loss.**

---

## 2. SECONDARY FRAGILITY POINTS

### 2a. Same FK bug in `createMasterProfileAfterSignup()`
**Lines 244–261 vs 275–277:** Identical anti-pattern. Secondary reward insert before Primary upsert.

### 2b. Referrer update inconsistency (M2M path)
- `claimMasterRole` (line 96): only updates `subscription_expires_at` for referrer
- `createMasterProfileAfterSignup` (line 236): updates both `subscription_tier: 'pro'` AND `subscription_expires_at`

If a master referrer is on Starter tier, `claimMasterRole` doesn't upgrade their tier to Pro — it just extends the expiry date on a Starter subscription (useless).

### 2c. `auth/callback` (Google OAuth) — `ignoreDuplicates: true` blocks C2B
**File:** `bookit/src/app/auth/callback/route.ts`, line 143:
```typescript
{ onConflict: 'id', ignoreDuplicates: true }
```
This means if a DB trigger pre-created the `master_profiles` row, referral data (`subscription_tier: 'pro'`, `referred_by`, `subscription_expires_at`) is silently discarded. Additionally, the callback only handles M2M referrals (only checks `master_profiles` for ref code), completely missing C2B.

### 2d. `processRegistrationReferral` (in `referrals.ts`) is imported but never called
`PhoneOtpForm.tsx` imports it but uses `claimMasterRole` directly. Dead import — no impact on execution, but creates confusion.

---

## 3. BULLETPROOF ARCHITECTURE

### Core Principle: Primary Before Secondary

```
PRIMARY TRANSACTION (MUST NEVER FAIL):
  1. upsert profiles          → establishes identity
  2. upsert master_profiles   → creates the row so FK can resolve
  
SECONDARY TRANSACTION (ISOLATED — cannot break Primary):
  try {
    3. Lookup referral code (master_profiles OR client_profiles)
    4a. M2M: update referrer's subscription_expires_at + tier
    4b. C2B: INSERT client_promocodes (FK now valid ✓)
             RPC increment_client_master_invite_count
    5. update master_profiles with referral bonus (tier='pro', +30 days)
  } catch (err) {
    console.error('[REFERRAL - IRON MACHINE] ❌ Secondary TX failed:', err)
    // DOES NOT affect registration — master was already created
  }
```

### Key architectural decisions:

1. **FK prerequisite**: `master_profiles` row must exist BEFORE `client_promocodes` insert
2. **Split upsert strategy**: First upsert master_profiles with base data (slug, referral_code, tier='starter'), then update subscription_tier/expires_at separately after reward calculation
3. **Single admin client instance**: One `createAdminClient()` call per function, reused throughout
4. **Isolated Secondary TX**: Entire referral reward block wrapped in `try...catch` — any failure (RLS, FK, schema mismatch, network) cannot reach the user as a registration error
5. **Consistent M2M reward**: Always update both `subscription_tier: 'pro'` AND `subscription_expires_at` for referrer

---

## 4. FILES TO MODIFY

### PRIMARY: `bookit/src/app/(auth)/register/actions.ts`
Both `claimMasterRole()` and `createMasterProfileAfterSignup()` need the rewrite.

### SECONDARY: `bookit/src/app/auth/callback/route.ts`
Fix `ignoreDuplicates: true` → `ignoreDuplicates: false` for master upsert, add C2B path lookup.

---

## 5. DETAILED REWRITE SPEC: `claimMasterRole()`

```
[IRON MACHINE] ENTER claimMasterRole
  ↓
[IRON MACHINE] Auth check → user.id
  ↓
PRIMARY TX BEGIN:
  [IRON MACHINE] Upserting profiles (role=master)...
  [IRON MACHINE] Generating slug + referral code...
  [IRON MACHINE] Upserting master_profiles (tier=starter, base state)...
  [IRON MACHINE] PRIMARY TX COMPLETE. master_profiles row guaranteed.
  ↓
SECONDARY TX BEGIN (try/catch):
  [IRON MACHINE] Referral code present: "${referredBy}"
  [IRON MACHINE] Parallel lookup: master_profiles + client_profiles...
  [IRON MACHINE] Master lookup result: { found, id, error }
  [IRON MACHINE] Client lookup result: { found, id, error }
  
  IF M2M:
    [IRON MACHINE] PATH: M2M (Master-to-Master)
    [IRON MACHINE] Updating referrer ${mReferrer.id}: +30 days, tier=pro
    [IRON MACHINE] M2M reward applied.
    [IRON MACHINE] Updating new master: tier=pro, +30 days
    
  ELSE IF C2B:
    [IRON MACHINE] PATH: C2B (Client-to-Barter)
    [IRON MACHINE] Inserting client_promocodes { client_id, master_id: user.id, discount_percentage: 50 }
    [IRON MACHINE] Promo insert result: { success, error? }
    [IRON MACHINE] Incrementing client invite count for ${cReferrer.id}
    [IRON MACHINE] RPC result: { success, error? }
    [IRON MACHINE] Updating new master: tier=pro, +30 days
    [IRON MACHINE] C2B reward complete.
    
SECONDARY TX END (catch):
  [IRON MACHINE] ❌ SECONDARY TX EXCEPTION: ${err.message}
  [IRON MACHINE] Registration not affected. Master already created.
  ↓
[IRON MACHINE] EXIT claimMasterRole → { error: null }
```

---

## 6. DETAILED REWRITE SPEC: `createMasterProfileAfterSignup()`

Same pattern — same issue, same fix. Additionally: remove the "rollback" on `master_profiles` error that deletes the profile row — this is dangerous if the row existed before (re-registration scenario).

---

## 7. OUT OF SCOPE (noted, not fixing)

- `auth/callback` C2B gap — separate issue, not referenced by `bookit_ref` cookie flow (Google OAuth users don't hit this code path with client referrals in current UX)
- `processRegistrationReferral` dead import in PhoneOtpForm — not causing bugs

---

## 8. VERIFICATION PLAN

After implementation:
1. Register new master with a valid **M2M** ref code → master gets Pro, referrer gets +30 days
2. Register new master with a valid **C2B** (client) ref code → master gets Pro, `client_promocodes` row inserted, `total_masters_invited` incremented
3. Register new master with an **invalid** ref code → master registers as Starter, no crash
4. Register new master with **no** ref code → master registers as Starter, no crash
5. Register new master where C2B promo insert fails (simulate) → master still registers, error only in console

---

**Awaiting: PLAN APPROVED**
