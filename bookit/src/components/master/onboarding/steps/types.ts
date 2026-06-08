export type Step = 'PROFILE' | 'SERVICES' | 'SCHEDULE' | 'PREVIEW' | 'SUCCESS';

export const STEP_ORDER: Step[] = ['PROFILE', 'SERVICES', 'SCHEDULE', 'PREVIEW', 'SUCCESS'];

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type DaySchedule = { is_working: boolean; start_time: string; end_time: string };

export const DAYS_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export const DAYS_UA: Record<string, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Нд',
};

export interface SpecializationItem {
  label: string;
  group: string;
}

export interface SpecializationGroup {
  id: string;
  label: string;
}

export const SPECIALIZATION_GROUPS: SpecializationGroup[] = [
  { id: 'nails',  label: 'Нігті'      },
  { id: 'hair',   label: 'Волосся'    },
  { id: 'face',   label: 'Обличчя'    },
  { id: 'body',   label: 'Тіло'       },
  { id: 'art',    label: 'Тату/Пірс'  },
  { id: 'other',  label: 'Інше'       },
];

export const SPECIALIZATIONS: SpecializationItem[] = [
  // Нігті
  { label: 'Манікюр',        group: 'nails' },
  { label: 'Педикюр',        group: 'nails' },
  { label: 'Нейл-арт',       group: 'nails' },
  { label: 'Нарощення',      group: 'nails' },
  // Волосся
  { label: 'Стрижки',        group: 'hair'  },
  { label: 'Фарбування',     group: 'hair'  },
  { label: 'Барбершоп',      group: 'hair'  },
  { label: 'Кератин/Ботокс', group: 'hair'  },
  // Обличчя
  { label: 'Брови',          group: 'face'  },
  { label: 'Вії (Lash)',     group: 'face'  },
  { label: 'Макіяж',         group: 'face'  },
  { label: 'Косметологія',   group: 'face'  },
  { label: 'ПМ Макіяж',     group: 'face'  },
  // Тіло
  { label: 'Масаж',          group: 'body'  },
  { label: 'Депіляція',      group: 'body'  },
  { label: 'SPA',            group: 'body'  },
  { label: 'Фітнес',        group: 'body'  },
  // Тату / Пірсинг
  { label: 'Татуювання',    group: 'art'   },
  { label: 'Пірсинг',        group: 'art'   },
  // Інше
  { label: 'Інше',           group: 'other' },
];

export const BUFFER_PRESETS = [0, 5, 10, 15, 20, 30];
export const DURATION_PRESETS = [30, 45, 60, 90, 120];

export const DEFAULT_SCHEDULE = Object.fromEntries(
  DAYS_ORDER.map(d => [d, { is_working: !['sat', 'sun'].includes(d), start_time: '09:00', end_time: '18:00' }])
) as Record<DayKey, DaySchedule>;

// Standard schedule shown as the one-tap default in onboarding (Mon-Sat, 10:00-19:00)
export const TEMPLATE_SCHEDULE = Object.fromEntries(
  DAYS_ORDER.map(d => [d, { is_working: d !== 'sun', start_time: '10:00', end_time: '19:00' }])
) as Record<DayKey, DaySchedule>;

export const inputCls = 'w-full px-4 py-3 rounded-lg bg-secondary/70 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:bg-secondary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all';
