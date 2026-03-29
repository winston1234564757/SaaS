-- ═══════════════════════════════════════════════════════════════
-- 057: Referral MVP — B2B / C2M / C2C
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Таблиця реферальних лінків ────────────────────────────────

CREATE TABLE IF NOT EXISTS referral_links (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT        UNIQUE NOT NULL,
  owner_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_role       TEXT        NOT NULL CHECK (owner_role IN ('master', 'client')),
  target_type      TEXT        NOT NULL CHECK (target_type IN ('B2B', 'C2M', 'C2C')),
  -- Для C2C: до якого майстра веде лінк (Клієнт А → клієнт/подруга до цього майстра)
  target_master_id UUID        REFERENCES master_profiles(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_links_code  ON referral_links(code);
CREATE INDEX IF NOT EXISTS idx_referral_links_owner ON referral_links(owner_id, target_type);

-- ── 2. Колонка для нагороди C2C ──────────────────────────────────

ALTER TABLE client_master_relations
  ADD COLUMN IF NOT EXISTS has_referral_discount_active BOOLEAN DEFAULT false;

-- ── 3. Колонка для відстеження C2C у бронюваннях ─────────────────

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS referral_code_used TEXT;

-- ── 4. RLS ───────────────────────────────────────────────────────

ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;

-- Власник може читати свої лінки
CREATE POLICY "referral_links: owner reads own"
  ON referral_links FOR SELECT
  USING (owner_id = auth.uid());

-- Service role керує всім (Server Actions через admin client)
CREATE POLICY "referral_links: service role all"
  ON referral_links FOR ALL
  USING (auth.role() = 'service_role');

-- ── 5. DB Trigger: C2C — активуємо знижку при completed ──────────

CREATE OR REPLACE FUNCTION fn_referral_c2c_on_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link referral_links%ROWTYPE;
BEGIN
  -- Спрацьовує лише при переході САМЕ в 'completed' і є реф-код
  IF NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed'
     AND NEW.referral_code_used IS NOT NULL
  THEN
    SELECT * INTO v_link
    FROM referral_links
    WHERE code = NEW.referral_code_used
      AND target_type = 'C2C'
    LIMIT 1;

    IF FOUND THEN
      -- Активуємо знижку Клієнту А (власник лінка) у нього конкретного майстра
      UPDATE client_master_relations
      SET    has_referral_discount_active = true
      WHERE  client_id = v_link.owner_id
        AND  master_id = v_link.target_master_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_referral_c2c_on_complete ON bookings;
CREATE TRIGGER trg_referral_c2c_on_complete
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION fn_referral_c2c_on_complete();
