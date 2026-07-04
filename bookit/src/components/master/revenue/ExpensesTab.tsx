'use client';

// humanized
import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';
import {
  Plus,
  Building2,
  Megaphone,
  Package,
  GraduationCap,
  Wrench,
  MoreHorizontal,
  Trash2,
  Loader2,
  ReceiptText,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useExpenses, type ExpensePayload } from '@/lib/supabase/hooks/useExpenses';
import { useToast } from '@/lib/toast/context';
import type { ExpenseCategory, MasterExpense } from '@/types/database';

const CATEGORIES: { value: ExpenseCategory; label: string; Icon: React.ElementType }[] = [
  { value: 'rent',        label: 'Оренда',      Icon: Building2      },
  { value: 'advertising', label: 'Реклама',      Icon: Megaphone      },
  { value: 'tools',       label: 'Інструменти',  Icon: Wrench         },
  { value: 'education',   label: 'Навчання',     Icon: GraduationCap  },
  { value: 'utilities',   label: 'Комунальні',   Icon: Package        },
  { value: 'other',       label: 'Інше',         Icon: MoreHorizontal },
];

function getCategoryMeta(value: ExpenseCategory) {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[5];
}

function formatAmount(kopecks: number) {
  return `${(kopecks / 100).toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

function getMonthTotal(expenses: MasterExpense[]) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return expenses
    .filter(e => e.expense_date.startsWith(month))
    .reduce((sum, e) => sum + e.amount_kopecks, 0);
}

const FILTER_OPTIONS: { label: string; value: ExpenseCategory | 'all' }[] = [
  { label: 'Всі',          value: 'all'        },
  { label: 'Оренда',       value: 'rent'       },
  { label: 'Реклама',      value: 'advertising'},
  { label: 'Інструменти',  value: 'tools'      },
  { label: 'Навчання',     value: 'education'  },
  { label: 'Комунальні',   value: 'utilities'  },
  { label: 'Інше',         value: 'other'      },
];

export function ExpensesTab() {
  const { showToast } = useToast();
  const { expenses, isLoading, createExpense, deleteExpense, isCreating } = useExpenses();
  const [addOpen, setAddOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ExpenseCategory | 'all'>('all');
  const [, startDeleteTransition] = useTransition();

  // Form state
  const [category, setCategory] = useState<ExpenseCategory>('rent');
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  function resetForm() {
    setCategory('rent');
    setName('');
    setAmountStr('');
    setDateStr(new Date().toISOString().split('T')[0]);
    setNote('');
    setFormError(null);
  }

  async function handleCreate() {
    setFormError(null);
    if (!name.trim()) { setFormError('Вкажіть назву витрати'); return; }
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) { setFormError('Введіть суму більше 0'); return; }

    const payload: ExpensePayload = {
      category,
      name: name.trim(),
      amount_kopecks: Math.round(amount * 100),
      expense_date: dateStr,
      note: note.trim() || null,
    };

    try {
      await createExpense(payload);
      showToast({ type: 'success', title: 'Витрату додано', duration: 2000 });
      setAddOpen(false);
      resetForm();
    } catch {
      setFormError('Не вдалося зберегти витрату');
    }
  }

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      try {
        await deleteExpense(id);
        showToast({ type: 'success', title: 'Витрату видалено', duration: 1500 });
      } catch {
        showToast({ type: 'error', title: 'Не вдалося видалити' });
      }
    });
  }

  const filtered = activeFilter === 'all'
    ? expenses
    : expenses.filter(e => e.category === activeFilter);

  const monthTotal = getMonthTotal(expenses);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">Операційні витрати</h2>
          {monthTotal > 0 && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Цього місяця: <span className="font-bold text-foreground">{formatAmount(monthTotal)}</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 h-11 rounded-full bg-[var(--accent)] text-[var(--accent-on)] text-xs font-semibold active:scale-[0.95] transition-transform"
        >
          <Plus size={14} />
          Додати витрату
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f.value}
            type="button"
            aria-pressed={activeFilter === f.value}
            onClick={() => setActiveFilter(f.value)}
            className={cn(
              'shrink-0 px-4 py-2.5 rounded-full text-xs font-medium transition-all active:scale-[0.95]',
              activeFilter === f.value
                ? 'bg-[var(--accent)] text-[var(--accent-on)]'
                : 'border border-[var(--border-strong)] text-[var(--text-secondary)]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="bento-card p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[var(--border)]" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3 bg-[var(--border)] rounded-full w-1/2" />
                <div className="h-2.5 bg-[var(--border)] rounded-full w-1/4" />
              </div>
              <div className="h-4 bg-[var(--border)] rounded-full w-16" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bento-card p-10 flex flex-col items-center gap-3 text-center">
          <div className="size-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
            <ReceiptText size={22} className="text-[var(--text-secondary)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Витрат ще немає</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Додайте оренду, рекламу чи інші витрати</p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.map((expense, i) => {
            const meta = getCategoryMeta(expense.category);
            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.04, 0.16), type: 'spring' as const, stiffness: 340, damping: 26 }}
                className="bento-card p-4 flex items-center gap-3"
              >
                <div className="size-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center shrink-0">
                  <meta.Icon size={17} className="text-[var(--text-secondary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{expense.name}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {meta.label} · {formatDate(expense.expense_date)}
                  </p>
                </div>
                <p className="text-sm font-bold text-foreground shrink-0 tabular-nums">
                  {formatAmount(expense.amount_kopecks)}
                </p>
                <button
                  type="button"
                  aria-label={`Видалити ${expense.name}`}
                  onClick={() => handleDelete(expense.id)}
                  className="size-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-destructive hover:border-destructive/30 transition-colors active:scale-[0.88] shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {/* Add expense drawer */}
      <Drawer.Root
        open={addOpen}
        onOpenChange={(v: boolean) => { setAddOpen(v); if (!v) resetForm(); }}
        shouldScaleBackground
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--background)] rounded-t-[28px] shadow-2xl max-h-[90vh] flex flex-col">
            <div className="mx-auto mt-3 mb-1 w-12 h-1.5 rounded-full bg-[var(--border-strong)] shrink-0" />
            <div className="overflow-y-auto flex-1 px-5 pt-2 pb-6 flex flex-col gap-4" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
              <Drawer.Title className="text-base font-bold text-foreground">Нова витрата</Drawer.Title>

              {/* Category grid */}
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    aria-pressed={category === cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all active:scale-[0.95] text-center',
                      category === cat.value
                        ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                        : 'border-[var(--border)] bg-[var(--surface)]'
                    )}
                  >
                    <cat.Icon size={18} className={category === cat.value ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'} />
                    <span className="text-[10px] font-semibold leading-tight text-foreground">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1.5 block">Назва</label>
                <input
                  type="text"
                  placeholder="Наприклад: Оренда офісу"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  aria-label="Назва витрати"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-foreground placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
                />
              </div>

              {/* Amount + Date */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1.5 block">Сума (₴)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    min="0"
                    value={amountStr}
                    onChange={e => setAmountStr(e.target.value)}
                    aria-label="Сума витрати"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm font-bold text-foreground placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1.5 block">Дата</label>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={e => setDateStr(e.target.value)}
                    aria-label="Дата витрати"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-foreground outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1.5 block">Примітка (необов&apos;язково)</label>
                <textarea
                  placeholder="Деталі витрати..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  aria-label="Примітка"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-foreground placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all resize-none"
                />
              </div>

              {formError && (
                <p className="text-xs text-destructive px-1">{formError}</p>
              )}

              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full h-12 rounded-full bg-[var(--accent)] text-[var(--accent-on)] font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.97] transition-transform"
              >
                {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {isCreating ? 'Зберігаємо...' : 'Зберегти'}
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
