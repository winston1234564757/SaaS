-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 114: Portfolio Items — structured works/cases for masters
-- Separate from flat portfolio_photos (migration 014)
-- ─────────────────────────────────────────────────────────────────────────────

-- Main portfolio item (a "case" or "work")
CREATE TABLE IF NOT EXISTS portfolio_items (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id        UUID         NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  title            TEXT         NOT NULL,
  description      TEXT,
  service_id       UUID         REFERENCES services(id) ON DELETE SET NULL,
  tagged_client_id UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  consent_status   TEXT         CHECK (consent_status IN ('pending', 'approved', 'declined')),
  is_published     BOOLEAN      NOT NULL DEFAULT TRUE,
  display_order    INT          NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portfolio_items_master_idx ON portfolio_items(master_id);
CREATE INDEX IF NOT EXISTS portfolio_items_order_idx  ON portfolio_items(master_id, display_order);
CREATE INDEX IF NOT EXISTS portfolio_items_client_idx ON portfolio_items(tagged_client_id) WHERE tagged_client_id IS NOT NULL;

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Public sees published items; master sees all their own; tagged client sees their item
DROP POLICY IF EXISTS "View portfolio items" ON portfolio_items;
CREATE POLICY "View portfolio items"
  ON portfolio_items FOR SELECT
  USING (
    is_published = TRUE
    OR auth.uid() = master_id
    OR auth.uid() = tagged_client_id
  );

DROP POLICY IF EXISTS "Masters insert portfolio items" ON portfolio_items;
CREATE POLICY "Masters insert portfolio items"
  ON portfolio_items FOR INSERT
  TO authenticated
  WITH CHECK (master_id = auth.uid());

DROP POLICY IF EXISTS "Masters update portfolio items" ON portfolio_items;
CREATE POLICY "Masters update portfolio items"
  ON portfolio_items FOR UPDATE
  TO authenticated
  USING (master_id = auth.uid())
  WITH CHECK (master_id = auth.uid());

DROP POLICY IF EXISTS "Masters delete portfolio items" ON portfolio_items;
CREATE POLICY "Masters delete portfolio items"
  ON portfolio_items FOR DELETE
  TO authenticated
  USING (master_id = auth.uid());

-- ─── Photos (up to 5 per item) ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS portfolio_item_photos (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id   UUID         NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  storage_path        TEXT         NOT NULL,
  url                 TEXT         NOT NULL,
  display_order       INT          NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portfolio_item_photos_item_idx ON portfolio_item_photos(portfolio_item_id);

ALTER TABLE portfolio_item_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view portfolio item photos" ON portfolio_item_photos;
CREATE POLICY "Public view portfolio item photos"
  ON portfolio_item_photos FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Masters manage portfolio item photos" ON portfolio_item_photos;
CREATE POLICY "Masters manage portfolio item photos"
  ON portfolio_item_photos FOR ALL
  TO authenticated
  USING (
    portfolio_item_id IN (SELECT id FROM portfolio_items WHERE master_id = auth.uid())
  )
  WITH CHECK (
    portfolio_item_id IN (SELECT id FROM portfolio_items WHERE master_id = auth.uid())
  );

-- ─── Review links (many-to-many) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS portfolio_item_reviews (
  portfolio_item_id UUID NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  review_id         UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  PRIMARY KEY (portfolio_item_id, review_id)
);

ALTER TABLE portfolio_item_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view portfolio review links" ON portfolio_item_reviews;
CREATE POLICY "Public view portfolio review links"
  ON portfolio_item_reviews FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Masters manage portfolio review links" ON portfolio_item_reviews;
CREATE POLICY "Masters manage portfolio review links"
  ON portfolio_item_reviews FOR ALL
  TO authenticated
  USING (
    portfolio_item_id IN (SELECT id FROM portfolio_items WHERE master_id = auth.uid())
  )
  WITH CHECK (
    portfolio_item_id IN (SELECT id FROM portfolio_items WHERE master_id = auth.uid())
  );

-- ─── Storage: new path prefix in existing portfolios bucket ──────────────────
-- Path: {master_id}/items/{item_id}/{filename}
-- Covered by existing storage policies (foldername[1] = auth.uid())

-- ─── updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_portfolio_item_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS portfolio_items_updated_at ON portfolio_items;
CREATE TRIGGER portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW EXECUTE FUNCTION update_portfolio_item_updated_at();
