# 06 — Referral System Domain Map

## 1. Domain Overview

BookIT має 4 реферальні механіки: B2B Alliance (M2M), C2C (C2C), C2B Barter (C2M) та Cartel (M2M партнерство). Кожна має свою логіку, винагороду та технічну реалізацію.

### Key Files
- `src/lib/actions/referrals.ts` — Core referral logic
- `src/components/master/growth/ReferralPage.tsx` — Master's referral dashboard
- `src/components/client/MyLoyaltyPage.tsx` — Client's referral sharing
- `src/components/public/PostBookingAuth.tsx` — C2C after booking
- `src/lib/actions/createBooking.ts` — C2C validation (lines 332-434)
- `src/components/public/PublicMasterPage.tsx` — C2C banners on public page

### DB Tables
- `master_referrals` — B2B referral tracker (status, is_first_payment_made)
- `master_alliances` — Inviter-invitee graph (immutable)
- `referral_grants` — Bounty grants applied
- `c2c_referrals` — C2C referral tracking
- `c2c_bonus_uses` — C2C bonus redemption
- `client_promocodes` — C2B promo codes (client gains -50%)
- `client_profiles.total_masters_invited` — C2B referral counter
- `master_partners` — Cartel partnership links

### RPC
- `get_master_referral_history` — Fast referral history
- `increment_referral_bounty` — Atomic bounty increment

---

## 2. State Machine

### 2.1 B2B Alliance & Bounty (M2M)

**Flow:**
```
Master A invites Master B (link /invite/[code])
  → Master B registers
  → Phase 1: Upsert master_profiles (starter) — FK exists
  → Phase 2: applyReferralRewards(bonus_code)
    → INSERT master_alliances (A→B, immutable)
    → INSERT master_referrals (B: pending)
    → INSERT referral_grants (B: pro_14d)
    → UPDATE master_profiles B: tier = pro_trial
  → Phase 3: Update master_profiles (bonus only if referred_by exists)
    → Master A: referral_bounties_pending += 1
  → Master B makes first payment
    → master_referrals B: status = 'active', is_first_payment_made = true
    → Master A: bounty -= 10% next billing
  → Master A accumulates referals:
    → 5 active → 5% lifetime discount
    → 10 active → 10% lifetime discount
    → 25 active → 25% lifetime discount
    → 50 active → 50% lifetime discount
```

**States (master_referrals):**
| State | Description |
|---|---|
| `pending` | Referee registered, not yet paid |
| `active` | Referee made first payment |
| `cancelled` | Referee subscription cancelled |
| `expired` | Trial period ended without payment |

**States (referral_grants):**
| State | Description |
|---|---|
| `granted` | Bonus applied |
| `used` | Bonus consumed |
| `expired` | Time passed |

**States (master_alliances):**
- Immutable: once created, never changes
- Directional: inviter → invitee

### 2.2 C2C "Запроси подругу" (Client → Client)

**Flow:**
```
Master enables c2c_enabled=true in profile
  → Client A shares link: /[slug]?ref=[A_client_code]
  → New Client B opens link
    → localStorage.set('ref', code)
  → Client B books (first booking ever for this master)
    → createBooking checks C2C eligibility
    → valid: discount applied to B's booking
    → Client A receives bonus balance (c2c_bonus_uses)
  → Client A can use bonus on next booking
```

**States:**
| State | Description |
|---|---|
| C2C_ENABLED | Master turned on feature |
| C2C_DISABLED | Master turned off feature |
| LINK_SHARED | Client A generated share link |
| REFERRAL_CAPTURED | Client B opened link, ref stored |
| FIRST_BOOKING | Client B booked with discount |
| BONUS_EARNED | Client A got bonus balance |
| BONUS_USED | Client A spent bonus |

**Edge Cases:**
- Client B already had bookings with this master → not eligible
- Client B opens link but books later (ref expired?)
- Client A bonus balance check (RPC get_c2c_balance)
- Master disables C2C mid-flow
- C2C eligibility race: cancelled flag fix (2026-05-31)

### 2.3 C2B Barter Contract (Client → Master)

**Flow:**
```
Client A (has profile in BookIT) generates invite
  → Client A shares unique link with their master (who isn't on BookIT)
  → Master B clicks link → registration with referral code
  → System detects client_promocode context
    → Client A gets: -50% promo code record
    → Master B gets: 30d Pro trial
```

### 2.4 Cartel System (Master → Master Partnership)

**Flow:**
```
Master A → invite Master B as "partner"
  → INSERT master_partners (A→B)
  → Formal partnership (no financial benefit yet)
  → Future use: cross-promo, shared analytics
```

---

## 3. Environment Matrix

| Role | Referral UI Available |
|---|---|
| Master (dashboard) | ReferralPage.tsx in Growth Hub |
| Client (portal) | MyLoyaltyPage.tsx → "Refer & Earn" tab |
| Guest (public) | Registration with referral code field |
| Admin | AllianceMap.tsx (visual graph) |

### Plan Tier Variations
| Tier | C2C Available | B2B Available | Cartel Available |
|---|---|---|---|
| Starter | ❌ | ✅ (receive only) | ❌ |
| Pro | ✅ | ✅ (full) | ✅ |
| Studio | ✅ | ✅ (full) | ✅ |

---

## 4. Load & Concurrency Vectors

| Vector | Risk | Mitigation |
|---|---|---|
| B2B FK 23503 Race | applyReferralRewards before master_profiles exists | 3-Phase pattern |
| Idempotency → Starter override | Retry registration re-writes tier | Idempotency check returns correct bonus |
| Double C2C bonus | Two bookings, same ref | Atomic check at booking time |
| C2C ref code collision | Two clients same code | UUID-based codes |

---

## 5. Data Variations

| Variation | Effect |
|---|---|
| Referral code invalid/expired | "Код не дійсний" |
| Referral code belongs to self | Cannot refer yourself |
| Client has no master (C2C) | Link broken |
| Master has no C2C enabled (C2C) | Discount not applied |
| B2B: referee already had account | "Already registered" |
| B2B: referee was referred by someone else | Last referrer wins? |
| B2B: same person registered twice | Dedup by phone/email |
| B2B: referral bounty not yet paid | Pending status |
| B2B: lifetime discount = 50% max | 50+ referrals → 50% |
| C2B: client invites multiple masters | Each gets separate promo |
| C2B: master was already invited | Duplicate prevention |

### Discount Stacking (Test Critical)
```
final_price = max(0, base_price × (1 - lifetime_discount) - bounty_balance)
```

**Stack order:**
1. Flash deal (replaces service price)
2. Dynamic pricing (markup/discount on base)
3. C2C referral (% off)
4. Phone discount (% off)
5. Loyalty (points or %)
6. B2B Lifetime (on subscription)
7. B2B Bounty (on subscription)

---

## 6. Test Vectors

### Unit Tests
- [ ] B2B lifetime discount tiers (5/10/25/50 refs → 5/10/25/50%)
- [ ] B2B bounty calculation (base × 0.1 per active ref)
- [ ] Discount stacking: lifetime + bounty → final price
- [ ] Discount stacking: floor at zero (max(0, ...))
- [ ] C2C eligibility: first booking check
- [ ] C2C eligibility: existing client → not eligible
- [ ] Referral code generation (unique, UUID)
- [ ] Referral code parsing (from URL param)

### Integration Tests
- [ ] B2B: register with referral → Phase 1-2-3 → correct grants
- [ ] B2B: referee makes payment → bounty increments
- [ ] B2B: FK race test (Phase 2 before Phase 1) → doesn't crash
- [ ] B2B: idempotency (retry registration) → no double grant
- [ ] C2C: share link → new client books → discount + bonus
- [ ] C2C: same client books again → no new bonus
- [ ] C2C: master disables → discount not applied
- [ ] C2B: client invites master → master registers → promo + trial
- [ ] RPC: get_master_referral_history returns correct data

### E2E Tests
- [ ] B2B full flow: invite → register → first payment → bounty
- [ ] B2B lifetime discount visible in billing
- [ ] C2C: share link on public page → new client booking
- [ ] C2C: client sees bonus balance in MyLoyaltyPage
- [ ] C2B: client invites in MyLoyaltyPage → promo visible
- [ ] Referral landing page /invite/[code] renders correctly
- [ ] Guest registration with referral code field

### Security Tests
- [ ] Referral code: cannot refer yourself
- [ ] Referral code: reused after first use → blocked
- [ ] B2B: master_alliances immutable (can't delete)
- [ ] C2C: ref code tampering → invalid
- [ ] RPC: get_master_referral_history returns own only

---

## 7. File Inventory

### Server Actions
- `src/lib/actions/referrals.ts`
- `src/lib/actions/createBooking.ts` (C2C logic)

### Components
- `src/components/master/growth/ReferralPage.tsx`
- `src/components/client/MyLoyaltyPage.tsx`
- `src/components/public/PostBookingAuth.tsx`
- `src/components/public/PublicMasterPage.tsx`

### Admin
- `src/components/admin/AllianceMap.tsx`

### DB Migrations
- `010_master_referrals.sql`
- `057_referral_mvp.sql`
- `066_advanced_referrals.sql`
- `096_bounty_referral_model.sql`
- `099_c2c_referral.sql`
- `20260524124500_get_master_referral_history.sql`

### Existing Tests
- `e2e/tests/03-referral-engine.spec.ts` (B2B)
- `e2e/tests/06-referrals.spec.ts` (C2C)
