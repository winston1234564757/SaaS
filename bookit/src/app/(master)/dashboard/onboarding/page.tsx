import type { Metadata } from 'next';
import { BlobBackground } from '@/components/shared/BlobBackground';
import { OnboardingWizard } from '@/components/master/onboarding/OnboardingWizard';

export const metadata: Metadata = { title: 'Налаштування профілю — Bookit' };

export default function OnboardingPage() {
  return (
    <>
      <BlobBackground />
      <OnboardingWizard />
    </>
  );
}
