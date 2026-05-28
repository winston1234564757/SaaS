// src/components/shared/wizard/helpers.ts
import type { WizardStep } from './types';
import { getNow } from '@/lib/utils/now';

export const DOW     = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const DAY_S   = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
export const MONTH_S = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDays(n = 30): Date[] {
  const t = getNow(); t.setHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(t); d.setDate(t.getDate() + i); return d;
  });
}

export function fmt(n: number): string {
  return n.toLocaleString('uk-UA') + ' ₴';
}

export const ALL_STEPS: WizardStep[] = ['services', 'datetime', 'products', 'details', 'success'];
export const PROGRESS: WizardStep[]  = ['services', 'datetime', 'products', 'details'];

export const STEP_TITLE: Record<WizardStep, string | ((m: string) => string)> = {
  services: 'Обери послуги',
  datetime: 'Дата та час',
  products: 'Додати товари',
  details:  (m) => m === 'master' ? 'Деталі запису' : 'Твої контакти',
  success:  '',
};

export const slide = {
  enter:  (d: number) => ({ x: d > 0 ? 52 : -52, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? -52 : 52, opacity: 0 }),
};
