'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';

// ─── Types ────────────────────────────────────────────────────

export interface ProductLink {
  serviceId: string;
  isAutoSuggest: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────

/**
 * Manages product_service_links for a single product.
 *
 * Usage:
 *   const { links, setLinks } = useProductLinks(productId);
 *
 * `setLinks` does a full replace: deletes all existing links for
 * the product, then inserts the new set. Pass an empty array to clear.
 */
export function useProductLinks(productId: string | null) {
  const supabase = createClient();
  const qc = useQueryClient();
  const key = ['product-links', productId] as const;

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<ProductLink[]> => {
      const { data, error } = await supabase
        .from('product_service_links')
        .select('service_id, is_auto_suggest')
        .eq('product_id', productId!);
      if (error) throw error;
      return data.map(r => ({ serviceId: r.service_id, isAutoSuggest: r.is_auto_suggest }));
    },
    enabled: !!productId,
  });

  const setLinksMutation = useMutation({
    mutationFn: async (links: ProductLink[]) => {
      // 1. Delete all existing links for this product
      const { error: delError } = await supabase
        .from('product_service_links')
        .delete()
        .eq('product_id', productId!);
      if (delError) throw delError;

      // 2. Insert new links (skip if empty)
      if (links.length > 0) {
        const { error: insError } = await supabase
          .from('product_service_links')
          .insert(
            links.map(l => ({
              product_id: productId!,
              service_id: l.serviceId,
              is_auto_suggest: l.isAutoSuggest,
            }))
          );
        if (insError) throw insError;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    links: query.data ?? [],
    isLoading: query.isLoading,
    setLinks: (links: ProductLink[]) => setLinksMutation.mutateAsync(links),
    isSaving: setLinksMutation.isPending,
  };
}

// ─── Standalone mutator (use when you don't have a hook instance) ─

/**
 * Full-replace links for a product. Deletes existing, inserts new.
 * Call this after creating a new product to persist its links.
 */
export async function setProductLinks(productId: string, links: ProductLink[]): Promise<void> {
  const supabase = createClient();
  const { error: delError } = await supabase
    .from('product_service_links')
    .delete()
    .eq('product_id', productId);
  if (delError) throw delError;

  if (links.length > 0) {
    const { error: insError } = await supabase
      .from('product_service_links')
      .insert(
        links.map(l => ({
          product_id: productId,
          service_id: l.serviceId,
          is_auto_suggest: l.isAutoSuggest,
        }))
      );
    if (insError) throw insError;
  }
}

// ─── Utility: fetch links for multiple services (BookingFlow) ──

/**
 * Given an array of selected service IDs, returns product IDs
 * that are linked (auto-suggest) to any of those services.
 * Used by BookingFlow to filter the products step.
 */
export async function getAutoSuggestProductIds(serviceIds: string[]): Promise<string[]> {
  if (serviceIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from('product_service_links')
    .select('product_id')
    .in('service_id', serviceIds)
    .eq('is_auto_suggest', true);
  if (error) throw error;
  return [...new Set(data.map(r => r.product_id))];
}
