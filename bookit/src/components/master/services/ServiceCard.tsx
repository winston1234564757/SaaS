'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, Star, GripVertical, Eye } from 'lucide-react';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils/cn';
import { type Service, formatPrice, formatDuration } from './types';
import { ServiceIcon } from '@/lib/service-icons';

export type ServiceView = 'grid' | 'list';

interface ServiceCardProps {
  service: Service;
  onEdit: (s: Service) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onPreview: (s: Service) => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  index: number;
  view?: ServiceView;
}

export function ServiceCard({ service, onEdit, onDelete, onToggle, onPreview, dragHandleProps, index, view = 'grid' }: ServiceCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const enter = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: Math.min(index * 0.04, 0.2), type: 'spring' as const, stiffness: 340, damping: 26 } as const,
  };

  // Shared management controls — identical in both views
  const editDelete = (
    <div className="flex items-center gap-1">
      <Tooltip content={<p className="text-xs text-foreground">Редагувати послугу</p>} position="top">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(service); }}
          aria-label="Редагувати послугу"
          className="size-11 flex items-center justify-center rounded-full bg-secondary/60 border border-border text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
        >
          <Pencil size={14} />
        </button>
      </Tooltip>

      <AnimatePresence mode="popLayout">
        {confirmDelete ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-1 overflow-hidden"
          >
            <span className="text-xs text-muted-foreground/70 whitespace-nowrap ml-1">Заховати послугу?</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(service.id); }}
              className="px-2.5 h-8 rounded-full bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition-colors"
            >
              Так
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
              className="px-2.5 h-8 rounded-full bg-secondary/60 border border-border text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Ні
            </button>
          </motion.div>
        ) : (
          <Tooltip key="btn" content={<p className="text-xs text-foreground max-w-[180px]">Послуга буде захована — записи та статистика збережуться</p>} position="top">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              aria-label="Видалити послугу"
              className="size-11 flex items-center justify-center rounded-full bg-secondary/60 border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </Tooltip>
        )}
      </AnimatePresence>
    </div>
  );

  const toggle = (
    <Tooltip content={<p className="text-xs text-foreground">{service.active ? 'Деактивувати послугу' : 'Активувати послугу'}</p>} position="top">
      <button
        type="button"
        role="switch"
        aria-checked={service.active}
        aria-label={service.active ? 'Деактивувати послугу' : 'Активувати послугу'}
        onClick={(e) => { e.stopPropagation(); onToggle(service.id); }}
        className="py-[12px] px-0.5 -my-[12px] flex items-center shrink-0 active:scale-95"
      >
        <span className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          service.active ? 'bg-accent' : 'bg-muted-foreground/25'
        }`}>
          <motion.div
            animate={{ x: service.active ? 26 : 2 }}
            transition={{ type: 'spring' as const, stiffness: 500, damping: 30 } as const}
            className="absolute top-1 size-4 rounded-full bg-white shadow-sm"
          />
        </span>
      </button>
    </Tooltip>
  );

  const preview = (
    <Tooltip content={<p className="text-xs text-foreground">Як цю послугу бачить клієнт</p>} position="top">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onPreview(service); }}
        aria-label="Переглянути як бачить клієнт"
        className="size-11 flex items-center justify-center rounded-full bg-secondary/60 border border-border text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
      >
        <Eye size={14} />
      </button>
    </Tooltip>
  );

  // ─────────────────────────── LIST VIEW ───────────────────────────
  if (view === 'list') {
    return (
      <motion.div
        {...enter}
        className={cn(
          "bento-card overflow-hidden p-0 flex items-stretch group transition-all duration-300",
          !service.active && "opacity-55"
        )}
      >
        {/* Thumbnail */}
        <div className="relative w-[60px] self-stretch flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary/12 via-accent/8 to-primary/5">
          <button
            type="button"
            {...dragHandleProps}
            aria-label="Перемістити послугу"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-0.5 left-0.5 size-5 rounded-md bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
          >
            <GripVertical size={11} className="text-white" />
          </button>
          {service.imageUrl ? (
            <Image src={service.imageUrl} alt={service.name} fill sizes="60px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/55">
              <ServiceIcon name={service.icon_name} size={22} />
            </div>
          )}
        </div>

        {/* Content — clickable. Name gets full width (no truncation) */}
        <button
          type="button"
          onClick={() => onEdit(service)}
          aria-label={`Редагувати послугу ${service.name}`}
          className="flex-1 min-w-0 text-left px-3 py-2 flex flex-col justify-center gap-1 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-start gap-1.5">
            <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{service.name}</p>
            {service.popular && (
              <Tooltip content={<p className="text-xs text-foreground">Відображається як «Популярне» на публічній сторінці</p>} position="top">
                <Star size={11} className="fill-warning text-warning flex-shrink-0 mt-1 cursor-default" />
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              {service.category}
            </span>
            <span className="text-xs text-muted-foreground/60">{formatDuration(service.duration)}</span>
          </div>
        </button>

        {/* Price over actions — right column */}
        <div className="flex flex-col items-end justify-center gap-1.5 pl-1 pr-2 py-2 flex-shrink-0">
          <p className="metric-value text-sm text-foreground whitespace-nowrap">{formatPrice(service.price)}</p>
          <div className="flex items-center gap-0.5">
            {preview}
            {editDelete}
            {toggle}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─────────────────────────── GRID VIEW ───────────────────────────
  return (
    <motion.div
      {...enter}
      className={cn(
        "bento-card overflow-hidden p-0 flex flex-col group transition-all duration-300",
        !service.active && "opacity-55"
      )}
    >
      {/* Visual zone — full-width thumbnail on top, or tinted icon fallback */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary/12 via-accent/8 to-primary/5">
        <button
          type="button"
          {...dragHandleProps}
          aria-label="Перемістити послугу"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1.5 left-1.5 size-7 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        >
          <GripVertical size={13} className="text-white" />
        </button>

        {service.imageUrl ? (
          <Image src={service.imageUrl} alt={service.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary/55">
            <ServiceIcon name={service.icon_name} size={40} />
          </div>
        )}

        {service.popular && (
          <Tooltip content={<p className="text-xs text-foreground">Відображається як «Популярне» на публічній сторінці</p>} position="top">
            <span className="absolute top-1.5 right-1.5 flex items-center gap-1 h-6 pl-1.5 pr-2 rounded-full bg-background/85 backdrop-blur-sm shadow-sm cursor-default">
              <Star size={11} className="fill-warning text-warning" />
              <span className="text-[10px] font-semibold text-foreground">Хіт</span>
            </span>
          </Tooltip>
        )}
      </div>

      {/* Content — clickable area to open editor */}
      <button
        type="button"
        onClick={() => onEdit(service)}
        aria-label={`Редагувати послугу ${service.name}`}
        className="text-left px-3 pt-3 pb-1.5 flex flex-col gap-1 hover:opacity-80 transition-opacity"
      >
        <p className="text-[15px] font-semibold text-foreground leading-snug line-clamp-2">{service.name}</p>

        {service.description && (
          <p className="text-xs text-muted-foreground/70 leading-snug line-clamp-1">{service.description}</p>
        )}

        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
            {service.category}
          </span>
          <span className="text-xs text-muted-foreground/60">{formatDuration(service.duration)}</span>
        </div>

        <p className="metric-value text-lg text-foreground leading-none pt-0.5">{formatPrice(service.price)}</p>
      </button>

      {/* Footer — management actions */}
      <div className="flex items-center justify-between px-3 py-2 mt-auto border-t border-secondary/60">
        <div className="flex items-center gap-1">
          {preview}
          {editDelete}
        </div>
        {toggle}
      </div>
    </motion.div>
  );
}
