-- Allow a client to claim an unclaimed booking (set client_id = their own id)
-- This is needed for the post-booking registration flow
CREATE POLICY "Client can claim unclaimed booking"
  ON bookings FOR UPDATE
  USING (client_id IS NULL)
  WITH CHECK (client_id = auth.uid());
