-- ─────────────────────────────────────────────────────────────────────────────
-- Ітерація 24: Фото-портфоліо майстра
-- ─────────────────────────────────────────────────────────────────────────────

-- Таблиця фото-портфоліо
CREATE TABLE IF NOT EXISTS portfolio_photos (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id    UUID         NOT NULL REFERENCES master_profiles(id) ON DELETE CASCADE,
  url          TEXT         NOT NULL,
  storage_path TEXT         NOT NULL,
  caption      TEXT,
  sort_order   INTEGER      NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portfolio_photos_master_id_idx ON portfolio_photos(master_id);
CREATE INDEX IF NOT EXISTS portfolio_photos_sort_order_idx ON portfolio_photos(master_id, sort_order);

ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;

-- Публічний перегляд
DROP POLICY IF EXISTS "Anyone can view portfolio photos" ON portfolio_photos;
CREATE POLICY "Anyone can view portfolio photos"
  ON portfolio_photos FOR SELECT
  USING (true);

-- Майстер керує своїм портфоліо
DROP POLICY IF EXISTS "Masters manage own portfolio" ON portfolio_photos;
CREATE POLICY "Masters manage own portfolio"
  ON portfolio_photos FOR ALL
  TO authenticated
  USING (
    master_id IN (SELECT id FROM master_profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    master_id IN (SELECT id FROM master_profiles WHERE id = auth.uid())
  );

-- ─── Supabase Storage Bucket ──────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolios',
  'portfolios',
  true,
  5242880,   -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- RLS для storage
DROP POLICY IF EXISTS "Anyone can view portfolio images" ON storage.objects;
CREATE POLICY "Anyone can view portfolio images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolios');

DROP POLICY IF EXISTS "Authenticated users upload portfolio images" ON storage.objects;
CREATE POLICY "Authenticated users upload portfolio images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'portfolios' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own portfolio images" ON storage.objects;
CREATE POLICY "Users delete own portfolio images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'portfolios' AND (storage.foldername(name))[1] = auth.uid()::text);
