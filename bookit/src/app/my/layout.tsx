import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { BlobBackground } from '@/components/shared/BlobBackground';
import { MasterModeBanner } from '@/components/client/MasterModeBanner';
import { B2CRouteGuard } from '@/components/client/B2CRouteGuard';

export default async function MyLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Strict Identity Guard is now deferred to the client to avoid RSC pathname caching issues
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, phone')
    .eq('id', user.id)
    .single();

  const cookieStore = await cookies();
  const viewMode = cookieStore.get('view_mode')?.value;

  // Check if this is a master visiting in client mode
  const isMasterInClientMode = viewMode === 'client' && profile?.role === 'master';

  return (
    <div className="min-h-dvh">
      <BlobBackground />
      {isMasterInClientMode && <MasterModeBanner />}
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <B2CRouteGuard phone={profile?.phone || null}>
          {children}
        </B2CRouteGuard>
      </div>
    </div>
  );
}
