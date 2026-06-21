'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';
import type { ProductTransaction } from '@/types/database';

export function useProductTransactions(productId: string | null) {
  return useQuery<ProductTransaction[]>({
    queryKey: ['product-transactions', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await createClient()
        .from('product_transactions')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return (data ?? []) as ProductTransaction[];
    },
    enabled: !!productId,
    staleTime: 30_000,
  });
}
