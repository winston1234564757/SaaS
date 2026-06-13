'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import { PhotoLightbox } from '@/components/shared/PhotoLightbox';

interface Photo {
  id: string;
  url: string;
  display_order: number;
}

interface Props {
  photos: Photo[];
  title: string;
}

export function PortfolioPhotoViewer({ photos, title }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setLightboxIndex(0)}
        aria-label="Переглянути фото"
        className="relative w-full aspect-square rounded-xl overflow-hidden active:scale-[0.99] transition-transform"
        style={{ boxShadow: '0 4px 24px rgba(44,26,20,0.10)' }}
      >
        <Image
          src={photos[0].url}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 512px"
          priority
        />
        {photos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {photos.length} фото
          </div>
        )}
      </button>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {photos.slice(1).map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIndex(i + 1)}
              aria-label={`Фото ${i + 2}`}
              className="relative size-20 rounded-xl overflow-hidden shrink-0 active:scale-[0.95] transition-transform"
            >
              <Image src={photo.url} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

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
