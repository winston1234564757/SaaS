'use client';

import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
}

export function useVacation() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();
  const key = ['vacation', masterId] as const;

  const { data: blockedDates = [], isLoading } = useQuery<BlockedDate[]>({
    queryKey: key,
    enabled: !!masterId,
    queryFn: async () => {
      const supabase = createClient();
      const n = new Date();
      const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
      const { data, error } = await supabase
        .from('schedule_exceptions')
        .select('id, date, reason')
        .eq('master_id', masterId!)
        .eq('is_day_off', true)
        .gte('date', today)
        .order('date', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id as string,
        date: r.date as string,
        reason: (r.reason as string) || null,
      }));
    },
    staleTime: 60_000,
  });

  const addMutation = useMutation<void, Error, { date: string; reason?: string }, { prev: BlockedDate[] | undefined }>({
    onMutate: async (_input) => {
      // Скасовуємо активні запити, щоб уникнути перезапису оптимістичного стану
      await qc.cancelQueries({ queryKey: key });
      // Зберігаємо попередній стан для rollback (id невідомий до відповіді сервера)
      const prev = qc.getQueryData<BlockedDate[]>(key);
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      // Відновлюємо попередній стан при помилці
      if (ctx?.prev !== undefined) qc.setQueryData<BlockedDate[]>(key, ctx.prev);
    },
    mutationFn: async ({ date, reason }) => {
      const supabase = createClient();
      await supabase.from('schedule_exceptions').upsert({
        master_id: masterId!,
        date,
        is_day_off: true,
        reason: reason || null,
      }, { onConflict: 'master_id,date' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const removeMutation = useMutation<void, Error, string, { prev: BlockedDate[] | undefined }>({
    onMutate: async (id) => {
      // Скасовуємо активні запити, щоб уникнути перезапису оптимістичного стану
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BlockedDate[]>(key);
      // Оптимістично видаляємо запис з кешу
      qc.setQueryData<BlockedDate[]>(key, old =>
        (old ?? []).filter(b => b.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      // Відновлюємо попередній стан при помилці
      if (ctx?.prev !== undefined) qc.setQueryData<BlockedDate[]>(key, ctx.prev);
    },
    mutationFn: async (id) => {
      const supabase = createClient();
      await supabase.from('schedule_exceptions').delete().eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    blockedDates,
    isLoading: isLoading && !!masterId,
    addBlockedDate: (date: string, reason?: string) => addMutation.mutate({ date, reason }),
    removeBlockedDate: (id: string) => removeMutation.mutate(id),
    isAdding: addMutation.isPending,
  };
}
