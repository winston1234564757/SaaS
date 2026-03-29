import { useEffect, useState } from 'react';

export function useTour(tourName: string, totalSteps: number) {
  // -1 = not yet initialized (avoids SSR flash)
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    if (localStorage.getItem(`tour_${tourName}`) !== 'done') {
      const t = setTimeout(() => setCurrentStep(0), 800);
      return () => clearTimeout(t);
    }
  }, [tourName]);

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

  function resetTour() {
    localStorage.removeItem(`tour_${tourName}`);
    setCurrentStep(0);
  }

  return { currentStep, nextStep, closeTour, resetTour };
}
