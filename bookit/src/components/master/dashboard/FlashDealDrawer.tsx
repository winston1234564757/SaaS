import dynamic from 'next/dynamic';
import { PopUpModal } from '@/components/ui/PopUpModal';

const DynamicFlashDealPage = dynamic(
  () => import('@/components/master/flash/FlashDealPage').then(m => m.FlashDealPage),
  { ssr: false }
);

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function FlashDealDrawer({ isOpen, onClose }: Props) {
  return (
    <PopUpModal isOpen={isOpen} onClose={onClose} title="Флеш-акції">
      {isOpen && (
        <DynamicFlashDealPage isDrawer={true} />
      )}
    </PopUpModal>
  );
}
