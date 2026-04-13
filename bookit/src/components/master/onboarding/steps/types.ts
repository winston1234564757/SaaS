export type Step =
  | 'BASIC'
  | 'SCHEDULE_PROMPT'
  | 'SCHEDULE_FORM'
  | 'SERVICES_PROMPT'
  | 'SERVICES_FORM'
  | 'SUCCESS';

export const STEP_ORDER: Step[] = [
  'BASIC',
  'SCHEDULE_PROMPT',
  'SCHEDULE_FORM',
  'SERVICES_PROMPT',
  'SERVICES_FORM',
  'SUCCESS',
];

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type DaySchedule = { is_working: boolean; start_time: string; end_time: string };

export const DAYS_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export const DAYS_UA: Record<string, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Нд',
};

export const SPECIALIZATIONS = [
  { emoji: '💅', label: 'Манікюр' },
  { emoji: '✂️', label: 'Стрижки' },
  { emoji: '💆', label: 'Масаж' },
  { emoji: '👁️', label: 'Lash' },
  { emoji: '🌸', label: 'Брови' },
  { emoji: '💄', label: 'Макіяж' },
  { emoji: '💎', label: 'Нарощення' },
  { emoji: '✨', label: 'Інше' },
];

export const BUFFER_PRESETS = [0, 5, 10, 15, 20, 30];
export const DURATION_PRESETS = [30, 45, 60, 90, 120];

export const DEFAULT_SCHEDULE = Object.fromEntries(
  DAYS_ORDER.map(d => [d, { is_working: !['sat', 'sun'].includes(d), start_time: '09:00', end_time: '18:00' }])
) as Record<DayKey, DaySchedule>;

export const TEMPLATE_SCHEDULE = Object.fromEntries(
  DAYS_ORDER.map(d => [d, { is_working: !['sat', 'sun'].includes(d), start_time: '10:00', end_time: '19:00' }])
) as Record<DayKey, DaySchedule>;

export const inputCls = 'w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/80 text-sm text-[#2C1A14] placeholder-[#A8928D] outline-none focus:bg-white focus:border-[#789A99] focus:ring-2 focus:ring-[#789A99]/20 transition-all';
