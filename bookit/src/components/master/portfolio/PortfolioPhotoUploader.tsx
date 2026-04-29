'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, Plus, GripVertical, Loader2 } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, horizontalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createClient } from '@/lib/supabase/client';
import { addPortfolioPhoto, deletePortfolioPhoto, reorderPortfolioPhotos } from '@/app/(master)/dashboard/portfolio/actions';
import type { PortfolioItemPhoto } from '@/types/database';

const MAX_PHOTOS = 5;

interface SortablePhotoProps {
  photo: PortfolioItemPhoto;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function SortablePhoto({ photo, onDelete, deleting }: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="relative w-24 h-24 rounded-2xl overflow-hidden group shrink-0"
    >
      <Image src={photo.url} alt="" fill className="object-cover" sizes="96px" />
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing active:scale-95 transition-all"
      >
        <GripVertical size={12} className="text-white" />
      </button>
      {/* Delete */}
      <button
        onClick={() => onDelete(photo.id)}
        disabled={deleting}
        className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {deleting ? <Loader2 size={10} className="text-white animate-spin" /> : <X size={10} className="text-white" />}
      </button>
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
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const slots = MAX_PHOTOS - photos.length;
    const toUpload = files.slice(0, slots);

    setUploading(true);
    setUploadError(null);
    const currentPhotos = [...photos];
    try {
      for (const file of toUpload) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
        const path = `${masterId}/items/${itemId}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

        const { error: upErr } = await supabase.storage
          .from('portfolios')
          .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || 'image/jpeg' });

        if (upErr) {
          setUploadError(upErr.message);
          continue;
        }

        const { data: urlData } = supabase.storage.from('portfolios').getPublicUrl(path);
        const result = await addPortfolioPhoto(itemId, path, urlData.publicUrl, currentPhotos.length);
        if (result.error) {
          setUploadError(`DB error: ${result.error}`);
        } else {
          const newPhoto: PortfolioItemPhoto = {
            id: crypto.randomUUID(),
            portfolio_item_id: itemId,
            storage_path: path,
            url: urlData.publicUrl,
            display_order: currentPhotos.length,
            created_at: new Date().toISOString(),
          };
          currentPhotos.push(newPhoto);
          onPhotosChange([...currentPhotos]);
        }
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [itemId, masterId, photos, supabase, onPhotosChange]);

  const handleDelete = useCallback(async (photoId: string) => {
    setDeletingId(photoId);
    await deletePortfolioPhoto(photoId);
    onPhotosChange(photos.filter(p => p.id !== photoId));
    setDeletingId(null);
  }, [photos, onPhotosChange]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex(p => p.id === active.id);
    const newIndex = photos.findIndex(p => p.id === over.id);
    const reordered = arrayMove(photos, oldIndex, newIndex).map((p, i) => ({ ...p, display_order: i }));
    onPhotosChange(reordered);
    await reorderPortfolioPhotos(itemId, reordered.map(p => p.id));
  }, [photos, itemId, onPhotosChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={photos.map(p => p.id)} strategy={horizontalListSortingStrategy}>
            {photos.map(photo => (
              <SortablePhoto
                key={photo.id}
                photo={photo}
                onDelete={handleDelete}
                deleting={deletingId === photo.id}
              />
            ))}
          </SortableContext>
        </DndContext>

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || disabled}
            className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#C8B8B2] flex flex-col items-center justify-center gap-1 text-muted-foreground/60 hover:border-primary hover:text-primary transition-colors shrink-0"
          >
            {uploading
              ? <Loader2 size={18} className="animate-spin" />
              : <><Plus size={18} /><span className="text-[10px] font-medium">Фото</span></>
            }
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground/60">
        {photos.length} / {MAX_PHOTOS} фото · Перетягуйте для зміни порядку
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
        multiple
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
