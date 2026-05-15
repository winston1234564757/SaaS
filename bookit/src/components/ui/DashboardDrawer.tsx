'use client';

import { PopUpModal } from '@/components/ui/PopUpModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function DashboardDrawer({ isOpen, onClose, title, children }: Props) {
  return (
    <PopUpModal isOpen={isOpen} onClose={onClose} title={title}>
      {children}
    </PopUpModal>
  );
}
