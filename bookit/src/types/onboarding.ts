import type { DayKey, DaySchedule, Step } from '@/components/master/onboarding/steps/types';
import type { BreakWindow } from '@/types/database';

export type { Step };

export interface OnboardingData {
  // PROFILE step
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  slug?: string;
  categories?: string[];

  // SERVICES step — per-category state
  categoryPrices?: Record<string, string>;
  categoryServiceTypes?: Record<string, Record<string, boolean>>;
  // Legacy fields (kept for backward compat with existing DB data)
  serviceCategoryId?: string;
  serviceBasePrice?: string;
  selectedServiceTypes?: Record<string, boolean>;

  // SCHEDULE step
  schedule?: Record<DayKey, DaySchedule>;
  bufferTime?: number;
  breaks?: BreakWindow[];
}
