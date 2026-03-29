import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { MyProfilePage } from '@/components/client/MyProfilePage';

export const metadata: Metadata = { title: 'Мій профіль' };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  return (
    <MyProfilePage
      profile={{
        fullName: profile?.full_name ?? '',
        phone: profile?.phone ?? '',
        email: profile?.email ?? user?.email ?? '',
        memberSince: profile?.created_at ?? '',
        telegramChatId: profile?.telegram_chat_id ?? null,
        userId: user!.id,
        lastMasterId: lastBooking?.master_id ?? null,
      }}
    />
  );
}
