-- Migration 086: Recurring billing columns + RPC for safe cron locking
-- Adds status/failed_attempts/next_charge_at to master_subscriptions
-- Adds get_pending_subscriptions_for_billing RPC (FOR UPDATE SKIP LOCKED)

-- ── Alter master_subscriptions ────────────────────────────────────────────────

ALTER TABLE master_subscriptions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'canceled')),
  ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_charge_at TIMESTAMPTZ;

-- Index for cron query: status = 'active' AND next_charge_at <= NOW()
CREATE INDEX IF NOT EXISTS master_subscriptions_billing_idx
  ON master_subscriptions (status, next_charge_at)
  WHERE status = 'active';

-- ── RPC: get_pending_subscriptions_for_billing ────────────────────────────────
-- Safely fetch-and-lock active subscriptions whose next_charge_at is due.
-- Uses FOR UPDATE SKIP LOCKED to prevent race conditions between concurrent
-- cron instances. Returns locked rows; transaction must stay open while charging.

CREATE OR REPLACE FUNCTION get_pending_subscriptions_for_billing(batch_size INT DEFAULT 50)
RETURNS SETOF master_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT *
    FROM master_subscriptions
    WHERE status = 'active'
      AND next_charge_at IS NOT NULL
      AND next_charge_at <= NOW()
    ORDER BY next_charge_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED;
END;
$$;

-- Grant execute to service_role only (cron uses service_role key)
REVOKE ALL ON FUNCTION get_pending_subscriptions_for_billing(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_pending_subscriptions_for_billing(INT) TO service_role;
