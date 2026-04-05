-- 059: Atomic flash deal claiming to prevent double-claim race condition
-- BL-03: Two concurrent bookings could both read status='active' and apply discount twice.
-- This function updates the row in a single statement — only one concurrent call succeeds.

CREATE OR REPLACE FUNCTION fn_claim_flash_deal_atomic(
  p_deal_id    UUID,
  p_booking_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_updated INT;
BEGIN
  UPDATE flash_deals
  SET    status     = 'claimed',
         booking_id = p_booking_id
  WHERE  id         = p_deal_id
    AND  status     = 'active'
    AND  expires_at > now();

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RETURN v_rows_updated > 0;
END;
$$;

-- Only service_role can call this function (Server Actions use admin client)
REVOKE ALL ON FUNCTION fn_claim_flash_deal_atomic(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_claim_flash_deal_atomic(UUID, UUID) TO service_role;
