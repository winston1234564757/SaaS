-- ═══════════════════════════════════════════════════════════════
-- 097: Discount Banking & Roll-over
--
-- discount_reserve: carries over unused discount fraction when
-- total >= 100% in a given billing cycle. Instead of wasting the
-- excess, we bank it and apply it next month.
--
-- Full algorithm (executed in billing cron):
--   total = status_discount + bounty_discount + discount_reserve
--   if total >= 1.0:
--     grant 30 free days; new_reserve = round2(total - 1.0)
--     reset bounties_pending = 0; discount_reserve = new_reserve
--     NO Monobank invoice created
--   else:
--     final_kopecks = max(100, round(70000 * (1 - total)))
--     create Monobank invoice
--     reset bounties_pending = 0; discount_reserve = 0
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Add discount_reserve to master_profiles ────────────────
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS discount_reserve NUMERIC(6,4) NOT NULL DEFAULT 0
    CHECK (discount_reserve >= 0);

-- ── 2. get_master_billing_state: atomic snapshot for cron ─────
-- Returns all inputs needed for the billing decision.
-- Reads inside a single statement → consistent snapshot.
DROP FUNCTION IF EXISTS get_master_billing_state(UUID);
CREATE OR REPLACE FUNCTION get_master_billing_state(p_master_id UUID)
RETURNS TABLE (
  lifetime_discount          NUMERIC(6,4),
  referral_bounties_pending  INT,
  discount_reserve           NUMERIC(6,4),
  active_refs_count          INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lifetime  NUMERIC(6,4);
  v_bounties  INT;
  v_reserve   NUMERIC(6,4);
  v_active    INT;
BEGIN
  SELECT
    COALESCE(mp.lifetime_discount, 0),
    COALESCE(mp.referral_bounties_pending, 0),
    COALESCE(mp.discount_reserve, 0)
  INTO v_lifetime, v_bounties, v_reserve
  FROM master_profiles mp
  WHERE mp.id = p_master_id;

  SELECT LEAST(50, COUNT(*))::INT INTO v_active
  FROM master_referrals
  WHERE referrer_id = p_master_id
    AND status = 'active';

  RETURN QUERY SELECT v_lifetime, v_bounties, v_reserve, v_active;
END;
$$;

GRANT EXECUTE ON FUNCTION get_master_billing_state(UUID) TO service_role;

-- ── 3. commit_free_month: atomic write for Branch A ──────────
-- Called by cron when total_discount >= 100%.
-- Extends subscription by 30 days, banks remainder, resets bounties.
CREATE OR REPLACE FUNCTION commit_free_month(
  p_master_id   UUID,
  p_new_reserve NUMERIC(6,4),
  p_expires_at  TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE master_profiles
  SET
    subscription_expires_at    = p_expires_at,
    discount_reserve           = p_new_reserve,
    referral_bounties_pending  = 0
  WHERE id = p_master_id;
END;
$$;

GRANT EXECUTE ON FUNCTION commit_free_month(UUID, NUMERIC, TIMESTAMPTZ) TO service_role;

-- ── 4. commit_paid_month: atomic write for Branch B ──────────
-- Called by cron AFTER successful invoice.
-- Resets bounties and reserve.
CREATE OR REPLACE FUNCTION commit_paid_month(p_master_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE master_profiles
  SET
    discount_reserve          = 0,
    referral_bounties_pending = 0
  WHERE id = p_master_id;
END;
$$;

GRANT EXECUTE ON FUNCTION commit_paid_month(UUID) TO service_role;
