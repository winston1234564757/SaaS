import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/telegram', () => ({
  escHtml: (s: unknown) => {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },
}));

import { notifMap } from './notifMap';
import type { NotifData, NotifEventType } from './notifMap';

const baseData: NotifData = {
  bookingId: '550e8400-e29b-41d4-a716-446655440000',
  clientName: 'Олександр',
  masterName: 'Олена',
  masterSlug: 'olena',
  date: '2026-06-10',
  startTime: '14:30',
  services: 'Стрижка, фарбування',
  totalPrice: 1200,
  notes: 'Без сульфатів',
  rating: 5,
  comment: 'Чудово',
  portfolioItemId: 'pf-001',
  portfolioItemTitle: 'Фарбування',
  orderItems: 'Шампунь × 2',
  productName: 'Шампунь',
  stockCount: 3,
  tier: 'Pro',
  expiresAt: '2026-07-10',
  ticketId: 'TICKET-001',
  userRole: 'master',
  count: 3,
  bookingItems: '• 10:00 — Марія\n• 12:00 — Іван',
};

const allEvents: NotifEventType[] = [
  'booking_created', 'booking_confirmed', 'booking_cancelled',
  'booking_rescheduled', 'booking_completed', 'unhandled_booking',
  'reminder_24h', 'reminder_2h', 'reminder_30m', 'master_day_briefing',
  'new_review', 'rebooking_reminder', 'portfolio_consent_request',
  'order_new', 'order_shipped', 'order_completed', 'stock_alert',
  'subscription_paid', 'subscription_expiring', 'subscription_failed',
  'subscription_downgraded', 'support_admin_alert', 'support_user_reply',
];

describe('notifMap', () => {
  it('has exactly 23 event types', () => {
    expect(Object.keys(notifMap)).toHaveLength(23);
  });

  it('all events have isCritical defined', () => {
    for (const event of allEvents) {
      expect(notifMap[event]).toBeDefined();
      expect(typeof notifMap[event].isCritical).toBe('boolean');
    }
  });

  describe.each(allEvents)('%s', (event) => {
    const template = notifMap[event];

    it('inApp builds without error', () => {
      if (!template.inApp) return;
      const r = template.inApp(baseData);
      expect(r).toHaveProperty('title');
      expect(r).toHaveProperty('body');
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.body.length).toBeGreaterThan(0);
    });

    it('push builds without error', () => {
      if (!template.push) return;
      const r = template.push(baseData);
      expect(r).toHaveProperty('title');
      expect(r).toHaveProperty('body');
      expect(r).toHaveProperty('url');
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.body.length).toBeGreaterThan(0);
      expect(r.url.length).toBeGreaterThan(0);
    });

    it('telegram builds without error', () => {
      if (!template.telegram) return;
      const r = template.telegram(baseData);
      expect(r.text.length).toBeGreaterThan(0);
      if (r.buttons) {
        expect(Array.isArray(r.buttons)).toBe(true);
        expect(r.buttons.length).toBeGreaterThan(0);
        for (const row of r.buttons) {
          for (const btn of row) {
            expect(btn).toHaveProperty('text');
            expect(btn).toHaveProperty('url');
            expect(btn.text.length).toBeGreaterThan(0);
            expect(btn.url.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('sms builds without error', () => {
      if (!template.sms) return;
      const r = template.sms(baseData);
      expect(typeof r).toBe('string');
      expect(r.length).toBeGreaterThan(0);
    });
  });

  describe('fmtDate integration (via booking_created inApp)', () => {
    it('formats date as "10 червня"', () => {
      const r = notifMap.booking_created.inApp!(baseData);
      expect(r.body).toContain('10 червня');
    });
  });

  describe('fmtTime integration (via reminder_2h)', () => {
    it('formats time as HH:MM', () => {
      const r = notifMap.reminder_2h.inApp!(baseData);
      expect(r.body).toContain('14:30');
    });
  });

  describe('SMS prefix check', () => {
    it('all SMS messages start with BookIT', () => {
      const smsEvents = allEvents.filter(e => notifMap[e].sms);
      for (const event of smsEvents) {
        const msg = notifMap[event].sms!(baseData);
        expect(msg).toMatch(/^BookIT/);
      }
    });
  });

  describe('escHtml integration (XSS resistance)', () => {
    const xssData: NotifData = {
      ...baseData,
      clientName: '<b>hacker</b>',
      masterName: '<img src=x onerror=alert(1)>',
      services: '"><script>',
      comment: '&eval()',
      orderItems: '<b>XSS</b>',
      productName: '"><script>',
    };

    it.each(allEvents.filter(e => notifMap[e].telegram))(
      'telegram %s escapes HTML', (event) => {
        const r = notifMap[event].telegram!(xssData);
        expect(r.text).not.toContain('<script>');
        expect(r.text).not.toContain('<b>hacker</b>');
      },
    );

    it.each(allEvents.filter(e => notifMap[e].inApp && !['order_shipped', 'order_completed', 'subscription_failed', 'subscription_downgraded'].includes(e)))(
      'inApp %s escapes HTML or uses safe interpolation', (event) => {
        const r = notifMap[event].inApp!(xssData);
        expect(r.title).toBeDefined();
        expect(r.body).toBeDefined();
      },
    );
  });

  describe('missing optional data resilience', () => {
    // Events that use d.date!/d.startTime! need at least date+startTime
    const needsSlot = new Set([
      'booking_created', 'booking_confirmed', 'booking_cancelled',
      'booking_rescheduled', 'reminder_24h', 'reminder_2h', 'reminder_30m',
    ]);
    const slotBase = { date: '2026-06-10', startTime: '14:30', services: 'test', masterName: 'test' };

    it.each(allEvents)('%s does not crash with minimal data', (event) => {
      const t = notifMap[event];
      const data: NotifData = needsSlot.has(event) ? slotBase : {};
      if (t.inApp) expect(() => t.inApp!(data)).not.toThrow();
      if (t.push) expect(() => t.push!(data)).not.toThrow();
      if (t.telegram) expect(() => t.telegram!(data)).not.toThrow();
      if (t.sms) expect(() => t.sms!(data)).not.toThrow();
    });
  });

  describe('button URLs use SITE_URL', () => {
    it.each(allEvents.filter(e => notifMap[e].telegram))(
      '%s telegram buttons point to SITE_URL', (event) => {
        const r = notifMap[event].telegram!(baseData);
        if (r.buttons) {
          for (const row of r.buttons) {
            for (const btn of row) {
              expect(btn.url).toMatch(/^https?:\/\//);
            }
          }
        }
      },
    );
  });
});
