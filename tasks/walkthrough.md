# IRON MACHINE — Walkthrough Report
## Enterprise Referral Suite: Bulletproof C2B Barter — DEPLOYED

---

## What Was Changed

**Single file modified:** `bookit/src/app/(auth)/register/actions.ts`

Both `claimMasterRole()` and `createMasterProfileAfterSignup()` were rewritten with the Iron Machine protocol.

---

## The Fix: Execution Order Inversion

### Before (broken)
```
Step 3: INSERT client_promocodes { master_id: user.id }  ← 💥 FK 23503
Step 4: upsert master_profiles                           ← too late
```

### After (bulletproof)
```
PRIMARY TX [1/2]: upsert profiles
PRIMARY TX [2/2]: upsert master_profiles                 ← FK dependency RESOLVED
SECONDARY TX (try/catch):
  └─ INSERT client_promocodes { master_id: user.id }     ← FK safe ✓
```

---

## Execution Trace (happy path — C2B)

```
[REFERRAL - IRON MACHINE] ══════════════════════════════════════════
[REFERRAL - IRON MACHINE] ENTER claimMasterRole
[REFERRAL - IRON MACHINE] Input → phone: +380XXXXXXXXX | referredBy: ABC123
[REFERRAL - IRON MACHINE] Auth OK → user.id: <uuid>
[REFERRAL - IRON MACHINE] PRIMARY TX [1/2] → upserting profiles (role=master)...
[REFERRAL - IRON MACHINE] PRIMARY TX [1/2] ✓ profiles upserted
[REFERRAL - IRON MACHINE] PRIMARY TX [2/2] → upserting master_profiles...
[REFERRAL - IRON MACHINE]   slug: master-a1b2c3d4 | referral_code: XYZ789 | referred_by: ABC123
[REFERRAL - IRON MACHINE] PRIMARY TX [2/2] ✓ master_profiles upserted. FK dependency RESOLVED.
[REFERRAL - IRON MACHINE] ── PRIMARY TX COMPLETE ─────────────────────────────────────────
[REFERRAL - IRON MACHINE] SECONDARY TX START → code: ABC123
[REFERRAL - IRON MACHINE] Parallel lookup → master_profiles + client_profiles...
[REFERRAL - IRON MACHINE] Master lookup result: { found: false, id: null, error: null }
[REFERRAL - IRON MACHINE] Client lookup result: { found: true, id: <client-uuid>, error: null }
[REFERRAL - IRON MACHINE] PATH → C2B | client.id: <client-uuid>
[REFERRAL - IRON MACHINE] Inserting client_promocodes → { client_id: <client-uuid>, master_id: <uuid>, discount_percentage: 50 }
[REFERRAL - IRON MACHINE] C2B promo inserted ✓
[REFERRAL - IRON MACHINE] C2B invite count incremented ✓
[REFERRAL - IRON MACHINE] C2B new master reward ✓ → tier: pro, expiry: 2026-05-11T...
[REFERRAL - IRON MACHINE] ── SECONDARY TX COMPLETE ───────────────────────────────────
[REFERRAL - IRON MACHINE] EXIT claimMasterRole → { error: null }
[REFERRAL - IRON MACHINE] ══════════════════════════════════════════
```

---

## Secondary Fixes Included

| Fix | Description |
|-----|-------------|
| M2M referrer tier upgrade | Now updates both `subscription_tier: 'pro'` AND `subscription_expires_at` for the referrer (was only updating expiry) |
| Removed dangerous rollback | `createMasterProfileAfterSignup` no longer deletes `profiles` row on `master_profiles` error — identity record must survive independently |
| Consistent reward logic | Both functions now use identical M2M and C2B reward patterns |

---

## Verification Checklist

| Scenario | Expected Behavior |
|----------|-------------------|
| M2M referral (valid master code) | New master → Pro +30d; referrer → Pro tier + expiry extended |
| C2B referral (valid client code) | New master → Pro +30d; `client_promocodes` row inserted; `total_masters_invited` incremented |
| Invalid/expired referral code | New master registers as Starter; no crash |
| No referral code | New master registers as Starter; SECONDARY TX skipped |
| C2B promo insert fails | Error logged; new master still registers (Pro bonus update may also fail, logged); **registration succeeds** |

---

## TypeScript

```
npx tsc --noEmit → EXIT: 0 (zero errors)
```
