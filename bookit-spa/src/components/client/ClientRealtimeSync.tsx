import { useEffect, startTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

interface Props {
  userId: string;
}

export function ClientRealtimeSync({ userId }: Props) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`client-bookings-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `client_id=eq.${userId}`,
        },
        () => {
          startTransition(() => {
            queryClient.invalidateQueries({ queryKey: ['myBookings', userId] });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return null;
}
