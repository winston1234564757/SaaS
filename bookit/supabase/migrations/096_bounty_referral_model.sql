-- ═══════════════════════════════════════════════════════════════
-- 096: Alliance & Bounty — refined referral model
--
-- Bounty: one-time -10% coupon per referral's FIRST payment.
--         Accumulates in referral_bounties_pending, resets to 0
--         after each billing cycle.
-- Status: permanent lifetime discount based on CURRENT active refs.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. master_profiles: pending bounty counter ────────────────
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS referral_bounties_pending INT NOT NULL DEFAULT 0
    CHECK (referral_bounties_pending >= 0);

-- ── 2. master_referrals: first-payment idempotency flag ───────
ALTER TABLE master_referrals
  ADD COLUMN IF NOT EXISTS is_first_payment_made BOOLEAN NOT NULL DEFAULT false;

-- ── 3. Update fn_sync_referral_status to handle Bounty ────────
-- When referee's first payment is confirmed (is_first_payment_made
-- transitions false→true), increment referrer's bounty counter.
-- This transition is done in the billing cron (not here) because
-- it requires confirmed payment context. The trigger still handles
-- lifetime_discount recalculation on tier/expiry changes.
CREATE OR REPLACE FUNCTION fn_sync_referral_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_status        TEXT;
  v_referrer_id       UUID;
  v_active_count      INT;
  v_lifetime_discount NUMERIC(5,4);
BEGIN
  -- Map subscription state to referral status
  IF NEW.subscription_tier IN ('pro', 'studio')
     AND NEW.subscription_expires_at IS NOT NULL
     AND NEW.subscription_expires_at > now()
  THEN
    v_new_status := 'active';
  ELSE
    v_new_status := 'expired';
  END IF;

  -- Sync status for this master (as a referee)
  UPDATE master_referrals
  SET    status     = v_new_status,
         updated_at = now()
  WHERE  referee_id = NEW.id
    AND  status IS DISTINCT FROM v_new_status;

  -- Recalculate lifetime_discount for the referrer based on active count
  SELECT referrer_id INTO v_referrer_id
  FROM   master_referrals
  WHERE  referee_id = NEW.id
  LIMIT  1;

  IF v_referrer_id IS NOT NULL THEN
    SELECT LEAST(50, COUNT(*))::INT INTO v_active_count
    FROM   master_referrals
    WHERE  referrer_id = v_referrer_id
      AND  status = 'active';

    v_lifetime_discount := CASE
      WHEN v_active_count >= 50 THEN 0.50
      WHEN v_active_count >= 25 THEN 0.25
      WHEN v_active_count >= 10 THEN 0.10
      WHEN v_active_count >=  5 THEN 0.05
      ELSE                           0.00
    END;

    UPDATE master_profiles
    SET    lifetime_discount = v_lifetime_discount
    WHERE  id = v_referrer_id
      AND  lifetime_discount IS DISTINCT FROM v_lifetime_discount;
  END IF;

  RETURN NEW;
END;
$$;

-- ── 4. Updated billing price RPC ──────────────────────────────
-- bounty_discount = referral_bounties_pending * 10% (one-time per cycle)
-- lifetime_discount = tier-based permanent (from master_profiles column)
-- total = min(1.0, lifetime + bounty)
-- final = max(100 kopecks, round(70000 * (1 - total)))
DROP FUNCTION IF EXISTS calculate_master_billing_price(UUID);
CREATE OR REPLACE FUNCTION calculate_master_billing_price(p_master_id UUID)
RETURNS TABLE (
  referral_bounties_pending  INT,
  bounty_discount            NUMERIC(5,4),
  lifetime_discount          NUMERIC(5,4),
  total_discount             NUMERIC(5,4),
  final_kopecks              INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bounties  INT;
  v_bounty    NUMERIC(5,4);
  v_lifetime  NUMERIC(5,4);
  v_total     NUMERIC(5,4);
  v_base      INT := 70000; -- 700 UAH
  v_final     INT;
BEGIN
  SELECT
    COALESCE(mp.referral_bounties_pending, 0),
    COALESCE(mp.lifetime_discount, 0)
  INTO v_bounties, v_lifetime
  FROM master_profiles mp
  WHERE mp.id = p_master_id;

  v_bounty := LEAST(1.0, (v_bounties * 0.10)::NUMERIC(5,4));
  v_total  := LEAST(1.0, v_bounty + v_lifetime);
  v_final  := GREATEST(100, ROUND(v_base * (1 - v_total))::INT);

  RETURN QUERY SELECT v_bounties, v_bounty, v_lifetime, v_total, v_final;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_master_billing_price(UUID) TO service_role;

-- ── 5. increment_referral_bounty: atomic RPC for billing cron ─
-- Used by billing cron when a referee's first payment is confirmed.
-- Atomic to prevent race conditions on concurrent first-payments.
CREATE OR REPLACE FUNCTION increment_referral_bounty(p_master_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE master_profiles
  SET    referral_bounties_pending = referral_bounties_pending + 1
  WHERE  id = p_master_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_referral_bounty(UUID) TO service_role;

-- ── 6. Index for first-payment query in billing cron ──────────
CREATE INDEX IF NOT EXISTS idx_master_referrals_first_payment
  ON master_referrals(referee_id, is_first_payment_made)
  WHERE is_first_payment_made = false;
