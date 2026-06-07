import dynamic from 'next/dynamic';
import { Sheet } from '@/components/ui/Sheet';

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
    <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()} title="Флеш-акції">
      {isOpen && <DynamicFlashDealPage isDrawer={true} />}
    </Sheet>
  );
}
