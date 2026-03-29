import { useEffect } from 'react';
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
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#2C1A14]/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-[#FFF8F5] rounded-t-[28px] shadow-2xl',
              'max-h-[90dvh] overflow-y-auto',
              className
            )}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[#E8D5CF] rounded-full" />
            </div>

            {title && (
              <div className="flex items-center justify-between px-5 py-3">
                <h3 className="heading-serif text-lg text-[#2C1A14]">{title}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5E8E3] text-[#6B5750] hover:bg-[#EDD9D1] transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            <div className="px-5 pb-8 pt-2">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
