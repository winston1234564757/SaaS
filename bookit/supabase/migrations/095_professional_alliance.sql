-- ═══════════════════════════════════════════════════════════════
-- 095: Professional Alliance & Referral System
-- ═══════════════════════════════════════════════════════════════

-- ── 1. master_profiles: lifetime_discount ─────────────────────
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS lifetime_discount NUMERIC(5,4) NOT NULL DEFAULT 0
    CHECK (lifetime_discount >= 0 AND lifetime_discount <= 1);

-- ── 2. master_referrals: billing-tracked referral relationships ─
-- Tracks M2M referral pairs + status for billing discount engine.
-- status: trial = referred master is on Pro trial (не платить)
--         active = referred master is a paying subscriber
--         expired = referred master downgraded / sub expired
CREATE TABLE IF NOT EXISTS master_referrals (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  referee_id   UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'trial'
                           CHECK (status IN ('trial', 'active', 'expired')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT master_referrals_no_self CHECK (referrer_id != referee_id),
  UNIQUE(referrer_id, referee_id)
);

CREATE INDEX IF NOT EXISTS idx_master_referrals_referrer ON master_referrals(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_master_referrals_referee  ON master_referrals(referee_id);

-- ── 3. master_alliances: professional network graph ───────────
-- Represents the "Alliance" relationship (social/professional network).
-- Immutable once created — reflects who invited whom permanently.
CREATE TABLE IF NOT EXISTS master_alliances (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id  UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  invitee_id  UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT master_alliances_no_self CHECK (inviter_id != invitee_id),
  UNIQUE(inviter_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_master_alliances_inviter ON master_alliances(inviter_id);
CREATE INDEX IF NOT EXISTS idx_master_alliances_invitee ON master_alliances(invitee_id);

-- ── 4. RLS ────────────────────────────────────────────────────
ALTER TABLE master_referrals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_alliances  ENABLE ROW LEVEL SECURITY;

-- service_role has full access; anon/authenticated read their own rows
CREATE POLICY "master_referrals: referrer reads own"
  ON master_referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "master_alliances: both sides read"
  ON master_alliances FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

GRANT ALL ON master_referrals TO service_role;
GRANT ALL ON master_alliances TO service_role;

-- ── 5. fn_sync_referral_status: trigger syncs status on tier change ─
-- Fires whenever master_profiles.subscription_tier or
-- subscription_expires_at changes. Updates master_referrals.status
-- for that referee and recalculates the referrer's lifetime_discount.
CREATE OR REPLACE FUNCTION fn_sync_referral_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_status  TEXT;
  v_referrer_id UUID;
  v_active_count INT;
  v_lifetime_discount NUMERIC(5,4);
BEGIN
  -- Determine the new referral status for this master (as a referee)
  IF NEW.subscription_tier IN ('pro', 'studio')
     AND NEW.subscription_expires_at IS NOT NULL
     AND NEW.subscription_expires_at > now()
  THEN
    -- Has a future expiry: could be trial or active.
    -- We treat it as 'active' only if there's a billing event (paid).
    -- For simplicity in the trigger, mark 'active' when tier is paid.
    -- The cron job fine-tunes 'trial' vs 'active' on charge success.
    v_new_status := 'active';
  ELSE
    v_new_status := 'expired';
  END IF;

  -- Update the referral record where this master is the referee
  UPDATE master_referrals
  SET    status     = v_new_status,
         updated_at = now()
  WHERE  referee_id = NEW.id
    AND  status IS DISTINCT FROM v_new_status;

  -- Recalculate lifetime_discount for the referrer
  SELECT referrer_id INTO v_referrer_id
  FROM   master_referrals
  WHERE  referee_id = NEW.id
  LIMIT  1;

  IF v_referrer_id IS NOT NULL THEN
    SELECT LEAST(50, COUNT(*)) INTO v_active_count
    FROM   master_referrals
    WHERE  referrer_id = v_referrer_id
      AND  status = 'active';

    -- Tier thresholds: 5→5%, 10→10%, 25→25%, 50→50%
    v_lifetime_discount := CASE
      WHEN v_active_count >= 50 THEN 0.50
      WHEN v_active_count >= 25 THEN 0.25
      WHEN v_active_count >= 10 THEN 0.10
      WHEN v_active_count >=  5 THEN 0.05
      ELSE 0.00
    END;

    UPDATE master_profiles
    SET    lifetime_discount = v_lifetime_discount
    WHERE  id = v_referrer_id
      AND  lifetime_discount IS DISTINCT FROM v_lifetime_discount;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_referral_status ON master_profiles;
CREATE TRIGGER trg_sync_referral_status
  AFTER UPDATE OF subscription_tier, subscription_expires_at ON master_profiles
  FOR EACH ROW
  EXECUTE FUNCTION fn_sync_referral_status();

-- ── 6. calculate_master_billing_price: RPC for billing engine ──
-- Returns final price in kopecks after stacking dynamic + lifetime
-- discounts. Used by the cron billing engine before charging.
-- DROP first to allow return-type change between migration versions.
DROP FUNCTION IF EXISTS calculate_master_billing_price(UUID);
CREATE OR REPLACE FUNCTION calculate_master_billing_price(p_master_id UUID)
RETURNS TABLE (
  active_refs_count   INT,
  dynamic_discount    NUMERIC(5,4),
  lifetime_discount   NUMERIC(5,4),
  total_discount      NUMERIC(5,4),
  final_kopecks       INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_count      INT;
  v_dynamic           NUMERIC(5,4);
  v_lifetime          NUMERIC(5,4);
  v_total             NUMERIC(5,4);
  v_base_kopecks      INT  := 70000; -- 700 UAH
  v_final             INT;
BEGIN
  -- Count active referrals, hard-capped at 50
  SELECT LEAST(50, COUNT(*))::INT INTO v_active_count
  FROM   master_referrals
  WHERE  referrer_id = p_master_id
    AND  status = 'active';

  -- Dynamic discount: each active ref = 10%
  v_dynamic := LEAST(1.0, (v_active_count * 0.10)::NUMERIC(5,4));

  -- Lifetime discount from profile
  SELECT COALESCE(mp.lifetime_discount, 0) INTO v_lifetime
  FROM   master_profiles mp
  WHERE  mp.id = p_master_id;

  -- Stack and cap at 100%
  v_total := LEAST(1.0, v_dynamic + v_lifetime);

  -- Final price, minimum 1 UAH = 100 kopecks
  v_final := GREATEST(100, ROUND(v_base_kopecks * (1 - v_total))::INT);

  RETURN QUERY SELECT v_active_count, v_dynamic, v_lifetime, v_total, v_final;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_master_billing_price(UUID) TO service_role;
