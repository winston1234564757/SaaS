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

import { BottomSheet } from '@/components/ui/BottomSheet';

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

  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
        {children}
      </BottomSheet>
    );
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: isOpen ? 1 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-sm", !isOpen && "pointer-events-none")}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <div 
                className={cn(
                  "fixed inset-0 z-50 flex p-0 outline-none items-center justify-center md:p-6",
                  !isOpen && "pointer-events-none"
                )}
                style={{ display: keepMounted && !hasOpenedOnce ? 'none' : 'flex' }}
              >
                <motion.div
                  key="modal-content"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onAnimationComplete={() => {
                    if (isOpen) setIsFullyOpen(true);
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                  className={cn(
                    "relative w-full overflow-hidden flex flex-col bg-background transition-shadow duration-500 outline-none",
                    isOpen ? "pointer-events-auto" : "pointer-events-none",
                    "h-auto max-h-[90vh] max-w-[620px] rounded-[32px] shadow-2xl"
                  )}
                >
                  {/* Header */}
                  <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-background/95 backdrop-blur-md border-b border-border/40">
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
                    {children}
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
