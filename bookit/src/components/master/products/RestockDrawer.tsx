'use client';

import { useState, useEffect, useTransition } from 'react';
import { Drawer } from 'vaul';
import { X, Plus, Minus, RefreshCw } from 'lucide-react';
import { restockProduct } from '@/app/(master)/dashboard/products/actions';
import { useQueryClient } from '@tanstack/react-query';
import { useMasterContext } from '@/lib/supabase/context';
import type { Product } from '@/types/database';

const UNIT_LABEL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };
const PRESETS_FOR_LIQUID = [10, 50, 100];

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export function RestockDrawer({ product, open, onClose }: Props) {
  const unit = (product.unit ?? 'pcs') as 'pcs' | 'ml' | 'g';
  const [qty, setQty]         = useState(1);
  const [note, setNote]       = useState('');
  const [costStr, setCostStr] = useState(
    product.cost_kopecks ? String(product.cost_kopecks / 100) : '',
  );
  const [error, setError]         = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { masterProfile } = useMasterContext();
  const qc = useQueryClient();

  useEffect(() => {
    if (open) {
      setQty(1);
      setNote('');
      setCostStr(product.cost_kopecks ? String(product.cost_kopecks / 100) : '');
      setError(null);
    }
  }, [open, product.id, product.cost_kopecks]);

  function handleQtyChange(raw: string) {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 1) setQty(parsed);
    else if (raw === '' || raw === '0') setQty(1);
  }

  function handleSave() {
    setError(null);
    const costVal = costStr.trim() ? parseFloat(costStr) : null;
    const costKopecks =
      costVal !== null && !isNaN(costVal) && costVal > 0
        ? Math.round(costVal * 100)
        : undefined;
    startTransition(async () => {
      const res = await restockProduct(product.id, qty, note.trim() || undefined, costKopecks);
      if (res.error) { setError(res.error); return; }
      qc.invalidateQueries({ queryKey: ['products', masterProfile?.id] });
      onClose();
    });
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      shouldScaleBackground
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[76]" />
        {/* max-h-[90dvh] — dvh adjusts when keyboard opens on iOS */}
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[80] bg-[var(--background)] rounded-t-[28px] shadow-2xl max-h-[90dvh] flex flex-col">

          {/* Drag handle */}
          <div className="mx-auto mt-3 w-12 h-1.5 rounded-full bg-[var(--border-strong)] shrink-0" />

          {/* Header */}
          <div className="shrink-0 px-5 pt-3 pb-2 flex items-center justify-between">
            <div>
              <Drawer.Title className="text-base font-bold text-foreground">Поповнити склад</Drawer.Title>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {product.name} · зараз: {product.stock_qty} {UNIT_LABEL[unit]}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрити"
              className="size-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] active:scale-[0.88] transition-transform"
            >
              <X size={16} />
            </button>
          </div>

          {/* Stepper */}
          <div className="shrink-0 px-5 pb-3 flex flex-col items-center gap-2">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                aria-label="Зменшити"
                className="size-11 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] active:scale-[0.88] transition-transform"
              >
                <Minus size={18} />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={qty}
                onChange={e => handleQtyChange(e.target.value)}
                aria-label="Кількість"
                className="w-16 text-4xl font-bold text-center text-foreground bg-transparent border-b-2 border-[var(--border-strong)] focus:border-[var(--accent)] outline-none tabular-nums transition-colors"
              />
              <button
                type="button"
                onClick={() => setQty(q => q + 1)}
                aria-label="Збільшити"
                className="size-11 rounded-xl bg-[var(--accent)] flex items-center justify-center text-[var(--accent-on)] active:scale-[0.88] transition-transform"
              >
                <Plus size={18} />
              </button>
            </div>
            {unit !== 'pcs' && (
              <div className="flex items-center gap-2">
                {PRESETS_FOR_LIQUID.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQty(q => q + preset)}
                    className="px-3 py-1.5 rounded-full bg-[var(--accent-light)] text-[var(--text-secondary)] text-xs font-medium active:scale-[0.93] transition-transform"
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Inputs */}
          <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-2 pb-2">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="Ціна закупки, ₴ (необов'язково)"
              value={costStr}
              onChange={e => setCostStr(e.target.value)}
              aria-label="Ціна закупки за одиницю"
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-foreground placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors"
            />
            <input
              type="text"
              placeholder="Примітка (необов'язково)"
              value={note}
              onChange={e => setNote(e.target.value)}
              aria-label="Примітка до поповнення"
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-foreground placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {/* Footer button — 20px above keyboard */}
          <div className="shrink-0 px-5 pt-2 pb-5">
            {error && <p className="text-xs text-destructive mb-2">{error}</p>}
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="w-full py-3.5 rounded-full bg-[var(--accent)] text-[var(--accent-on)] font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.97] transition-transform"
            >
              <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} />
              {isPending ? 'Зберігаємо...' : `Додати +${qty} ${UNIT_LABEL[unit]}`}
            </button>
          </div>

        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
