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
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      className={cn(
        "bento-card p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group",
        !service.active && "opacity-55"
      )}
      onClick={() => onEdit(service)}
    >
      <div className="flex items-center gap-3">
        {/* Thumbnail or Icon */}
        <div className="relative size-12 rounded-xl overflow-hidden flex-shrink-0 bg-warning/20">
          <button
            {...dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-0.5 left-0.5 size-5 rounded-md bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
          >
            <GripVertical size={10} className="text-white" />
          </button>
          {service.imageUrl ? (
            <Image src={service.imageUrl} alt={service.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              <ServiceIcon name={service.icon_name} size={18} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{service.name}</p>
            {service.popular && (
              <Tooltip content={<p className="text-xs text-foreground">Відображається як «Популярне» на публічній сторінці</p>} position="top">
                <Star size={12} className="fill-warning text-warning cursor-default" />
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {service.category}
            </span>
            <span className="text-xs text-muted-foreground/60">{formatDuration(service.duration)}</span>
          </div>
        </div>

        {/* Price */}
        <p className="text-base font-bold text-foreground flex-shrink-0">{formatPrice(service.price)}</p>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-secondary/60">
        <div className="flex items-center gap-1">
          <Tooltip content={<p className="text-xs text-foreground">Редагувати послугу</p>} position="top">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(service); }}
              className="size-8 flex items-center justify-center rounded-xl bg-secondary/60 border border-border text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
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
                <span className="text-xs text-destructive font-medium whitespace-nowrap ml-1">Видалити?</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(service.id); }}
                  className="px-2.5 h-7 rounded-lg bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition-colors"
                >
                  Так
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                  className="px-2.5 h-7 rounded-lg bg-secondary/60 border border-border text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Ні
                </button>
              </motion.div>
            ) : (
              <Tooltip key="btn" content={<p className="text-xs text-foreground">Видалити послугу</p>} position="top">
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                  className="size-8 flex items-center justify-center rounded-xl bg-secondary/60 border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
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
            onClick={(e) => { e.stopPropagation(); onToggle(service.id); }}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              service.active ? 'bg-primary' : 'bg-secondary/80'
            }`}
          >
            <motion.div
              animate={{ x: service.active ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 size-4 rounded-full bg-accent-on shadow-sm"
            />
          </button>
        </Tooltip>
      </div>
    </motion.div>
  );
}
