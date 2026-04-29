'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ isOpen, onClose, title, children, className }: BottomSheetProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            
            <Dialog.Content asChild>
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                  'fixed bottom-0 left-0 right-0 z-50 outline-none',
                  'bg-background rounded-t-[28px] shadow-2xl',
                  'max-h-[90dvh] overflow-y-auto',
                  className
                )}
              >
                <Dialog.Title className="sr-only">{title ?? 'Bottom Sheet Content'}</Dialog.Title>
                <Dialog.Description className="sr-only">Sheet dialog overlay</Dialog.Description>

                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-muted rounded-full" />
                </div>

                {title && (
                  <div className="flex items-center justify-between px-5 py-3">
                    <h3 className="heading-serif text-lg text-foreground">{title}</h3>
                    <Dialog.Close asChild>
                      <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors active:scale-95 transition-all"
                      >
                        <X size={15} />
                      </button>
                    </Dialog.Close>
                  </div>
                )}

                <div className="px-5 pb-8 pt-2">{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
