'use client';

import { useQuery } from '@tanstack/react-query';
import { checkAmbassadorStatus } from '@/lib/actions/referrals';

export function useAmbassadorStatus(
  phone: string | null | undefined,
  masterId: string | null | undefined,
) {
  return useQuery({
    queryKey: ['ambassador-status', phone, masterId],
    queryFn: () => checkAmbassadorStatus(phone!, masterId!),
    enabled: !!phone && !!masterId,
    staleTime: 5 * 60_000,
    select: (data) => data.isAmbassador,
  });
}
