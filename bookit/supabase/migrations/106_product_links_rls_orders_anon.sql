-- Migration 106: product_service_links RLS + orders anonymous support

-- ── product_service_links RLS ─────────────────────────────────────────────────
ALTER TABLE product_service_links ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated) can read all links — needed for wizard filtering on public pages
CREATE POLICY "psl_public_read"
  ON product_service_links FOR SELECT TO public USING (true);

-- Authenticated masters can insert links only for products they own
CREATE POLICY "psl_master_insert"
  ON product_service_links FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_id
        AND products.master_id = auth.uid()
    )
  );

-- Authenticated masters can delete links only for products they own
CREATE POLICY "psl_master_delete"
  ON product_service_links FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_id
        AND products.master_id = auth.uid()
    )
  );

-- ── Orders: support anonymous product orders from wizard ──────────────────────
ALTER TABLE orders ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_phone TEXT;
