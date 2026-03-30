import { TodaySchedule } from './TodaySchedule';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { useTourStep } from './DashboardTourContext';
import { cn } from '@/lib/utils/cn';

export function TodayScheduleWithHint() {
  const { tourStep, handleNextStep, closeTour } = useTourStep();
  const isActive = tourStep === 1;

  return (
    <div className={cn(
      'relative rounded-2xl transition-all duration-500',
      isActive && 'tour-glow z-40 scale-[1.02]'
    )}>
      <TodaySchedule />
      <AnchoredTooltip
        isOpen={isActive}
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
