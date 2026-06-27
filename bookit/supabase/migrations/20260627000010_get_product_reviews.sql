-- Migration: get_product_reviews RPC — per-product published reviews (M-SHOP-03b)
-- Created: 2026-06-27
-- Affects: reviews (read), order_items (read) — NO schema change to either
--
-- Context: order reviews are bound to an order (reviews.order_id), not to a
-- product. The link between a review and a product is
-- reviews.order_id -> order_items.product_id. A multi-product order's single
-- review therefore surfaces under each of its products (accepted product
-- decision, mirrors M-SVC-03 get_service_reviews). reviews.product_id exists
-- but is not populated by the current per-order review flow — left unused.

-- ============================================================
-- SAFETY CHECKS
-- ============================================================

DO $$
BEGIN
  ASSERT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'),
    'reviews table missing';
  ASSERT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'order_items'),
    'order_items table missing';
  ASSERT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'order_id'),
    'reviews.order_id missing';
END $$;

-- ============================================================
-- INDEXES (join support — all already present, asserted idempotently)
-- ============================================================
-- idx_reviews_order_id, idx_order_items_order, idx_order_items_product already exist.
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);

-- ============================================================
-- RPC
-- ============================================================
-- Returns ONLY published reviews. SECURITY DEFINER so anonymous (public shop /
-- product page) visitors can read them through the explicit is_published filter
-- without exposing internal review columns (order_id, client_id, master_id, etc).

CREATE OR REPLACE FUNCTION public.get_product_reviews(p_product_id uuid)
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
  JOIN order_items oi ON oi.order_id = r.order_id
  WHERE oi.product_id = p_product_id
    AND r.is_published = true
  ORDER BY r.created_at DESC;
$$;

-- ============================================================
-- GRANTS
-- ============================================================
REVOKE ALL ON FUNCTION public.get_product_reviews(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_product_reviews(uuid) TO anon, authenticated;

-- ============================================================
-- ROLLBACK NOTES
-- ============================================================
-- DROP FUNCTION IF EXISTS public.get_product_reviews(uuid);
