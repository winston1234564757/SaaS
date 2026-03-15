import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { MyProfilePage } from '@/components/client/MyProfilePage';

export const metadata: Metadata = { title: 'Мій профіль' };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, email, created_at')
    .eq('id', user!.id)
    .single();

  return (
    <MyProfilePage
      profile={{
        fullName: profile?.full_name ?? '',
        phone: profile?.phone ?? '',
        email: profile?.email ?? user?.email ?? '',
        memberSince: profile?.created_at ?? '',
      }}
    />
  );
}
