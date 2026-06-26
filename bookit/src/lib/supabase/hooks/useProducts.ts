'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import { reorderProducts as reorderProductsAction } from '@/app/(master)/dashboard/products/actions';
import type { Product, ProductCategory } from '@/types/database';

export type { Product };

// ── Query key factory ─────────────────────────────────────────────────────────
const KEY = (masterId: string | undefined) => ['products', masterId] as const;

const PRODUCT_SELECT =
  'id, master_id, icon_name, name, description, category, product_type, unit, ' +
  'price_kopecks, cost_kopecks, photos, stock_qty, stock_alert_threshold, ' +
  'purchase_unit, purchase_qty, purchase_price_kopecks, ' +
  'is_active, is_archived, recommend_always, auto_deduct, sort_order, ' +
  'created_at, updated_at, product_service_links(service_id, quantity)';

// Public (anon) projection: ONLY columns anon is granted SELECT on. Excludes
// cost_kopecks / purchase_* / stock_alert_threshold / auto_deduct — those are
// revoked from anon at the DB level so a master's margin never leaks to the shop.
const PUBLIC_PRODUCT_SELECT =
  'id, master_id, icon_name, name, description, category, product_type, unit, ' +
  'price_kopecks, photos, stock_qty, is_active, is_archived, recommend_always, ' +
  'sort_order, created_at, updated_at, product_service_links(service_id, quantity)';

// ─────────────────────────────────────────────────────────────────────────────
// Read hook (master dashboard)
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
        .select(PRODUCT_SELECT)
        .eq('master_id', masterId!)
        .eq('is_archived', false)
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

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const result = await reorderProductsAction(orderedIds);
      if (result.error) throw new Error(result.error);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    products:        query.data ?? [],
    isLoading:       query.isPending,
    error:           query.error,
    refetch:         () => qc.invalidateQueries({ queryKey: key }),
    toggleActive:    (id: string, is_active: boolean) => toggleMutation.mutate({ id, is_active }),
    reorderProducts: reorderMutation.mutateAsync,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public shop hook (client-side, no auth required)
// ─────────────────────────────────────────────────────────────────────────────

export function usePublicProducts(masterId: string | undefined, category?: ProductCategory) {
  return useQuery<Product[]>({
    queryKey: ['public-products', masterId, category],
    queryFn: async () => {
      let q = createClient()
        .from('products')
        .select(PUBLIC_PRODUCT_SELECT)
        .eq('master_id', masterId!)
        .eq('is_active', true)
        .eq('is_archived', false)
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
