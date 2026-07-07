'use client';

import { type ReactNode, useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Доступна назва діалогу коли `title` навмисно порожній (напр. власна обкладинка-герой володіє ідентичністю). */
  srTitle?: string;
  children: ReactNode;
  variant?: 'adaptive' | 'dialog' | 'bottom';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
  contentClassName?: string;
  dismissible?: boolean;
}

const maxWidthClasses: Record<string, string> = {
  sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl',
  '2xl': 'max-w-2xl', '3xl': 'max-w-3xl', '4xl': 'max-w-4xl', '5xl': 'max-w-5xl',
};

const SPRING = { type: 'spring', stiffness: 350, damping: 32 } as const;

function DialogVariant({ open, onOpenChange, title, srTitle, children, maxWidth = 'xl', className, contentClassName }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div
                key="sheet-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[150] bg-black/20 backdrop-blur-[2px]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 outline-none">
                <motion.div
                  key="sheet-content"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={SPRING}
                  className={cn(
                    'relative w-full overflow-hidden flex flex-col outline-none',
                    'bg-secondary backdrop-blur-3xl saturate-150',
                    'border border-border shadow-2xl rounded-xl',
                    'h-auto max-h-[90vh]',
                    maxWidthClasses[maxWidth ?? 'xl'],
                    className,
                  )}
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-6 bg-transparent border-b border-border shrink-0">
                    {title ? (
                      <Dialog.Title className="heading-serif text-2xl text-foreground m-0 tracking-tight">
                        {title}
                      </Dialog.Title>
                    ) : (
                      <Dialog.Title className="sr-only">{srTitle || 'Діалог'}</Dialog.Title>
                    )}
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        aria-label="Закрити"
                        className="size-10 rounded-lg flex items-center justify-center bg-secondary/50 border border-border hover:bg-secondary/80 hover:text-foreground transition-all shadow-sm cursor-pointer active:scale-[0.88] group"
                      >
                        <X size={22} className="text-text-sub group-hover:text-foreground transition-colors" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <Dialog.Description className="sr-only">{title || 'Діалог'}</Dialog.Description>
                  <div className={cn('flex-1 overflow-y-auto overscroll-contain px-8 py-4', contentClassName)}>
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

function BottomVariant({ open, onOpenChange, title, srTitle, children, className, contentClassName, dismissible = true }: SheetProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      dismissible={dismissible}
      shouldScaleBackground={false}
      repositionInputs={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <Drawer.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-[100] outline-none flex flex-col',
            'bg-secondary backdrop-blur-3xl saturate-150 rounded-t-xl shadow-lg',
            'border-t border-border',
            'max-h-[96dvh] will-change-transform',
            className,
          )}
        >
          <div
            role="presentation"
            aria-hidden="true"
            className="flex justify-center pt-3 pb-4 cursor-grab active:cursor-grabbing shrink-0"
          >
            <div className="w-12 h-1.5 bg-muted/30 rounded-full" />
          </div>

          {title ? (
            <div className="flex items-center justify-between px-6 py-2 shrink-0">
              <Drawer.Title className="heading-serif text-xl text-foreground m-0">{title}</Drawer.Title>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Закрити"
                className="size-9 flex items-center justify-center rounded-lg bg-secondary/50 text-text-sub hover:bg-secondary/80 hover:text-foreground active:scale-[0.88] transition-all cursor-pointer border border-border"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <Drawer.Title className="sr-only">{srTitle || 'Панель'}</Drawer.Title>
          )}

          <div className={cn('flex-1 overflow-y-auto scrollbar-hide overscroll-contain px-6 pt-2 pb-32', contentClassName)}>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function Sheet({ variant = 'adaptive', ...props }: SheetProps) {
  const [mounted, setMounted] = useState(false);
  const isDesktop = useIsDesktop();

  useEffect(() => { setMounted(true); }, []);

  if (variant === 'dialog') return <DialogVariant {...props} />;
  if (variant === 'bottom') return <BottomVariant {...props} />;
  if (!mounted) return null;
  return isDesktop ? <DialogVariant {...props} /> : <BottomVariant {...props} />;
}
