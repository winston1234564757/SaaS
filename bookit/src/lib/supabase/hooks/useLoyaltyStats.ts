'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface LoyaltyProgramStat {
  id: string;
  on_track: number;
  reached: number;
}

export interface LoyaltyOverview {
  has_programs: boolean;
  in_progress: number;
  ready: number;
  one_step: number;
  programs: LoyaltyProgramStat[];
}

export interface LoyaltyImpact {
  given_hryvnia: number;
  redemptions: number;
}

/**
 * M-GROW-01: майстер-side статистика лояльності.
 * Обидві RPC GRANT authenticated → кличуться client-side з JWT майстра (auth.uid()).
 * Overview = pipeline all-time (client_master_relations.total_visits).
 * Impact   = redemption forward-only, 30 днів (bookings.loyalty_amount/label).
 */
export function useLoyaltyStats(masterId: string | undefined) {
  const overview = useQuery<LoyaltyOverview>({
    queryKey: ['loyaltyOverview', masterId],
    enabled: !!masterId,
    staleTime: 60_000,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_loyalty_overview');
      if (error) throw error;
      return data as LoyaltyOverview;
    },
  });

  const impact = useQuery<LoyaltyImpact>({
    queryKey: ['loyaltyImpact', masterId],
    enabled: !!masterId,
    staleTime: 60_000,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_loyalty_impact');
      if (error) throw error;
      return data as LoyaltyImpact;
    },
  });

  return { overview, impact };
}
