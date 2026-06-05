import { describe, it, expect } from 'vitest';
import { getDayOfWeek, pluralize, formatDurationFull } from './dates';

describe('getDayOfWeek', () => {
  it('returns sun for 2026-06-07', () => {
    expect(getDayOfWeek(new Date('2026-06-07'))).toBe('sun');
  });

  it('returns mon for 2026-06-08', () => {
    expect(getDayOfWeek(new Date('2026-06-08'))).toBe('mon');
  });

  it('returns tue for 2026-06-09', () => {
    expect(getDayOfWeek(new Date('2026-06-09'))).toBe('tue');
  });

  it('returns wed for 2026-06-10', () => {
    expect(getDayOfWeek(new Date('2026-06-10'))).toBe('wed');
  });

  it('returns thu for 2026-06-11', () => {
    expect(getDayOfWeek(new Date('2026-06-11'))).toBe('thu');
  });

  it('returns fri for 2026-06-12', () => {
    expect(getDayOfWeek(new Date('2026-06-12'))).toBe('fri');
  });

  it('returns sat for 2026-06-13', () => {
    expect(getDayOfWeek(new Date('2026-06-13'))).toBe('sat');
  });

  it('handles single-digit dates safely', () => {
    expect(getDayOfWeek(new Date('2026-06-01'))).toBe('mon');
  });
});

describe('pluralize', () => {
  const forms: [string, string, string] = ['запис', 'записи', 'записів'];

  it('returns "1 запис" for count 1', () => {
    expect(pluralize(1, forms)).toBe('1 запис');
  });

  it('returns "21 запис" for count 21', () => {
    expect(pluralize(21, forms)).toBe('21 запис');
  });

  it('returns "2 записи" for count 2', () => {
    expect(pluralize(2, forms)).toBe('2 записи');
  });

  it('returns "3 записи" for count 3', () => {
    expect(pluralize(3, forms)).toBe('3 записи');
  });

  it('returns "4 записи" for count 4', () => {
    expect(pluralize(4, forms)).toBe('4 записи');
  });

  it('returns "5 записів" for count 5', () => {
    expect(pluralize(5, forms)).toBe('5 записів');
  });

  it('returns "0 записів" for count 0', () => {
    expect(pluralize(0, forms)).toBe('0 записів');
  });

  it('returns "11 записів" for count 11', () => {
    expect(pluralize(11, forms)).toBe('11 записів');
  });

  it('returns "14 записів" for count 14', () => {
    expect(pluralize(14, forms)).toBe('14 записів');
  });

  it('returns "22 записи" for count 22', () => {
    expect(pluralize(22, forms)).toBe('22 записи');
  });

  it('returns "100 записів" for count 100', () => {
    expect(pluralize(100, forms)).toBe('100 записів');
  });
});

describe('formatDurationFull', () => {
  it('returns only minutes when h=0', () => {
    expect(formatDurationFull(30)).toBe('30 хвилин');
  });

  it('returns only minutes for 1 minute', () => {
    expect(formatDurationFull(1)).toBe('1 хвилина');
  });

  it('returns only minutes for 2 minutes', () => {
    expect(formatDurationFull(2)).toBe('2 хвилини');
  });

  it('returns only hours when m=0', () => {
    expect(formatDurationFull(60)).toBe('1 година');
  });

  it('returns only hours for 2 hours', () => {
    expect(formatDurationFull(120)).toBe('2 години');
  });

  it('returns hours + minutes for 1h30m', () => {
    expect(formatDurationFull(90)).toBe('1 година 30 хвилин');
  });

  it('returns hours + minutes for 1h1m', () => {
    expect(formatDurationFull(61)).toBe('1 година 1 хвилина');
  });

  it('handles 0 minutes', () => {
    expect(formatDurationFull(0)).toBe('0 хвилин');
  });

  it('handles exact hours (omits "0 хвилин")', () => {
    expect(formatDurationFull(1440)).toBe('24 години');
  });

  it('handles 3h30m', () => {
    expect(formatDurationFull(210)).toBe('3 години 30 хвилин');
  });
});
