export type UserRole = 'master' | 'client' | 'admin';
import type { PricingRules } from '@/lib/utils/dynamicPricing';

// ── Working-hours scheduling config (master_profiles.working_hours JSONB) ─────

export interface BreakWindow {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export interface WorkingHoursConfig {
  /** Minutes of empty time required between the end of one booking and the start of the next */
  buffer_time_minutes: number;
  /** Break windows applied to every working day (e.g. lunch 13:00–14:00) */
  breaks: BreakWindow[];
}
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type SubscriptionTier = 'starter' | 'pro' | 'studio';
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type NotificationChannel = 'push' | 'telegram' | 'sms';
export type ReferralStatus = 'pending' | 'registered' | 'activated';
export type FlashDealStatus = 'active' | 'claimed' | 'expired';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  telegram_chat_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MasterProfile {
  id: string;
  slug: string;
  business_name: string | null;
  bio: string | null;
  categories: string[];
  mood_theme: string;
  accent_color: string;
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
  commission_rate: number;
  rating: number;
  rating_count: number;
  is_published: boolean;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  floor: string | null;
  cabinet: string | null;
  instagram_url: string | null;
  telegram_url: string | null;
  telegram_chat_id: string | null;
  avatar_emoji: string;
  has_seen_tour: boolean;
  seen_tours: Record<string, boolean>;
  pricing_rules?: PricingRules | null;
  working_hours?: WorkingHoursConfig | null;
  timezone?: string | null;
  referral_code?: string | null;
  referred_by?: string | null;
  dynamic_pricing_extra_earned?: number | null;
  retention_cycle_days?: number | null;
  created_at: string;
  updated_at: string;
}

// ── Rate-limiting & auth tables ──────────────────────────────────────────────

export interface SmsOtp {
  id: number;
  phone: string;
  otp: string;
  used: boolean;
  created_at: string;
}

export interface SmsVerifyAttempt {
  id: number;
  phone: string;
  created_at: string;
}

export interface SmsIpLog {
  id: number;
  ip_address: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface ClientProfile {
  id: string;
  referral_code: string | null;
  ambassador_level: number;
  total_bookings: number;
  total_masters_invited: number;
  created_at: string;
}

export interface Service {
  id: string;
  master_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  price: number;
  price_max: number | null;
  image_url: string | null;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  master_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  master_id: string;
  client_id: string | null;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  status_changed_at: string | null;
  total_services_price: number;
  total_products_price: number;
  total_price: number;
  deposit_amount: number;
  deposit_paid: boolean;
  commission_amount: number;
  notes: string | null;
  master_notes: string | null;
  source: string;
  cancellation_reason: string | null;
  next_visit_suggestion: string | null;
  flash_deal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleTemplate {
  id: string;
  master_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_working: boolean;
}

export interface ClientMasterRelation {
  id: string;
  client_id: string;
  master_id: string;
  total_visits: number;
  total_spent: number;
  average_check: number;
  last_visit_at: string | null;
  favorite_service_id: string | null;
  is_vip: boolean;
  client_tag: string | null;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyProgram {
  id: string;
  master_id: string;
  name: string;
  description: string | null;
  target_visits: number;
  reward_type: 'percent_discount' | 'fixed_discount' | 'free_service';
  reward_value: number;
  is_active: boolean;
  created_at: string;
}
