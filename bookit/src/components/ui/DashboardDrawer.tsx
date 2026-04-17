'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function DashboardDrawer({ isOpen, onClose, title, children }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const variants = {
    initial: isMobile ? { x: '100%', opacity: 1, scale: 1 } : { x: 0, opacity: 0, scale: 0.95 },
    animate: { x: 0, opacity: 1, scale: 1 },
    exit: isMobile ? { x: '100%', opacity: 1, scale: 1 } : { x: 0, opacity: 0, scale: 0.95 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:items-center md:justify-center p-0 md:p-6 pointer-events-none">
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#2C1A14]/40 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className={cn(
              "relative z-10 w-full overflow-hidden flex flex-col pointer-events-auto shadow-2xl",
              isMobile 
                ? "fixed inset-y-0 right-0 h-full max-w-[560px] bg-[#FFE8DC]" 
                : "h-auto max-h-[85vh] max-w-[620px] bg-red-500 rounded-[32px]"
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-[#FFE8DC]/90 backdrop-blur-md border-b border-white/40">
              <h2 className="heading-serif text-xl text-[#2C1A14]">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Закрити"
                className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/40 border border-white/40 hover:bg-white/70 transition-colors shadow-sm"
              >
                <X size={20} className="text-[#6B5750]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
