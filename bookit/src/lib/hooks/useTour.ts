'use client';

import { useEffect, useState } from 'react';
import { markTourSeen } from '@/app/(master)/dashboard/actions';

interface UseTourOptions {
  /** DB value: masterProfile.seen_tours[tourName] — prevents showing on any device if seen */
  initialSeen?: boolean;
  /** Supabase user ID. When provided, useTour persists to DB automatically on completion. */
  masterId?: string;
  /**
   * Optional extra callback after tour completes (e.g. context refresh).
   * If NOT provided and masterId IS provided — DB is written automatically.
   * If provided — caller is responsible for DB write (backward compat for DashboardTourContext).
   */
  onComplete?: () => Promise<void>;
}

export function useTour(tourName: string, totalSteps: number, options?: UseTourOptions) {
  const initialSeen = options?.initialSeen ?? false;
  const masterId = options?.masterId;
  const onComplete = options?.onComplete;

  // -1 = not yet initialized (avoids SSR flash)
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    // DB says done — never show, even on new device
    if (initialSeen) return;

    // Same-device cache: if localStorage marks done, skip
    if (localStorage.getItem(`tour_${tourName}`) === 'done') return;

    const t = setTimeout(() => setCurrentStep(0), 800);
    return () => clearTimeout(t);
  }, [tourName, initialSeen]);

  async function finishTour() {
    setCurrentStep(-1);
    localStorage.setItem(`tour_${tourName}`, 'done');

    if (onComplete) {
      // Caller owns DB write (e.g. DashboardTourContext needs refresh() after)
      try { await onComplete(); } catch (err) {
        console.error(`[useTour:${tourName}] onComplete failed:`, err);
      }
    } else if (masterId) {
      // DB-primary: persist automatically — no boilerplate in callers
      markTourSeen(tourName).catch(err =>
        console.error(`[useTour:${tourName}] markTourSeen failed:`, err)
      );
    }
  }

  function nextStep() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishTour();
    }
  }

  function closeTour() {
    finishTour();
  }

  function resetTour() {
    localStorage.removeItem(`tour_${tourName}`);
    setCurrentStep(0);
  }

  return { currentStep, nextStep, closeTour, resetTour };
}
