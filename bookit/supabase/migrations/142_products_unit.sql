ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'pcs'
  CHECK (unit IN ('pcs', 'ml', 'g'));

COMMENT ON COLUMN public.products.unit IS 'Unit of measurement for consumables: pcs=pieces, ml=millilitres, g=grams';
