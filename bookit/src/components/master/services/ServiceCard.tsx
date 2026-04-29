'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { type Service, formatPrice, formatDuration } from './types';

interface ServiceCardProps {
  service: Service;
  onEdit: (s: Service) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  index: number;
}

export function ServiceCard({ service, onEdit, onDelete, onToggle, onMoveUp, onMoveDown, index }: ServiceCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      className={`bento-card p-4 transition-opacity ${!service.active ? 'opacity-55' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Thumbnail or Emoji */}
        <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0" style={{ background: 'rgba(255, 210, 194, 0.4)' }}>
          {service.imageUrl ? (
            <Image src={service.imageUrl} alt={service.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">{service.emoji}</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{service.name}</p>
            {service.popular && (
              <Tooltip content={<p className="text-[11px] text-foreground">Відображається як «Популярне» на публічній сторінці</p>} position="top">
                <Star size={12} className="fill-[#D4935A] text-warning cursor-default" />
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[11px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
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
          {/* Reorder */}
          <div className="flex flex-col gap-0.5 mr-1">
            <button
              onClick={onMoveUp}
              disabled={!onMoveUp}
              className="w-6 h-5 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-primary hover:bg-white/70 disabled:opacity-25 disabled:cursor-default transition-colors active:scale-95 transition-all"
            >
              <ChevronUp size={12} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!onMoveDown}
              className="w-6 h-5 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-primary hover:bg-white/70 disabled:opacity-25 disabled:cursor-default transition-colors active:scale-95 transition-all"
            >
              <ChevronDown size={12} />
            </button>
          </div>

          <Tooltip content={<p className="text-[11px] text-foreground">Редагувати послугу</p>} position="top">
            <button
              onClick={() => onEdit(service)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/70 border border-white/80 text-muted-foreground hover:bg-white hover:text-primary transition-colors"
            >
              <Pencil size={14} />
            </button>
          </Tooltip>

          <AnimatePresence mode="wait">
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
                  onClick={() => onDelete(service.id)}
                  className="px-2.5 h-7 rounded-lg bg-destructive text-white text-xs font-semibold hover:bg-[#a84a4a] transition-colors"
                >
                  Так
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 h-7 rounded-lg bg-white/70 border border-white/80 text-xs font-medium text-muted-foreground hover:bg-white transition-colors"
                >
                  Ні
                </button>
              </motion.div>
            ) : (
              <Tooltip key="btn" content={<p className="text-[11px] text-foreground">Видалити послугу</p>} position="top">
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/70 border border-white/80 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </Tooltip>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle */}
        <Tooltip content={<p className="text-[11px] text-foreground">{service.active ? 'Деактивувати послугу' : 'Активувати послугу'}</p>} position="top">
          <button
            onClick={() => onToggle(service.id)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              service.active ? 'bg-primary' : 'bg-secondary/80'
            }`}
          >
            <motion.div
              animate={{ x: service.active ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
            />
          </button>
        </Tooltip>
      </div>
    </motion.div>
  );
}
