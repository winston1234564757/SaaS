import type { SupabaseClient } from '@supabase/supabase-js';

export type PhotoEntity =
  | { type: 'master-avatar'; masterId: string }
  | { type: 'client-avatar'; userId: string }
  | { type: 'service'; masterId: string }
  | { type: 'product'; masterId: string }
  | { type: 'portfolio'; masterId: string; itemId: string };

interface BucketConfig {
  bucket: string;
  path: (ts: number, uuid: string, ext: string) => string;
  upsert?: boolean;
}

function getConfig(entity: PhotoEntity): BucketConfig {
  switch (entity.type) {
    case 'master-avatar':
      return {
        bucket: 'images',
        path: (ts) => `avatars/${entity.masterId}/${ts}.jpg`,
        upsert: true,
      };
    case 'client-avatar':
      return {
        bucket: 'avatars',
        path: (_ts, _uuid, ext) => `${entity.userId}.${ext}`,
        upsert: true,
      };
    case 'service':
      return {
        bucket: 'images',
        path: (ts, uuid, ext) => `services/${entity.masterId}/${ts}-${uuid}.${ext}`,
      };
    case 'product':
      return {
        bucket: 'product-photos',
        path: (ts, uuid, ext) => `${entity.masterId}/${ts}-${uuid}.${ext}`,
      };
    case 'portfolio':
      return {
        bucket: 'portfolios',
        path: (ts, uuid, ext) => `${entity.masterId}/items/${entity.itemId}/${ts}-${uuid}.${ext}`,
      };
  }
}

export interface UploadPhotoSuccess {
  url: string;
  path: string;
}

export type UploadPhotoResult = UploadPhotoSuccess | { error: string };

export async function uploadPhoto(
  supabase: SupabaseClient,
  entity: PhotoEntity,
  blob: Blob,
  originalExt = 'jpg',
): Promise<UploadPhotoResult> {
  const config = getConfig(entity);
  const ts = Date.now();
  const uuid = crypto.randomUUID();
  const ext = blob.type === 'image/jpeg' ? 'jpg' : originalExt;
  const path = config.path(ts, uuid, ext);

  const { error } = await supabase.storage.from(config.bucket).upload(path, blob, {
    cacheControl: '3600',
    upsert: config.upsert ?? false,
    contentType: blob.type || 'image/jpeg',
  });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from(config.bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}
