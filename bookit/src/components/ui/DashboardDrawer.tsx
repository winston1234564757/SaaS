'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
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

  const variants = {
    initial: isMobile ? { x: '100%', opacity: 1, scale: 1 } : { x: 0, opacity: 0, scale: 0.95 },
    animate: { x: 0, opacity: 1, scale: 1 },
    exit: isMobile ? { x: '100%', opacity: 1, scale: 1 } : { x: 0, opacity: 0, scale: 0.95 }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            
            <Dialog.Content asChild>
              <div className="fixed inset-0 z-50 flex items-center justify-center md:items-center md:justify-center p-0 md:p-6 outline-none pointer-events-none">
                <motion.div
                  key="drawer"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                  className={cn(
                    "relative w-full overflow-hidden flex flex-col shadow-2xl outline-none pointer-events-auto",
                    isMobile 
                      ? "fixed inset-y-0 right-0 h-full max-w-[560px] bg-background" 
                      : "h-auto max-h-[85vh] max-w-[620px] bg-background rounded-[32px]"
                  )}
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-background/90 backdrop-blur-md border-b border-border/40">
                    <Dialog.Title className="heading-serif text-xl text-foreground m-0">{title}</Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        onClick={onClose}
                        aria-label="Закрити"
                        className="w-10 h-10 rounded-2xl flex items-center justify-center bg-secondary border border-border hover:bg-secondary/80 transition-colors shadow-sm active:scale-95 transition-all"
                      >
                        <X size={20} className="text-muted-foreground" />
                      </button>
                    </Dialog.Close>
                  </div>
                  
                  <Dialog.Description className="sr-only">
                    {title} Drawer Content
                  </Dialog.Description>
                  
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
