'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';

export interface ProductReview {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string;
  created_at: string;
}

export interface ProductReviewsResult {
  reviews: ProductReview[];
  count: number;
  average: number; // 0 when no reviews
}

/**
 * Published reviews for a single product (M-SHOP-03b).
 *
 * Reviews are bound to an order, not a product — the RPC derives the link via
 * reviews.order_id -> order_items.product_id. A multi-product order's review
 * therefore appears under each of its products (accepted product decision,
 * mirrors M-SVC-03). RPC `get_product_reviews` is SECURITY DEFINER and returns
 * only is_published rows, so it is safe to call from the public (anon) page.
 */
export function useProductReviews(productId: string | null, enabled = true) {
  const query = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async (): Promise<ProductReview[]> => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_product_reviews', {
        p_product_id: productId,
      });
      if (error) throw error;
      return (data ?? []) as ProductReview[];
    },
    enabled: enabled && !!productId,
    staleTime: 5 * 60_000,
  });

  const reviews = query.data ?? [];
  const count = reviews.length;
  const average = count > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : 0;

  return {
    reviews,
    count,
    average,
    isLoading: query.isLoading && enabled && !!productId,
    error: query.error,
  } satisfies ProductReviewsResult & { isLoading: boolean; error: unknown };
}
