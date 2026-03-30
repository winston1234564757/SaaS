import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useMasterContext } from '@/lib/supabase/context';
import { MyProfilePage as MyProfileComponent } from '@/components/client/MyProfilePage';

export function MyProfilePage() {
  const { user } = useMasterContext();

  const { data, isLoading } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      const [{ data: profile }, { data: lastBooking }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, phone, email, created_at, telegram_chat_id')
          .eq('id', user!.id)
          .single(),
        supabase
          .from('bookings')
          .select('master_id')
          .eq('client_id', user!.id)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      return {
        fullName: profile?.full_name ?? '',
        phone: profile?.phone ?? '',
        email: profile?.email ?? user?.email ?? '',
        memberSince: profile?.created_at ?? '',
        telegramChatId: profile?.telegram_chat_id ?? null,
        userId: user!.id,
        lastMasterId: lastBooking?.master_id ?? null,
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div className="p-6 text-sm text-[#A8928D]">Завантаження...</div>;

  return <MyProfileComponent profile={data!} />;
}
