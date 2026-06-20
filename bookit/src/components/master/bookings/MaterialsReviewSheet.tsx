'use client';

// humanized
import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { Package2, Droplets, FlaskConical } from 'lucide-react';
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
  const [qtyMap, setQtyMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (consumables.length > 0) {
      const init: Record<string, string> = {};
      consumables.forEach(c => { init[c.product_id] = String(c.total_qty); });
      setQtyMap(init);
    }
  }, [consumables]);

  function handleConfirm() {
    const reviewed = consumables.map(c => ({
      product_id: c.product_id,
      qty_used: Number(qtyMap[c.product_id] ?? c.total_qty),
    }));
    onConfirm(reviewed);
  }

  return (
    <Drawer.Root open={open} onOpenChange={v => !v && onClose()} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-surface rounded-t-[28px] shadow-2xl max-h-[80vh]">
          <div className="mx-auto mt-3 mb-2 w-12 h-1.5 rounded-full bg-border/60 shrink-0" />

          <div className="px-5 overflow-y-auto pb-safe">
            <Drawer.Title className="text-base font-bold text-foreground mt-1 mb-0.5">
              Розхідники сеансу
            </Drawer.Title>
            <p className="text-xs text-muted-foreground/70 mb-4">
              Скоригуйте фактичну витрату матеріалів
            </p>

            {isLoading ? (
              <div className="h-24 bg-secondary/30 rounded-2xl animate-pulse mb-4" />
            ) : consumables.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 text-center py-8 mb-4">
                Немає прив&apos;язаних матеріалів
              </p>
            ) : (
              <div className="flex flex-col gap-3 mb-5">
                {consumables.map(c => {
                  const Icon = UNIT_ICON[c.unit];
                  return (
                    <div key={c.product_id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40">
                      <Icon size={16} className="text-muted-foreground/60 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground/50">Норма: {c.total_qty} {UNIT_LABEL[c.unit]}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min={0}
                          step={c.unit === 'pcs' ? 1 : 0.1}
                          value={qtyMap[c.product_id] ?? String(c.total_qty)}
                          onChange={e => setQtyMap(prev => ({ ...prev, [c.product_id]: e.target.value }))}
                          aria-label={`Фактична витрата ${c.name}`}
                          className="w-20 px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-right font-semibold outline-none focus:border-primary"
                        />
                        <span className="text-xs text-muted-foreground/60 w-5 shrink-0">{UNIT_LABEL[c.unit]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 pb-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary/60 transition-colors active:scale-[0.97]"
              >
                Пропустити
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 h-12 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors active:scale-[0.97]"
              >
                Завершити запис
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
