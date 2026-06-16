import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ServicesPage } from '@/components/master/services/ServicesPage';
import type { ServiceRow } from '@/lib/supabase/hooks/useServices';

export const metadata: Metadata = { title: 'Послуги та товари — Bookit' };

export default async function Page() {
  try {
    const supabase = await createClient();
    // getSession reads from cookie — no extra network round-trip
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return <ServicesPage />;

    const { data } = await supabase
      .from('services')
      .select('id, name, icon_name, category, price, duration_minutes, is_popular, is_active, is_archived, sort_order, description, image_url')
      .eq('master_id', session.user.id)
      .eq('is_archived', false)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    return <ServicesPage initialServicesData={(data ?? []) as ServiceRow[]} />;
  } catch {
    return <ServicesPage />;
  }
}
