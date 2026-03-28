'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import { addTimeOff, removeTimeOff, type AddTimeOffPayload, type TimeOffType } from '@/app/(master)/dashboard/settings/actions';

export interface TimeOffEntry {
  id: string;
  type: TimeOffType;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
}

export function useTimeOff() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();
  const key = ['time-off', masterId] as const;

  const { data: entries = [], isLoading } = useQuery<TimeOffEntry[]>({
    queryKey: key,
    enabled: !!masterId,
    queryFn: async () => {
      const supabase = createClient();
      const n = new Date();
      const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
      const { data, error } = await supabase
        .from('master_time_off')
        .select('id, type, start_date, end_date, start_time, end_time')
        .eq('master_id', masterId!)
        .gte('end_date', today)
        .order('start_date', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        type: r.type as TimeOffType,
        startDate: r.start_date as string,
        endDate:   r.end_date   as string,
        startTime: r.start_time ? (r.start_time as string).slice(0, 5) : null,
        endTime:   r.end_time   ? (r.end_time   as string).slice(0, 5) : null,
      }));
    },
    staleTime: 60_000,
  });

  const addMutation = useMutation({
    mutationFn: async (payload: AddTimeOffPayload) => {
      const result = await addTimeOff(payload);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['wizard-schedule'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await removeTimeOff(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['wizard-schedule'] });
    },
  });

  return {
    entries,
    isLoading: isLoading && !!masterId,
    add:    (payload: AddTimeOffPayload) => addMutation.mutate(payload),
    remove: (id: string)                 => removeMutation.mutate(id),
    isAdding:   addMutation.isPending,
    addError:   addMutation.error?.message ?? null,
    removeError: removeMutation.error?.message ?? null,
  };
}
