'use client';

import { useMasterContext } from '@/lib/supabase/context';
import { useTour } from '@/lib/hooks/useTour';
import { DESTINATION_TOURS, isTourSeen } from '@/components/master/onboarding/destinationTours';
import type { TourStep } from '@/components/master/onboarding/TourBanner';

export function useDestinationTour(tourKey: string, pageSteps: TourStep[]) {
  const { masterProfile, refresh } = useMasterContext();
  const seenTours = masterProfile?.seen_tours as Record<string, boolean> | null;

  const { currentStep, nextStep, closeTour, resetTour } = useTour(tourKey, pageSteps.length + 1, {
    initialSeen: isTourSeen(tourKey, seenTours),
    masterId: masterProfile?.id ?? '',
    onAfterSeen: refresh,
  });

  const nextTours = DESTINATION_TOURS
    .filter(d => !isTourSeen(d.tourKey, seenTours) && d.tourKey !== tourKey)
    .slice(0, 3)
    .map(d => ({ icon: d.icon, label: d.label, href: d.href }));

  // humanized — navigator step (consistent across all destination pages)
  const dynamicSteps: TourStep[] = [
    ...pageSteps,
    { title: 'Що далі?', text: 'Обери наступний розділ.', isNavigator: true, links: nextTours },
  ];

  return { currentStep, nextStep, closeTour, resetTour, dynamicSteps };
}
