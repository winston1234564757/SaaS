'use client';

import { useEffect, useState } from 'react';

export function useTour(tourName: string, totalSteps: number) {
  // -1 = not yet initialized (avoids SSR flash)
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    if (localStorage.getItem(`tour_${tourName}`) !== 'done') {
      const t = setTimeout(() => setCurrentStep(0), 800);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function nextStep() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCurrentStep(-1);
      localStorage.setItem(`tour_${tourName}`, 'done');
    }
  }

  function closeTour() {
    setCurrentStep(-1);
    localStorage.setItem(`tour_${tourName}`, 'done');
  }

  return { currentStep, nextStep, closeTour };
}
