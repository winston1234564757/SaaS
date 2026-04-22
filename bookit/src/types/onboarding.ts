import type { DayKey, DaySchedule, Step } from '@/components/master/onboarding/steps/types';
import type { BreakWindow } from '@/types/database';

export type { Step };

export interface OnboardingData {
  // BASIC step
  fullName?: string;
  specialization?: string;   // emoji e.g. "💅"
  phone?: string;
  avatarUrl?: string;

  // SCHEDULE_FORM step
  schedule?: Record<DayKey, DaySchedule>;
  bufferTime?: number;
  breaks?: BreakWindow[];

  // SERVICES_FORM step
  serviceName?: string;
  servicePrice?: string;
  serviceDuration?: number;
}
