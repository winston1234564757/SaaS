  -- Migration 019: Atomic SMS rate-limit function
  -- Fixes race condition in verify-sms: SELECT count + INSERT were two separate
  -- operations, allowing concurrent requests to both pass under the limit.
  -- This RPC executes check + log atomically inside one transaction with
  -- a per-phone advisory lock, preventing any concurrent bypass.

  CREATE OR REPLACE FUNCTION check_and_log_sms_attempt(
    p_phone        text,
    max_attempts   int,
    window_minutes int DEFAULT 15
  )
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
    v_count int;
  BEGIN
    -- Serialize concurrent calls for the same phone number.
    -- pg_advisory_xact_lock is released automatically at transaction end.
    PERFORM pg_advisory_xact_lock(hashtext(p_phone));

    -- Count attempts within the rolling window
    SELECT COUNT(*) INTO v_count
    FROM sms_verify_attempts
    WHERE phone = p_phone
      AND created_at >= now() - (window_minutes || ' minutes')::interval;

    -- Reject if over limit
    IF v_count >= max_attempts THEN
      RETURN false;
    END IF;

    -- Log this attempt (before we even check the OTP — fail-safe throttling)
    INSERT INTO sms_verify_attempts (phone) VALUES (p_phone);

    RETURN true;
  END;
  $$;

  -- Grant execute to service role (used by admin client in route handler)
  GRANT EXECUTE ON FUNCTION check_and_log_sms_attempt(text, int, int) TO service_role;
