-- Migration 031: Migrate flash_deals.status from TEXT to ENUM
-- TEXT allowed any string value; ENUM enforces 'active' | 'claimed' | 'expired' at DB level.
-- Note: must drop the TEXT default first, cast the type, then restore the ENUM default.
-- Doing it in one statement fails with SQLSTATE 42804 on fresh Supabase stacks.

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flash_deal_status') THEN
        CREATE TYPE flash_deal_status AS ENUM ('active', 'claimed', 'expired');
    END IF;
END $$;

-- Step 1: Drop the text default and the RLS policy that depends on the 'status' column
-- Postgres won't allow ALTER COLUMN TYPE if the column is used in a policy.
ALTER TABLE flash_deals ALTER COLUMN status DROP DEFAULT;
DROP POLICY IF EXISTS "Anyone can read active flash deals" ON flash_deals;

-- Step 2: Cast existing rows to the new ENUM
ALTER TABLE flash_deals
  ALTER COLUMN status TYPE flash_deal_status
    USING status::flash_deal_status;

-- Step 3: Restore the default and the RLS policy
ALTER TABLE flash_deals ALTER COLUMN status SET DEFAULT 'active'::flash_deal_status;

CREATE POLICY "Anyone can read active flash deals" ON flash_deals
  FOR SELECT USING (status = 'active'::flash_deal_status);
