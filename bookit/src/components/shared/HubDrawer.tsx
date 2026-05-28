import { ReactNode } from 'react';
import { PopUpModal } from '@/components/ui/PopUpModal';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface HubDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function HubDrawer({ isOpen, onClose, title, children }: HubDrawerProps) {
  // We use PopUpModal which handles the PC (centered) vs Mobile (drawer) transition internally.
  // Note: BottomSheet is still an option for very specific mobile-only layouts,
  // but for the Hubs, a centered modal on PC is the priority.
  
  return (
    <PopUpModal isOpen={isOpen} onClose={onClose} title={title} keepMounted={true}>
      <div className="p-0 md:p-2">
        {children}
      </div>
    </PopUpModal>
  );
}
