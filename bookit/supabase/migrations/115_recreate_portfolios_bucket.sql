-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 115: Recreate portfolios storage bucket (was dropped in migration 056)
-- Path convention: {master_id}/items/{item_id}/{filename}
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolios',
  'portfolios',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit   = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read
DROP POLICY IF EXISTS "Anyone can view portfolio images" ON storage.objects;
CREATE POLICY "Anyone can view portfolio images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolios');

-- Master upload: first path segment must match auth.uid()
DROP POLICY IF EXISTS "Authenticated users upload portfolio images" ON storage.objects;
CREATE POLICY "Authenticated users upload portfolio images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolios'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Master update own files
DROP POLICY IF EXISTS "Users update own portfolio images" ON storage.objects;
CREATE POLICY "Users update own portfolio images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'portfolios'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Master delete own files
DROP POLICY IF EXISTS "Users delete own portfolio images" ON storage.objects;
CREATE POLICY "Users delete own portfolio images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolios'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
