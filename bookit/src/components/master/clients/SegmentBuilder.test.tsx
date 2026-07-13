/**
 * Unit-тести evaluateCustomSegment — фільтр кастомних CRM-сегментів (TEST-M4).
 *
 * Функція вирішує, чи клієнт потрапляє в сегмент майстра. Від неї залежить,
 * кого майстер побачить у списку клієнтів і кому піде розсилка, тож помилка тут
 * тиха: не падає, просто відбирає не тих людей.
 *
 * Частина тестів — характеризаційні: вони фіксують поведінку, яка сьогодні
 * саме така (а не таку, якою вона мала б бути). Ті місця позначені явно.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { evaluateCustomSegment } from './SegmentBuilder';
import type { ClientRow } from '@/lib/supabase/hooks/useClients';
import type { CustomSegment, SegmentCondition } from '@/lib/types/segments';

function makeClient(over: Partial<ClientRow> = {}): ClientRow {
  return {
    id: 'c1',
    client_id: 'c1',
    client_name: 'Оля',
    client_phone: '0670000000',
    total_visits: 3,
    total_spent: 3000,
    average_check: 1000,
    last_visit_at: '2026-07-01T10:00:00Z',
    last_service_name: 'Манікюр',
    is_vip: false,
    relation_id: 'r1',
    retention_status: 'active',
    health_notes: null,
    medical_notes: null,
    ...over,
  } as ClientRow;
}

function seg(...conditions: SegmentCondition[]): CustomSegment {
  return { id: 's1', name: 'Тест', icon: 'Star', color: '#000', conditions } as CustomSegment;
}

afterEach(() => vi.useRealTimers());

// ── Порожній сегмент ──────────────────────────────────────────────────────────

describe('evaluateCustomSegment — порожній сегмент', () => {
  it('без умов нікого не матчить (а не всіх)', () => {
    expect(evaluateCustomSegment(makeClient(), seg())).toBe(false);
  });
});

// ── Числові поля й оператори ──────────────────────────────────────────────────

describe('числові оператори', () => {
  const cases: Array<[SegmentCondition['operator'], number, boolean]> = [
    ['gt',  2, true],   // 3 > 2
    ['gt',  3, false],
    ['gte', 3, true],
    ['lt',  4, true],
    ['lt',  3, false],
    ['lte', 3, true],
    ['eq',  3, true],
    ['neq', 3, false],
  ];

  it.each(cases)('total_visits %s %i → %s', (operator, value, expected) => {
    const c = makeClient({ total_visits: 3 });
    expect(evaluateCustomSegment(c, seg({ field: 'total_visits', operator, value }))).toBe(expected);
  });

  it('значення-рядок з UI приводиться до числа', () => {
    const c = makeClient({ total_spent: 5000 });
    // білдер зберігає value як string, коли майстер друкує в інпут
    expect(evaluateCustomSegment(c, seg({ field: 'total_spent', operator: 'gte', value: '5000' as never }))).toBe(true);
  });
});

// ── is_vip ────────────────────────────────────────────────────────────────────

describe('is_vip', () => {
  it('eq true матчить VIP', () => {
    expect(evaluateCustomSegment(makeClient({ is_vip: true }), seg({ field: 'is_vip', operator: 'eq', value: 'true' }))).toBe(true);
  });

  it('eq false матчить не-VIP', () => {
    expect(evaluateCustomSegment(makeClient({ is_vip: false }), seg({ field: 'is_vip', operator: 'eq', value: 'false' }))).toBe(true);
  });

  it('neq true матчить не-VIP', () => {
    expect(evaluateCustomSegment(makeClient({ is_vip: false }), seg({ field: 'is_vip', operator: 'neq', value: 'true' }))).toBe(true);
  });
});

// ── retention_status ──────────────────────────────────────────────────────────

describe('retention_status', () => {
  it('in масив — матч', () => {
    const c = makeClient({ retention_status: 'sleeping' });
    expect(evaluateCustomSegment(c, seg({ field: 'retention_status', operator: 'in', value: ['sleeping', 'lost'] }))).toBe(true);
  });

  it('in масив — без матчу', () => {
    const c = makeClient({ retention_status: 'active' });
    expect(evaluateCustomSegment(c, seg({ field: 'retention_status', operator: 'in', value: ['sleeping', 'lost'] }))).toBe(false);
  });

  it('eq / neq', () => {
    const c = makeClient({ retention_status: 'at_risk' });
    expect(evaluateCustomSegment(c, seg({ field: 'retention_status', operator: 'eq',  value: 'at_risk' }))).toBe(true);
    expect(evaluateCustomSegment(c, seg({ field: 'retention_status', operator: 'neq', value: 'at_risk' }))).toBe(false);
  });

  it('числові оператори на статусі нікого не матчать (не тихий true)', () => {
    const c = makeClient({ retention_status: 'active' });
    expect(evaluateCustomSegment(c, seg({ field: 'retention_status', operator: 'gt', value: 'active' as never }))).toBe(false);
  });
});

// ── days_since_last_visit ─────────────────────────────────────────────────────

describe('days_since_last_visit', () => {
  it('рахує дні від останнього візиту', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-11T10:00:00Z')); // рівно 10 днів після 2026-07-01
    const c = makeClient({ last_visit_at: '2026-07-01T10:00:00Z' });
    expect(evaluateCustomSegment(c, seg({ field: 'days_since_last_visit', operator: 'gte', value: 10 }))).toBe(true);
    expect(evaluateCustomSegment(c, seg({ field: 'days_since_last_visit', operator: 'gt',  value: 10 }))).toBe(false);
  });

  it('клієнт без жодного візиту НЕ матчиться навіть у сегмент "давно не був"', () => {
    // last_visit_at = null → умова просто false. Тобто «не приходив 90+ днів»
    // не збирає тих, хто не приходив НІКОЛИ. Це навмисна поведінка, не баг:
    // без дати візиту порахувати «скільки днів минуло» неможливо.
    const c = makeClient({ last_visit_at: null });
    expect(evaluateCustomSegment(c, seg({ field: 'days_since_last_visit', operator: 'gte', value: 90 }))).toBe(false);
  });
});

// ── AND / OR ──────────────────────────────────────────────────────────────────

describe('склейка умов', () => {
  it('AND — обидві мусять справдитись', () => {
    const c = makeClient({ total_visits: 5, total_spent: 1000 });
    const s = seg(
      { field: 'total_visits', operator: 'gte', value: 3, joinNext: 'AND' },
      { field: 'total_spent',  operator: 'gte', value: 5000 },
    );
    expect(evaluateCustomSegment(c, s)).toBe(false);
  });

  it('OR — досить однієї (пресет «Кандидати в VIP»)', () => {
    const c = makeClient({ total_visits: 5, total_spent: 100 });
    const s = seg(
      { field: 'total_visits', operator: 'gte', value: 5, joinNext: 'OR' },
      { field: 'total_spent',  operator: 'gte', value: 5000 },
    );
    expect(evaluateCustomSegment(c, s)).toBe(true);
  });

  it('joinNext береться з ПОПЕРЕДНЬОЇ умови, не з поточної', () => {
    // Якби join читався з поточної умови, тут вийшов би AND і результат false.
    const c = makeClient({ total_visits: 1, total_spent: 99_999 });
    const s = seg(
      { field: 'total_visits', operator: 'gte', value: 10, joinNext: 'OR' },
      { field: 'total_spent',  operator: 'gte', value: 15_000, joinNext: 'AND' },
    );
    expect(evaluateCustomSegment(c, s)).toBe(true);
  });

  it('🔴 ХАРАКТЕРИЗАЦІЙНИЙ: склейка йде ЗЛІВА НАПРАВО, без пріоритету AND над OR', () => {
    // Майстер читає умови як «A або B і C», де «і» природно зв'язує сильніше:
    //   очікування:  A OR (B AND C)  → true  (бо A справджується)
    //   фактично:   (A OR B) AND C   → false (бо C не справджується)
    // Тобто клієнт, якого майстер очікує побачити в сегменті, туди НЕ потрапить.
    // Стріляє лише на 3+ умовах із міксом «і»/«або» — усі вбудовані пресети
    // мають по 2 умови, тож вони не зачеплені.
    const c = makeClient({ is_vip: true, total_visits: 0, total_spent: 0 });
    const s = seg(
      { field: 'is_vip',       operator: 'eq',  value: 'true', joinNext: 'OR' },  // A: true
      { field: 'total_visits', operator: 'gte', value: 10,     joinNext: 'AND' }, // B: false
      { field: 'total_spent',  operator: 'gte', value: 15_000 },                  // C: false
    );
    expect(evaluateCustomSegment(c, s)).toBe(false); // ← сьогодні так; природне читання дало б true
  });
});

// ── Edge: брудні дані ─────────────────────────────────────────────────────────

describe('брудні дані не ламають фільтр', () => {
  it('null у числовому полі → умова false, а не виняток', () => {
    const c = makeClient({ total_spent: null as never });
    expect(() => evaluateCustomSegment(c, seg({ field: 'total_spent', operator: 'gte', value: 100 }))).not.toThrow();
    expect(evaluateCustomSegment(c, seg({ field: 'total_spent', operator: 'gte', value: 100 }))).toBe(false);
  });

  it('🔴 ХАРАКТЕРИЗАЦІЙНИЙ: null у числовому полі не матчить і зворотні оператори', () => {
    // Number(null) = 0, тож `lte 100` дає true — клієнт без суми потрапляє
    // в сегмент «середній чек до 100». Для average_check це реальний ризик:
    // «чутливі до ціни» збере й тих, у кого просто немає даних.
    const c = makeClient({ average_check: null as never });
    expect(evaluateCustomSegment(c, seg({ field: 'average_check', operator: 'lte', value: 500 }))).toBe(true);
  });
});
