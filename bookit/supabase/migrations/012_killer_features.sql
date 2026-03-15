-- ============================================================
-- 012 — Flash Deals + Dynamic Pricing + Smart Rebooking
-- ============================================================

-- ─── FLASH DEALS ─────────────────────────────────────────────
CREATE TABLE flash_deals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id      UUID NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  service_name   TEXT NOT NULL,
  slot_date      DATE NOT NULL,
  slot_time      TIME NOT NULL,
  original_price INT  NOT NULL, -- in kopecks
  discount_pct   INT  NOT NULL CHECK (discount_pct BETWEEN 5 AND 70),
  expires_at     TIMESTAMPTZ NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active', -- active | claimed | expired
  claimed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_flash_deals_master    ON flash_deals(master_id);
CREATE INDEX idx_flash_deals_status    ON flash_deals(status);
CREATE INDEX idx_flash_deals_expires   ON flash_deals(expires_at);

ALTER TABLE flash_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master manages own flash deals" ON flash_deals
  USING (master_id = auth.uid());

CREATE POLICY "Anyone can read active flash deals" ON flash_deals
  FOR SELECT USING (status = 'active');

-- ─── DYNAMIC PRICING ─────────────────────────────────────────
-- pricing_rules JSONB structure:
-- {
--   peak: { days: ["fri","sat"], hours: [16,20], markup_pct: 15 },
--   quiet: { days: ["mon","tue","wed"], hours: [9,13], discount_pct: 10 },
--   early_bird: { days_ahead: 14, discount_pct: 7 },
--   last_minute: { hours_ahead: 4, discount_pct: 20 }
-- }
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS pricing_rules JSONB DEFAULT '{}';

-- ─── SMART REBOOKING ─────────────────────────────────────────
-- Suggested next visit date per booking (set when status → completed)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS next_visit_suggestion DATE;

-- Track sent rebooking reminders to avoid duplicates
CREATE TABLE rebooking_reminders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sent_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(booking_id)
);
