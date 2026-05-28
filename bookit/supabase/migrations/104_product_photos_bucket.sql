-- ============================================================
-- Migration 104: Storage bucket for product photos
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-photos',
  'product-photos',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Masters can upload to their own folder: {master_id}/...
CREATE POLICY "product_photos_master_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Masters can delete their own photos
CREATE POLICY "product_photos_master_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read (bucket is already public, but explicit policy for clarity)
CREATE POLICY "product_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-photos');
