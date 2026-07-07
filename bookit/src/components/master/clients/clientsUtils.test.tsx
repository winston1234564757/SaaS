// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { getAutoTags, getSmartAction, formatClientName } from './clientsUtils';
import type { ClientRow } from '@/lib/supabase/hooks/useClients';

/** Domain 4 (Client CRM) — auto-tag / smart-segment classification unit coverage. */

function makeClient(overrides: Partial<ClientRow> = {}): ClientRow {
  return {
    client_id: 'c1',
    client_name: 'Олена Ковальчук',
    client_phone: '380501234567',
    total_visits: 3,
    total_spent: 3000,
    average_check: 1000,
    last_visit_at: '2026-01-01T00:00:00Z',
    is_vip: false,
    retention_status: 'active',
    ...(overrides as Partial<ClientRow>),
  } as ClientRow;
}

describe('getAutoTags', () => {
  it('tags a first-time client as Новий', () => {
    const tags = getAutoTags(makeClient({ total_visits: 1 }));
    expect(tags.map((t) => t.label)).toContain('Новий');
  });

  it('tags a 5+ visit client as Постійний (not Новий)', () => {
    const tags = getAutoTags(makeClient({ total_visits: 6 }));
    const labels = tags.map((t) => t.label);
    expect(labels).toContain('Постійний');
    expect(labels).not.toContain('Новий');
  });

  it('tags high average check as Великий чек', () => {
    const tags = getAutoTags(makeClient({ average_check: 1500 }));
    expect(tags.map((t) => t.label)).toContain('Великий чек');
  });

  it('stacks VIP + Постійний + Великий чек', () => {
    const tags = getAutoTags(makeClient({ is_vip: true, total_visits: 10, average_check: 2000 }));
    const labels = tags.map((t) => t.label);
    expect(labels).toEqual(expect.arrayContaining(['VIP', 'Постійний', 'Великий чек']));
  });

  it('returns no tags for a plain mid-tier client', () => {
    const tags = getAutoTags(makeClient({ total_visits: 3, average_check: 800, is_vip: false }));
    expect(tags).toHaveLength(0);
  });
});

describe('formatClientName', () => {
  it('abbreviates the surname to an initial', () => {
    expect(formatClientName('Олена Ковальчук')).toBe('Олена К.');
  });
  it('leaves a single-word name unchanged', () => {
    expect(formatClientName('Олена')).toBe('Олена');
  });
  it('collapses extra whitespace', () => {
    expect(formatClientName('  Олена   Ковальчук ')).toBe('Олена К.');
  });
});

describe('getSmartAction', () => {
  it('recommends win-back for a lost client', () => {
    const action = getSmartAction(makeClient({ retention_status: 'lost' }), 'none');
    expect(action.title).toBe('Повернути клієнта');
    expect(action.template).toContain('Олена');
  });

  it('recommends locking in a newbie for the newbie_danger segment', () => {
    const action = getSmartAction(makeClient({ total_visits: 1 }), 'newbie_danger');
    expect(action.title).toBe('Закріпити новачка');
  });

  it('recommends VIP nudge for a loyal non-VIP client (>3 visits)', () => {
    const action = getSmartAction(makeClient({ total_visits: 4, is_vip: false }), 'none');
    expect(action.title).toBe('Заохотити до VIP');
  });

  it('falls back to a rebooking invite', () => {
    const action = getSmartAction(makeClient({ total_visits: 2, is_vip: false, retention_status: 'active' }), 'none');
    expect(action.title).toBe('Запросити на запис');
  });
});
