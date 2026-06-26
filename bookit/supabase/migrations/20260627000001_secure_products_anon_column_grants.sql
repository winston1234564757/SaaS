-- P1 #1: stop anon (publishable key) from reading master cost / purchase price.
-- products_public_read RLS stays (row filter is_active=true); we restrict COLUMNS for anon.
-- Masters read cost via products_master_all (authenticated, master_id=auth.uid()) — unaffected.
REVOKE SELECT ON public.products FROM anon;

GRANT SELECT (
  id, master_id, icon_name, name, description, category,
  product_type, unit, price_kopecks, photos, stock_qty,
  recommend_always, is_active, is_archived, sort_order,
  created_at, updated_at
) ON public.products TO anon;
