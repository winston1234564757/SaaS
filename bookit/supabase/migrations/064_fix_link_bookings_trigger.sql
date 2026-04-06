-- Migration 064: Fix migration 063 — add performance index + trigger idempotency
--
-- Issue 1: bookings(client_phone) had no index — trigger was doing seq scan.
-- Partial index covers only unlinked bookings (WHERE client_id IS NULL),
-- which are the only rows the trigger ever touches. Once linked, the index
-- entry is automatically removed.
--
-- Issue 2: CREATE TRIGGER in 063 was not idempotent.
-- Re-creating trigger here with DROP IF EXISTS for safety.

-- Performance: partial index for trigger's WHERE clause
CREATE INDEX IF NOT EXISTS idx_bookings_client_phone_unlinked
  ON bookings (client_phone)
  WHERE client_id IS NULL;

COMMENT ON INDEX idx_bookings_client_phone_unlinked IS
  'Partial index for trg_link_bookings_on_phone trigger. '
  'Covers only unlinked guest bookings. Entry removed automatically when client_id is set.';

-- Idempotency: re-create trigger with DROP IF EXISTS pattern
DROP TRIGGER IF EXISTS trg_link_bookings_on_phone ON profiles;
CREATE TRIGGER trg_link_bookings_on_phone
  AFTER INSERT OR UPDATE OF phone ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_bookings_by_phone();

COMMENT ON TRIGGER trg_link_bookings_on_phone ON profiles IS
  'Fires after profile phone is set/changed. Links unlinked guest bookings by phone match.';

DO $$
BEGIN
  RAISE LOG 'Migration 064: idx_bookings_client_phone_unlinked created, trigger re-created idempotently';
END;
$$;
