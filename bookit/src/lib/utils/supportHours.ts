/**
 * BookIT support working hours → honest presence label for the support chat.
 * Підтримка працює щодня з 8:00 до 20:00 (підтверджено founder 2026-07-02).
 */
const SUPPORT_START_HOUR = 8;
const SUPPORT_END_HOUR = 20;

export interface SupportPresence {
  online: boolean;
  label: string;
}

export function getSupportPresence(now: Date = new Date()): SupportPresence {
  const online = now.getHours() >= SUPPORT_START_HOUR && now.getHours() < SUPPORT_END_HOUR;

  return online
    ? { online: true, label: 'Онлайн · зазвичай відповідаємо за 15 хвилин' }
    : { online: false, label: 'Офлайн · працюємо щодня, 8:00-20:00' };
}
