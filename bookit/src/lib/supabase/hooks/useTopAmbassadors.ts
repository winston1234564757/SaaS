'use client';
import { useQuery } from '@tanstack/react-query';
import { getTopAmbassadors, type TopAmbassadorsResult } from '@/lib/actions/referrals';

export type { TopAmbassadorsResult };

export function useTopAmbassadors(masterId: string | undefined) {
  return useQuery({
    queryKey: ['top-ambassadors', masterId],
    queryFn: () => getTopAmbassadors(masterId!),
    enabled: !!masterId,
    staleTime: 5 * 60 * 1000,
  });
}
