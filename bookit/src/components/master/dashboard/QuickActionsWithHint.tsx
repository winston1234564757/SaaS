'use client';

import { QuickActions } from './QuickActions';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { useTourStep } from './DashboardTourContext';

export function QuickActionsWithHint() {
  const { tourStep, handleNextStep, closeTour } = useTourStep();

  return (
    <div className="relative">
      <QuickActions />
      <AnchoredTooltip
        isOpen={tourStep === 2}
        onClose={closeTour}
        title="⚡ Ручний запис"
        text="Клієнт написав у Direct? Натисніть «+» щоб додати запис вручну за кілька секунд."
        position="top"
        primaryButtonText="Завершити"
        onPrimaryClick={handleNextStep}
      />
    </div>
  );
}
