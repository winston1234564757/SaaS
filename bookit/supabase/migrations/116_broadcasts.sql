-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 116: Broadcasts — targeted marketing campaigns (Push/Telegram/SMS)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. broadcasts_used counter on master_profiles ────────────────────────────
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS broadcasts_used INT NOT NULL DEFAULT 0;

-- ── 2. broadcasts — campaign definition ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcasts (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id             UUID         NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  title                 TEXT         NOT NULL,
  message_template      TEXT         NOT NULL,
  channels              TEXT[]       NOT NULL DEFAULT ARRAY['push','telegram','sms'],
  tag_filters           TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  discount_percent      INT          CHECK (discount_percent BETWEEN 1 AND 99),
  discount_service_id   UUID         REFERENCES services(id) ON DELETE SET NULL,
  discount_expires_days INT          CHECK (discount_expires_days BETWEEN 1 AND 30),
  service_link_id       UUID         REFERENCES services(id) ON DELETE SET NULL,
  product_link_id       UUID         REFERENCES products(id) ON DELETE SET NULL,
  status                TEXT         NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','sent','failed')),
  recipients_count      INT          NOT NULL DEFAULT 0,
  sent_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS broadcasts_master_idx ON broadcasts(master_id);
CREATE INDEX IF NOT EXISTS broadcasts_status_idx  ON broadcasts(master_id, status, created_at DESC);

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Masters manage own broadcasts" ON broadcasts;
CREATE POLICY "Masters manage own broadcasts"
  ON broadcasts FOR ALL
  TO authenticated
  USING  (master_id = auth.uid())
  WITH CHECK (master_id = auth.uid());

-- ── 3. broadcast_recipients — per-client delivery log ────────────────────────
CREATE TABLE IF NOT EXISTS broadcast_recipients (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id    UUID         NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  client_id       UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone           TEXT         NOT NULL,
  push_sent       BOOLEAN      NOT NULL DEFAULT FALSE,
  telegram_sent   BOOLEAN      NOT NULL DEFAULT FALSE,
  sms_sent        BOOLEAN      NOT NULL DEFAULT FALSE,
  clicked_at      TIMESTAMPTZ,
  booked_at       TIMESTAMPTZ,
  discount_used_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (broadcast_id, client_id)
);

CREATE INDEX IF NOT EXISTS broadcast_recipients_broadcast_idx ON broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS broadcast_recipients_client_idx    ON broadcast_recipients(client_id);

ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Masters view own broadcast recipients" ON broadcast_recipients;
CREATE POLICY "Masters view own broadcast recipients"
  ON broadcast_recipients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM broadcasts b
      WHERE b.id = broadcast_id AND b.master_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role manages broadcast recipients" ON broadcast_recipients;
CREATE POLICY "Service role manages broadcast recipients"
  ON broadcast_recipients FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ── 4. broadcast_links — short link redirect table ────────────────────────────
CREATE TABLE IF NOT EXISTS broadcast_links (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT         NOT NULL UNIQUE,
  broadcast_id  UUID         NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  recipient_id  UUID         REFERENCES broadcast_recipients(id) ON DELETE SET NULL,
  target_url    TEXT         NOT NULL,
  clicks        INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS broadcast_links_code_idx         ON broadcast_links(code);
CREATE INDEX IF NOT EXISTS broadcast_links_broadcast_idx    ON broadcast_links(broadcast_id);

ALTER TABLE broadcast_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read broadcast links" ON broadcast_links;
CREATE POLICY "Anyone can read broadcast links"
  ON broadcast_links FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Service role manages broadcast links" ON broadcast_links;
CREATE POLICY "Service role manages broadcast links"
  ON broadcast_links FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ── 5. phone_discounts — phone-bound one-time discounts ──────────────────────
CREATE TABLE IF NOT EXISTS phone_discounts (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id     UUID         NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  master_id        UUID         NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  phone            TEXT         NOT NULL,
  service_id       UUID         REFERENCES services(id) ON DELETE SET NULL,
  discount_percent INT          NOT NULL CHECK (discount_percent BETWEEN 1 AND 99),
  expires_at       TIMESTAMPTZ  NOT NULL,
  used_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (broadcast_id, phone)
);

CREATE INDEX IF NOT EXISTS phone_discounts_phone_master_idx  ON phone_discounts(phone, master_id) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS phone_discounts_broadcast_idx     ON phone_discounts(broadcast_id);
CREATE INDEX IF NOT EXISTS phone_discounts_expires_idx       ON phone_discounts(expires_at) WHERE used_at IS NULL;

ALTER TABLE phone_discounts ENABLE ROW LEVEL SECURITY;

-- Public read by phone (needed for BookingWizard guest flow)
DROP POLICY IF EXISTS "Anyone can read phone discounts" ON phone_discounts;
CREATE POLICY "Anyone can read phone discounts"
  ON phone_discounts FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Service role manages phone discounts" ON phone_discounts;
CREATE POLICY "Service role manages phone discounts"
  ON phone_discounts FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ── 6. RPC: claim_phone_discount ──────────────────────────────────────────────
-- Atomically marks a phone_discount as used and sets broadcast_recipients.discount_used_at
CREATE OR REPLACE FUNCTION claim_phone_discount(
  p_phone        TEXT,
  p_master_id    UUID,
  p_service_id   UUID DEFAULT NULL
)
RETURNS TABLE(discount_percent INT, discount_id UUID)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_discount phone_discounts%ROWTYPE;
BEGIN
  -- Lock the row
  SELECT * INTO v_discount
  FROM phone_discounts
  WHERE phone = p_phone
    AND master_id = p_master_id
    AND used_at IS NULL
    AND expires_at > NOW()
    AND (service_id IS NULL OR service_id = p_service_id)
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Mark used
  UPDATE phone_discounts SET used_at = NOW() WHERE id = v_discount.id;

  -- Update recipient log
  UPDATE broadcast_recipients
  SET discount_used_at = NOW()
  WHERE broadcast_id = v_discount.broadcast_id AND phone = p_phone;

  RETURN QUERY SELECT v_discount.discount_percent, v_discount.id;
END;
$$;

REVOKE ALL ON FUNCTION claim_phone_discount FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_phone_discount TO service_role, authenticated;
