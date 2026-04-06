-- Migration 063: Auto-link guest bookings when profile.phone is set
-- Trigger fires AFTER any INSERT or UPDATE that sets/changes profiles.phone.
-- Atomically updates bookings.client_id = profiles.id
-- for all rows where client_phone = NEW.phone AND client_id IS NULL.

CREATE OR REPLACE FUNCTION public.link_bookings_by_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Тільки якщо phone з'явився або змінився (не NULL → NULL не рахується)
  IF NEW.phone IS NOT NULL
     AND (OLD IS NULL OR OLD.phone IS DISTINCT FROM NEW.phone)
  THEN
    UPDATE bookings
    SET client_id = NEW.id
    WHERE client_phone = NEW.phone
      AND client_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_link_bookings_on_phone
  AFTER INSERT OR UPDATE OF phone ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_bookings_by_phone();

COMMENT ON FUNCTION public.link_bookings_by_phone() IS
  'Auto-links guest bookings to a profile when phone is set/updated. '
  'Fires via trg_link_bookings_on_phone trigger on profiles table.';
