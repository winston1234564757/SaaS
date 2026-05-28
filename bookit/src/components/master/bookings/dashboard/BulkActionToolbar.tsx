'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Trash2, CheckCircle2 } from 'lucide-react';

interface Props {
  selectedCount: number;
  onConfirmAll?: () => void;
  onCompleteAll?: () => void;
  onCancelAll?: () => void;
  onClear?: () => void;
  isPending?: boolean;
}

export function BulkActionToolbar({ selectedCount, onConfirmAll, onCompleteAll, onCancelAll, onClear, isPending }: Props) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-50"
        >
          <div className="bg-foreground text-background rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-4 border border-background/10 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-background/10 flex items-center justify-center font-bold text-sm">
                {selectedCount}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold uppercase tracking-widest">Вибрано</p>
                <p className="text-[10px] text-background/60">записів для масових дій</p>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={onConfirmAll}
                disabled={isPending}
                className="h-10 px-4 shrink-0 rounded-2xl bg-[var(--btn-primary-bg)] text-[var(--accent-on)] flex items-center gap-2 text-xs font-bold hover:opacity-90 transition-all active:scale-[0.88] cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                <span>Підтвердити</span>
              </button>

              <button
                onClick={onCompleteAll}
                disabled={isPending}
                className="h-10 px-4 shrink-0 rounded-2xl bg-success text-white flex items-center gap-2 text-xs font-bold hover:opacity-90 transition-all active:scale-[0.88] cursor-pointer disabled:opacity-50"
              >
                <Check size={16} />
                <span>Завершити</span>
              </button>
              
              <button
                onClick={onCancelAll}
                disabled={isPending}
                className="h-10 px-4 shrink-0 rounded-2xl bg-background/10 text-background flex items-center gap-2 text-xs font-bold hover:bg-background/20 transition-all active:scale-[0.88] cursor-pointer disabled:opacity-50"
              >
                <X size={16} />
                <span>Скасувати</span>
              </button>

              <div className="w-px h-6 bg-background/10 mx-1 shrink-0" />

              <button
                onClick={onClear}
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl hover:bg-background/10 text-background/60 transition-colors active:scale-[0.88] cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

