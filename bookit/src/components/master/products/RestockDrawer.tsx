'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, RefreshCw } from 'lucide-react';
import { restockProduct } from '@/app/(master)/dashboard/products/actions';
import { useQueryClient } from '@tanstack/react-query';
import { useMasterContext } from '@/lib/supabase/context';
import type { Product } from '@/types/database';

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export function RestockDrawer({ product, open, onClose }: Props) {
  const [qty, setQty]   = useState(1);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { masterProfile } = useMasterContext();
  const qc = useQueryClient();

  function handleClose() {
    setQty(1);
    setNote('');
    setError(null);
    onClose();
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await restockProduct(product.id, qty, note.trim() || undefined);
      if (res.error) { setError(res.error); return; }
      qc.invalidateQueries({ queryKey: ['products', masterProfile?.id] });
      handleClose();
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFF8F5] rounded-t-3xl p-6 pb-10 max-w-lg mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-[#D4B9B0] rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-[#2C1A14]">Поповнити склад</h2>
                <p className="text-xs text-[#A8928D] mt-0.5">{product.name} · зараз: {product.stock_qty} шт</p>
              </div>
              <button onClick={handleClose} className="w-8 h-8 rounded-full bg-[#F5E8E3] flex items-center justify-center text-[#6B5750]">
                <X size={16} />
              </button>
            </div>

            {/* Qty stepper */}
            <div className="flex items-center justify-center gap-5 my-6">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-12 h-12 rounded-2xl bg-[#F5E8E3] flex items-center justify-center text-[#6B5750] active:scale-95 transition-all"
              >
                <Minus size={20} />
              </button>
              <span className="text-4xl font-bold text-[#2C1A14] w-16 text-center tabular-nums">{qty}</span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="w-12 h-12 rounded-2xl bg-[#789A99] flex items-center justify-center text-white active:scale-95 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Note */}
            <input
              type="text"
              placeholder="Примітка (необов'язково)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder:text-[#A8928D] outline-none focus:border-[#789A99]/50 mb-4"
            />

            {error && (
              <p className="text-xs text-[#C05B5B] mb-3 px-1">{error}</p>
            )}

            <button
              onClick={handleSave}
              disabled={isPending}
              className="w-full py-3.5 rounded-2xl bg-[#789A99] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all"
            >
              <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} />
              {isPending ? 'Зберігаємо...' : `Додати +${qty} шт`}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
