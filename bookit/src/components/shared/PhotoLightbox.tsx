'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface LightboxPhoto {
  url: string;
  alt?: string;
}

interface Props {
  photos: LightboxPhoto[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const spring = { type: 'spring', stiffness: 380, damping: 30 } as const;

export function PhotoLightbox({ photos, currentIndex, onClose, onPrev, onNext }: Props) {
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;
  const photo = photos[currentIndex];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  if (!photo) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрити"
        className="absolute right-4 size-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10 active:scale-90 transition-transform"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <X size={20} />
      </button>

      {hasPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Попереднє фото"
          className="absolute left-4 top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10 active:scale-90 transition-transform"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Наступне фото"
          className="absolute right-4 top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10 active:scale-90 transition-transform"
        >
          <ChevronRight size={22} />
        </button>
      )}

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={spring}
        className="relative w-full max-w-lg mx-16 aspect-square"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photo.url}
          alt={photo.alt ?? ''}
          fill
          className="object-contain"
          sizes="(max-width: 640px) calc(100vw - 128px), 480px"
          priority
        />
      </motion.div>

      {photos.length > 1 && (
        <div
          className="absolute text-xs text-white/50 font-medium"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {currentIndex + 1} / {photos.length}
        </div>
      )}
    </motion.div>
  );
}
