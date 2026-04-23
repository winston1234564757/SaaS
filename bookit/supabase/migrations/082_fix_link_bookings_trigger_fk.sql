-- Migration 082: Fix link_bookings_by_phone trigger foreign key violation
--
-- The trg_link_bookings_on_phone trigger fires when profiles.phone is updated.
-- It attempts to link guest bookings to the profile via bookings.client_id = NEW.id.
-- However, bookings.client_id has a foreign key to client_profiles(id).
-- If the user updating their phone is a Master and doesn't have a client_profiles row,
-- the UPDATE on bookings fails with a foreign key violation.
-- This migration ensures a client_profiles row exists before linking.

CREATE OR REPLACE FUNCTION public.link_bookings_by_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only if phone was added or changed
  IF NEW.phone IS NOT NULL
     AND (OLD IS NULL OR OLD.phone IS DISTINCT FROM NEW.phone)
  THEN
    -- Check if there are actually any guest bookings to link
    IF EXISTS (SELECT 1 FROM bookings WHERE client_phone = NEW.phone AND client_id IS NULL) THEN
      
      -- Ensure client_profile exists to satisfy bookings_client_id_fkey
      -- Since this is SECURITY DEFINER, it bypasses RLS and can insert safely.
      INSERT INTO client_profiles (id)
      VALUES (NEW.id)
      ON CONFLICT (id) DO NOTHING;

      -- Now update the bookings safely
      UPDATE bookings
      SET client_id = NEW.id
      WHERE client_phone = NEW.phone
        AND client_id IS NULL;
        
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.link_bookings_by_phone() IS
  'Auto-links guest bookings to a profile when phone is set/updated. Ensures client_profile exists to satisfy FK.';
