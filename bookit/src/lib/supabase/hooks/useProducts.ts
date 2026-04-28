'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import type { Product, ProductCategory } from '@/types/database';

export type { Product };

// ── Query key factory ─────────────────────────────────────────────────────────
const KEY = (masterId: string | undefined) => ['products', masterId] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Read hook
// ─────────────────────────────────────────────────────────────────────────────

export function useProducts() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();
  const key = KEY(masterId);

  const query = useQuery<Product[]>({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('products')
        .select('id, master_id, name, description, category, price_kopecks, photos, stock_qty, is_active, recommend_always, sort_order, created_at, updated_at, product_service_links(service_id)')
        .eq('master_id', masterId!)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []) as Product[];
    },
    enabled: !!masterId,
    staleTime: 30_000,
  });

  // Optimistic toggle active
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await createClient()
        .from('products')
        .update({ is_active: !is_active })
        .eq('id', id)
        .eq('master_id', masterId!);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ id, is_active }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Product[]>(key);
      qc.setQueryData<Product[]>(key, old =>
        old?.map(p => p.id === id ? { ...p, is_active: !is_active } : p)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    products:      query.data ?? [],
    isLoading:     query.isPending,
    error:         query.error,
    refetch:       () => qc.invalidateQueries({ queryKey: key }),
    toggleActive:  (id: string, is_active: boolean) => toggleMutation.mutate({ id, is_active }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public shop hook (client-side, no auth)
// ─────────────────────────────────────────────────────────────────────────────

export function usePublicProducts(masterId: string | undefined, category?: ProductCategory) {
  return useQuery<Product[]>({
    queryKey: ['public-products', masterId, category],
    queryFn: async () => {
      let q = createClient()
        .from('products')
        .select('id, master_id, name, description, category, price_kopecks, photos, stock_qty, is_active, recommend_always, sort_order, created_at, updated_at, product_service_links(service_id)')
        .eq('master_id', masterId!)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (category) q = q.eq('category', category);

      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as Product[];
    },
    enabled: !!masterId,
    staleTime: 60_000,
  });
}
