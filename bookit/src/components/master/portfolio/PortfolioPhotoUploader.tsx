'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Plus, Loader2, Star, Expand, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getCroppedImg } from '@/components/master/settings/utils/cropImage';
import { uploadPhoto } from '@/lib/upload/uploadPhoto';
import { CropDrawer } from '@/components/shared/CropDrawer';
import type { Area } from 'react-easy-crop';
import { addPortfolioPhoto, deletePortfolioPhoto, reorderPortfolioPhotos } from '@/app/(master)/dashboard/portfolio/actions';
import { PhotoLightbox } from '@/components/shared/PhotoLightbox';
import type { PortfolioItemPhoto } from '@/types/database';

const MAX_PHOTOS = 5;

interface PhotoItemProps {
  photo: PortfolioItemPhoto;
  index: number;
  total: number;
  isActive: boolean;
  isDeleting: boolean;
  onActivate: () => void;
  onDismiss: () => void;
  onDelete: () => void;
  onSetCover: () => void;
  onPreview: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}

function PhotoItem({
  photo, index, total, isActive, isDeleting,
  onActivate, onDismiss, onDelete, onSetCover, onPreview, onMoveLeft, onMoveRight,
}: PhotoItemProps) {
  const isCover = index === 0;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative size-28 rounded-2xl overflow-hidden shrink-0">
        <Image src={photo.url} alt="" fill className="object-cover" sizes="112px" />

        {isCover && !isActive && (
          <div className="absolute top-1.5 left-1.5 size-5 rounded-md bg-warning/85 flex items-center justify-center z-[1]">
            <Star size={10} className="text-white fill-white" />
          </div>
        )}

        <button
          type="button"
          aria-label={isActive ? 'Закрити' : 'Відкрити дії'}
          onClick={isActive ? onDismiss : onActivate}
          className="absolute inset-0 z-[2]"
        />

        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="absolute inset-0 flex flex-col items-stretch justify-center gap-1 px-1.5 z-[3]"
              style={{ background: 'rgba(0,0,0,0.60)' }}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onPreview(); }}
                className="flex items-center justify-center gap-1 py-[9px] rounded-lg bg-white/15 active:bg-white/25 text-white text-[11px] font-semibold active:scale-95 transition-transform"
              >
                <Expand size={11} /> Переглянути
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onSetCover(); }}
                disabled={isCover}
                className="flex items-center justify-center gap-1 py-[9px] rounded-lg bg-white/15 active:bg-white/25 text-white text-[11px] font-semibold active:scale-95 transition-transform disabled:opacity-40 disabled:pointer-events-none"
              >
                <Star size={11} /> Головне
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                disabled={isDeleting}
                className="flex items-center justify-center gap-1 py-[9px] rounded-lg bg-red-500/40 active:bg-red-500/60 text-white text-[11px] font-semibold active:scale-95 transition-transform"
              >
                {isDeleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                Видалити
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-1">
        <button
          type="button"
          onClick={onMoveLeft}
          disabled={index === 0}
          aria-label="Перемістити вліво"
          className="size-6 rounded-md flex items-center justify-center text-muted-foreground bg-secondary disabled:opacity-25 active:scale-95 transition-transform"
        >
          <ChevronLeft size={13} />
        </button>
        <button
          type="button"
          onClick={onMoveRight}
          disabled={index === total - 1}
          aria-label="Перемістити вправо"
          className="size-6 rounded-md flex items-center justify-center text-muted-foreground bg-secondary disabled:opacity-25 active:scale-95 transition-transform"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

interface Props {
  itemId: string;
  masterId: string;
  photos: PortfolioItemPhoto[];
  onPhotosChange: (photos: PortfolioItemPhoto[]) => void;
  disabled?: boolean;
}

export function PortfolioPhotoUploader({ itemId, masterId, photos, onPhotosChange, disabled = false }: Props) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  // tracks photos added in current session (React state updates are async)
  const pendingCountRef = useRef(0);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = '';
    pendingCountRef.current = 0;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (croppedAreaPixels: Area) => {
    if (!cropSrc) return;
    setUploading(true);
    setUploadError(null);
    try {
      const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
      if (!blob) throw new Error('crop failed');

      const displayOrder = photos.length + pendingCountRef.current;
      const result = await uploadPhoto(supabase, { type: 'portfolio', masterId, itemId }, blob);

      if ('error' in result) {
        setUploadError(result.error);
      } else {
        const dbResult = await addPortfolioPhoto(itemId, result.path, result.url, displayOrder);
        if (dbResult.error) {
          setUploadError(`DB error: ${dbResult.error}`);
        } else {
          const newPhoto: PortfolioItemPhoto = {
            id: crypto.randomUUID(),
            portfolio_item_id: itemId,
            storage_path: result.path,
            url: result.url,
            display_order: displayOrder,
            created_at: new Date().toISOString(),
          };
          pendingCountRef.current++;
          onPhotosChange([...photos, newPhoto]);
        }
      }
      setCropOpen(false);
      setCropSrc(null);
    } catch {
      setUploadError('Помилка завантаження');
      setCropOpen(false);
      setCropSrc(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    setDeletingId(photoId);
    setActiveId(null);
    await deletePortfolioPhoto(photoId);
    onPhotosChange(photos.filter(p => p.id !== photoId));
    setDeletingId(null);
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= photos.length) return;
    const reordered = [...photos];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    const updated = reordered.map((p, i) => ({ ...p, display_order: i }));
    onPhotosChange(updated);
    await reorderPortfolioPhotos(itemId, updated.map(p => p.id));
  };

  const handleSetCover = async (photoId: string) => {
    const idx = photos.findIndex(p => p.id === photoId);
    if (idx <= 0) return;
    const reordered = [photos[idx], ...photos.filter(p => p.id !== photoId)];
    const updated = reordered.map((p, i) => ({ ...p, display_order: i }));
    onPhotosChange(updated);
    setActiveId(null);
    await reorderPortfolioPhotos(itemId, updated.map(p => p.id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 flex-wrap">
        {photos.map((photo, index) => (
          <PhotoItem
            key={photo.id}
            photo={photo}
            index={index}
            total={photos.length}
            isActive={activeId === photo.id}
            isDeleting={deletingId === photo.id}
            onActivate={() => setActiveId(photo.id)}
            onDismiss={() => setActiveId(null)}
            onDelete={() => handleDelete(photo.id)}
            onSetCover={() => handleSetCover(photo.id)}
            onPreview={() => { setActiveId(null); setLightboxIndex(index); }}
            onMoveLeft={() => handleMove(index, -1)}
            onMoveRight={() => handleMove(index, 1)}
          />
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || disabled}
            className="size-28 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground/60 hover:border-accent hover:text-accent transition-colors shrink-0 self-start"
          >
            {uploading
              ? <Loader2 size={20} className="animate-spin" />
              : <><Plus size={20} /><span className="text-[10px] font-medium">Фото</span></>
            }
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground/60">
        {photos.length} / {MAX_PHOTOS} · Торкніться фото для дій
      </p>

      {uploadError && (
        <p className="text-xs text-destructive bg-destructive/8 rounded-xl px-3 py-2">
          Помилка завантаження: {uploadError}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleFilesSelected}
      />

      <CropDrawer
        open={cropOpen}
        onOpenChange={open => { if (!open && !uploading) { setCropOpen(false); setCropSrc(null); } }}
        imageSrc={cropSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => { setCropOpen(false); setCropSrc(null); }}
        uploading={uploading}
      />

      <AnimatePresence>
        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={photos.map(p => ({ url: p.url }))}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onPrev={() => setLightboxIndex(prev => (prev !== null && prev > 0) ? prev - 1 : prev)}
            onNext={() => setLightboxIndex(prev => (prev !== null && prev < photos.length - 1) ? prev + 1 : prev)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
