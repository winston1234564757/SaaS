'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '../client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FlashDealsStats { total: number; claimed: number; }
export interface BroadcastsStats { sent: number; opened: number; converted: number; }
export interface LoyaltyStats { activeMembers: number; totalPoints: number; }
export interface ReferralStats { totalSent: number; signedUp: number; activated: number; }

interface UseAnalyticsMarketingArgs {
  masterId: string | undefined;
  startDate: string;
  endDate: string;
  /** Спільний гейт активації: !!masterId && isPro && наявні записи */
  enabled: boolean;
}

/**
 * Маркетингові/growth-статистики для вкладки «Зростання» аналітики.
 * Винесено з AnalyticsPage (M-ANL-01) без зміни логіки — 4 запити лишились
 * незалежними useQuery з тими самими ключами, гейтами та staleTime.
 */
export function useAnalyticsMarketing({
  masterId,
  startDate,
  endDate,
  enabled,
}: UseAnalyticsMarketingArgs) {
  const { data: flashDealsStats } = useQuery<FlashDealsStats>({
    queryKey: ['analytics-flash-deals', masterId, startDate, endDate],
    enabled,
    queryFn: async () => {
      const supabase = createClient();
      const { data: fd, error } = await supabase
        .from('flash_deals')
        .select('status')
        .eq('master_id', masterId!)
        .gte('slot_date', startDate)
        .lte('slot_date', endDate);
      if (error) throw error;
      const total = fd?.length ?? 0;
      const claimed = fd?.filter((d: { status: string }) => d.status === 'booked').length ?? 0;
      return { total, claimed };
    },
    staleTime: 5 * 60_000,
  });

  const { data: broadcastsStats } = useQuery<BroadcastsStats>({
    queryKey: ['analytics-broadcasts', masterId, startDate, endDate],
    enabled,
    queryFn: async () => {
      const supabase = createClient();
      const { data: b, error } = await supabase
        .from('broadcasts')
        .select('id')
        .eq('master_id', masterId!)
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      if (error) throw error;

      if (!b || b.length === 0) {
        return { sent: 0, opened: 0, converted: 0 };
      }

      const ids = b.map((item: { id: string }) => item.id);
      const { data: recipients, error: rError } = await supabase
        .from('broadcast_recipients')
        .select('push_sent, telegram_sent, sms_sent, clicked_at, booked_at')
        .in('broadcast_id', ids);
      if (rError) throw rError;

      let sent = 0;
      let opened = 0;
      let converted = 0;

      recipients?.forEach((r: {
        push_sent: boolean | null;
        telegram_sent: boolean | null;
        sms_sent: boolean | null;
        clicked_at: string | null;
        booked_at: string | null;
      }) => {
        if (r.push_sent || r.telegram_sent || r.sms_sent) sent++;
        if (r.clicked_at) opened++;
        if (r.booked_at) converted++;
      });

      return { sent, opened, converted };
    },
    staleTime: 5 * 60_000,
  });

  const { data: loyaltyStats } = useQuery<LoyaltyStats>({
    queryKey: ['analytics-loyalty-stats', masterId],
    enabled,
    queryFn: async () => {
      const supabase = createClient();
      const { data: cmr, error } = await supabase
        .from('client_master_relations')
        .select('total_visits')
        .eq('master_id', masterId!);
      if (error) throw error;

      const activeMembers = cmr?.filter((c: { total_visits: number }) => c.total_visits > 0).length ?? 0;
      const totalPoints = cmr?.reduce((sum: number, c: { total_visits: number }) => sum + (c.total_visits || 0), 0) ?? 0;

      return { activeMembers, totalPoints };
    },
    staleTime: 5 * 60_000,
  });

  const { data: referralStats } = useQuery<ReferralStats>({
    queryKey: ['analytics-referrals', masterId],
    enabled,
    queryFn: async () => {
      const supabase = createClient();
      const { data: sent, error: e1 } = await supabase
        .from('referrals')
        .select('status')
        .eq('master_id', masterId!);
      if (e1) throw e1;

      const totalSent = sent?.length ?? 0;
      const signedUp = sent?.filter((r: { status: string }) => r.status === 'signed_up' || r.status === 'activated').length ?? 0;
      const activated = sent?.filter((r: { status: string }) => r.status === 'activated').length ?? 0;

      return { totalSent, signedUp, activated };
    },
    staleTime: 5 * 60_000,
  });

  return { flashDealsStats, broadcastsStats, loyaltyStats, referralStats };
}
