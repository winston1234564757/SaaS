-- ============================================================
-- BOOKIT — Media fields + Storage bucket
-- Version: 007
-- ============================================================

-- Storage bucket for product/service images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop old policies first so this script is safe to re-run
DROP POLICY IF EXISTS "Public images are readable"   ON storage.objects;
DROP POLICY IF EXISTS "Masters can upload images"    ON storage.objects;
DROP POLICY IF EXISTS "Masters can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Masters can delete own images" ON storage.objects;

-- Allow anyone to read public images
CREATE POLICY "Public images are readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

-- Allow authenticated masters to upload to their own folder
-- Path pattern: {folder}/{masterId}/{filename}
-- storage.foldername('services/uuid/file.jpg') → ARRAY['services','uuid']
-- Index [2] (1-based) = masterId
CREATE POLICY "Masters can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow authenticated masters to update/delete their own images
CREATE POLICY "Masters can update own images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'images'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Masters can delete own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'images'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
