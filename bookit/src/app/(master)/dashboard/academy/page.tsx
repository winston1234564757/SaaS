import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AcademyPage } from '@/components/master/academy/AcademyPage';

export const metadata = { title: 'BookIT Академія' };

export default async function AcademyPageRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch minimal data for completion status
  const [mpRes, servicesRes] = await Promise.all([
    supabase
      .from('master_profiles')
      .select('bio, business_name, telegram_chat_id, is_published, referral_code, slug')
      .eq('id', user.id)
      .single(),
    supabase
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('master_id', user.id)
      .eq('is_active', true),
  ]);

  const mp = mpRes.data;
  const serviceCount = servicesRes.count ?? 0;

  return (
    <AcademyPage
      profileFilled={!!(mp?.bio || mp?.business_name)}
      servicesAdded={serviceCount > 0}
      profilePublished={mp?.is_published ?? false}
      telegramConnected={!!(mp?.telegram_chat_id)}
      slug={mp?.slug ?? ''}
      referralCode={mp?.referral_code ?? ''}
    />
  );
}
