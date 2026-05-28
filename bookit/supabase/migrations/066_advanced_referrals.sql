-- ═══════════════════════════════════════════════════════════════
-- 066: Advanced Referral Suite & Cartel System
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Таблиця партнерств майстрів (Cartel System) ────────────

CREATE TABLE IF NOT EXISTS master_partners (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id    UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  partner_id   UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  
  -- Мастер не може бути партнером самого себе
  CONSTRAINT master_not_self_partner CHECK (master_id != partner_id),
  -- Унікальність зв'язку
  UNIQUE(master_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_master_partners_master ON master_partners(master_id);
CREATE INDEX IF NOT EXISTS idx_master_partners_partner ON master_partners(partner_id);

-- ── 2. Таблиця промокодів Бартерного Контракту (C2B) ──────────

CREATE TABLE IF NOT EXISTS client_promocodes (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID        NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  master_id           UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  discount_percentage INTEGER     NOT NULL DEFAULT 50,
  is_used             BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_promocodes_client ON client_promocodes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_promocodes_master ON client_promocodes(master_id, is_used);

-- ── 3. RLS для нових таблиць ──────────────────────────────────

ALTER TABLE master_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_promocodes ENABLE ROW LEVEL SECURITY;

-- Master partners: читати можуть обидві сторони
DROP POLICY IF EXISTS "master_partners: basic select" ON master_partners;
CREATE POLICY "master_partners: basic select"
  ON master_partners FOR SELECT
  USING (auth.uid() = master_id OR auth.uid() = partner_id);

-- Client promocodes: читає власник (клієнт)
DROP POLICY IF EXISTS "client_promocodes: owner select" ON client_promocodes;
CREATE POLICY "client_promocodes: owner select"
  ON client_promocodes FOR SELECT
  USING (auth.uid() = client_id);

-- ── 4. Забезпечення реферальних кодів для існуючих клієнтів ───

-- Функція для генерації короткого коду
CREATE OR REPLACE FUNCTION generate_short_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Backfill для існуючих профілів
UPDATE client_profiles
SET referral_code = generate_short_code()
WHERE referral_code IS NULL;

-- ── 5. Надання прав для service_role ──────────────────────────

GRANT ALL ON master_partners TO service_role;
GRANT ALL ON client_promocodes TO service_role;

-- ── 6. Допоміжні функції ────────────────────────────────────────

-- RPC для інкременту лічильника запрошених майстрів
CREATE OR REPLACE FUNCTION increment_client_master_invite_count(p_client_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE client_profiles
  SET total_masters_invited = total_masters_invited + 1
  WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
