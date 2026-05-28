-- Allow clients to see master profiles of masters they have booked with
-- (regardless of is_published status)
CREATE POLICY "Client can see masters they booked with"
  ON master_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.master_id = master_profiles.id
        AND bookings.client_id = auth.uid()
    )
  );
