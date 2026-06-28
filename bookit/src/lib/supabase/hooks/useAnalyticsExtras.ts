'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { createClient } from '../client';
import { useMasterContext } from '../context';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WinbackCandidate {
  client_name: string;
  client_phone: string;
  ltv: number; // в копійках
  last_visit_date: string;
  days_inactive: number;
}

export interface AnomalyAlert {
  date: string;
  dow: number;
  booking_count: number;
  avg_bookings: number;
  deviation: number;
  alert_type: string;
}

export interface ServicePair {
  service_a: string;
  service_b: string;
  pair_count: number;
}

export interface OccupancyPoint {
  dow: number;
  hour: number;
  occupancy_pct: number;
}

export interface CohortPoint {
  cohort_month: string;
  cohort_size: number;
  month_diff: number;
  retention_pct: number;
}

// ── V2 Types ───────────────────────────────────────────────────────────────────

export interface BusinessHealth {
  score: number;
  retention_score: number;
  noshow_score: number;
  ticket_score: number;
  occupancy_score: number;
  ltv_score: number;
}

export interface ChurnPrediction {
  client_id: string;
  client_name: string;
  client_phone: string;
  last_visit_date: string;
  days_inactive: number;
  avg_interval: number;
  ltv: number;
  risk_level: 'high' | 'medium';
}

export interface CrossSellItem {
  service_a: string;
  service_b: string;
  pair_count: number;
  avg_days: number;
  conversion_pct: number;
}

export interface IdleSlotCostItem {
  dow: number;
  hour: number;
  empty_count: number;
  lost_revenue: number;
}

export interface FinanceServiceItem {
  service_id: string;
  service_name: string;
  bookings_count: number;
  revenue_kopecks: number;
  cost_kopecks: number;
  margin_pct: number;
}

export interface FinanceProductItem {
  product_id: string;
  product_name: string;
  sold_qty: number;
  revenue_kopecks: number;
  cost_kopecks: number;
  margin_pct: number;
}

export interface FinanceAnalytics {
  services_revenue: number;
  products_revenue: number;
  materials_cost: number;
  discount_amount: number;
  operational_expenses_total: number;
  net_profit: number;
  services: FinanceServiceItem[];
  products: FinanceProductItem[];
}

export interface StockForecastItem {
  product_id: string;
  product_name: string;
  stock_qty: number;
  stock_alert_threshold: number | null;
  cost_kopecks: number | null;
  required_qty_14_days: number;
  used_qty_past_30_days: number;
  predicted_days_left: number;
}

export interface GoalProgress {
  revenue_kopecks: number;
  target_kopecks: number;
  progress_pct: number;
}

export interface AnalyticsExtras {
  dynamic_pricing_uplift?: {
    uplift_kopecks: number;
    rule_counts: Record<string, number>;
    saved_slots?: number;
  };
  ltv_concentration?: {
    concentration_pct: number;
    ltv_distribution: Record<string, number>;
    winback_candidates: WinbackCandidate[];
  };
  cohort_matrix?: CohortPoint[];
  occupancy_heatmap?: OccupancyPoint[];
  anomaly_alerts?: AnomalyAlert[];
  service_pairing?: ServicePair[];
  
  // V2 fields
  business_health?: BusinessHealth;
  churn_predictions?: ChurnPrediction[];
  cross_sell_matrix?: CrossSellItem[];
  idle_slots_cost?: IdleSlotCostItem[];
  finances?: FinanceAnalytics;
  stock_forecast?: StockForecastItem[];
  goal_progress?: GoalProgress;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAnalyticsExtras({
  start,
  end,
  isPro,
  scope = 'all',
  enabled = true,
}: {
  start: string;
  end: string;
  isPro: boolean;
  scope?: 'all' | 'main' | 'growth' | 'ops' | 'engagement' | 'health' | 'finances' | 'stock';
  enabled?: boolean;
}) {
  const { masterProfile } = useMasterContext();
  const masterId = masterProfile?.id;

  return useQuery({
    queryKey: ['analytics-extras', masterId, start, end, isPro, scope],
    enabled: !!masterId && enabled,
    staleTime: 5 * 60_000, // 5 min
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<AnalyticsExtras> => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_analytics_extras', {
        p_master_id: masterId!,
        p_start_date: start,
        p_end_date: end,
        p_is_pro: isPro,
        p_scope: scope,
      });

      if (error) throw error;
      return (data ?? {}) as AnalyticsExtras;
    },
  });
}
