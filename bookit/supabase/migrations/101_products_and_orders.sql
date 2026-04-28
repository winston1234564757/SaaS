-- ============================================================
-- Migration 101: Products, Orders, Inventory
-- ============================================================

-- ── 1. Products ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id       UUID        NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT,
  category        TEXT        NOT NULL DEFAULT 'other'
                              CHECK (category IN ('hair','nails','skin','brows','body','tools','other')),
  price_kopecks   INT         NOT NULL CHECK (price_kopecks > 0),
  photos          TEXT[]      NOT NULL DEFAULT '{}',
  stock_qty       INT         NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  sort_order      INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_master_active ON products(master_id, is_active);

-- ── 2. Nova Poshta flag on master_profiles ───────────────────
ALTER TABLE master_profiles
  ADD COLUMN IF NOT EXISTS ships_nova_poshta BOOLEAN NOT NULL DEFAULT false;

-- ── 3. Orders ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id        UUID        NOT NULL REFERENCES master_profiles(id),
  client_id        UUID        REFERENCES profiles(id),
  booking_id       UUID        REFERENCES bookings(id),
  delivery_type    TEXT        NOT NULL CHECK (delivery_type IN ('pickup','nova_poshta')),
  delivery_address TEXT,
  total_kopecks    INT         NOT NULL CHECK (total_kopecks > 0),
  status           TEXT        NOT NULL DEFAULT 'new'
                               CHECK (status IN ('new','confirmed','shipped','completed','cancelled')),
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_master    ON orders(master_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_client    ON orders(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_booking   ON orders(booking_id);

-- ── 4. Order items ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES products(id),
  qty            INT  NOT NULL CHECK (qty > 0),
  price_kopecks  INT  NOT NULL CHECK (price_kopecks > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ── 5. Inventory transactions (audit log) ────────────────────
CREATE TABLE IF NOT EXISTS product_transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('sale','restock','adjustment','return')),
  qty_delta   INT         NOT NULL,
  order_id    UUID        REFERENCES orders(id),
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_transactions_product ON product_transactions(product_id, created_at DESC);

-- ── 6. updated_at trigger for products ───────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── 7. RLS ───────────────────────────────────────────────────
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_transactions ENABLE ROW LEVEL SECURITY;

-- products: public read (active only), master full CRUD
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "products_master_all" ON products
  FOR ALL USING (
    master_id IN (
      SELECT id FROM master_profiles WHERE id = auth.uid()
    )
  );

-- orders: master sees own, client sees own
CREATE POLICY "orders_master_select" ON orders
  FOR SELECT USING (master_id IN (SELECT id FROM master_profiles WHERE id = auth.uid()));

CREATE POLICY "orders_client_select" ON orders
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "orders_client_insert" ON orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "orders_master_update" ON orders
  FOR UPDATE USING (master_id IN (SELECT id FROM master_profiles WHERE id = auth.uid()));

-- order_items: follow order access
CREATE POLICY "order_items_select" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE master_id IN (SELECT id FROM master_profiles WHERE id = auth.uid())
         OR client_id = auth.uid()
    )
  );

CREATE POLICY "order_items_insert" ON order_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- product_transactions: master read only (writes via service role in actions)
CREATE POLICY "product_transactions_master_read" ON product_transactions
  FOR SELECT USING (
    product_id IN (SELECT id FROM products WHERE master_id IN (
      SELECT id FROM master_profiles WHERE id = auth.uid()
    ))
  );
