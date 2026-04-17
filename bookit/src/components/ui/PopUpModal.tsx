'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  keepMounted?: boolean;
}

export function PopUpModal({ isOpen, onClose, title, children, keepMounted = false }: PopUpModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isFullyOpen, setIsFullyOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasOpenedOnce(true);
    } else {
      setIsFullyOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const variants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  const modalBody = (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6",
        !isOpen && keepMounted ? "pointer-events-none" : "pointer-events-none" // Outer container is always passthrough
      )}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#2C1A14]/30 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.div
        key="modal-content"
        variants={variants}
        initial="initial"
        animate={isOpen ? "animate" : "exit"}
        onAnimationComplete={() => {
          if (isOpen) setIsFullyOpen(true);
        }}
        style={{ 
          display: keepMounted && !hasOpenedOnce ? 'none' : 'flex',
          visibility: !isOpen && keepMounted ? 'hidden' : 'visible'
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        className={cn(
          "relative z-10 w-full overflow-hidden flex flex-col pointer-events-auto shadow-2xl bg-[#FFE8DC]",
          isMobile 
            ? "fixed inset-y-0 right-0 h-full max-w-[560px]" 
            : "h-auto max-h-[90vh] max-w-[620px] rounded-[32px]"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-[#FFE8DC]/95 backdrop-blur-md border-b border-white/40">
          <h2 className="heading-serif text-xl text-[#2C1A14]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Закрити"
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/40 border border-white/40 hover:bg-white/70 transition-colors shadow-sm cursor-pointer"
          >
            <X size={20} className="text-[#6B5750]" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {(!isFullyOpen && !hasOpenedOnce) || (isMobile && !isFullyOpen) ? (
            <div className="flex flex-col gap-5 p-6 animate-pulse">
              {/* Header Ghost */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#789A99]/10" />
                  <div className="space-y-2">
                    <div className="w-32 h-5 bg-[#789A99]/10 rounded-lg" />
                    <div className="w-48 h-3 bg-[#789A99]/5 rounded-md" />
                  </div>
                </div>
                <div className="w-20 h-6 bg-[#789A99]/10 rounded-full" />
              </div>

              {/* Bento Chips Ghost */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-white/40 border border-white/60 rounded-2xl" />
                ))}
              </div>

              {/* Main Card Ghost */}
              <div className="space-y-4">
                <div className="h-40 bg-white/40 border border-white/60 rounded-3xl" />
                <div className="h-40 bg-white/40 border border-white/60 rounded-3xl" />
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </motion.div>
    </div>
  );

  if (keepMounted) {
    return modalBody;
  }

  return (
    <AnimatePresence>
      {isOpen && modalBody}
    </AnimatePresence>
  );
}
