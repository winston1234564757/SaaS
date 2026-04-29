import { describe, it, expect } from 'vitest';
import {
  matchesTagFilters,
  personalizeMessage,
  buildTargetUrl,
  generateShortCode,
} from './broadcastUtils';
import type { ClientForFilter } from './broadcastUtils';

// ── matchesTagFilters ─────────────────────────────────────────────────────────

describe('matchesTagFilters', () => {
  const base: ClientForFilter = {
    is_vip: false,
    total_visits: 3,
    average_check: 50000,
    retention_status: 'active',
  };

  it('порожній фільтр — завжди true', () => {
    expect(matchesTagFilters(base, [])).toBe(true);
  });

  it('vip: false → не проходить фільтр vip', () => {
    expect(matchesTagFilters(base, ['vip'])).toBe(false);
  });

  it('vip: true → проходить фільтр vip', () => {
    expect(matchesTagFilters({ ...base, is_vip: true }, ['vip'])).toBe(true);
  });

  it('total_visits === 1 → new', () => {
    expect(matchesTagFilters({ ...base, total_visits: 1 }, ['new'])).toBe(true);
    expect(matchesTagFilters({ ...base, total_visits: 2 }, ['new'])).toBe(false);
  });

  it('total_visits >= 5 → regular', () => {
    expect(matchesTagFilters({ ...base, total_visits: 5 }, ['regular'])).toBe(true);
    expect(matchesTagFilters({ ...base, total_visits: 10 }, ['regular'])).toBe(true);
    expect(matchesTagFilters({ ...base, total_visits: 4 }, ['regular'])).toBe(false);
  });

  it('average_check >= 150000 → big_check (1500 UAH в копійках)', () => {
    expect(matchesTagFilters({ ...base, average_check: 150000 }, ['big_check'])).toBe(true);
    expect(matchesTagFilters({ ...base, average_check: 149999 }, ['big_check'])).toBe(false);
  });

  it('retention_status → sleeping / at_risk / lost / active', () => {
    expect(matchesTagFilters({ ...base, retention_status: 'sleeping' }, ['sleeping'])).toBe(true);
    expect(matchesTagFilters({ ...base, retention_status: 'at_risk' }, ['at_risk'])).toBe(true);
    expect(matchesTagFilters({ ...base, retention_status: 'lost' }, ['lost'])).toBe(true);
    expect(matchesTagFilters({ ...base, retention_status: 'active' }, ['active'])).toBe(true);
    expect(matchesTagFilters({ ...base, retention_status: 'sleeping' }, ['active'])).toBe(false);
  });

  it('мультифільтр — OR логіка', () => {
    const vipClient = { ...base, is_vip: true };
    expect(matchesTagFilters(vipClient, ['new', 'vip'])).toBe(true);
    expect(matchesTagFilters(base, ['new', 'vip'])).toBe(false);
  });
});

// ── personalizeMessage ────────────────────────────────────────────────────────

describe('personalizeMessage', () => {
  it("підставляє {{ім'я}}", () => {
    const result = personalizeMessage("Привіт, {{ім'я}}!", { name: 'Оля', visits: 3 });
    expect(result).toBe('Привіт, Оля!');
  });

  it('підставляє {{кількість_візитів}}', () => {
    const result = personalizeMessage('У тебе {{кількість_візитів}} візитів.', { name: 'А', visits: 7 });
    expect(result).toBe('У тебе 7 візитів.');
  });

  it('підставляє {{знижка}} якщо є', () => {
    const result = personalizeMessage('Знижка {{знижка}}', { name: 'А', visits: 1, discount: 20 });
    expect(result).toBe('Знижка 20%');
  });

  it('видаляє {{знижка}} якщо null', () => {
    const result = personalizeMessage('Знижка {{знижка}}', { name: 'А', visits: 1, discount: null });
    expect(result).toBe('Знижка ');
  });

  it('заміняє всі входження', () => {
    const result = personalizeMessage("{{ім'я}} — {{ім'я}}", { name: 'Тест', visits: 1 });
    expect(result).toBe('Тест — Тест');
  });
});

// ── buildTargetUrl ────────────────────────────────────────────────────────────

describe('buildTargetUrl', () => {
  const SITE = 'https://bookit.com.ua';

  it('без serviceId та productId → базовий URL', () => {
    expect(buildTargetUrl('masha', SITE, null, null)).toBe('https://bookit.com.ua/masha');
  });

  it('з serviceId → встановлює ?serviceId= (auto-open в PublicMasterPage)', () => {
    const url = buildTargetUrl('masha', SITE, 'svc-123', null);
    expect(url).toContain('serviceId=svc-123');
    expect(url).not.toContain('add_product');
    expect(url).not.toContain('open=booking');
  });

  it('з serviceId + productId → serviceId= і add_product=', () => {
    const url = buildTargetUrl('masha', SITE, 'svc-123', 'prod-456');
    expect(url).toContain('serviceId=svc-123');
    expect(url).toContain('add_product=prod-456');
  });

  it('з productId без serviceId → тільки add_product=', () => {
    const url = buildTargetUrl('masha', SITE, null, 'prod-456');
    expect(url).not.toContain('serviceId=');
    expect(url).toContain('add_product=prod-456');
  });

  it('slug включений у URL', () => {
    const url = buildTargetUrl('my-cool-slug', SITE, null, null);
    expect(url).toContain('my-cool-slug');
  });
});

// ── generateShortCode ─────────────────────────────────────────────────────────

describe('generateShortCode', () => {
  it('генерує рядок довжиною 6', () => {
    expect(generateShortCode()).toHaveLength(6);
  });

  it('складається тільки з алфавітно-цифрових символів', () => {
    const code = generateShortCode();
    expect(/^[a-zA-Z0-9]{6}$/.test(code)).toBe(true);
  });

  it('два коди різні (з великою ймовірністю)', () => {
    const codes = new Set(Array.from({ length: 20 }, generateShortCode));
    expect(codes.size).toBeGreaterThan(15);
  });
});
