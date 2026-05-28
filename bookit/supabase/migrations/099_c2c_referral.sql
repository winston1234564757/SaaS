-- ════════════════════════════════════════════════════════════════
-- 099: C2C Referral Program
-- ════════════════════════════════════════════════════════════════

-- 1. Додаємо поля до master_profiles
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS c2c_enabled      BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS c2c_discount_pct INTEGER  NOT NULL DEFAULT 10
    CONSTRAINT c2c_discount_pct_range CHECK (c2c_discount_pct BETWEEN 1 AND 50);

-- 2. Таблиця відстеження рефералів
CREATE TABLE IF NOT EXISTS c2c_referrals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   UUID        NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  referred_id   UUID        REFERENCES client_profiles(id) ON DELETE SET NULL,
  master_id     UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  booking_id    UUID        UNIQUE REFERENCES bookings(id) ON DELETE SET NULL,
  discount_pct  INTEGER     NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'completed', 'expired')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_c2c_referrals_referrer_master
  ON c2c_referrals(referrer_id, master_id);
CREATE INDEX IF NOT EXISTS idx_c2c_referrals_booking
  ON c2c_referrals(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_c2c_referrals_status
  ON c2c_referrals(status) WHERE status = 'completed';

-- 3. Таблиця використання бонусів реферера
CREATE TABLE IF NOT EXISTS c2c_bonus_uses (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   UUID        NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  master_id     UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  booking_id    UUID        UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  discount_used INTEGER     NOT NULL CHECK (discount_used BETWEEN 1 AND 80),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_c2c_bonus_uses_referrer_master
  ON c2c_bonus_uses(referrer_id, master_id);

-- 4. RLS
ALTER TABLE c2c_referrals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE c2c_bonus_uses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "c2c_referrals: owner select" ON c2c_referrals;
CREATE POLICY "c2c_referrals: owner select"
  ON c2c_referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "c2c_bonus_uses: owner select" ON c2c_bonus_uses;
CREATE POLICY "c2c_bonus_uses: owner select"
  ON c2c_bonus_uses FOR SELECT
  USING (auth.uid() = referrer_id);

GRANT ALL ON c2c_referrals  TO service_role;
GRANT ALL ON c2c_bonus_uses TO service_role;

-- 5. Тригер: bookings.status → 'completed' → c2c_referrals.status = 'completed'
CREATE OR REPLACE FUNCTION fn_c2c_complete_on_booking_done()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    UPDATE c2c_referrals
    SET status = 'completed'
    WHERE booking_id = NEW.id AND status = 'pending';

    -- In-app notification для реферера
    INSERT INTO notifications (recipient_id, type, title, body, related_booking_id, related_master_id)
    SELECT
      r.referrer_id,
      'c2c_referral_completed',
      'Подруга завершила візит!',
      'Твій реферальний баланс поповнено. Використай його при наступному записі.',
      NEW.id,
      NEW.master_id
    FROM c2c_referrals r
    WHERE r.booking_id = NEW.id AND r.status = 'completed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_c2c_complete ON bookings;
CREATE TRIGGER trg_c2c_complete
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION fn_c2c_complete_on_booking_done();

-- 6. RPC: get_c2c_balance(referrer_id, master_id) → INTEGER
CREATE OR REPLACE FUNCTION get_c2c_balance(p_referrer_id UUID, p_master_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_earned INTEGER;
  v_used   INTEGER;
BEGIN
  SELECT COALESCE(
    COUNT(*) FILTER (WHERE status = 'completed') *
    (SELECT c2c_discount_pct FROM master_profiles WHERE id = p_master_id LIMIT 1),
    0
  ) INTO v_earned
  FROM c2c_referrals
  WHERE referrer_id = p_referrer_id AND master_id = p_master_id;

  SELECT COALESCE(SUM(discount_used), 0) INTO v_used
  FROM c2c_bonus_uses
  WHERE referrer_id = p_referrer_id AND master_id = p_master_id;

  RETURN GREATEST(0, v_earned - v_used);
END;
$$;

REVOKE ALL ON FUNCTION get_c2c_balance FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_c2c_balance TO service_role, authenticated;

-- 7. RPC: get_c2c_stats_for_master(master_id) → TABLE
CREATE OR REPLACE FUNCTION get_c2c_stats_for_master(p_master_id UUID)
RETURNS TABLE(total_referrals BIGINT, completed_referrals BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COUNT(*)                                    AS total_referrals,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_referrals
  FROM c2c_referrals
  WHERE master_id = p_master_id;
$$;

REVOKE ALL ON FUNCTION get_c2c_stats_for_master FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_c2c_stats_for_master TO service_role, authenticated;
