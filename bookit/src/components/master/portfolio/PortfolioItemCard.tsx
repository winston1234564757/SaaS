'use client';

import Image from 'next/image';
import { Eye, EyeOff, Scissors, Star, User, GripVertical, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { PortfolioItemFull } from '@/types/database';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';

interface Props {
  item: PortfolioItemFull;
  onClick: () => void;
  onStoryClick?: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export function PortfolioItemCard({ item, onClick, onStoryClick, dragHandleProps }: Props) {
  const coverPhoto = item.photos[0];

  const consentChip = item.consent_status === 'pending'
    ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-warning/15 text-warning">Очікує</span>
    : item.consent_status === 'approved'
      ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-success/15 text-success">Підтв.</span>
      : null;

  const hasMeta = item.service_name || item.review_ids.length > 0 || item.tagged_client_id;

  return (
    <div className="group relative h-full flex flex-col rounded-3xl overflow-hidden bg-secondary border border-border shadow-sm transition-all hover:shadow-md">
      {/* Drag handle */}
      <button
        type="button"
        {...dragHandleProps}
        className="absolute top-2 left-2 size-6 rounded-lg bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        aria-label="Перетягнути"
      >
        <GripVertical size={12} className="text-white" />
      </button>

      {/* Main clickable area */}
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col flex-1 w-full text-left active:scale-[0.98] transition-transform"
      >
        {/* Cover */}
        <div className="relative w-full aspect-[4/3] flex-shrink-0 bg-secondary">
          {coverPhoto ? (
            <Image src={coverPhoto.url} alt={item.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-1 text-text-sub">
              <div className="size-10 rounded-2xl bg-background flex items-center justify-center">
                <Scissors size={16} />
              </div>
              <p className="text-[10px]">Без фото</p>
            </div>
          )}
          {item.photos.length > 1 && (
            <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-black/40 rounded-full px-2 py-0.5">
              {item.photos.length} фото
            </span>
          )}
          <span className={cn(
            'absolute top-2 right-2 size-6 rounded-lg flex items-center justify-center',
            item.is_published ? 'bg-success/20 text-success' : 'bg-black/30 text-white'
          )}>
            {item.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
          </span>
        </div>

        {/* Info — fills remaining height, meta pinned to bottom for even card baselines */}
        <div className="flex flex-col flex-1 p-3">
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{item.title}</p>
          {hasMeta && (
            <div className="flex flex-wrap gap-1.5 items-center mt-auto pt-2">
              {item.service_name && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-text-sub bg-secondary rounded-full px-2 py-0.5">
                  <Scissors size={9} /> {item.service_name}
                </span>
              )}
              {item.review_ids.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-text-sub bg-secondary rounded-full px-2 py-0.5">
                  <Star size={9} /> {item.review_ids.length}
                </span>
              )}
              {item.tagged_client_id && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-text-sub bg-secondary rounded-full px-2 py-0.5">
                  <User size={9} /> {consentChip}
                </span>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Сторіс overlay — anchored to the cover (matches its aspect ratio), visible on hover when item has photos */}
      {onStoryClick && item.photos.length > 0 && (
        <div className="absolute inset-x-0 top-0 aspect-[4/3] pointer-events-none z-10">
          <button
            type="button"
            onClick={onStoryClick}
            aria-label="Зробити сторіс"
            className="pointer-events-auto absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/35 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
          >
            <Sparkles size={10} /> Сторіс
          </button>
        </div>
      )}
    </div>
  );
}
