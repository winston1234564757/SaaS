'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, Star, GripVertical } from 'lucide-react';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils/cn';
import { type Service, formatPrice, formatDuration } from './types';
import { ServiceIcon } from '@/lib/service-icons';

interface ServiceCardProps {
  service: Service;
  onEdit: (s: Service) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  index: number;
}

export function ServiceCard({ service, onEdit, onDelete, onToggle, dragHandleProps, index }: ServiceCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.25), type: 'spring' as const, stiffness: 340, damping: 26 } as const}
      className={cn(
        "bento-card p-3 transition-all duration-300 group",
        !service.active && "opacity-55"
      )}
    >
      <div className="flex items-center gap-2.5">
        {/* Thumbnail / Drag handle */}
        <div className="relative size-10 rounded-xl overflow-hidden flex-shrink-0 bg-warning/20">
          <button
            type="button"
            {...dragHandleProps}
            aria-label="Перемістити послугу"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-0.5 left-0.5 size-4 rounded-md bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
          >
            <GripVertical size={8} className="text-white" />
          </button>
          {service.imageUrl ? (
            <Image src={service.imageUrl} alt={service.name} width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">
              <ServiceIcon name={service.icon_name} size={16} />
            </div>
          )}
        </div>

        {/* Info + Price — clickable area to open editor */}
        <button
          type="button"
          onClick={() => onEdit(service)}
          aria-label={`Редагувати послугу ${service.name}`}
          className="flex-1 flex items-center gap-2 min-w-0 text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{service.name}</p>
              {service.popular && (
                <Tooltip content={<p className="text-xs text-foreground">Відображається як «Популярне» на публічній сторінці</p>} position="top">
                  <Star size={11} className="fill-warning text-warning cursor-default" />
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                {service.category}
              </span>
              <span className="text-xs text-muted-foreground/60">{formatDuration(service.duration)}</span>
            </div>
          </div>

          {/* Price */}
          <p className="text-sm font-bold text-foreground flex-shrink-0">{formatPrice(service.price)}</p>
        </button>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-secondary/60">
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

        {/* Toggle */}
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
      </div>
    </motion.div>
  );
}
