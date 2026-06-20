// humanized
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { MasterExpense, ExpenseCategory } from '@/types/database';

export interface ExpensePayload {
  category:       ExpenseCategory;
  name:           string;
  amount_kopecks: number;
  expense_date:   string;
  note?:          string | null;
}

async function getMasterOwnerId(): Promise<{ userId: string; masterId: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('master_id')
    .eq('id', user.id)
    .single();
  if (!profile?.master_id) return null;
  return { userId: user.id, masterId: profile.master_id };
}

export async function createExpense(
  payload: ExpensePayload,
): Promise<{ id: string | null; error: string | null }> {
  const owner = await getMasterOwnerId();
  if (!owner) return { id: null, error: 'Не авторизований' };

  try {
    if (!payload.name.trim()) return { id: null, error: 'Назва обов\'язкова' };
    if (payload.amount_kopecks <= 0) return { id: null, error: 'Сума має бути більше 0' };

    const { data, error } = await createAdminClient()
      .from('master_expenses')
      .insert({
        master_id:      owner.masterId,
        category:       payload.category,
        name:           payload.name.trim(),
        amount_kopecks: payload.amount_kopecks,
        expense_date:   payload.expense_date,
        note:           payload.note ?? null,
      })
      .select('id')
      .single();

    if (error) throw error;
    revalidatePath('/dashboard/revenue');
    revalidatePath('/dashboard/analytics');
    return { id: data.id, error: null };
  } catch (err: unknown) {
    console.error('[createExpense]', err);
    return { id: null, error: 'Не вдалося додати витрату' };
  }
}

export async function updateExpense(
  id: string,
  payload: Partial<ExpensePayload>,
): Promise<{ error: string | null }> {
  const owner = await getMasterOwnerId();
  if (!owner) return { error: 'Не авторизований' };

  try {
    const updateData: Record<string, unknown> = {};
    if (payload.category !== undefined)       updateData.category = payload.category;
    if (payload.name !== undefined)           updateData.name = payload.name.trim();
    if (payload.amount_kopecks !== undefined) updateData.amount_kopecks = payload.amount_kopecks;
    if (payload.expense_date !== undefined)   updateData.expense_date = payload.expense_date;
    if (payload.note !== undefined)           updateData.note = payload.note;

    const { error } = await createAdminClient()
      .from('master_expenses')
      .update(updateData)
      .eq('id', id)
      .eq('master_id', owner.masterId);

    if (error) throw error;
    revalidatePath('/dashboard/revenue');
    revalidatePath('/dashboard/analytics');
    return { error: null };
  } catch (err: unknown) {
    console.error('[updateExpense]', err);
    return { error: 'Не вдалося оновити витрату' };
  }
}

export async function deleteExpense(
  id: string,
): Promise<{ error: string | null }> {
  const owner = await getMasterOwnerId();
  if (!owner) return { error: 'Не авторизований' };

  try {
    const { error } = await createAdminClient()
      .from('master_expenses')
      .delete()
      .eq('id', id)
      .eq('master_id', owner.masterId);

    if (error) throw error;
    revalidatePath('/dashboard/revenue');
    revalidatePath('/dashboard/analytics');
    return { error: null };
  } catch (err: unknown) {
    console.error('[deleteExpense]', err);
    return { error: 'Не вдалося видалити витрату' };
  }
}

export async function getExpenses(
  month?: string,
): Promise<MasterExpense[]> {
  const owner = await getMasterOwnerId();
  if (!owner) return [];

  try {
    let query = createAdminClient()
      .from('master_expenses')
      .select('*')
      .eq('master_id', owner.masterId)
      .order('expense_date', { ascending: false });

    if (month) {
      query = query
        .gte('expense_date', `${month}-01`)
        .lte('expense_date', `${month}-31`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as MasterExpense[];
  } catch (err: unknown) {
    console.error('[getExpenses]', err);
    return [];
  }
}
