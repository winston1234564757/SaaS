-- Migration 027: Atomic SMS send rate-limit function
-- Fixes TOCTOU race condition in send-sms: SELECT COUNT + conditional INSERT
-- were two separate operations, allowing concurrent requests to bypass limits.
-- This RPC executes both checks + both inserts atomically inside one transaction
-- with advisory locks on phone and IP, preventing any concurrent bypass.

CREATE OR REPLACE FUNCTION check_and_log_sms_send(
  p_phone            text,
  p_ip               text,
  phone_max_sends    int DEFAULT 3,
  phone_window_min   int DEFAULT 15,
  ip_max_sends       int DEFAULT 10,
  ip_window_hours    int DEFAULT 1
)
RETURNS text   -- 'ok' | 'phone_limit' | 'ip_limit'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_phone_lock bigint := hashtext(p_phone);
  v_ip_lock    bigint := hashtext('ip:' || p_ip);
  v_phone_count int;
  v_ip_count    int;
BEGIN
  -- Acquire advisory locks in sorted order to prevent deadlocks
  -- between concurrent requests that share phone or IP.
  IF v_phone_lock <= v_ip_lock THEN
    PERFORM pg_advisory_xact_lock(v_phone_lock);
    PERFORM pg_advisory_xact_lock(v_ip_lock);
  ELSE
    PERFORM pg_advisory_xact_lock(v_ip_lock);
    PERFORM pg_advisory_xact_lock(v_phone_lock);
  END IF;

  -- Check phone rate limit (sms_logs)
  SELECT COUNT(*) INTO v_phone_count
  FROM sms_logs
  WHERE phone = p_phone
    AND created_at >= now() - (phone_window_min || ' minutes')::interval;

  IF v_phone_count >= phone_max_sends THEN
    RETURN 'phone_limit';
  END IF;

  -- Check IP rate limit (sms_ip_logs)
  SELECT COUNT(*) INTO v_ip_count
  FROM sms_ip_logs
  WHERE ip_address = p_ip
    AND created_at >= now() - (ip_window_hours || ' hours')::interval;

  IF v_ip_count >= ip_max_sends THEN
    RETURN 'ip_limit';
  END IF;

  -- Both checks passed — log atomically
  INSERT INTO sms_logs (phone, ip) VALUES (p_phone, p_ip);
  INSERT INTO sms_ip_logs (ip_address) VALUES (p_ip);

  RETURN 'ok';
END;
$$;

-- Grant execute to service role (used by admin client in route handler)
GRANT EXECUTE ON FUNCTION check_and_log_sms_send(text, text, int, int, int, int) TO service_role;
