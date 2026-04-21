import dynamic from 'next/dynamic';
import { PopUpModal } from '@/components/ui/PopUpModal';
import type { PricingRules } from '@/lib/utils/dynamicPricing';

const DynamicPricingPage = dynamic(
  () => import('@/components/master/pricing/DynamicPricingPage').then(m => m.DynamicPricingPage),
  { ssr: false }
);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pricingRules: PricingRules;
}

export function PricingDrawer({ isOpen, onClose, pricingRules }: Props) {
  return (
    <PopUpModal isOpen={isOpen} onClose={onClose} title="Ціноутворення" keepMounted={true}>
      <div className="md:p-2">
        {isOpen && <DynamicPricingPage initial={pricingRules} isDrawer={true} />}
      </div>
    </PopUpModal>
  );
}
