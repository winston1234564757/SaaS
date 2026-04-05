-- 058: Booking overlap exclusion constraint
-- Prevents two bookings for the same master overlapping in time
-- Requires btree_gist extension for non-equality operators in EXCLUDE

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Existing bookings: add constraint only if it does not exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_bookings'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT no_overlapping_bookings
      EXCLUDE USING gist (
        master_id WITH =,
        tsrange(
          (date + start_time)::timestamp,
          (date + end_time)::timestamp,
          '[)'
        ) WITH &&
      )
      WHERE (status IN ('pending', 'confirmed'));
  END IF;
END;
$$;
