import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/components/master/DashboardLayout';
import { PullToRefresh } from '@/components/ui/PullToRefresh';

export const dynamic = 'force-dynamic';

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: profile }, { data: masterProfile }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('master_profiles').select('*').eq('id', user.id).maybeSingle(),
  ]);

  if (profile?.role === 'client') redirect('/my/bookings');

  // Onboarding guard is now handled entirely client-side via MasterRouteGuard
  // inside DashboardLayout, because proxy.ts is not executing as middleware,
  // making x-pathname consistently empty and causing infinite loops.
  
  return (
    <DashboardLayout
      initialUser={user}
      initialProfile={profile ?? null}
      initialMasterProfile={masterProfile ?? null}
    >
      <PullToRefresh>
        {children}
      </PullToRefresh>
    </DashboardLayout>
  );
}
