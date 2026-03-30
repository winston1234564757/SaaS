import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { ClientRealtimeSync } from '@/components/client/ClientRealtimeSync';
import { MyBookingsPage as MyBookingsComponent } from '@/components/client/MyBookingsPage';

export function MyBookingsPage() {
  const { user } = useMasterContext();

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings', user?.id],
    queryFn: async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id, date, start_time, end_time, status, total_price, notes, master_id,
          master_profiles ( slug, avatar_emoji, profiles ( full_name ) ),
          booking_services ( service_id, service_name, service_price, duration_minutes ),
          reviews ( id )
        `)
        .eq('client_id', user!.id)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(50);

      return (bookings ?? []).map((b: any) => ({
        id: b.id as string,
        date: b.date as string,
        startTime: (b.start_time as string | null)?.slice(0, 5) ?? '',
        endTime: (b.end_time as string | null)?.slice(0, 5) ?? '',
        status: b.status as string,
        totalPrice: Number(b.total_price),
        notes: (b.notes as string) || null,
        masterId: b.master_id as string,
        masterName: (b.master_profiles?.profiles as any)?.full_name ?? 'Майстер',
        masterSlug: (b.master_profiles?.slug as string) ?? '',
        masterEmoji: (b.master_profiles?.avatar_emoji as string) ?? '💅',
        hasReview: ((b.reviews ?? []) as any[]).length > 0,
        services: ((b.booking_services ?? []) as any[]).map((s: any) => ({
          id: (s.service_id as string) || null,
          name: s.service_name as string,
          price: Number(s.service_price),
          duration: s.duration_minutes as number,
        })),
      }));
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="p-6 text-sm text-[#A8928D]">Завантаження...</div>;

  return (
    <>
      <ClientRealtimeSync userId={user!.id} />
      <MyBookingsComponent bookings={data ?? []} />
    </>
  );
}
