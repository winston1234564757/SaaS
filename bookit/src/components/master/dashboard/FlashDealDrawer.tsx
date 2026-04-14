'use client';

import { DashboardDrawer } from '@/components/ui/DashboardDrawer';
import { FlashDealPage } from '@/components/master/flash/FlashDealPage';
import { useFlashDealsCount } from '@/lib/supabase/hooks/useFlashDeals';
import { useMasterContext } from '@/lib/supabase/context';
import { Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function FlashDealDrawer({ isOpen, onClose }: Props) {
  const { masterProfile } = useMasterContext();
  const tier = masterProfile?.subscription_tier ?? 'starter';

  const { data: usedThisMonth = 0, isLoading } = useFlashDealsCount();

  return (
    <DashboardDrawer isOpen={isOpen} onClose={onClose} title="Флеш-акції">
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-[#789A99]" />
        </div>
      ) : (
        <FlashDealPage
          activeDeals={[]}
          tier={tier}
          usedThisMonth={usedThisMonth}
        />
      )}
    </DashboardDrawer>
  );
}
