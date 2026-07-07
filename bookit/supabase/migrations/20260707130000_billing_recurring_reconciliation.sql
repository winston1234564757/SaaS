-- Migration 20260707130000: Recurring-billing reconciliation + double-charge lock
--
-- Fixes three P1 defects in the recurring-charge engine (R2 audit 10-billing):
--   1. pending-treated-as-paid  → cron now defers pending charges to the webhook
--      (see expire-subscriptions/route.ts chargeAndCommit). Needs pending_invoice_id.
--   2. recurring webhook not reconciled → mono-webhook now settles recurring_* refs.
--   3. SKIP LOCKED double-charge → the old RPC did SELECT ... FOR UPDATE SKIP LOCKED,
--      but PostgREST commits each .rpc() as its own transaction, releasing the row
--      locks the moment the function returns — BEFORE the up-to-8s charge. Two
--      overlapping cron runs both fetched the same due row and both charged it.
--      Replaced with an atomic UPDATE ... SET charging_at = NOW() ... RETURNING *:
--      the claim is a committed write, so it survives past the RPC transaction and a
--      concurrent run cannot re-pick a row that is already being charged.

-- ── In-flight charge tracking ─────────────────────────────────────────────────
ALTER TABLE master_subscriptions
  ADD COLUMN IF NOT EXISTS charging_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pending_invoice_id TEXT;

-- ── Atomic claim RPC (replaces the FOR UPDATE SKIP LOCKED version) ────────────
-- A row is claimable when it is due AND either:
--   • it has no in-flight charge and is not currently being charged (15-min guard
--     covers a crashed/timed-out run), OR
--   • it has an unresolved pending charge whose settlement never arrived — after
--     25h (> Monobank's 24h webhook-retry window) we release it for a fresh attempt.
CREATE OR REPLACE FUNCTION get_pending_subscriptions_for_billing(batch_size INT DEFAULT 50)
RETURNS SETOF master_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    UPDATE master_subscriptions
    SET charging_at = NOW()
    WHERE id IN (
      SELECT id
      FROM master_subscriptions
      WHERE status = 'active'
        AND next_charge_at IS NOT NULL
        AND next_charge_at <= NOW()
        AND (
          (pending_invoice_id IS NULL
             AND (charging_at IS NULL OR charging_at < NOW() - INTERVAL '15 minutes'))
          OR
          (pending_invoice_id IS NOT NULL
             AND charging_at < NOW() - INTERVAL '25 hours')
        )
      ORDER BY next_charge_at ASC
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION get_pending_subscriptions_for_billing(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_pending_subscriptions_for_billing(INT) TO service_role;
