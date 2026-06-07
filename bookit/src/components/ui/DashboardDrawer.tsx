'use client';

import { Sheet } from '@/components/ui/Sheet';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function DashboardDrawer({ isOpen, onClose, title, children }: Props) {
  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()} title={title}>
      {children}
    </Sheet>
  );
}
