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

  // Onboarding guard — new masters haven't set avatar_emoji yet.
  // x-pathname is forwarded from proxy.ts via request headers (not response),
  // so headers().get('x-pathname') correctly reflects the current page.
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  const isOnboarding = pathname.startsWith('/dashboard/onboarding');
  const isBilling = pathname.startsWith('/dashboard/billing');

  if (profile?.role === 'master' && !masterProfile?.avatar_emoji && !isOnboarding && !isBilling) {
    redirect('/dashboard/onboarding');
  }

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
