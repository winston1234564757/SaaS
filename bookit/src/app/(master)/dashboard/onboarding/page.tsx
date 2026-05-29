import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingWizard } from '@/components/master/onboarding/OnboardingWizard';
import type { Step, OnboardingData } from '@/types/onboarding';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Налаштування профілю — Bookit' };

export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_step, onboarding_data')
    .eq('id', user.id)
    .maybeSingle();

  const initialStep = (profile?.onboarding_step as Step | undefined) ?? 'BASIC';
  const initialData = (profile?.onboarding_data ?? {}) as OnboardingData;

  // User already completed onboarding — skip wizard
  if (initialStep === 'SUCCESS') redirect('/dashboard');

  return (
    <div
      data-theme="frost"
      className="fixed inset-0 z-50 overflow-auto"
      style={{
        background: [
          'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(99,102,241,0.16) 0%, transparent 55%)',
          'radial-gradient(ellipse 50% 40% at 92% 8%, rgba(139,92,246,0.10) 0%, transparent 50%)',
          'radial-gradient(ellipse 40% 35% at 5% 92%, rgba(59,130,246,0.09) 0%, transparent 45%)',
          'var(--background)',
        ].join(', '),
      }}
    >
      <OnboardingWizard initialStep={initialStep} initialData={initialData} />
    </div>
  );
}
