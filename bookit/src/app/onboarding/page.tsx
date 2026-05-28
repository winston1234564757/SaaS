import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BlobBackground } from '@/components/shared/BlobBackground';
import { OnboardingWizard } from '@/components/master/onboarding/OnboardingWizard';
import type { Step, OnboardingData } from '@/types/onboarding';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Налаштування профілю — Bookit' };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Already completed onboarding — send to dashboard
  const { data: mp } = await supabase
    .from('master_profiles')
    .select('id, slug')
    .eq('id', user.id)
    .maybeSingle();

  if (mp) redirect('/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_step, onboarding_data')
    .eq('id', user.id)
    .maybeSingle();

  const initialStep = (profile?.onboarding_step as Step | undefined) ?? 'BASIC';

  // If the user somehow lands here at SUCCESS step, send them to dashboard
  if (initialStep === 'SUCCESS') redirect('/dashboard');

  const rawData = (profile?.onboarding_data ?? {}) as OnboardingData;
  // Hydrate slug from master_profiles if present but missing in persisted data
  const initialData: OnboardingData = {
    ...rawData,
    slug: rawData.slug ?? (mp as { slug?: string } | null)?.slug ?? undefined,
  };

  return (
    <>
      <BlobBackground />
      <OnboardingWizard initialStep={initialStep} initialData={initialData} />
    </>
  );
}
