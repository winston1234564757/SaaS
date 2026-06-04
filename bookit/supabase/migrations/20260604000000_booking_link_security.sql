-- P0.1: Booking link security — audit table for linkBookingToClient
-- Allows rate-limit enforcement and audit of all booking link attempts

CREATE TABLE IF NOT EXISTS public.link_attempts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID        NOT NULL REFERENCES public.bookings(id)  ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  result     TEXT        NOT NULL CHECK (result IN (
               'success', 'phone_mismatch', 'not_found', 'already_linked', 'rate_limited'
             )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_link_attempts_user_id    ON public.link_attempts(user_id,    created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_attempts_booking_id ON public.link_attempts(booking_id, created_at DESC);

ALTER TABLE public.link_attempts ENABLE ROW LEVEL SECURITY;
-- No SELECT/INSERT/UPDATE/DELETE policy → only service_role can access
