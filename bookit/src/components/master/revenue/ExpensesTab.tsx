'use client';

// humanized
import { useState } from 'react';
import { Drawer } from 'vaul';
import { Plus, ReceiptText, Trash2, Pencil, TrendingUp } from 'lucide-react';
import { useExpenses } from '@/lib/supabase/hooks/useExpenses';
import { formatPrice } from '@/lib/utils/currency';
import type { ExpenseCategory, MasterExpense } from '@/types/database';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: 'Оренда',
  utilities: 'Комунальні',
  tools: 'Інструменти',
  advertising: 'Реклама',
  education: 'Навчання',
  other: 'Інше',
};

const CATEGORIES: ExpenseCategory[] = ['rent', 'utilities', 'tools', 'advertising', 'education', 'other'];

interface ExpensesTabProps {
  isPro: boolean;
}

interface ExpenseForm {
  category: ExpenseCategory;
  name: string;
  amountStr: string;
  expense_date: string;
  note: string;
}

function emptyForm(): ExpenseForm {
  return {
    category: 'other',
    name: '',
    amountStr: '',
    expense_date: new Date().toISOString().split('T')[0],
    note: '',
  };
}

export function ExpensesTab({ isPro }: ExpensesTabProps) {
  const { expenses, isLoading, createExpense, updateExpense, deleteExpense, isCreating } = useExpenses();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm());

  if (!isPro) {
    return (
      <div className="p-6 rounded-2xl bg-secondary/20 border border-border/5 text-center flex flex-col items-center justify-center min-h-[300px]">
        <TrendingUp className="size-12 text-primary mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Облік витрат доступний в Pro</h3>
        <p className="text-sm text-muted-foreground/60 max-w-sm">
          Підключіть тариф Pro, щоб вести облік оренди, інструментів та реклами.
        </p>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount_kopecks, 0);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }

  function openEdit(expense: MasterExpense) {
    setEditingId(expense.id);
    setForm({
      category: expense.category,
      name: expense.name,
      amountStr: String(expense.amount_kopecks / 100),
      expense_date: expense.expense_date,
      note: expense.note ?? '',
    });
    setDrawerOpen(true);
  }

  async function handleSave() {
    const amount = parseFloat(form.amountStr);
    if (!form.name.trim() || isNaN(amount) || amount <= 0) return;
    const payload = {
      category: form.category,
      name: form.name.trim(),
      amount_kopecks: Math.round(amount * 100),
      expense_date: form.expense_date,
      note: form.note.trim() || null,
    };
    if (editingId) {
      await updateExpense({ id: editingId, payload });
    } else {
      await createExpense(payload);
    }
    setDrawerOpen(false);
  }

  return (
    <>
      <div className="bento-card p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Операційні витрати</h2>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Оренда, інструменти, реклама</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Всього</p>
              <p className="text-lg font-bold text-destructive">-{formatPrice(Math.round(totalExpenses / 100))}</p>
            </div>
            <button
              type="button"
              aria-label="Додати витрату"
              onClick={openCreate}
              className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors active:scale-95"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-secondary/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-10 text-center">
            <ReceiptText className="size-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground/60">Витрат ще немає</p>
            <p className="text-xs text-muted-foreground/40 mt-1">Додайте оренду, інструменти або рекламу</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/10">
            {expenses.map(expense => (
              <div key={expense.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{expense.name}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {CATEGORY_LABELS[expense.category]} · {expense.expense_date}
                  </p>
                </div>
                <p className="text-sm font-bold text-destructive shrink-0">
                  -{formatPrice(Math.round(expense.amount_kopecks / 100))}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    aria-label="Редагувати витрату"
                    onClick={() => openEdit(expense)}
                    className="size-8 rounded-lg bg-secondary/60 text-muted-foreground flex items-center justify-center hover:bg-secondary/80 transition-colors active:scale-95"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label="Видалити витрату"
                    onClick={() => deleteExpense(expense.id)}
                    className="size-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors active:scale-95"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Drawer.Root open={drawerOpen} onOpenChange={v => !v && setDrawerOpen(false)} shouldScaleBackground>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-[28px] shadow-2xl max-h-[90vh] flex flex-col">
            <div className="mx-auto mt-3 mb-2 w-12 h-1.5 rounded-full bg-border/60 shrink-0" />
            <div className="px-5 overflow-y-auto pb-safe">
              <Drawer.Title className="text-base font-bold text-foreground mt-1 mb-4">
                {editingId ? 'Редагувати витрату' : 'Нова витрата'}
              </Drawer.Title>

              <div className="flex flex-col gap-4 mb-5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 block">Категорія</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        aria-pressed={form.category === cat}
                        onClick={() => setForm(f => ({ ...f, category: cat }))}
                        className={`py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-[0.95] cursor-pointer ${
                          form.category === cat
                            ? 'bg-primary text-primary-foreground border-transparent'
                            : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 block">Назва</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Наприклад: Оренда за червень"
                    aria-label="Назва витрати"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 block">Сума (₴)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.amountStr}
                      onChange={e => setForm(f => ({ ...f, amountStr: e.target.value }))}
                      placeholder="0"
                      aria-label="Сума витрати в гривнях"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 block">Дата</label>
                    <input
                      type="date"
                      value={form.expense_date}
                      onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                      aria-label="Дата витрати"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 block">Примітка (необов&apos;язково)</label>
                  <input
                    type="text"
                    value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="Будь-яка деталь..."
                    aria-label="Примітка до витрати"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 pb-6">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 h-12 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary/60 transition-colors active:scale-[0.97]"
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isCreating}
                  className="flex-1 h-12 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors active:scale-[0.97] disabled:opacity-50"
                >
                  {editingId ? 'Зберегти' : 'Додати'}
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
