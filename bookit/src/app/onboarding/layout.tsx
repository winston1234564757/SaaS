import { createClient } from '@/lib/supabase/server';
import { MasterProvider } from '@/lib/supabase/context';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let masterProfile = null;

  if (user) {
    const [{ data: p }, { data: mp }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('master_profiles').select('*').eq('id', user.id).maybeSingle(),
    ]);
    profile = p;
    masterProfile = mp;
  }

  return (
    <MasterProvider
      initialUser={user}
      initialProfile={profile}
      initialMasterProfile={masterProfile}
    >
      {children}
    </MasterProvider>
  );
}
