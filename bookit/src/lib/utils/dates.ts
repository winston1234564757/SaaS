import { format, isToday, isTomorrow, isYesterday, formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return 'Сьогодні';
  if (isTomorrow(d)) return 'Завтра';
  if (isYesterday(d)) return 'Вчора';
  return format(d, 'd MMMM', { locale: uk });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm');
}

export function formatDateFull(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMMM yyyy', { locale: uk });
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: uk });
}

export function getDayOfWeek(date: Date): 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  return days[date.getDay()];
}

export function pluralize(count: number, forms: [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${count} ${forms[2]}`;
  if (mod10 === 1) return `${count} ${forms[0]}`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} ${forms[1]}`;
  return `${count} ${forms[2]}`;
}

function pluralForm(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return `${n} ${many}`;
  if (mod10 === 1) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

export function formatDurationFull(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hStr = pluralForm(h, 'година', 'години', 'годин');
  const mStr = pluralForm(m, 'хвилина', 'хвилини', 'хвилин');
  if (!h) return mStr;
  if (!m) return hStr;
  return `${hStr} ${mStr}`;
}

export function formatDayFull(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'EEEE', { locale: uk });
}
