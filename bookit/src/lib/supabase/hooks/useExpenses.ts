'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import type { MasterExpense } from '@/types/database';
import {
  createExpense as createExpenseAction,
  updateExpense as updateExpenseAction,
  deleteExpense as deleteExpenseAction,
  type ExpensePayload,
} from '@/app/(master)/dashboard/revenue/expenses.actions';

export type { ExpensePayload };

const KEY = (masterId: string | undefined, month?: string) =>
  ['expenses', masterId, month ?? 'all'] as const;

export function useExpenses(month?: string) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();
  const key = KEY(masterId, month);

  const query = useQuery<MasterExpense[]>({
    queryKey: key,
    queryFn: async () => {
      let q = createClient()
        .from('master_expenses')
        .select('id, master_id, category, name, amount_kopecks, expense_date, note, created_at')
        .eq('master_id', masterId!)
        .order('expense_date', { ascending: false })
        .limit(500);

      if (month) {
        q = q
          .gte('expense_date', `${month}-01`)
          .lte('expense_date', `${month}-31`);
      }

      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as MasterExpense[];
    },
    enabled: !!masterId,
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['expenses', masterId] });

  const createMutation = useMutation({
    mutationFn: (payload: ExpensePayload) => createExpenseAction(payload),
    onSuccess: (result) => { if (!result.error) invalidate(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ExpensePayload> }) =>
      updateExpenseAction(id, payload),
    onSuccess: (result) => { if (!result.error) invalidate(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpenseAction(id),
    onSuccess: (result) => { if (!result.error) invalidate(); },
  });

  return {
    expenses:      query.data ?? [],
    isLoading:     query.isPending,
    createExpense: createMutation.mutateAsync,
    updateExpense: updateMutation.mutateAsync,
    deleteExpense: deleteMutation.mutateAsync,
    isCreating:    createMutation.isPending,
    isDeleting:    deleteMutation.isPending,
  };
}
