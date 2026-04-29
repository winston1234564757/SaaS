'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

type Position = 'top' | 'bottom' | 'left' | 'right';

const POSITION_CLASSES: Record<Position, string> = {
  top:    'bottom-full left-0 mb-3',
  bottom: 'top-full left-0 mt-3',
  left:   'right-full top-0 mr-3',
  right:  'left-full top-0 ml-3',
};

// Arrow points toward the anchored element
const ARROW_CLASSES: Record<Position, string> = {
  top:    'bottom-[-6px] left-8 -translate-x-1/2 rotate-45 border-b border-r',
  bottom: 'top-[-6px] left-8 -translate-x-1/2 rotate-45 border-t border-l',
  left:   'right-[-6px] top-1/2 -translate-y-1/2 rotate-45 border-t border-r',
  right:  'left-[-6px] top-1/2 -translate-y-1/2 rotate-45 border-b border-l',
};


interface AnchoredTooltipProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
  position?: Position;
  primaryButtonText?: string;
  onPrimaryClick?: () => void;
}

export function AnchoredTooltip({
  isOpen,
  onClose,
  title,
  text,
  position = 'top',
  primaryButtonText = 'Зрозуміло',
  onPrimaryClick,
}: AnchoredTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && tooltipRef.current) {
      tooltipRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isOpen]);

  function handlePrimary() {
    if (onPrimaryClick) onPrimaryClick();
    else onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
          className={`absolute ${POSITION_CLASSES[position]} z-50 w-72`}
        >
          {/* Tooltip card */}
          <div
            className="relative bg-white rounded-2xl p-4"
            style={{
              boxShadow: '0 8px 32px rgba(44,26,20,0.13), 0 2px 8px rgba(44,26,20,0.07)',
              border: '1px solid rgba(44,26,20,0.08)',
            }}
          >
            {/* Arrow caret */}
            <div
              className={`absolute w-3 h-3 bg-white z-[-1] ${ARROW_CLASSES[position]}`}
              style={{ borderColor: 'rgba(44,26,20,0.1)' }}
            />

            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0">
                <span className="block w-2.5 h-2.5 rounded-full bg-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug">{title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{text}</p>

                <button
                  onClick={handlePrimary}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-[#6B8C8B] active:scale-95 transition-all"
                >
                  {primaryButtonText}
                </button>
              </div>

              <button
                onClick={onClose}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary transition-colors active:scale-95 transition-all"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
