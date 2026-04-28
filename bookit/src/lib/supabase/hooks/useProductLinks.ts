'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';

export interface ProductLink {
  serviceId: string;
}

const KEY = (productId: string | null) => ['product-links', productId] as const;

export function useProductLinks(productId: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: KEY(productId),
    queryFn: async (): Promise<ProductLink[]> => {
      const { data, error } = await createClient()
        .from('product_service_links')
        .select('service_id')
        .eq('product_id', productId!);
      if (error) throw error;
      return (data as { service_id: string }[]).map(r => ({ serviceId: r.service_id }));
    },
    enabled: !!productId,
    staleTime: 60_000,
  });

  return {
    links:     query.data ?? [],
    isLoading: query.isPending,
    invalidate: () => qc.invalidateQueries({ queryKey: KEY(productId) }),
  };
}

// Full-replace links for a product (used by ProductFormDrawer after save)
export async function setProductLinks(productId: string, serviceIds: string[]): Promise<void> {
  const supabase = createClient();

  const { error: delErr } = await supabase
    .from('product_service_links')
    .delete()
    .eq('product_id', productId);
  if (delErr) throw delErr;

  if (serviceIds.length > 0) {
    const { error: insErr } = await supabase
      .from('product_service_links')
      .insert(serviceIds.map(sid => ({ product_id: productId, service_id: sid })));
    if (insErr) throw insErr;
  }
}

// Returns product IDs that should be auto-suggested given selected service IDs
export async function getAutoSuggestProductIds(serviceIds: string[]): Promise<string[]> {
  if (serviceIds.length === 0) return [];
  const { data, error } = await createClient()
    .from('product_service_links')
    .select('product_id')
    .in('service_id', serviceIds);
  if (error) return [];
  return [...new Set((data as { product_id: string }[]).map(r => r.product_id))];
}
