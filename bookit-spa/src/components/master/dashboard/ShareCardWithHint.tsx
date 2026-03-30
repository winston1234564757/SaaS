import { SharePageCard } from './SharePageCard';
import { AnchoredTooltip } from '@/components/ui/AnchoredTooltip';
import { useTourStep } from './DashboardTourContext';
import { cn } from '@/lib/utils/cn';

export function ShareCardWithHint() {
  const { tourStep, handleNextStep, closeTour } = useTourStep();
  const isActive = tourStep === 0;

  return (
    <div className={cn(
      'relative rounded-2xl transition-all duration-500',
      isActive && 'tour-glow z-40 scale-[1.02]'
    )}>
      <SharePageCard />
      <AnchoredTooltip
        isOpen={isActive}
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
