'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { PortfolioItemFull } from '@/types/database';

const QUERY_KEY = ['portfolio-items'];

export function usePortfolioItems(initialItems?: PortfolioItemFull[]) {
  const supabase = createClient();

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<PortfolioItemFull[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: items, error } = await supabase
        .from('portfolio_items')
        .select(`
          id, master_id, title, description, service_id, tagged_client_id,
          consent_status, is_published, display_order, created_at, updated_at,
          portfolio_item_photos ( id, portfolio_item_id, storage_path, url, display_order, created_at ),
          portfolio_item_reviews ( review_id )
        `)
        .eq('master_id', user.id)
        .order('display_order', { ascending: true });

      if (error || !items) return [];

      return (items as unknown as Array<Record<string, unknown>>).map(item => {
        const photos = ((item.portfolio_item_photos as unknown[]) ?? []) as import('@/types/database').PortfolioItemPhoto[];
        const reviews = ((item.portfolio_item_reviews as unknown[]) ?? []) as Array<{ review_id: string }>;
        return {
          id: item.id as string,
          master_id: item.master_id as string,
          title: item.title as string,
          description: (item.description as string) ?? null,
          service_id: (item.service_id as string) ?? null,
          tagged_client_id: (item.tagged_client_id as string) ?? null,
          consent_status: (item.consent_status as 'pending' | 'approved' | 'declined') ?? null,
          is_published: item.is_published as boolean,
          display_order: item.display_order as number,
          created_at: item.created_at as string,
          updated_at: item.updated_at as string,
          photos: photos.sort((a, b) => a.display_order - b.display_order),
          review_ids: reviews.map(r => r.review_id),
          service_name: null,
          tagged_client_name: null,
        };
      });
    },
    initialData: initialItems,
    staleTime: 2 * 60 * 1000,
  });
}

export function useInvalidatePortfolio() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEY });
}
