'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      await supabase.auth.getSession();
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('schedule_exceptions')
        .select('id, date, reason')
        .eq('master_id', masterId!)
        .eq('is_day_off', true)
        .gte('date', today)
        .order('date', { ascending: true });
      return (data ?? []).map((r: any) => ({
        id: r.id as string,
        date: r.date as string,
        reason: (r.reason as string) || null,
      }));
    },
    staleTime: 60_000,
  });

  const addMutation = useMutation({
    mutationFn: async ({ date, reason }: { date: string; reason?: string }) => {
      const supabase = createClient();
      await supabase.auth.getSession();
      await supabase.from('schedule_exceptions').upsert({
        master_id: masterId!,
        date,
        is_day_off: true,
        reason: reason || null,
      }, { onConflict: 'master_id,date' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      await supabase.auth.getSession();
      await supabase.from('schedule_exceptions').delete().eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    blockedDates,
    isLoading,
    addBlockedDate: (date: string, reason?: string) => addMutation.mutate({ date, reason }),
    removeBlockedDate: (id: string) => removeMutation.mutate(id),
    isAdding: addMutation.isPending,
  };
}
