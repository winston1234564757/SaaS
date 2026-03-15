'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface PortfolioPhoto {
  id: string;
  url: string;
  storagePath: string;
  caption: string | null;
  sortOrder: number;
}

export function usePortfolio() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const supabase = createClient();

  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchPhotos = useCallback(async () => {
    if (!masterId) return;
    const { data } = await supabase
      .from('portfolio_photos')
      .select('id, url, storage_path, caption, sort_order')
      .eq('master_id', masterId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    setPhotos(
      (data ?? []).map((p: any) => ({
        id: p.id as string,
        url: p.url as string,
        storagePath: p.storage_path as string,
        caption: (p.caption as string) || null,
        sortOrder: p.sort_order as number,
      }))
    );
    setIsLoading(false);
  }, [masterId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  async function uploadPhoto(file: File): Promise<void> {
    if (!masterId) return;
    setIsUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsUploading(false); return; }

    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('portfolios')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadErr) { setIsUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage
      .from('portfolios')
      .getPublicUrl(path);

    const nextOrder = photos.length > 0 ? Math.max(...photos.map(p => p.sortOrder)) + 1 : 0;

    await supabase.from('portfolio_photos').insert({
      master_id: masterId,
      url: publicUrl,
      storage_path: path,
      sort_order: nextOrder,
    });

    await fetchPhotos();
    setIsUploading(false);
  }

  async function deletePhoto(id: string, storagePath: string): Promise<void> {
    await Promise.all([
      supabase.from('portfolio_photos').delete().eq('id', id),
      supabase.storage.from('portfolios').remove([storagePath]),
    ]);
    setPhotos(prev => prev.filter(p => p.id !== id));
  }

  async function updateCaption(id: string, caption: string): Promise<void> {
    await supabase.from('portfolio_photos').update({ caption: caption || null }).eq('id', id);
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, caption: caption || null } : p));
  }

  return {
    photos,
    isLoading,
    isUploading,
    uploadPhoto,
    deletePhoto,
    updateCaption,
  };
}
