'use client';

import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';
import { useToast } from '@/lib/toast/context';
import { approveReview as approveReviewAction } from '@/app/(master)/dashboard/bookings/actions';

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string;
  is_published: boolean;
  created_at: string;
  booking_date: string | null;
}

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string;
  is_published: boolean;
  created_at: string;
  bookings: { date: string } | null;
};

function mapRow(r: ReviewRow): Review {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment || null,
    client_name: r.client_name || 'Клієнт',
    is_published: r.is_published,
    created_at: r.created_at,
    booking_date: r.bookings?.date ?? null,
  };
}

export function useReviews() {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;
  const qc = useQueryClient();
  const { showToast } = useToast();

  // Published reviews
  const query = useQuery({
    queryKey: ['reviews', masterId],
    queryFn: async (): Promise<Review[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, client_name, is_published, created_at, bookings(date)')
        .eq('master_id', masterId!)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map((r: ReviewRow) => mapRow(r));
    },
    enabled: !!masterId,
    staleTime: 60_000,
  });

  // Pending (unpublished) reviews awaiting moderation
  const pendingQuery = useQuery({
    queryKey: ['reviews-pending', masterId],
    queryFn: async (): Promise<Review[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, client_name, is_published, created_at, bookings(date)')
        .eq('master_id', masterId!)
        .eq('is_published', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map((r: ReviewRow) => mapRow(r));
    },
    enabled: !!masterId,
    staleTime: 30_000,
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
      showToast({ type: 'error', title: 'Помилка', message: 'Не вдалося змінити видимість відгуку' });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['reviews', masterId] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const result = await approveReviewAction(id, approved);
      if (result.error) throw new Error(result.error);
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ['reviews-pending', masterId] });
      const prev = qc.getQueryData<Review[]>(['reviews-pending', masterId]);
      // Optimistically remove from pending list
      qc.setQueryData<Review[]>(['reviews-pending', masterId], old =>
        old?.filter(r => r.id !== id)
      );
      return { prev };
    },
    onSuccess: (_d, { approved }) => {
      showToast({
        type: 'success',
        title: approved ? 'Відгук опубліковано' : 'Відгук відхилено',
        message: approved ? 'Відгук тепер видно на вашій сторінці' : 'Відгук видалено',
      });
      // Refresh both lists
      qc.invalidateQueries({ queryKey: ['reviews', masterId] });
      qc.invalidateQueries({ queryKey: ['reviews-pending', masterId] });
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['reviews-pending', masterId], ctx.prev);
      showToast({ type: 'error', title: 'Помилка', message: 'Не вдалося обробити відгук' });
    },
  });

  return {
    reviews: query.data ?? [],
    isLoading: query.isLoading && !!masterId,
    error: query.error,
    pendingReviews: pendingQuery.data ?? [],
    isPendingLoading: pendingQuery.isLoading && !!masterId,
    togglePublish: (id: string, current: boolean) => togglePublish.mutate({ id, current }),
    isToggling: togglePublish.isPending ? (togglePublish.variables?.id ?? null) : null,
    approveReview: (id: string, approved: boolean) => approveMutation.mutate({ id, approved }),
    isApproving: approveMutation.isPending ? (approveMutation.variables?.id ?? null) : null,
  };
}
