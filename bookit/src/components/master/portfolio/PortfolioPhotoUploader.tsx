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
        className="absolute top-1 left-1 w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
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
}

export function PortfolioPhotoUploader({ itemId, masterId, photos, onPhotosChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const slots = MAX_PHOTOS - photos.length;
    const toUpload = files.slice(0, slots);

    setUploading(true);
    try {
      for (const file of toUpload) {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `${masterId}/items/${itemId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('portfolios')
          .upload(path, file, { cacheControl: '3600', upsert: false });

        if (upErr) continue;

        const { data: urlData } = supabase.storage.from('portfolios').getPublicUrl(path);
        const result = await addPortfolioPhoto(itemId, path, urlData.publicUrl, photos.length);
        if (!result.error) {
          onPhotosChange([
            ...photos,
            { id: crypto.randomUUID(), portfolio_item_id: itemId, storage_path: path, url: urlData.publicUrl, display_order: photos.length, created_at: new Date().toISOString() },
          ]);
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
            disabled={uploading}
            className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#C8B8B2] flex flex-col items-center justify-center gap-1 text-[#A8928D] hover:border-[#789A99] hover:text-[#789A99] transition-colors shrink-0"
          >
            {uploading
              ? <Loader2 size={18} className="animate-spin" />
              : <><Plus size={18} /><span className="text-[10px] font-medium">Фото</span></>
            }
          </button>
        )}
      </div>

      <p className="text-xs text-[#A8928D]">
        {photos.length} / {MAX_PHOTOS} фото · Перетягуйте для зміни порядку
      </p>

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
