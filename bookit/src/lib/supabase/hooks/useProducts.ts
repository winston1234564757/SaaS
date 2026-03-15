'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import { type Product, INITIAL_PRODUCTS } from '@/components/master/services/types';
import { safeQuery, safeMutation } from '../safeQuery';

// ─── DB ↔ Component type mapping ──────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji ?? '✨',
    price: Number(row.price),
    stock: row.stock_unlimited ? null : row.stock_quantity,
    active: row.is_active,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
  };
}

function productToRow(data: Omit<Product, 'id'>, masterId: string) {
  return {
    master_id: masterId,
    name: data.name,
    emoji: data.emoji,
    price: data.price,
    stock_quantity: data.stock ?? 0,
    stock_unlimited: data.stock === null,
    is_active: data.active,
    description: data.description ?? null,
    image_url: data.imageUrl ?? null,
  };
}

// ─── Hook ─────────────────────────────────────────────────────

export function useProducts() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();
  const supabase = createClient();
  const key = ['products', masterId] as const;

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const result = await safeQuery(
        'products:list',
        () =>
          supabase
            .from('products')
            .select('*')
            .eq('master_id', masterId!)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })
      );
      if (result.error) {
        const errorWithMeta = Object.assign(new Error(result.message ?? 'Failed to load products'), {
          __safeResult: result,
        });
        throw errorWithMeta;
      }
      return (result.data ?? []).map(rowToProduct);
    },
    enabled: !!masterId,
    placeholderData: INITIAL_PRODUCTS,
  });

  const addMutation = useMutation({
    mutationFn: async (data: Omit<Product, 'id'>) => {
      const result = await safeMutation(
        'products:add',
        () =>
          supabase
            .from('products')
            .insert(productToRow(data, masterId!))
            .select()
            .single()
      );
      if (result.error || !result.data) {
        const errorWithMeta = Object.assign(new Error(result.message ?? 'Failed to add product'), {
          __safeResult: result,
        });
        throw errorWithMeta;
      }
      return rowToProduct(result.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<Product, 'id'> }) => {
      const result = await safeMutation(
        'products:update',
        () =>
          supabase
            .from('products')
            .update(productToRow(data, masterId!))
            .eq('id', id)
      );
      if (result.error) {
        const errorWithMeta = Object.assign(new Error(result.message ?? 'Failed to update product'), {
          __safeResult: result,
        });
        throw errorWithMeta;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await safeMutation(
        'products:delete',
        () => supabase.from('products').delete().eq('id', id)
      );
      if (result.error) {
        const errorWithMeta = Object.assign(new Error(result.message ?? 'Failed to delete product'), {
          __safeResult: result,
        });
        throw errorWithMeta;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const result = await safeMutation(
        'products:toggle',
        () =>
          supabase
            .from('products')
            .update({ is_active: !active })
            .eq('id', id)
      );
      if (result.error) {
        const errorWithMeta = Object.assign(new Error(result.message ?? 'Failed to toggle product'), {
          __safeResult: result,
        });
        throw errorWithMeta;
      }
    },
    onMutate: async ({ id, active }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Product[]>(key);
      qc.setQueryData<Product[]>(key, old =>
        old?.map(p => (p.id === id ? { ...p, active: !active } : p))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    products: query.data ?? INITIAL_PRODUCTS,
    isLoading: query.isLoading && !query.isPlaceholderData,
    error: query.error,
    addProduct: (data: Omit<Product, 'id'>) => addMutation.mutate(data),
    /** Returns the created Product (with id) — use when you need the new ID immediately */
    addProductAsync: (data: Omit<Product, 'id'>) => addMutation.mutateAsync(data),
    editProduct: (id: string, data: Omit<Product, 'id'>) => updateMutation.mutate({ id, data }),
    deleteProduct: (id: string) => deleteMutation.mutate(id),
    toggleProduct: (id: string, active: boolean) => toggleMutation.mutate({ id, active }),
  };
}
