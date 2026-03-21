'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import { type Service, INITIAL_SERVICES } from '@/components/master/services/types';
import { safeQuery, safeMutation } from '../safeQuery';

// ─── DB ↔ Component type mapping ──────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToService(row: any): Service {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji ?? '💅',
    category: row.category ?? 'Інше',
    price: Number(row.price),
    duration: row.duration_minutes,
    popular: row.is_popular,
    active: row.is_active,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
  };
}

function serviceToRow(data: Omit<Service, 'id'>, masterId: string) {
  return {
    master_id: masterId,
    name: data.name,
    emoji: data.emoji,
    category: data.category,
    price: data.price,
    duration_minutes: data.duration,
    is_popular: data.popular,
    is_active: data.active,
    description: data.description ?? null,
    image_url: data.imageUrl ?? null,
  };
}

// ─── Hook ─────────────────────────────────────────────────────

export function useServices() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();
  const key = ['services', masterId] as const;

  const query = useQuery<Service[]>({
    queryKey: key,
    queryFn: async () => {
      const supabase = createClient();
      const result = await safeQuery<any[]>(
        'services:list',
        () =>
          supabase
            .from('services')
            .select('*')
            .eq('master_id', masterId!)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })
      );
      if (result.error) {
        const errorWithMeta = Object.assign(new Error(result.message ?? 'Failed to load services'), {
          __safeResult: result,
        });
        throw errorWithMeta;
      }
      return (result.data ?? []).map(rowToService);
    },
    enabled: !!masterId,
    placeholderData: INITIAL_SERVICES,
  });

  const addMutation = useMutation({
    mutationFn: async (data: Omit<Service, 'id'>) => {
      const supabase = createClient();
      const result = await safeMutation(
        'services:add',
        () =>
          supabase
            .from('services')
            .insert(serviceToRow(data, masterId!))
            .select()
            .single()
      );
      if (result.error || !result.data) {
        const errorWithMeta = Object.assign(new Error(result.message ?? 'Failed to add service'), {
          __safeResult: result,
        });
        throw errorWithMeta;
      }
      return rowToService(result.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<Service, 'id'> }) => {
      const supabase = createClient();
      const result = await safeMutation(
        'services:update',
        () =>
          supabase
            .from('services')
            .update(serviceToRow(data, masterId!))
            .eq('id', id)
      );
      if (result.error) {
        const errorWithMeta = Object.assign(new Error(result.message ?? 'Failed to update service'), {
          __safeResult: result,
        });
        throw errorWithMeta;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const result = await safeMutation(
        'services:delete',
        () => supabase.from('services').delete().eq('id', id)
      );
      if (result.error) {
        const errorWithMeta = Object.assign(new Error(result.message ?? 'Failed to delete service'), {
          __safeResult: result,
        });
        throw errorWithMeta;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ordered: { id: string; sort_order: number }[]) => {
      const supabase = createClient();
      const result = await safeMutation(
        'services:reorder',
        async () => {
          for (const { id, sort_order } of ordered) {
            const { error } = await supabase.from('services').update({ sort_order }).eq('id', id);
            if (error) throw error;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { success: true } as any;
        }
      );
      if (result.error) {
        const errorWithMeta = Object.assign(new Error(result.message ?? 'Failed to reorder services'), {
          __safeResult: result,
        });
        throw errorWithMeta;
      }
    },
    onMutate: async (ordered) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Service[]>(key);
      const orderMap = new Map(ordered.map(o => [o.id, o.sort_order]));
      qc.setQueryData<Service[]>(key, old =>
        old ? [...old].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)) : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const supabase = createClient();
      const result = await safeMutation(
        'services:toggle',
        () =>
          supabase
            .from('services')
            .update({ is_active: !active })
            .eq('id', id)
      );
      if (result.error) {
        const errorWithMeta = Object.assign(new Error(result.message ?? 'Failed to toggle service'), {
          __safeResult: result,
        });
        throw errorWithMeta;
      }
    },
    onMutate: async ({ id, active }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Service[]>(key);
      qc.setQueryData<Service[]>(key, old =>
        old?.map(s => (s.id === id ? { ...s, active: !active } : s))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    services: query.data ?? INITIAL_SERVICES,
    isLoading: query.isLoading && !query.isPlaceholderData,
    error: query.error,
    addService: (data: Omit<Service, 'id'>) => addMutation.mutate(data),
    editService: (id: string, data: Omit<Service, 'id'>) => updateMutation.mutate({ id, data }),
    deleteService: (id: string) => deleteMutation.mutate(id),
    toggleService: (id: string, active: boolean) => toggleMutation.mutate({ id, active }),
    reorderServices: (services: Service[]) =>
      reorderMutation.mutate(services.map((s, i) => ({ id: s.id, sort_order: i }))),
  };
}
