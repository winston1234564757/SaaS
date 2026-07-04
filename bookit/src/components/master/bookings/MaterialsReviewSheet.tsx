'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package2, Droplets, FlaskConical, Plus, Minus } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { EditorialCover } from '@/components/ui/EditorialCover';
import { Button } from '@/components/ui/Button';
import { useConsumablesForBooking } from '@/lib/supabase/hooks/useConsumablesForBooking';
import { pluralUk } from '@/lib/utils/pluralUk';

const UNIT_LABEL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };
const UNIT_ICON = { pcs: Package2, ml: Droplets, g: FlaskConical } as const;

interface MaterialsReviewSheetProps {
  bookingId: string;
  open: boolean;
  onConfirm: (consumables: { product_id: string; qty_used: number }[]) => void;
  onClose: () => void;
}

/**
 * DS-MODAL-02 — звірка розхідників перед завершенням сеансу. Дизайн-мова: мігровано з голого
 * vaul на kit Sheet; викорінено заборонений `--text-tertiary`; дії на kit Button. Темна
 * обкладинка несе намір («що списуємо»), світле тіло — редагований чек матеріалів.
 */
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

  const count = consumables.length;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()} variant="bottom" srTitle="Розхідники сеансу">
      <div className="flex flex-col gap-5">
        {/* ── HERO: намір списання ── */}
        <EditorialCover>
          <div className="flex items-center gap-1.5 mb-2 text-white/55">
            <FlaskConical size={13} aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Завершення сеансу</span>
          </div>
          <h2 className="heading-serif text-[22px] text-white leading-tight">Розхідники сеансу</h2>
          <p className="text-sm text-white/70 mt-1.5">
            {isLoading
              ? 'Рахуємо матеріали…'
              : count === 0
                ? 'Привʼязаних матеріалів немає'
                : `${count} ${pluralUk(count, 'позиція', 'позиції', 'позицій')} — звірте кількість перед списанням`}
          </p>
        </EditorialCover>

        {/* ── ТІЛО: редагований чек ── */}
        {isLoading ? (
          <div className="flex flex-col gap-2.5 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-secondary/50 border border-border">
                <div className="size-9 rounded-xl bg-border" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 bg-border rounded-full w-2/3" />
                  <div className="h-2 bg-border rounded-full w-1/3" />
                </div>
                <div className="h-8 w-32 bg-border rounded-full" />
              </div>
            ))}
          </div>
        ) : count === 0 ? (
          <div className="py-6 text-center bg-secondary/40 rounded-2xl border border-dashed border-border">
            <p className="text-sm text-foreground font-medium">Немає привʼязаних матеріалів</p>
            <p className="text-xs text-text-sub mt-1">Нічого не буде списано зі складу</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {consumables.map((c, i) => {
                const Icon = UNIT_ICON[c.unit];
                const qty = qtyMap[c.product_id] ?? c.total_qty;
                const changed = qty !== c.total_qty;
                return (
                  <motion.div
                    key={c.product_id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, type: 'spring' as const, stiffness: 340, damping: 26 }}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-secondary/60 border border-border"
                  >
                    <div className="size-9 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-text-sub" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-[11px] text-text-sub mt-0.5">
                        Норма: {c.total_qty} {UNIT_LABEL[c.unit]}{changed && ' · змінено'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => adjust(c.product_id, -1, c.unit)}
                        aria-label={`Зменшити ${c.name}`}
                        className="size-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-text-sub active:scale-[0.88] transition-transform"
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
                      <span className="text-[10px] text-text-sub w-5 shrink-0">{UNIT_LABEL[c.unit]}</span>
                      <button
                        type="button"
                        onClick={() => adjust(c.product_id, 1, c.unit)}
                        aria-label={`Збільшити ${c.name}`}
                        className="size-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-text-sub active:scale-[0.88] transition-transform"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* ── Дії ── */}
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" fullWidth onClick={() => onConfirm([])}>
            Без списання
          </Button>
          <Button variant="primary" size="lg" fullWidth isLoading={isLoading} onClick={handleConfirm}>
            Завершити
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
