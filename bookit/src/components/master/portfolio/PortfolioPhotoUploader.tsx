'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, Plus, GripVertical, Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { createClient } from '@/lib/supabase/client';
import { addPortfolioPhoto, deletePortfolioPhoto, reorderPortfolioPhotos } from '@/app/(master)/dashboard/portfolio/actions';
import type { PortfolioItemPhoto } from '@/types/database';

const MAX_PHOTOS = 5;

interface SortablePhotoProps {
  photo: PortfolioItemPhoto;
  index: number;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function SortablePhoto({ photo, index, onDelete, deleting }: SortablePhotoProps) {
  return (
    <Draggable draggableId={photo.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="group relative size-24 rounded-2xl overflow-hidden shrink-0"
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.6 : 1,
          }}
        >
          <Image src={photo.url} alt="" fill className="object-cover" sizes="96px" />
          <button
            {...provided.dragHandleProps}
            className="absolute top-1 left-1 size-6 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing active:scale-95 transition-all"
          >
            <GripVertical size={12} className="text-white" />
          </button>
          <button
            onClick={() => onDelete(photo.id)}
            disabled={deleting}
            className="absolute top-1 right-1 size-6 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {deleting ? <Loader2 size={10} className="text-white animate-spin" /> : <X size={10} className="text-white" />}
          </button>
        </div>
      )}
    </Draggable>
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleDelete = async (photoId: string) => {
    setDeletingId(photoId);
    await deletePortfolioPhoto(photoId);
    onPhotosChange(photos.filter(p => p.id !== photoId));
    setDeletingId(null);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;

    const reordered = Array.from(photos);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const updated = reordered.map((p, i) => ({ ...p, display_order: i }));
    onPhotosChange(updated);
    await reorderPortfolioPhotos(itemId, updated.map(p => p.id));
  };

  return (
    <div className="space-y-3">
      {!mounted ? (
        <div className="flex items-center gap-2 flex-wrap">
          {photos.map((photo) => (
            <div key={photo.id} className="relative size-24 rounded-2xl overflow-hidden shrink-0">
              <Image src={photo.url} alt="" fill className="object-cover" sizes="96px" />
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || disabled}
              className="size-24 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground/60 hover:border-primary hover:text-primary transition-colors shrink-0"
            >
              {uploading
                ? <Loader2 size={18} className="animate-spin" />
                : <><Plus size={18} /><span className="text-[10px] font-medium">Фото</span></>
              }
            </button>
          )}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="photos" direction="horizontal">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex items-center gap-2 flex-wrap">
                {photos.map((photo, index) => (
                  <SortablePhoto
                    key={photo.id}
                    photo={photo}
                    index={index}
                    onDelete={handleDelete}
                    deleting={deletingId === photo.id}
                  />
                ))}
                {provided.placeholder}

                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading || disabled}
                    className="size-24 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground/60 hover:border-primary hover:text-primary transition-colors shrink-0"
                  >
                    {uploading
                      ? <Loader2 size={18} className="animate-spin" />
                      : <><Plus size={18} /><span className="text-[10px] font-medium">Фото</span></>
                    }
                  </button>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

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
