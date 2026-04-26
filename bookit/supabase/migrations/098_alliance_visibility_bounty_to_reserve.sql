-- Migration 098: Alliance visibility + Bounty → Discount Reserve routing
-- Bounties now go directly into discount_reserve (not referral_bounties_pending)
-- master_alliances.is_visible controls public page display

-- 1. Add is_visible column to master_alliances
ALTER TABLE master_alliances
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

-- 2. Update increment_referral_bounty: adds 0.10 to discount_reserve (not referral_bounties_pending)
CREATE OR REPLACE FUNCTION increment_referral_bounty(p_master_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE master_profiles
     SET discount_reserve = ROUND((COALESCE(discount_reserve, 0) + 0.10)::NUMERIC, 4)
   WHERE id = p_master_id;
END;
$$;

-- 3. Update get_master_billing_state: remove referral_bounties_pending (now baked into reserve)
--    Keep backward-compat column but always returns 0 so callers don't break during deploy
DROP FUNCTION IF EXISTS get_master_billing_state(UUID);
CREATE OR REPLACE FUNCTION get_master_billing_state(p_master_id UUID)
RETURNS TABLE (
  lifetime_discount         NUMERIC,
  referral_bounties_pending INT,    -- always 0 (kept for backward compat)
  discount_reserve          NUMERIC,
  active_refs_count         BIGINT,
  telegram_chat_id          TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(mp.lifetime_discount,  0)::NUMERIC  AS lifetime_discount,
    0::INT                                        AS referral_bounties_pending,
    COALESCE(mp.discount_reserve,   0)::NUMERIC  AS discount_reserve,
    COUNT(mr.id)::BIGINT                          AS active_refs_count,
    mp.telegram_chat_id::TEXT                     AS telegram_chat_id
  FROM master_profiles mp
  LEFT JOIN master_referrals mr
         ON mr.referrer_id = p_master_id
        AND mr.status = 'active'
  WHERE mp.id = p_master_id
  GROUP BY mp.id, mp.lifetime_discount, mp.discount_reserve, mp.telegram_chat_id;
END;
$$;

-- 4. Add increment_discount_reserve RPC (direct +amount to reserve, atomic)
CREATE OR REPLACE FUNCTION increment_discount_reserve(p_master_id UUID, p_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE master_profiles
     SET discount_reserve = ROUND((COALESCE(discount_reserve, 0) + p_amount)::NUMERIC, 4)
   WHERE id = p_master_id;
END;
$$;
