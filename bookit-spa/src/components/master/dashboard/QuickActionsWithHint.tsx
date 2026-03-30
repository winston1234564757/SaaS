import { QuickActions } from './QuickActions';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { useTourStep } from './DashboardTourContext';
import { cn } from '@/lib/utils/cn';

export function QuickActionsWithHint() {
  const { tourStep, handleNextStep, closeTour } = useTourStep();
  const isActive = tourStep === 2;

  return (
    <div className={cn(
      'relative rounded-2xl transition-all duration-500',
      isActive && 'tour-glow z-40 scale-[1.02]'
    )}>
      <QuickActions />
      <AnchoredTooltip
        isOpen={isActive}
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
