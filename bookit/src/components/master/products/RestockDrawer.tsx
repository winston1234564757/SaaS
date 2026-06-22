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
  const [error, setError] = useState<string | null>(null);
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

  function handleClose() { onClose(); }

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
      handleClose();
    });
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(v) => { if (!v) handleClose(); }}
      shouldScaleBackground
    >
      <Drawer.Portal>
        {/* z-[76] — above BentoBottomNav z-[75] */}
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[76]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[80] bg-[var(--background)] rounded-t-[28px] shadow-2xl max-h-[90vh] flex flex-col">

          {/* Drag handle */}
          <div className="mx-auto mt-3 mb-0 w-12 h-1.5 rounded-full bg-[var(--border-strong)] shrink-0" />

          {/* ── ZONE 1: Fixed header — never scrolls away ── */}
          <div className="shrink-0 px-5 pt-4 pb-3">
            <div className="flex items-center justify-between mb-5">
              <div>
                <Drawer.Title className="text-base font-bold text-foreground">Поповнити склад</Drawer.Title>
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

            {/* Qty stepper */}
            <div className="flex items-center justify-center gap-5">
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

            {/* Quick presets for liquid/weight */}
            {unit !== 'pcs' && (
              <div className="flex items-center justify-center gap-2 mt-3">
                {PRESETS_FOR_LIQUID.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQty(q => q + preset)}
                    className="px-3 py-2 rounded-full bg-[var(--accent-light)] text-[var(--text-secondary)] text-xs font-medium active:scale-[0.93] transition-transform"
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── ZONE 2: Scroll area — only inputs ── */}
          <div className="flex-1 overflow-y-auto px-5 pb-2 flex flex-col gap-3">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="Ціна закупки, ₴ (необов'язково)"
              value={costStr}
              onChange={e => setCostStr(e.target.value)}
              aria-label="Ціна закупки за одиницю"
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-foreground placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
            />

            <input
              type="text"
              placeholder="Примітка (необов'язково)"
              value={note}
              onChange={e => setNote(e.target.value)}
              aria-label="Примітка до поповнення"
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-foreground placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
            />
          </div>

          {/* ── ZONE 3: Sticky footer — button always visible ── */}
          <div
            className="shrink-0 px-5 pt-3"
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {error && (
              <p className="text-xs text-destructive px-1 mb-2">{error}</p>
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
          </div>

        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
