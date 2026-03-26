-- Migration 031: Migrate flash_deals.status from TEXT to ENUM
-- TEXT allowed any string value; ENUM enforces 'active' | 'claimed' | 'expired' at DB level.

CREATE TYPE flash_deal_status AS ENUM ('active', 'claimed', 'expired');

ALTER TABLE flash_deals
  ALTER COLUMN status TYPE flash_deal_status
    USING status::flash_deal_status,
  ALTER COLUMN status SET DEFAULT 'active'::flash_deal_status;
