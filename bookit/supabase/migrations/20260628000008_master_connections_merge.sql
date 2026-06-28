-- M-GROW-02: обʼєднання master_partners + master_alliances → master_connections.
-- master_referrals (білінг) НЕ чіпаємо. Additive + reversible: старі таблиці лишаються
-- (drop окремою міграцією після verify на проді). Backfill ідемпотентний.
--
-- Bilateral-модель: рядок на пару (master_id бачить other_id). Дзеркалить наявну
-- partners-модель (2 симетричні рядки). Alliance (1 directional) розгортається у 2 рядки
-- з role inviter/invitee для збереження напряму.

CREATE TABLE IF NOT EXISTS master_connections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id   uuid NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  other_id    uuid NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('partner','alliance')),
  status      text NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending','accepted')),
  role        text CHECK (role IN ('inviter','invitee')),   -- лише alliance; NULL для partner (mutual)
  is_visible  boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mc_no_self CHECK (master_id != other_id),
  UNIQUE (master_id, other_id)
);

COMMENT ON TABLE  master_connections IS 'Обʼєднана мережа майстра: партнери (cross-promo) + альянси (реферал-граф). M-GROW-02.';
COMMENT ON COLUMN master_connections.kind   IS 'partner = взаємна співпраця; alliance = реферал-звʼязок.';
COMMENT ON COLUMN master_connections.role   IS 'inviter/invitee — напрям реферала (лише kind=alliance); NULL для partner.';

CREATE INDEX IF NOT EXISTS idx_mc_master ON master_connections(master_id, kind, status);
CREATE INDEX IF NOT EXISTS idx_mc_other  ON master_connections(other_id);
CREATE INDEX IF NOT EXISTS idx_mc_public ON master_connections(other_id) WHERE is_visible AND status='accepted';

-- ── Backfill ──────────────────────────────────────────────────────────────────
-- 1. partners (вже bilateral) → прямий копі
INSERT INTO master_connections (master_id, other_id, kind, status, role, is_visible, created_at)
SELECT master_id, partner_id, 'partner', status, NULL, COALESCE(is_visible, true), created_at
FROM master_partners
ON CONFLICT (master_id, other_id) DO NOTHING;

-- 2. alliances → 2 bilateral рядки (inviter-сторона + invitee-сторона).
--    Dedup: partner перемагає (вставлено першим), тож пара що і партнер і реферал лишається 'partner'.
INSERT INTO master_connections (master_id, other_id, kind, status, role, is_visible, created_at)
SELECT inviter_id, invitee_id, 'alliance', 'accepted', 'inviter', COALESCE(is_visible, true), created_at
FROM master_alliances
ON CONFLICT (master_id, other_id) DO NOTHING;

INSERT INTO master_connections (master_id, other_id, kind, status, role, is_visible, created_at)
SELECT invitee_id, inviter_id, 'alliance', 'accepted', 'invitee', COALESCE(is_visible, true), created_at
FROM master_alliances
ON CONFLICT (master_id, other_id) DO NOTHING;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE master_connections ENABLE ROW LEVEL SECURITY;

-- власник читає свої звʼязки (обидві сторони)
CREATE POLICY mc_owner_read ON master_connections FOR SELECT TO authenticated
  USING (auth.uid() = master_id OR auth.uid() = other_id);

-- ПУБЛІЧНЕ читання видимих прийнятих звʼязків — фіксить мертвий trustedPartners для анонів.
-- Тече лише факт «X у видимій мережі Y» (не PII) — те, що майстер сам увімкнув.
CREATE POLICY mc_public_read ON master_connections FOR SELECT TO anon, authenticated
  USING (is_visible = true AND status = 'accepted');

-- admin
CREATE POLICY mc_admin ON master_connections FOR ALL TO authenticated
  USING (is_admin());

-- write — лише service_role (actions через admin client). Без INSERT/UPDATE/DELETE політик для anon/authenticated.
GRANT SELECT ON master_connections TO anon, authenticated;
GRANT ALL    ON master_connections TO service_role;
