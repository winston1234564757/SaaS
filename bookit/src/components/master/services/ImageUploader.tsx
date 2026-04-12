'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface ImageUploaderProps {
  /** Folder prefix: 'services' or 'products' */
  folder: string;
  masterId: string;
  /** Currently saved URL (from DB) */
  value?: string;
  onChange: (url: string | null) => void;
}

export function ImageUploader({ folder, masterId, value, onChange }: ImageUploaderProps) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  // Sync preview when value prop changes (e.g., after context loads avatar_url)
  useEffect(() => {
    setPreview(value ?? null);
  }, [value]);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);

    // Optimistic preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${folder}/${masterId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    let uploadTimeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const { error } = await Promise.race([
        supabase.storage.from('images').upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        }),
        new Promise<never>((_, reject) => {
          uploadTimeoutId = setTimeout(() => reject(new Error('Timeout завантаження')), 10_000);
        }),
      ]);
      clearTimeout(uploadTimeoutId);

      if (error) {
        console.error('[ImageUploader] upload error', error);
        setPreview(value ?? null);
        return;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(path);
      setPreview(data.publicUrl);
      onChange(data.publicUrl);
    } catch (err) {
      console.error('[ImageUploader] upload failed (possibly timeout):', err);
      setPreview(value ?? null);
    } finally {
      setUploading(false);
    }
  }

  function handleClear() {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="flex flex-col gap-2">
      {preview ? (
        <div className="relative w-full aspect-square shrink-0 rounded-xl overflow-hidden border border-border bg-muted object-center">
          <Image src={preview} alt="preview" fill className="object-contain" unoptimized />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-24 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm flex flex-col items-center justify-center gap-1 hover:bg-muted/40 transition-colors"
        >
          <span className="text-xl">🖼️</span>
          <span>{uploading ? 'Завантаження…' : 'Додати фото'}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
