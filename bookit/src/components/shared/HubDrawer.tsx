import { ReactNode } from 'react';
import { Sheet } from '@/components/ui/Sheet';

interface HubDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function HubDrawer({ isOpen, onClose, title, children }: HubDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()} title={title}>
      <div className="p-0 md:p-2">
        {children}
      </div>
    </Sheet>
  );
}
