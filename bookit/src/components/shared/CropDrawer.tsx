'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Drawer } from 'vaul';
import type { Area } from 'react-easy-crop';
import { ImageCropper } from '@/components/master/settings/components/ImageCropper';

interface CropDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onConfirm: (croppedAreaPixels: Area) => void;
  onCancel: () => void;
  uploading: boolean;
  aspectRatio?: number;
}

export function CropDrawer({
  open,
  onOpenChange,
  imageSrc,
  onConfirm,
  onCancel,
  uploading,
  aspectRatio,
}: CropDrawerProps) {
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next && !uploading) onCancel();
    onOpenChange(next);
  };

  return (
    <Drawer.Root open={open} onOpenChange={handleOpenChange} dismissible={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[96vh] bg-background rounded-t-[40px] flex flex-col z-[210] outline-none shadow-2xl">
          <div className="flex-1 overflow-y-auto px-6 pb-12 pt-4 scrollbar-hide">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted/60 mb-8" />
            <div className="max-w-md mx-auto">

              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold tracking-tight">Редагувати фото</h3>
                <button
                  type="button"
                  onClick={onCancel}
                  aria-label="Закрити"
                  className="p-3 rounded-2xl bg-muted/30 hover:bg-muted transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="rounded-[32px] overflow-hidden border border-muted/20 shadow-inner bg-black/5">
                {imageSrc && (
                  <ImageCropper
                    image={imageSrc}
                    onCropComplete={setCroppedAreaPixels}
                    aspect={aspectRatio}
                  />
                )}
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-5 rounded-3xl bg-muted/45 font-bold text-sm active:scale-[0.95] transition-all border border-border cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={() => croppedAreaPixels && onConfirm(croppedAreaPixels)}
                  disabled={uploading || !croppedAreaPixels}
                  className="flex-1 py-5 rounded-3xl bg-accent text-[var(--accent-on)] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.95] transition-all cursor-pointer disabled:opacity-60"
                >
                  {uploading ? (
                    <><Loader2 size={18} className="animate-spin" /> Зберігаємо...</>
                  ) : (
                    'Зберегти'
                  )}
                </button>
              </div>

            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
