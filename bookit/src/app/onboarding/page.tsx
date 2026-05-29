import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingWizard } from '@/components/master/onboarding/OnboardingWizard';
import type { OnboardingData } from '@/types/onboarding';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Налаштування профілю — Bookit' };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: mp }, { data: profile }] = await Promise.all([
    supabase.from('master_profiles').select('slug').eq('id', user.id).maybeSingle(),
    supabase.from('profiles').select('onboarding_step, onboarding_data').eq('id', user.id).maybeSingle(),
  ]);

  const initialStep = (profile?.onboarding_step as string | undefined) ?? 'PROFILE';

  // Redirect only when the user has explicitly completed all onboarding steps.
  // Do NOT redirect just because master_profiles exists — it is created at step 1
  // of the new 5-step flow, so mid-flow users would be incorrectly ejected.
  if (initialStep === 'SUCCESS') redirect('/dashboard');

  const rawData = (profile?.onboarding_data ?? {}) as OnboardingData;
  // Hydrate slug from master_profiles if present but missing in persisted data
  const initialData: OnboardingData = {
    ...rawData,
    slug: rawData.slug ?? (mp as { slug?: string } | null)?.slug ?? undefined,
  };

  return (
    <div
      data-theme="frost"
      className="min-h-dvh"
      style={{ background: 'var(--background)' }}
    >
      <OnboardingWizard initialStep={initialStep} initialData={initialData} />
    </div>
  );
}
