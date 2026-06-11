'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import { type Service } from '@/components/master/services/types';
import type { ServiceIconName } from '@/lib/service-icons';
import { safeQuery, safeMutation } from '../safeQuery';

interface ServiceRow {
  id: string;
  name: string;
  icon_name: string;
  category: string | null;
  price: number;
  duration_minutes: number;
  is_popular: boolean;
  is_active: boolean;
  is_archived: boolean;
  description: string | null;
  image_url: string | null;
}

function rowToService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    icon_name: (row.icon_name as ServiceIconName) ?? 'sparkles',
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
    icon_name: data.icon_name,
    category: data.category,
    price: data.price,
    duration_minutes: data.duration,
    is_popular: data.popular,
    is_active: data.active,
    description: data.description ?? null,
    image_url: data.imageUrl ?? null,
  };
}

export function useServices() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();
  const key = ['services', masterId] as const;

  const query = useQuery<Service[]>({
    queryKey: key,
    queryFn: async () => {
      const supabase = createClient();

      const result = await safeQuery<ServiceRow[]>(
        'services:list',
        () =>
          supabase
            .from('services')
            .select('id, name, icon_name, category, price, duration_minutes, is_popular, is_active, sort_order, description, image_url')
            .eq('master_id', masterId!)
            .eq('is_archived', false)
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
    staleTime: 60_000,
  });

  const addMutation = useMutation({
    mutationFn: async (data: Omit<Service, 'id'>) => {
      const supabase = createClient();

      const result = await safeMutation<ServiceRow>(
        'services:add',
        () =>
          supabase
            .from('services')
            .insert(serviceToRow(data, masterId!))
            .select('id, name, icon_name, category, price, duration_minutes, is_popular, is_active, is_archived, description, image_url')
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
            .eq('master_id', masterId!)
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

  const deleteMutation = useMutation<void, Error, string, { prev: Service[] | undefined }>({
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Service[]>(key);
      qc.setQueryData<Service[]>(key, old =>
        (old ?? []).filter(s => s.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    mutationFn: async (id: string) => {
      const supabase = createClient();

      const result = await safeMutation(
        'services:delete',
        () => supabase.from('services').update({ is_archived: true, is_active: false }).eq('id', id)
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

  async function toggleService(id: string, active: boolean) {
    const supabase = createClient();
    const result = await safeMutation(
      'services:toggle',
      () =>
        supabase
          .from('services')
          .update({ is_active: !active })
          .eq('id', id)
          .eq('master_id', masterId!)
    );
    if (result.error) {
      const errorWithMeta = Object.assign(new Error(result.message ?? 'Failed to toggle service'), {
        __safeResult: result,
      });
      throw errorWithMeta;
    }
    await qc.invalidateQueries({ queryKey: key });
  }

  async function reorderServices(services: Service[]) {
    const supabase = createClient();
    const results = await Promise.all(
      services.map((service, index) =>
        supabase
          .from('services')
          .update({ sort_order: index + 1 })
          .eq('id', service.id)
          .eq('master_id', masterId!)
      )
    );
    const failed = results.find(r => r.error);
    if (failed?.error) {
      throw Object.assign(new Error(failed.error.message ?? 'Failed to reorder services'), {
        __safeResult: { error: failed.error },
      });
    }
    await qc.invalidateQueries({ queryKey: key });
  }

  return {
    services: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    addService: addMutation.mutateAsync,
    editService: (id: string, data: Omit<Service, 'id'>) => updateMutation.mutateAsync({ id, data }),
    deleteService: deleteMutation.mutateAsync,
    toggleService,
    reorderServices,
    refetch: query.refetch,
  };
}
