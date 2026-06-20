ALTER TABLE public.product_service_links
  ALTER COLUMN quantity TYPE NUMERIC(10,2)
  USING quantity::NUMERIC(10,2);

COMMENT ON COLUMN public.product_service_links.quantity IS 'Amount of consumable used per service session. Unit from products.unit (pcs/ml/g). Supports decimals.';
