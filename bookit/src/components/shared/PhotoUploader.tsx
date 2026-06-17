'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ImageIcon } from 'lucide-react';
import type { Area } from 'react-easy-crop';
import { createClient } from '@/lib/supabase/client';
import { getCroppedImg } from '@/components/master/settings/utils/cropImage';
import { uploadPhoto, type PhotoEntity } from '@/lib/upload/uploadPhoto';
import { useToast } from '@/lib/toast/context';
import { CropDrawer } from './CropDrawer';

type SinglePhotoEntity = Extract<PhotoEntity, { type: 'master-avatar' | 'client-avatar' | 'service' }>;

interface PhotoUploaderProps {
  entity: SinglePhotoEntity;
  value?: string | null;
  onChange: (url: string | null) => void;
  aspectRatio?: number;
  children?: (props: { triggerUpload: () => void; uploading: boolean; preview: string | null }) => React.ReactNode;
}

export function PhotoUploader({
  entity,
  value,
  onChange,
  aspectRatio = 1,
  children,
}: PhotoUploaderProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreview(value ?? null);
  }, [value]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const handleCropConfirm = async (croppedAreaPixels: Area) => {
    if (!cropSrc) return;
    setUploading(true);
    try {
      const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
      if (!blob) throw new Error('crop failed');
      const result = await uploadPhoto(supabase, entity, blob);
      if ('error' in result) throw new Error(result.error);
      setPreview(result.url + '?t=' + Date.now());
      onChange(result.url);
      setCropOpen(false);
      setCropSrc(null);
      showToast({ type: 'success', title: 'Фото оновлено' });
    } catch {
      showToast({ type: 'error', title: 'Помилка', message: 'Не вдалося завантажити фото' });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setCropOpen(false);
    setCropSrc(null);
  };

  const handleClear = () => {
    setPreview(null);
    onChange(null);
  };

  const triggerUpload = () => { fileInputRef.current?.click(); };

  return (
    <>
      {children ? (
        children({ triggerUpload, uploading, preview })
      ) : (
        <div className="flex flex-col gap-2">
          {preview ? (
            <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-border bg-muted">
              <Image src={preview} alt="preview" fill className="object-contain" unoptimized />
              <button
                type="button"
                onClick={handleClear}
                aria-label="Видалити зображення"
                className="absolute top-2 right-2 bg-foreground/60 text-background rounded-full size-6 flex items-center justify-center hover:bg-foreground/80 active:scale-95 transition-all"
              >
                <X size={10} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={triggerUpload}
              disabled={uploading}
              className="w-full h-24 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm flex flex-col items-center justify-center gap-1 hover:bg-muted/40 transition-colors disabled:opacity-60"
            >
              <ImageIcon size={24} className="text-muted-foreground/60" />
              <span>{uploading ? 'Завантаження…' : 'Додати фото'}</span>
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleFileSelect}
      />

      <CropDrawer
        open={cropOpen}
        onOpenChange={open => { if (!open && !uploading) handleCancel(); }}
        imageSrc={cropSrc}
        onConfirm={handleCropConfirm}
        onCancel={handleCancel}
        uploading={uploading}
        aspectRatio={aspectRatio}
      />
    </>
  );
}
