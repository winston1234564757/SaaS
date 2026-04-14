-- Migration 031: Migrate flash_deals.status from TEXT to ENUM
-- TEXT allowed any string value; ENUM enforces 'active' | 'claimed' | 'expired' at DB level.
-- Note: must drop the TEXT default first, cast the type, then restore the ENUM default.
-- Doing it in one statement fails with SQLSTATE 42804 on fresh Supabase stacks.

CREATE TYPE IF NOT EXISTS flash_deal_status AS ENUM ('active', 'claimed', 'expired');

-- Step 1: Drop the text default so Postgres can freely change the column type
ALTER TABLE flash_deals ALTER COLUMN status DROP DEFAULT;

-- Step 2: Cast existing rows to the new ENUM
ALTER TABLE flash_deals
  ALTER COLUMN status TYPE flash_deal_status
    USING status::flash_deal_status;

-- Step 3: Restore the default as the ENUM value
ALTER TABLE flash_deals ALTER COLUMN status SET DEFAULT 'active'::flash_deal_status;
