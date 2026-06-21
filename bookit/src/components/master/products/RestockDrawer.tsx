'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, RefreshCw } from 'lucide-react';
import { restockProduct } from '@/app/(master)/dashboard/products/actions';
import { useQueryClient } from '@tanstack/react-query';
import { useMasterContext } from '@/lib/supabase/context';
import type { Product } from '@/types/database';

// humanized
const UNIT_LABEL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };
const PRESETS_FOR_LIQUID = [10, 50, 100];

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export function RestockDrawer({ product, open, onClose }: Props) {
  const unit = (product.unit ?? 'pcs') as 'pcs' | 'ml' | 'g';
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

  function handleQtyChange(raw: string) {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 1) setQty(parsed);
    else if (raw === '' || raw === '0') setQty(1);
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--background)] rounded-t-3xl p-6 pb-10 max-w-lg mx-auto border-t border-[var(--border)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring' as const, stiffness: 380, damping: 32 }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-[var(--border-strong)] rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-foreground">Поповнити склад</h2>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {product.name} · зараз: {product.stock_qty} {UNIT_LABEL[unit]}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Закрити"
                className="size-11 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] active:scale-[0.88] transition-transform"
              >
                <X size={16} />
              </button>
            </div>

            {/* Qty stepper with direct input */}
            <div className="flex items-center justify-center gap-5 my-6">
              <button
                type="button"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                aria-label="Зменшити"
                className="size-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] active:scale-[0.88] transition-transform"
              >
                <Minus size={20} />
              </button>

              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={qty}
                onChange={e => handleQtyChange(e.target.value)}
                aria-label="Кількість"
                className="w-20 text-4xl font-bold text-center text-foreground bg-transparent border-b-2 border-[var(--border-strong)] focus:border-[var(--accent)] outline-none tabular-nums transition-colors"
              />

              <button
                type="button"
                onClick={() => setQty(q => q + 1)}
                aria-label="Збільшити"
                className="size-12 rounded-xl bg-[var(--accent)] flex items-center justify-center text-[var(--accent-on)] active:scale-[0.88] transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Quick presets — only for liquid/weight units */}
            {unit !== 'pcs' && (
              <div className="flex items-center justify-center gap-2 mb-5">
                {PRESETS_FOR_LIQUID.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQty(q => q + preset)}
                    className="px-3 py-1 rounded-full bg-[var(--accent-light)] text-[var(--text-secondary)] text-xs font-medium active:scale-[0.93] transition-transform hover:bg-[var(--accent-light)]"
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            )}

            {/* Note */}
            <input
              type="text"
              placeholder="Примітка (необов&apos;язково)"
              value={note}
              onChange={e => setNote(e.target.value)}
              aria-label="Примітка до поповнення"
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-foreground placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 mb-4 transition-all"
            />

            {error && (
              <p className="text-xs text-destructive mb-3 px-1">{error}</p>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="w-full py-3.5 rounded-full bg-[var(--accent)] text-[var(--accent-on)] font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.97] transition-transform"
            >
              <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} />
              {isPending ? 'Зберігаємо...' : `Додати +${qty} ${UNIT_LABEL[unit]}`}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
