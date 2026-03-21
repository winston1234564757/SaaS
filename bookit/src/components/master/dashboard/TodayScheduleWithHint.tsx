'use client';

import { TodaySchedule } from './TodaySchedule';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { useTourStep } from './DashboardTourContext';

export function TodayScheduleWithHint() {
  const { tourStep, handleNextStep, closeTour } = useTourStep();

  return (
    <div className="relative">
      <TodaySchedule />
      <AnchoredTooltip
        isOpen={tourStep === 1}
        onClose={closeTour}
        title="📅 Розклад на сьогодні"
        text="Всі сьогоднішні записи в одному місці. Натисніть на картку, щоб підтвердити або завершити запис."
        position="bottom"
        primaryButtonText="Далі →"
        onPrimaryClick={handleNextStep}
      />
    </div>
  );
}
