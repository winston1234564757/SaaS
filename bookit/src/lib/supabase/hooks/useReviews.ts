'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string;
  is_published: boolean;
  created_at: string;
  booking_date: string | null;
}

export function useReviews() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['reviews', masterId],
    queryFn: async (): Promise<Review[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, client_name, is_published, created_at, bookings(date)')
        .eq('master_id', masterId!)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment || null,
        client_name: r.client_name || '\u041a\u043b\u0456\u0454\u043d\u0442',
        is_published: r.is_published,
        created_at: r.created_at,
        booking_date: r.bookings?.date ?? null,
      }));
    },
    enabled: !!masterId,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('reviews')
        .update({ is_published: !current })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, current }) => {
      await qc.cancelQueries({ queryKey: ['reviews', masterId] });
      const prev = qc.getQueryData<Review[]>(['reviews', masterId]);
      qc.setQueryData<Review[]>(['reviews', masterId], old =>
        old?.map(r => r.id === id ? { ...r, is_published: !current } : r)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['reviews', masterId], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['reviews', masterId] });
    },
  });

  return {
    reviews: query.data ?? [],
    isLoading: query.isLoading && !!masterId,
    error: query.error,
    togglePublish: (id: string, current: boolean) => togglePublish.mutate({ id, current }),
    isToggling: togglePublish.variables?.id ?? null,
  };
}
