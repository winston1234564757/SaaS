'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
}

const positionStyles: Record<TooltipPosition, string> = {
  top:    'bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2',
  bottom: 'top-[calc(100%+10px)] left-1/2 -translate-x-1/2',
  left:   'right-[calc(100%+10px)] top-1/2 -translate-y-1/2',
  right:  'left-[calc(100%+10px)] top-1/2 -translate-y-1/2',
};

const motionVariants: Record<TooltipPosition, { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }> = {
  top:    { initial: { opacity: 0, y: 5,  scale: 0.92 }, animate: { opacity: 1, y: 0,  scale: 1 }, exit: { opacity: 0, y: 5,  scale: 0.92 } },
  bottom: { initial: { opacity: 0, y: -5, scale: 0.92 }, animate: { opacity: 1, y: 0,  scale: 1 }, exit: { opacity: 0, y: -5, scale: 0.92 } },
  left:   { initial: { opacity: 0, x: 5,  scale: 0.92 }, animate: { opacity: 1, x: 0,  scale: 1 }, exit: { opacity: 0, x: 5,  scale: 0.92 } },
  right:  { initial: { opacity: 0, x: -5, scale: 0.92 }, animate: { opacity: 1, x: 0,  scale: 1 }, exit: { opacity: 0, x: -5, scale: 0.92 } },
};

const arrowStyles: Record<TooltipPosition, string> = {
  top:    'absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white/95 border-r border-b border-white/50',
  bottom: 'absolute -top-[4px]    left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white/95 border-l border-t border-white/50',
  left:   'absolute -right-[4px]  top-1/2  -translate-y-1/2 w-2 h-2 rotate-45 bg-white/95 border-r border-t border-white/50',
  right:  'absolute -left-[4px]   top-1/2  -translate-y-1/2 w-2 h-2 rotate-45 bg-white/95 border-l border-b border-white/50',
};

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 280,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timer.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }, []);

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            {...motionVariants[position]}
            transition={{ duration: 0.13, ease: 'easeOut' }}
            className={cn('absolute z-[200] pointer-events-none', positionStyles[position])}
          >
            <div className="relative px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white/70 shadow-[0_6px_20px_rgba(44,26,20,0.13),inset_0_1px_0_rgba(255,255,255,0.9)] min-w-max">
              {content}
              <div className={arrowStyles[position]} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
