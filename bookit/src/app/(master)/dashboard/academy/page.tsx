import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AcademyPage } from '@/components/master/academy/AcademyPage';

export const metadata = { title: 'BookIT Академія' };

export default async function AcademyPageRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <AcademyPage />;
}
