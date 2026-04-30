'use client';

import { Drawer } from 'vaul';
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
    <Drawer.Root 
      open={isOpen} 
      onOpenChange={(v) => !v && onClose()}
      dismissible={true}
      shouldScaleBackground={false}
      // prevents layout shift on focus
      repositionInputs={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <Drawer.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-[100] outline-none flex flex-col',
            'bg-background rounded-t-[32px] shadow-[0_-8px_40px_rgba(0,0,0,0.12)]',
            'max-h-[96vh] will-change-transform',
            className
          )}
        >
          {/* iOS Handle Area */}
          <div className="flex justify-center pt-3 pb-4 cursor-grab active:cursor-grabbing shrink-0">
            <div className="w-12 h-1.5 bg-muted/30 rounded-full" />
          </div>

          {title && (
            <div className="flex items-center justify-between px-6 py-2 shrink-0">
              <Drawer.Title className="heading-serif text-xl text-foreground m-0">
                {title}
              </Drawer.Title>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground hover:bg-secondary/80 active:scale-90 transition-all"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {!title && (
            <Drawer.Title className="sr-only">
              Bottom Sheet Content
            </Drawer.Title>
          )}

          {/* 
            CRITICAL: Added extra bottom padding (pb-32 = 128px) 
            to ensure content is never hidden by BottomNav and Safe Areas.
          */}
          <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain px-6 pt-2 pb-32">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
