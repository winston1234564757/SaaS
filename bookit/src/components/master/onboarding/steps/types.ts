export type Step =
  | 'BASIC'
  | 'SCHEDULE_PROMPT'
  | 'SCHEDULE_FORM'
  | 'SERVICES_PROMPT'
  | 'SERVICES_FORM'
  | 'PROFIT_PREDICTOR'
  | 'PROFILE_PREVIEW'
  | 'SUCCESS';

export const STEP_ORDER: Step[] = [
  'BASIC',
  'SCHEDULE_PROMPT',
  'SCHEDULE_FORM',
  'SERVICES_PROMPT',
  'SERVICES_FORM',
  'PROFIT_PREDICTOR',
  'PROFILE_PREVIEW',
  'SUCCESS',
];

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type DaySchedule = { is_working: boolean; start_time: string; end_time: string };

export const DAYS_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export const DAYS_UA: Record<string, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Нд',
};

export interface SpecializationItem {
  emoji: string;
  label: string;
  group: string;
}

export interface SpecializationGroup {
  id: string;
  label: string;
}

export const SPECIALIZATION_GROUPS: SpecializationGroup[] = [
  { id: 'nails',  label: 'Нігті'       },
  { id: 'hair',   label: 'Волосся'     },
  { id: 'face',   label: 'Обличчя'     },
  { id: 'body',   label: 'Тіло'        },
  { id: 'art',    label: 'Тату/Пірс'   },
  { id: 'other',  label: 'Інше'        },
];

export const SPECIALIZATIONS: SpecializationItem[] = [
  // Нігті
  { emoji: '💅',  label: 'Манікюр',         group: 'nails' },
  { emoji: '🦶',  label: 'Педикюр',         group: 'nails' },
  { emoji: '🎨',  label: 'Нейл-арт',        group: 'nails' },
  { emoji: '💎',  label: 'Нарощення',       group: 'nails' },
  // Волосся
  { emoji: '✂️',  label: 'Стрижки',         group: 'hair'  },
  { emoji: '🌈',  label: 'Фарбування',      group: 'hair'  },
  { emoji: '💈',  label: 'Барбершоп',       group: 'hair'  },
  { emoji: '✨',  label: 'Кератин/Ботокс',  group: 'hair'  },
  // Обличчя
  { emoji: '🌿',  label: 'Брови',           group: 'face'  },
  { emoji: '👁️',  label: 'Вії (Lash)',      group: 'face'  },
  { emoji: '💄',  label: 'Макіяж',          group: 'face'  },
  { emoji: '🧖',  label: 'Косметологія',    group: 'face'  },
  { emoji: '🖌️',  label: 'ПМ Макіяж',      group: 'face'  },
  // Тіло
  { emoji: '💆',  label: 'Масаж',           group: 'body'  },
  { emoji: '🌊',  label: 'Депіляція',       group: 'body'  },
  { emoji: '🛁',  label: 'SPA',             group: 'body'  },
  { emoji: '🏋️',  label: 'Фітнес',         group: 'body'  },
  // Тату / Пірсинг
  { emoji: '🖋️',  label: 'Татуювання',     group: 'art'   },
  { emoji: '💠',  label: 'Пірсинг',         group: 'art'   },
  // Інше
  { emoji: '🌸',  label: 'Інше',            group: 'other' },
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
