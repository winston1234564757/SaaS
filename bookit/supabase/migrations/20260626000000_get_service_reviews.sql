-- Migration: get_service_reviews RPC — per-service published reviews (M-SVC-03)
-- Created: 2026-06-26
-- Affects: reviews (read), booking_services (read) — NO schema change to either
--
-- Context: reviews are bound to a booking (reviews.booking_id), not to a service.
-- bookings.service_id is NOT populated by createBooking — the only link between a
-- review and a service is reviews.booking_id -> booking_services.service_id.
-- A multi-service booking's single review therefore surfaces under each of its
-- services (accepted product decision, M-SVC-03). No denormalised reviews.service_id.

-- ============================================================
-- SAFETY CHECKS
-- ============================================================

DO $$
BEGIN
  ASSERT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'),
    'reviews table missing';
  ASSERT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'booking_services'),
    'booking_services table missing';
END $$;

-- ============================================================
-- INDEXES (support the join; idempotent)
-- ============================================================
-- booking_services(service_id) and (booking_id) already exist (038/045/20260620000002).
-- Add reviews(booking_id) so the reviews join filters efficiently.
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);

-- ============================================================
-- RPC
-- ============================================================
-- Returns ONLY published reviews. SECURITY DEFINER so anonymous (public booking
-- page) visitors can read them through the explicit is_published filter without
-- exposing booking_services / internal review columns (booking_id, client_id, etc).

CREATE OR REPLACE FUNCTION public.get_service_reviews(p_service_id uuid)
RETURNS TABLE (
  id          uuid,
  rating      int,
  comment     text,
  client_name text,
  created_at  timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT DISTINCT r.id, r.rating, r.comment, r.client_name, r.created_at
  FROM reviews r
  JOIN booking_services bs ON bs.booking_id = r.booking_id
  WHERE bs.service_id = p_service_id
    AND r.is_published = true
  ORDER BY r.created_at DESC;
$$;

-- ============================================================
-- GRANTS
-- ============================================================
REVOKE ALL ON FUNCTION public.get_service_reviews(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_service_reviews(uuid) TO anon, authenticated;

-- ============================================================
-- ROLLBACK NOTES
-- ============================================================
-- DROP FUNCTION IF EXISTS public.get_service_reviews(uuid);
-- DROP INDEX IF EXISTS public.idx_reviews_booking_id;
