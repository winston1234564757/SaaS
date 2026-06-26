'use client';

// humanized
import { X, ArrowUp, ArrowDown, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { useProductTransactions } from '@/lib/supabase/hooks/useProductTransactions';
import type { Product, ProductTransaction } from '@/types/database';

const UNIT_LABEL: Record<'pcs' | 'ml' | 'g', string> = { pcs: 'шт', ml: 'мл', g: 'г' };

const TX_LABEL: Record<string, string> = {
  restock:    'Поповнення',
  sale:       'Продаж',
  adjustment: 'Коригування',
  return:     'Повернення',
  deduction:  'Списано на послугу',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function groupByMonth(transactions: ProductTransaction[]) {
  const groups = new Map<string, ProductTransaction[]>();
  for (const tx of transactions) {
    const key = new Date(tx.created_at).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }
  return groups;
}

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export function TransactionHistoryDrawer({ product, open, onClose }: Props) {
  const unit = (product.unit ?? 'pcs') as 'pcs' | 'ml' | 'g';
  const { data: transactions = [], isLoading } = useProductTransactions(open ? product.id : null);
  const grouped = groupByMonth(transactions);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--background)] rounded-t-3xl max-w-lg mx-auto border-t border-[var(--border)] flex flex-col"
            style={{ maxHeight: '75dvh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring' as const, stiffness: 340, damping: 26 }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-[var(--border-strong)] rounded-full mx-auto mt-4 mb-1 shrink-0" />

            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 shrink-0 border-b border-[var(--border)]">
              <div>
                <h2 className="text-base font-bold text-foreground">Журнал запасів</h2>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {product.name} · зараз: {product.stock_qty} {UNIT_LABEL[unit]}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрити"
                className="size-11 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] active:scale-[0.88] transition-transform mt-0.5"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 py-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
              {isLoading ? (
                <div className="flex flex-col gap-3 animate-pulse">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <div className="size-8 rounded-full bg-[var(--border)]" />
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="h-3 bg-[var(--border)] rounded-full w-2/3" />
                        <div className="h-2.5 bg-[var(--border)] rounded-full w-1/3" />
                      </div>
                      <div className="h-3 bg-[var(--border)] rounded-full w-12" />
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="size-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
                    <History size={22} className="text-[var(--text-tertiary)]" />
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">Транзакцій ще немає</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Поповнення та списання будуть відображатись тут</p>
                </div>
              ) : (
                Array.from(grouped.entries()).map(([month, txs]) => (
                  <div key={month} className="mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 sticky top-0 bg-[var(--background)] py-1">
                      {month}
                    </p>
                    {txs.map(tx => {
                      const isIn = tx.type === 'restock' || tx.type === 'return';
                      const delta = Math.abs(tx.qty_delta);
                      return (
                        <div key={tx.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
                          <div className={cn(
                            'size-8 rounded-full flex items-center justify-center shrink-0',
                            isIn ? 'bg-emerald-500/10' : 'bg-[var(--accent-light)]'
                          )}>
                            {isIn
                              ? <ArrowUp size={14} className="text-emerald-600" />
                              : <ArrowDown size={14} className="text-[var(--text-secondary)]" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {tx.note ?? TX_LABEL[tx.type] ?? tx.type}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)]">{formatDate(tx.created_at)}</p>
                          </div>
                          <span className={cn(
                            'text-sm font-bold tabular-nums shrink-0',
                            isIn ? 'text-emerald-600' : 'text-[var(--text-primary)]'
                          )}>
                            {isIn ? '+' : '−'}{delta} {UNIT_LABEL[unit]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
