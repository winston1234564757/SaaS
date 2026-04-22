import type { DayKey, DaySchedule, Step } from '@/components/master/onboarding/steps/types';

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
  breaks?: Array<{ start: string; end: string }>;

  // SERVICES_FORM step
  serviceName?: string;
  servicePrice?: string;
  serviceDuration?: number;
}
