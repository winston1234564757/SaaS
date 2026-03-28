'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface PortfolioPhoto {
  id: string;
  url: string;
  storagePath: string;
  caption: string | null;
  sortOrder: number;
  serviceId: string | null;
}

interface PhotoRow {
  id: string;
  url: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  service_id: string | null;
}

function rowToPhoto(p: PhotoRow): PortfolioPhoto {
  return {
    id: p.id,
    url: p.url,
    storagePath: p.storage_path,
    caption: p.caption || null,
    sortOrder: p.sort_order,
    serviceId: p.service_id ?? null,
  };
}

export function usePortfolio() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();
  const key = ['portfolio', masterId] as const;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const cachedPhotosRef = useRef<PortfolioPhoto[]>([]);

  const {
    data: freshPhotos,
    isLoading,
    error: queryError,
  } = useQuery<PortfolioPhoto[]>({
    queryKey: key,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('portfolio_photos')
        .select('id, url, storage_path, caption, sort_order, service_id')
        .eq('master_id', masterId!)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(rowToPhoto);
    },
    enabled: !!masterId,
    staleTime: 60_000,
    retry: 1,
  });

  // Зберігаємо останні успішні дані — фото не зникають при refetch-помилках
  if (freshPhotos !== undefined) {
    cachedPhotosRef.current = freshPhotos;
  }
  const photos = freshPhotos ?? cachedPhotosRef.current;

  async function uploadPhoto(file: File): Promise<void> {
    if (!masterId) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();

      const ext = file.name.split('.').pop() ?? 'jpg';
      const bytes = crypto.getRandomValues(new Uint8Array(6));
      const uniqueId = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      const path = `${masterId}/${Date.now()}-${uniqueId}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('portfolios')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadErr) {
        setUploadError('Помилка завантаження: ' + uploadErr.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('portfolios')
        .getPublicUrl(path);

      const nextOrder = photos.length > 0 ? Math.max(...photos.map(p => p.sortOrder)) + 1 : 0;

      const { error: insertErr } = await supabase.from('portfolio_photos').insert({
        master_id: masterId,
        url: publicUrl,
        storage_path: path,
        sort_order: nextOrder,
      });

      if (insertErr) {
        setUploadError('Помилка збереження: ' + insertErr.message);
        return;
      }

      await qc.invalidateQueries({ queryKey: key });
    } catch (e) {
      setUploadError('Несподівана помилка: ' + String(e));
    } finally {
      setIsUploading(false);
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      const supabase = createClient();
      await Promise.all([
        supabase.from('portfolio_photos').delete().eq('id', id),
        supabase.storage.from('portfolios').remove([storagePath]),
      ]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const updateCaptionMutation = useMutation({
    mutationFn: async ({ id, caption }: { id: string; caption: string }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('portfolio_photos')
        .update({ caption: caption || null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const updateServiceLinkMutation = useMutation({
    mutationFn: async ({ id, serviceId }: { id: string; serviceId: string | null }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('portfolio_photos')
        .update({ service_id: serviceId })
        .eq('id', id)
        .eq('master_id', masterId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    photos,
    isLoading: isLoading && !!masterId,
    isUploading,
    uploadPhoto,
    deletePhoto: (id: string, storagePath: string) =>
      deleteMutation.mutateAsync({ id, storagePath }),
    updateCaption: (id: string, caption: string) =>
      updateCaptionMutation.mutateAsync({ id, caption }),
    updateServiceLink: (id: string, serviceId: string | null) =>
      updateServiceLinkMutation.mutate({ id, serviceId }),
    uploadError,
    clearUploadError: () => setUploadError(null),
    queryError: queryError ? String((queryError as Error).message ?? queryError) : null,
  };
}
