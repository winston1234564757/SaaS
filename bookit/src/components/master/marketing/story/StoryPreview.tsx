'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import { StoryCanvas } from './StoryCanvas';
import type { CanvasProps, UpgradeCopy } from './storyTypes';

interface StoryPreviewProps {
  canvasProps: CanvasProps;
  scale: number;
  radius: number;
  isBlurLocked: boolean;
  isPremiumLocked: boolean;
  blurActive: boolean;
  upgradeCopy: UpgradeCopy | null;
}

export function StoryPreview({ canvasProps, scale, radius, isBlurLocked, isPremiumLocked, blurActive, upgradeCopy }: StoryPreviewProps) {
  return (
    <div style={{ position: 'relative', width: 360 * scale, height: 640 * scale }}>
      <div style={{
        width: 360 * scale, height: 640 * scale,
        overflow: 'hidden', borderRadius: radius,
        filter: isBlurLocked ? 'blur(10px)' : 'none',
        transition: 'filter 0.6s ease',
        boxShadow: '0 20px 60px color-mix(in srgb, var(--accent) 18%, transparent), 0 0 0 1px color-mix(in srgb, var(--border) 50%, transparent)',
      }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
          <StoryCanvas {...canvasProps} />
        </div>
      </div>

      <AnimatePresence>
        {isBlurLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ borderRadius: 20 * scale, background: 'color-mix(in srgb, var(--text-primary) 8%, transparent)' }}>
            <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl text-center"
              style={{ background: 'color-mix(in srgb, var(--text-primary) 90%, transparent)', backdropFilter: 'blur(4px)', maxWidth: 180 }}>
              <Lock size={16} strokeWidth={2.5} style={{ color: 'var(--accent-on)' }} />
              <span className="text-[11px] font-bold tracking-wide leading-tight" style={{ color: 'var(--accent-on)' }}>{upgradeCopy?.overlayTitle ?? 'Доступно в PRO'}</span>
              <span className="text-[10px] leading-snug" style={{ color: 'color-mix(in srgb, var(--accent-on) 55%, transparent)' }}>{upgradeCopy?.overlayHint ?? '700 грн/міс'}</span>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full mt-0.5"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>Перейти на PRO</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isPremiumLocked && !blurActive && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <span className="text-[9px] text-text-sub bg-background/80 rounded-full px-2 py-0.5">Перегляд · 10 сек</span>
        </div>
      )}
    </div>
  );
}
