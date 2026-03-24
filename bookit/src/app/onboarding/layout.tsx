import { createClient } from '@/lib/supabase/server';
import { MasterProvider } from '@/lib/supabase/context';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <MasterProvider initialUser={user}>{children}</MasterProvider>;
}
