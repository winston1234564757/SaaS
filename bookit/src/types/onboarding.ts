import type { DayKey, DaySchedule, Step } from '@/components/master/onboarding/steps/types';
import type { BreakWindow } from '@/types/database';

export type { Step };

export interface OnboardingData {
  // BASIC step
  fullName?: string;
  specialization?: string;   // emoji e.g. "💅"
  phone?: string;
  avatarUrl?: string;
  slug?: string;
  categories?: string[];

  // SCHEDULE_FORM step
  schedule?: Record<DayKey, DaySchedule>;
  bufferTime?: number;
  breaks?: BreakWindow[];

  // SERVICES_FORM step
  serviceCategoryId?: string;
  serviceBasePrice?: string;
  selectedServiceTypes?: Record<string, boolean>; // e.g. { express: true, standard: true, premium: true }

  // PROFIT_PREDICTOR step
  emptySlots?: number;        // empty windows per week (1–15)
  flashDealsEnabled?: boolean;

  // PROFILE_PREVIEW step
  businessName?: string;
}
