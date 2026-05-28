import type { BookingStatus } from '@/types/database';

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Очікує',       color: '#D4935A', bg: 'rgba(212,147,90,0.12)'   },
  confirmed: { label: 'Підтверджено', color: '#789A99', bg: 'rgba(120,154,153,0.12)' },
  completed: { label: 'Завершено',    color: '#5C9E7A', bg: 'rgba(92,158,122,0.12)'   },
  cancelled: { label: 'Скасовано',    color: '#C05B5B', bg: 'rgba(192,91,91,0.12)'    },
  no_show:   { label: 'Не прийшов',   color: '#A8928D', bg: 'rgba(168,146,141,0.12)'  },
};
