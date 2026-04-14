'use client';

import { useEffect, useState } from 'react';

interface UseTourOptions {
  /** If true, tour never starts (DB says already seen on another device). */
  initialSeen?: boolean;
  /** Called when tour finishes. Caller is responsible for DB persistence. */
  onComplete?: () => Promise<void>;
}

export function useTour(tourName: string, totalSteps: number, options?: UseTourOptions) {
  // Destructure to stable primitives — avoids effect re-runs from new object refs
  const initialSeen = options?.initialSeen ?? false;
  const onComplete = options?.onComplete;

  // -1 = not yet initialized (avoids SSR flash)
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    // DB says done — never show, even if localStorage is empty (new device)
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
      try {
        await onComplete();
      } catch (err) {
        console.error(`[useTour:${tourName}] onComplete failed:`, err);
      }
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
