'use client';

// humanized
import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'framer-motion';
import { Package2, Droplets, FlaskConical, Plus, Minus, Loader2 } from 'lucide-react';
import { useConsumablesForBooking } from '@/lib/supabase/hooks/useConsumablesForBooking';

const UNIT_LABEL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };
const UNIT_ICON = { pcs: Package2, ml: Droplets, g: FlaskConical } as const;

interface MaterialsReviewSheetProps {
  bookingId: string;
  open: boolean;
  onConfirm: (consumables: { product_id: string; qty_used: number }[]) => void;
  onClose: () => void;
}

export function MaterialsReviewSheet({ bookingId, open, onConfirm, onClose }: MaterialsReviewSheetProps) {
  const { data: consumables = [], isLoading } = useConsumablesForBooking(open ? bookingId : null);
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (consumables.length > 0) {
      const init: Record<string, number> = {};
      consumables.forEach(c => { init[c.product_id] = c.total_qty; });
      setQtyMap(init);
    }
  }, [consumables]);

  function adjust(productId: string, delta: number, unit: 'pcs' | 'ml' | 'g') {
    const step = unit === 'pcs' ? 1 : 5;
    setQtyMap(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] ?? 0) + delta * step),
    }));
  }

  function handleConfirm() {
    const reviewed = consumables.map(c => ({
      product_id: c.product_id,
      qty_used: qtyMap[c.product_id] ?? c.total_qty,
    }));
    onConfirm(reviewed);
  }

  return (
    <Drawer.Root open={open} onOpenChange={v => !v && onClose()} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-[var(--background)] rounded-t-[28px] shadow-2xl max-h-[85vh]">
          <div className="mx-auto mt-3 mb-1 w-12 h-1.5 rounded-full bg-[var(--border-strong)] shrink-0" />

          <div
            className="px-5 overflow-y-auto flex flex-col gap-4 pt-3"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div>
              <Drawer.Title className="text-base font-bold text-foreground">
                Розхідники сеансу
              </Drawer.Title>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                Скоригуйте кількість, якщо витрачено менше чи більше
              </p>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-2.5 animate-pulse">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                    <div className="size-9 rounded-xl bg-[var(--border)]" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-3 bg-[var(--border)] rounded-full w-2/3" />
                      <div className="h-2 bg-[var(--border)] rounded-full w-1/3" />
                    </div>
                    <div className="h-8 w-32 bg-[var(--border)] rounded-full" />
                  </div>
                ))}
              </div>
            ) : consumables.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-[var(--text-secondary)]">Немає прив&apos;язаних матеріалів</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Матеріали не будуть списані</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                <div className="flex flex-col gap-2.5">
                  {consumables.map((c, i) => {
                    const Icon = UNIT_ICON[c.unit];
                    const qty = qtyMap[c.product_id] ?? c.total_qty;
                    return (
                      <motion.div
                        key={c.product_id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, type: 'spring' as const, stiffness: 340, damping: 26 }}
                        className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"
                      >
                        <div className="size-9 rounded-xl bg-[var(--accent-light)] flex items-center justify-center shrink-0">
                          <Icon size={15} className="text-[var(--text-secondary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">
                            Норма: {c.total_qty} {UNIT_LABEL[c.unit]}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => adjust(c.product_id, -1, c.unit)}
                            aria-label={`Зменшити ${c.name}`}
                            className="size-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-secondary)] active:scale-[0.88] transition-transform"
                          >
                            <Minus size={13} />
                          </button>
                          <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step={c.unit === 'pcs' ? 1 : 0.5}
                            value={qty}
                            onChange={e => setQtyMap(prev => ({
                              ...prev,
                              [c.product_id]: Math.max(0, Number(e.target.value) || 0),
                            }))}
                            aria-label={`Кількість ${c.name}`}
                            className="w-14 text-center text-sm font-bold text-foreground bg-transparent border-b-2 border-[var(--border-strong)] focus:border-[var(--accent)] outline-none tabular-nums transition-colors py-0.5"
                          />
                          <span className="text-[10px] text-[var(--text-tertiary)] w-5 shrink-0">{UNIT_LABEL[c.unit]}</span>
                          <button
                            type="button"
                            onClick={() => adjust(c.product_id, 1, c.unit)}
                            aria-label={`Збільшити ${c.name}`}
                            className="size-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-secondary)] active:scale-[0.88] transition-transform"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            )}

            <div className="flex gap-3 mt-1">
              {/* Calls onConfirm([]) — booking is completed but no deduction */}
              <button
                type="button"
                onClick={() => onConfirm([])}
                className="flex-1 h-12 rounded-full border border-[var(--border-strong)] text-sm font-semibold text-[var(--text-secondary)] active:scale-[0.97] transition-transform"
              >
                Без списання
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 h-12 rounded-full bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold disabled:opacity-50 active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 size={15} className="animate-spin" />}
                Завершити
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
