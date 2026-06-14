import { escHtml } from '@/lib/telegram';
import { pluralUk } from '@/lib/utils/pluralUk';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua';

const UA_MONTHS = [
  'січня','лютого','березня','квітня','травня','червня',
  'липня','серпня','вересня','жовтня','листопада','грудня',
];

function fmtDate(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return `${d.getDate()} ${UA_MONTHS[d.getMonth()]}`;
}

function fmtTime(time: string): string {
  return time.slice(0, 5);
}

type TgButton = { text: string; url: string };

export interface NotifData {
  // Booking
  bookingId?: string;
  clientName?: string;
  masterName?: string;
  masterSlug?: string;
  date?: string;         // YYYY-MM-DD
  startTime?: string;    // HH:MM or HH:MM:SS
  services?: string;
  totalPrice?: number;
  notes?: string;
  // Review
  rating?: number;
  comment?: string;
  // Portfolio
  portfolioItemId?: string;
  portfolioItemTitle?: string;
  // Orders
  orderId?: string;
  orderItems?: string;   // "Шампунь × 2, Маска × 1"
  // Stock
  productName?: string;
  stockCount?: number;
  // Billing
  tier?: string;
  expiresAt?: string;
  // Support
  ticketId?: string;
  userRole?: 'master' | 'client';
  // Misc
  count?: number;
  bookingItems?: string; // formatted bullet list for unhandled_booking
}

interface NotifTemplate {
  isCritical: boolean;
  inApp: ((d: NotifData) => { title: string; body: string }) | null;
  push: ((d: NotifData) => { title: string; body: string; url: string }) | null;
  telegram: ((d: NotifData) => { text: string; buttons?: TgButton[][] }) | null;
  sms: ((d: NotifData) => string) | null;
}

export type NotifEventType =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'booking_completed'
  | 'unhandled_booking'
  | 'reminder_24h'
  | 'reminder_2h'
  | 'reminder_30m'
  | 'master_day_briefing'
  | 'new_review'
  | 'rebooking_reminder'
  | 'portfolio_consent_request'
  | 'order_new'
  | 'order_shipped'
  | 'order_completed'
  | 'stock_alert'
  | 'subscription_paid'
  | 'subscription_expiring'
  | 'subscription_failed'
  | 'subscription_downgraded'
  | 'support_admin_alert'
  | 'support_user_reply';

export const notifMap: Record<NotifEventType, NotifTemplate> = {

  // ── BOOKING_CREATED (new booking → master) ───────────────────────────────────
  booking_created: {
    isCritical: true,
    inApp: (d) => ({
      title: 'Новий запис',
      body: `${d.clientName} — ${fmtDate(d.date!)} о ${fmtTime(d.startTime!)}`,
    }),
    push: (d) => ({
      title: '🆕 Новий запис',
      body: `${d.clientName} — ${fmtDate(d.date!)} о ${fmtTime(d.startTime!)}`,
      url: d.bookingId ? `/dashboard/bookings?bookingId=${d.bookingId}` : '/dashboard/bookings',
    }),
    telegram: (d) => ({
      text:
        `🆕 <b>Новий запис</b>\n\n` +
        `👤 ${escHtml(d.clientName ?? '')}\n` +
        `📅 ${fmtDate(d.date!)} о ${fmtTime(d.startTime!)}\n` +
        `💅 ${escHtml(d.services ?? '')}` +
        (d.totalPrice ? `\n💰 ${Math.round(d.totalPrice)} грн` : ''),
      buttons: d.bookingId
        ? [[{ text: 'Відкрити запис', url: `${SITE_URL}/dashboard/bookings?bookingId=${d.bookingId}` }]]
        : undefined,
    }),
    sms: (d) =>
      `BookIT: Новий запис від ${d.clientName ?? 'клієнта'}. ${fmtDate(d.date!)} о ${fmtTime(d.startTime!)}, ${d.services}.`,
  },

  // ── BOOKING_CONFIRMED (master confirmed → client) ───────────────────────────
  booking_confirmed: {
    isCritical: true,
    inApp: (d) => ({
      title: 'Запис підтверджено',
      body: `${d.masterName} підтвердив ваш запис на ${fmtDate(d.date!)}`,
    }),
    push: (d) => ({
      title: '✅ Запис підтверджено',
      body: `${fmtDate(d.date!)} о ${fmtTime(d.startTime!)} — ${d.services}`,
      url: d.bookingId ? `/my/bookings?bookingId=${d.bookingId}` : '/my/bookings',
    }),
    telegram: (d) => ({
      text:
        `✅ <b>Запис підтверджено</b>\n\n` +
        `👤 Майстер: <b>${escHtml(d.masterName ?? '')}</b>\n` +
        `📅 ${fmtDate(d.date!)} о ${fmtTime(d.startTime!)}\n` +
        `💅 ${escHtml(d.services ?? '')}`,
      buttons: d.bookingId
        ? [[{ text: 'Деталі', url: `${SITE_URL}/my/bookings?bookingId=${d.bookingId}` }]]
        : undefined,
    }),
    sms: (d) =>
      `BookIT: Запис підтверджено. ${fmtDate(d.date!)} о ${fmtTime(d.startTime!)}, ${d.services}.`,
  },

  // ── BOOKING_CANCELLED ────────────────────────────────────────────────────────
  booking_cancelled: {
    isCritical: true,
    inApp: (d) => ({
      title: 'Запис скасовано',
      body: `${fmtDate(d.date!)} о ${fmtTime(d.startTime!)} — ${d.services}`,
    }),
    push: (d) => ({
      title: '❌ Запис скасовано',
      body: `${fmtDate(d.date!)} о ${fmtTime(d.startTime!)} — ${d.services}`,
      url: d.bookingId ? `/my/bookings?bookingId=${d.bookingId}` : '/my/bookings',
    }),
    telegram: (d) => ({
      text:
        `❌ <b>Запис скасовано</b>\n\n` +
        `📅 ${fmtDate(d.date!)} о ${fmtTime(d.startTime!)}\n` +
        `💅 ${escHtml(d.services ?? '')}`,
      buttons: d.bookingId
        ? [[{ text: 'Мої записи', url: `${SITE_URL}/my/bookings?bookingId=${d.bookingId}` }]]
        : undefined,
    }),
    sms: (d) =>
      `BookIT: Запис ${fmtDate(d.date!)} о ${fmtTime(d.startTime!)} скасовано.`,
  },

  // ── BOOKING_RESCHEDULED (master changed time → client) ────────────────────────
  booking_rescheduled: {
    isCritical: true,
    inApp: (d) => ({
      title: 'Час запису змінено',
      body: `Новий час: ${fmtDate(d.date!)} о ${fmtTime(d.startTime!)} — ${d.services}`,
    }),
    push: (d) => ({
      title: '🗓 Час запису змінено',
      body: `Новий час: ${fmtDate(d.date!)} о ${fmtTime(d.startTime!)}`,
      url: d.bookingId ? `/my/bookings?bookingId=${d.bookingId}` : '/my/bookings',
    }),
    telegram: (d) => ({
      text:
        `🗓 <b>Час запису змінено</b>\n\n` +
        `Майстер <b>${escHtml(d.masterName ?? '')}</b> переніс ваш запис.\n\n` +
        `📅 <b>Коли:</b> ${fmtDate(d.date!)} о ${fmtTime(d.startTime!)}\n` +
        `💅 <b>Послуги:</b> ${escHtml(d.services ?? '')}`,
      buttons: d.bookingId
        ? [[{ text: 'Деталі запису', url: `${SITE_URL}/my/bookings?bookingId=${d.bookingId}` }]]
        : undefined,
    }),
    sms: (d) =>
      `BookIT: Час запису змінено. Новий час: ${fmtDate(d.date!)} о ${fmtTime(d.startTime!)}, ${d.services}.`,
  },

  // ── BOOKING_COMPLETED (master marks done → client: review nudge) ─────────────
  booking_completed: {
    isCritical: false,
    inApp: (d) => ({
      title: 'Як пройшов візит?',
      body: `Залиште відгук для ${d.masterName} — це займе 30 секунд`,
    }),
    push: (d) => ({
      title: '⭐ Як пройшов візит?',
      body: `Залиште відгук для ${d.masterName}`,
      url: d.bookingId ? `/my/bookings?bookingId=${d.bookingId}&review=1` : '/my/bookings',
    }),
    telegram: (d) => ({
      text:
        `⭐ <b>Як пройшов візит?</b>\n\n` +
        `Залиште відгук для <b>${escHtml(d.masterName ?? '')}</b> — це допоможе іншим клієнтам.`,
      buttons: d.bookingId
        ? [[{ text: 'Залишити відгук', url: `${SITE_URL}/my/bookings?bookingId=${d.bookingId}&review=1` }]]
        : undefined,
    }),
    sms: null,
  },

  // ── UNHANDLED_BOOKING (cron → master) ────────────────────────────────────────
  unhandled_booking: {
    isCritical: false,
    inApp: (d) => ({
      title: `Незавершені записи (${d.count})`,
      body: 'Відмітьте записи як завершені, щоб клієнти могли залишити відгук',
    }),
    push: (d) => ({
      title: `⚠️ Незавершені записи (${d.count})`,
      body: 'Відмітьте записи як завершені',
      url: '/dashboard/bookings',
    }),
    telegram: (d) => ({
      text:
        `⚠️ <b>Незавершені записи (${d.count})</b>\n\n` +
        `${d.bookingItems ?? ''}\n\n` +
        `Відмітьте їх як завершені, щоб клієнти могли залишити відгук.`,
      buttons: [[{ text: 'Відкрити записи', url: `${SITE_URL}/dashboard/bookings` }]],
    }),
    sms: null,
  },

  // ── REMINDER_24H (client, NO SMS) ─────────────────────────────────────────────
  reminder_24h: {
    isCritical: false,
    inApp: (d) => ({
      title: 'Нагадування про візит',
      body: `Завтра о ${fmtTime(d.startTime!)} — ${d.services} у ${d.masterName}`,
    }),
    push: (d) => ({
      title: '🗓 Нагадування',
      body: `Завтра о ${fmtTime(d.startTime!)} — ${d.services} у ${d.masterName}`,
      url: d.bookingId ? `/my/bookings?bookingId=${d.bookingId}` : '/my/bookings',
    }),
    telegram: (d) => ({
      text:
        `🗓 <b>Нагадування про завтра</b>\n\n` +
        `👤 ${escHtml(d.masterName ?? '')}\n` +
        `⏰ ${fmtTime(d.startTime!)}\n` +
        `💅 ${escHtml(d.services ?? '')}`,
      buttons: d.bookingId
        ? [[{ text: 'Деталі', url: `${SITE_URL}/my/bookings?bookingId=${d.bookingId}` }]]
        : undefined,
    }),
    sms: null,
  },

  // ── REMINDER_2H (client, CRITICAL — SMS allowed) ───────────────────────────
  reminder_2h: {
    isCritical: true,
    inApp: (d) => ({
      title: 'Через 2 години — ваш запис',
      body: `о ${fmtTime(d.startTime!)} — ${d.services} у ${d.masterName}`,
    }),
    push: (d) => ({
      title: '⏰ Через 2 год — ваш запис',
      body: `о ${fmtTime(d.startTime!)} — ${d.services}`,
      url: d.bookingId ? `/my/bookings?bookingId=${d.bookingId}` : '/my/bookings',
    }),
    telegram: (d) => ({
      text:
        `⏰ <b>Через 2 години — ваш запис</b>\n\n` +
        `👤 ${escHtml(d.masterName ?? '')}\n` +
        `⏱ о ${fmtTime(d.startTime!)}\n` +
        `💅 ${escHtml(d.services ?? '')}`,
      buttons: d.bookingId
        ? [[{ text: 'Деталі', url: `${SITE_URL}/my/bookings?bookingId=${d.bookingId}` }]]
        : undefined,
    }),
    sms: (d) =>
      `BookIT: Нагадування! Сьогодні о ${fmtTime(d.startTime!)} — ${d.services} у ${d.masterName}.`,
  },

  // ── REMINDER_30M (client, NO SMS) ─────────────────────────────────────────────
  reminder_30m: {
    isCritical: false,
    inApp: (d) => ({
      title: 'Через 30 хвилин — ваш запис',
      body: `о ${fmtTime(d.startTime!)} — ${d.services}`,
    }),
    push: (d) => ({
      title: '🔔 Через 30 хв — ваш запис',
      body: `о ${fmtTime(d.startTime!)} — ${d.services} у ${d.masterName}`,
      url: d.bookingId ? `/my/bookings?bookingId=${d.bookingId}` : '/my/bookings',
    }),
    telegram: (d) => ({
      text:
        `🔔 <b>Через 30 хвилин — ваш запис</b>\n\n` +
        `👤 ${escHtml(d.masterName ?? '')}\n` +
        `⏱ о ${fmtTime(d.startTime!)}\n` +
        `💅 ${escHtml(d.services ?? '')}`,
      buttons: d.bookingId
        ? [[{ text: 'Деталі', url: `${SITE_URL}/my/bookings?bookingId=${d.bookingId}` }]]
        : undefined,
    }),
    sms: null,
  },

  // ── MASTER_DAY_BRIEFING (morning summary → master) ───────────────────────────
  master_day_briefing: {
    isCritical: false,
    inApp: (d) => ({
      title: `Сьогодні ${pluralUk(d.count!, 'запис', 'записи', 'записів')}`,
      body: d.bookingItems ?? 'Гарного дня!',
    }),
    push: (d) => ({
      title: `☀️ Розклад на сьогодні`,
      body: `${pluralUk(d.count!, 'запис', 'записи', 'записів')} — деталі в додатку`,
      url: '/dashboard/bookings',
    }),
    telegram: (d) => ({
      text:
        `☀️ <b>Розклад на сьогодні</b>\n\n` +
        `${d.bookingItems ?? 'Записів немає — гарного дня!'}`,
      buttons: [[{ text: 'Відкрити розклад', url: `${SITE_URL}/dashboard/bookings` }]],
    }),
    sms: null,
  },

  // ── NEW_REVIEW (client → master) ─────────────────────────────────────────────
  new_review: {
    isCritical: false,
    inApp: (d) => ({
      title: 'Новий відгук',
      body: `${d.clientName} — ${'⭐'.repeat(d.rating ?? 5)}`,
    }),
    push: (d) => ({
      title: `${'⭐'.repeat(d.rating ?? 5)} Новий відгук`,
      body: d.comment ? `${d.clientName}: ${d.comment}` : `${d.clientName} оцінив(ла) ваш сервіс`,
      url: '/dashboard/reviews',
    }),
    telegram: (d) => ({
      text:
        `${'⭐'.repeat(d.rating ?? 5)} <b>Новий відгук</b>\n\n` +
        `👤 <b>${escHtml(d.clientName ?? '')}</b> — ${d.rating}/5\n` +
        (d.comment ? `💬 ${escHtml(d.comment)}\n` : ''),
      buttons: [[{ text: 'Всі відгуки', url: `${SITE_URL}/dashboard/reviews` }]],
    }),
    sms: null,
  },

  // ── REBOOKING_REMINDER (retention cron → client) ─────────────────────────────
  rebooking_reminder: {
    isCritical: false,
    inApp: (d) => ({
      title: `Час до ${d.masterName}?`,
      body: 'Запишіться знову — ваш улюблений майстер чекає',
    }),
    push: (d) => ({
      title: `💆 Час до ${d.masterName}?`,
      body: 'Запишіться на наступний візит',
      url: d.masterSlug ? `/${d.masterSlug}` : '/my/masters',
    }),
    telegram: (d) => ({
      text:
        `💆 <b>Час до ${escHtml(d.masterName ?? '')}?</b>\n\n` +
        `Минув час після вашого останнього візиту. Запишіться знову!`,
      buttons: d.masterSlug
        ? [[{ text: 'Записатися', url: `${SITE_URL}/${d.masterSlug}` }]]
        : undefined,
    }),
    sms: null,
  },

  // ── PORTFOLIO_CONSENT_REQUEST (master tagged client) ────────────────────────
  portfolio_consent_request: {
    isCritical: false,
    inApp: (d) => ({
      title: `${d.masterName} відмітив вас у портфоліо`,
      body: `«${d.portfolioItemTitle}» — підтвердіть або відхиліть`,
    }),
    push: (d) => ({
      title: `📸 ${d.masterName} відмітив вас`,
      body: `«${d.portfolioItemTitle}» — підтвердіть участь`,
      url: '/my/notifications',
    }),
    telegram: (d) => ({
      text:
        `📸 <b>${escHtml(d.masterName ?? '')}</b> відмітив вас у роботі портфоліо:\n` +
        `«<b>${escHtml(d.portfolioItemTitle ?? '')}</b>»\n\n` +
        `Натисніть щоб підтвердити або відхилити участь.`,
      buttons: [[{ text: 'Переглянути', url: `${SITE_URL}/my/notifications` }]],
    }),
    sms: null,
  },

  // ── ORDER_NEW (new shop order → master) ───────────────────────────────────────
  order_new: {
    isCritical: false,
    inApp: (d) => ({
      title: 'Нове замовлення',
      body: d.orderItems ?? 'Замовлення з магазину',
    }),
    push: (d) => ({
      title: '🛍 Нове замовлення',
      body: d.orderItems ?? 'Перегляньте деталі в додатку',
      url: '/dashboard/products',
    }),
    telegram: (d) => ({
      text:
        `🛍 <b>Нове замовлення</b>\n\n` +
        `${escHtml(d.orderItems ?? '')}\n\n` +
        `Клієнт чекає підтвердження.`,
      buttons: [[{ text: 'Деталі замовлення', url: `${SITE_URL}/dashboard/products` }]],
    }),
    sms: null,
  },

  // ── ORDER_SHIPPED (master shipped → client) ───────────────────────────────────
  order_shipped: {
    isCritical: false,
    inApp: () => ({
      title: 'Замовлення відправлено',
      body: 'Ваше замовлення вже в дорозі',
    }),
    push: () => ({
      title: '📦 Замовлення відправлено',
      body: 'Ваше замовлення вже в дорозі',
      url: '/my/bookings',
    }),
    telegram: () => ({
      text: `📦 <b>Замовлення відправлено</b>\n\nВаше замовлення вже в дорозі!`,
    }),
    sms: null,
  },

  // ── ORDER_COMPLETED (order done → client) ─────────────────────────────────────
  order_completed: {
    isCritical: false,
    inApp: () => ({
      title: 'Замовлення готове',
      body: 'Ваше замовлення виконано',
    }),
    push: () => ({
      title: '✅ Замовлення готове',
      body: 'Можна забирати!',
      url: '/my/bookings',
    }),
    telegram: () => ({
      text: `✅ <b>Замовлення готове</b>\n\nВаше замовлення виконано. Можна забирати!`,
    }),
    sms: null,
  },

  // ── STOCK_ALERT (low stock → master) ─────────────────────────────────────────
  stock_alert: {
    isCritical: false,
    inApp: (d) => ({
      title: 'Залишок на мінімумі',
      body: `${d.productName}: залишилось ${d.stockCount} шт.`,
    }),
    push: (d) => ({
      title: '⚠️ Мало товару',
      body: `${d.productName}: залишилось ${d.stockCount} шт.`,
      url: '/dashboard/products',
    }),
    telegram: (d) => ({
      text:
        `⚠️ <b>Залишок на мінімумі</b>\n\n` +
        `Товар: <b>${escHtml(d.productName ?? '')}</b>\n` +
        `Залишилось: ${d.stockCount} шт.\n\n` +
        `Поповніть запаси вчасно.`,
      buttons: [[{ text: 'Управління товарами', url: `${SITE_URL}/dashboard/products` }]],
    }),
    sms: null,
  },

  // ── SUBSCRIPTION_PAID ────────────────────────────────────────────────────────
  subscription_paid: {
    isCritical: false,
    inApp: (d) => ({
      title: `Підписку ${d.tier ?? 'Pro'} активовано`,
      body: d.expiresAt ? `Діє до ${d.expiresAt}` : 'Підписка активна',
    }),
    push: (d) => ({
      title: `🎉 ${d.tier ?? 'Pro'} активовано`,
      body: d.expiresAt ? `Діє до ${d.expiresAt}` : 'Підписка активна',
      url: '/dashboard/billing',
    }),
    telegram: (d) => ({
      text:
        `🎉 <b>Підписку ${escHtml(d.tier ?? 'Pro')} активовано</b>\n\n` +
        (d.expiresAt ? `Діє до: ${escHtml(d.expiresAt)}\n` : '') +
        `Дякуємо за довіру до BookIT!`,
    }),
    sms: null,
  },

  // ── SUBSCRIPTION_EXPIRING ─────────────────────────────────────────────────────
  subscription_expiring: {
    isCritical: false,
    inApp: (d) => ({
      title: `Підписка закінчується за 3 дні`,
      body: d.expiresAt ? `Термін дії: до ${d.expiresAt}` : 'Поновіть підписку',
    }),
    push: (d) => ({
      title: `⏳ Підписка закінчується`,
      body: d.expiresAt ? `До ${d.expiresAt} — поновіть вчасно` : 'Поновіть підписку за 3 дні',
      url: '/dashboard/billing',
    }),
    telegram: (d) => ({
      text:
        `⏳ <b>Підписка закінчується за 3 дні</b>\n\n` +
        (d.expiresAt ? `Термін дії: до ${escHtml(d.expiresAt)}\n\n` : '') +
        `Поновіть підписку, щоб не втратити доступ до Pro-функцій.`,
      buttons: [[{ text: 'Поновити підписку', url: `${SITE_URL}/dashboard/billing` }]],
    }),
    sms: null,
  },

  // ── SUBSCRIPTION_FAILED (CRITICAL — SMS allowed) ─────────────────────────────
  subscription_failed: {
    isCritical: true,
    inApp: () => ({
      title: 'Оплата не пройшла',
      body: 'Перевірте реквізити картки в налаштуваннях білінгу',
    }),
    push: () => ({
      title: '❌ Оплата не пройшла',
      body: 'Перевірте картку щоб не втратити Pro-доступ',
      url: '/dashboard/billing',
    }),
    telegram: () => ({
      text:
        `❌ <b>Оплата за підписку не пройшла</b>\n\n` +
        `Перевірте реквізити картки та переконайтесь, що на ній достатньо коштів.`,
      buttons: [[{ text: 'Налаштування білінгу', url: `${SITE_URL}/dashboard/billing` }]],
    }),
    sms: () => `BookIT Pro: Оплата не пройшла. Перевірте картку на bookit.com.ua/billing`,
  },

  // ── SUBSCRIPTION_DOWNGRADED ───────────────────────────────────────────────────
  subscription_downgraded: {
    isCritical: false,
    inApp: () => ({
      title: 'Акаунт переведено на Starter',
      body: 'Pro-функції недоступні. Поновіть підписку для відновлення доступу',
    }),
    push: () => ({
      title: '📉 Акаунт переведено на Starter',
      body: 'Поновіть підписку для відновлення Pro-доступу',
      url: '/dashboard/billing',
    }),
    telegram: () => ({
      text:
        `📉 <b>Акаунт переведено на Starter</b>\n\n` +
        `Pro-функції тимчасово недоступні. Поновіть підписку для відновлення доступу.`,
      buttons: [[{ text: 'Поновити', url: `${SITE_URL}/dashboard/billing` }]],
    }),
    sms: null,
  },

  // ── SUPPORT_ADMIN_ALERT (user messages admin → admin) ─────────────────────────
  support_admin_alert: {
    isCritical: false,
    inApp: null,
    push: null,
    telegram: (d) => ({
      text:
        `🎧 <b>Нове повідомлення в підтримку</b>\n\n` +
        `👤 Від: <b>${escHtml(d.clientName ?? 'Користувач')}</b>\n` +
        `💬 Повідомлення: <i>${escHtml(d.comment ?? '')}</i>`,
      buttons: d.ticketId
        ? [[{ text: 'Відкрити чат', url: `${SITE_URL}/admin/support?ticketId=${d.ticketId}` }]]
        : [[{ text: 'Всі звернення', url: `${SITE_URL}/admin/support` }]],
    }),
    sms: null,
  },

  // ── SUPPORT_USER_REPLY (admin replies user → client/master) ───────────────────
  support_user_reply: {
    isCritical: false,
    inApp: (d) => ({
      title: 'Відповідь від підтримки BookIT',
      body: d.comment ?? 'Нове повідомлення',
    }),
    push: (d) => ({
      title: '🎧 Відповідь підтримки BookIT',
      body: d.comment ?? 'Нове повідомлення',
      url: d.userRole === 'client' ? '/my/support/chat' : '/dashboard/support/chat',
    }),
    telegram: (d) => ({
      text:
        `🎧 <b>Відповідь від підтримки BookIT</b>\n\n` +
        `💬 <i>${escHtml(d.comment ?? '')}</i>`,
      buttons: [[{ text: 'Відкрити чат', url: `${SITE_URL}${d.userRole === 'client' ? '/my/support/chat' : '/dashboard/support/chat'}` }]],
    }),
    sms: null,
  },
};
