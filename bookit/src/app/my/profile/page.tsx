import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MyProfilePage } from '@/components/client/MyProfilePage';

export const metadata: Metadata = { title: 'Мій профіль' };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, email, created_at, telegram_chat_id, medical_notes, health_notes, avatar_url, instagram_url, telegram_handle')
    .eq('id', user.id)
    .single();

  return (
    <MyProfilePage
      profile={{
        fullName: profile?.full_name ?? '',
        phone: profile?.phone ?? '',
        email: profile?.email ?? user?.email ?? '',
        memberSince: profile?.created_at ?? '',
        telegramChatId: profile?.telegram_chat_id ?? null,
        userId: user.id,
        medicalNotes: profile?.medical_notes ?? '',
        healthNotes: profile?.health_notes ?? '',
        avatarUrl: profile?.avatar_url ?? null,
        instagramUrl: profile?.instagram_url ?? '',
        telegramHandle: profile?.telegram_handle ?? '',
      }}
    />
  );
}
