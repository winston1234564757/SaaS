'use client';

import { SharePageCard } from './SharePageCard';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { useTourStep } from './DashboardTourContext';

export function ShareCardWithHint() {
  const { tourStep, handleNextStep, closeTour } = useTourStep();

  return (
    <div className="relative">
      <SharePageCard />
      <AnchoredTooltip
        isOpen={tourStep === 0}
        onClose={closeTour}
        title="🔗 Ваше посилання"
        text="Скопіюйте та додайте в шапку Instagram — клієнти зможуть записуватися самостійно 24/7."
        position="top"
        primaryButtonText="Далі →"
        onPrimaryClick={handleNextStep}
      />
    </div>
  );
}
