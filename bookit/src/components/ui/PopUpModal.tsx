'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
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

  const variants = isMobile ? {
    initial: { y: '100%', opacity: 1 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 1 }
  } : {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  const isRendered = isOpen || keepMounted;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <AnimatePresence>
        {isRendered && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: isOpen ? 1 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-sm", !isOpen && "pointer-events-none")}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount>
              <div 
                className={cn(
                  "fixed inset-0 z-50 flex p-0 outline-none", 
                  isMobile ? "items-end justify-center" : "items-center justify-center md:p-6",
                  !isOpen && "pointer-events-none"
                )}
                style={{ display: keepMounted && !hasOpenedOnce ? 'none' : 'flex' }}
              >
                <motion.div
                  key="modal-content"
                  variants={variants}
                  initial="initial"
                  animate={isOpen ? "animate" : "exit"}
                  onAnimationComplete={() => {
                    if (isOpen) setIsFullyOpen(true);
                  }}
                  transition={isMobile 
                    ? { type: 'spring', damping: 25, stiffness: 200 }
                    : { type: 'spring', stiffness: 350, damping: 32 }
                  }
                  className={cn(
                    "relative w-full overflow-hidden flex flex-col bg-background transition-shadow duration-500 outline-none",
                    isOpen ? "pointer-events-auto" : "pointer-events-none",
                    isMobile 
                      ? "h-[92vh] rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)]" 
                      : "h-auto max-h-[90vh] max-w-[620px] rounded-[32px] shadow-2xl"
                  )}
                >
                  {/* Mobile Drag Handle */}
                  {isMobile && (
                    <div className="absolute top-0 inset-x-0 h-8 flex items-center justify-center z-20 pointer-events-none">
                      <div className="w-12 h-1.5 bg-foreground/10 rounded-full" />
                    </div>
                  )}

                  {/* Header */}
                  <div className={cn(
                    "sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-background/95 backdrop-blur-md border-b border-border/40",
                    isMobile && "pt-8"
                  )}>
                    <Dialog.Title className="heading-serif text-xl text-foreground m-0">{title}</Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        onClick={onClose}
                        aria-label="Закрити"
                        className="w-10 h-10 rounded-2xl flex items-center justify-center bg-secondary border border-border hover:bg-secondary/80 transition-colors shadow-sm cursor-pointer active:scale-95 transition-all"
                      >
                        <X size={20} className="text-muted-foreground" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <Dialog.Description className="sr-only">
                    {title} modal
                  </Dialog.Description>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto overscroll-contain">
                    {(!isFullyOpen && (!hasOpenedOnce || isMobile)) ? (
                      <div className="flex flex-col gap-6 p-6 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-muted" />
                            <div className="space-y-2.5">
                              <div className="w-28 h-5 bg-muted rounded-lg" />
                              <div className="w-40 h-3 bg-muted rounded-md" />
                            </div>
                          </div>
                          <div className="w-16 h-7 bg-muted rounded-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="h-28 bg-secondary border border-border rounded-[24px]" />
                          <div className="h-28 bg-secondary border border-border rounded-[24px]" />
                        </div>
                        <div className="space-y-4">
                          <div className="h-44 bg-secondary border border-border rounded-[28px]" />
                          <div className="h-44 bg-secondary border border-border rounded-[28px]" />
                        </div>
                      </div>
                    ) : (
                      children
                    )}
                  </div>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
