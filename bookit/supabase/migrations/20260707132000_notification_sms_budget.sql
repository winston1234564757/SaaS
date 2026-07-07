-- Migration 20260707132000: notification-SMS spend guard rails
--
-- Fix R2 audit 11-notifications P2 (SMS spend has no guard rails): sendTurboSMS (the
-- ONLY path for notification SMS — OTP uses Supabase's provider + check_and_log_sms_attempt)
-- had no per-recipient, per-master or global cap. Combined with the unauthenticated,
-- un-rate-limited public booking/order surface, a spam script converted directly into
-- TurboSMS spend, and a single client could be blasted with SMS.
--
-- This adds an atomic budget check (mirrors the OTP limiter pattern, migration 019):
-- a per-recipient daily cap AND a global daily cap, both enforced under an advisory
-- lock so concurrent sends cannot bypass the ceiling.

CREATE TABLE IF NOT EXISTS notification_sms_log (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  phone      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_sms_log_created
  ON notification_sms_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_sms_log_phone_created
  ON notification_sms_log (phone, created_at DESC);

-- Sensitive table: no public/anon access (service_role bypasses RLS).
ALTER TABLE notification_sms_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION check_notification_sms_budget(
  p_phone             text,
  p_per_recipient_cap int DEFAULT 6,
  p_global_cap        int DEFAULT 400
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient int;
  v_global    int;
BEGIN
  -- Serialize all notification-SMS budget checks so the global cap is exact.
  -- Volume is low (critical notifications only), so a single lock is acceptable.
  PERFORM pg_advisory_xact_lock(hashtext('notification_sms_budget'));

  SELECT COUNT(*) INTO v_recipient
  FROM notification_sms_log
  WHERE phone = p_phone
    AND created_at >= now() - interval '24 hours';
  IF v_recipient >= p_per_recipient_cap THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO v_global
  FROM notification_sms_log
  WHERE created_at >= now() - interval '24 hours';
  IF v_global >= p_global_cap THEN
    RETURN false;
  END IF;

  INSERT INTO notification_sms_log (phone) VALUES (p_phone);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION check_notification_sms_budget(text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_notification_sms_budget(text, int, int) TO service_role;
