import { describe, it, expect } from 'vitest';
import { escHtml, buildCancellationMessage, buildReviewMessage, buildBookingMessage } from './telegram';

describe('escHtml', () => {
  it('escapes & to &amp;', () => {
    expect(escHtml('AT&T')).toBe('AT&amp;T');
  });

  it('escapes < to &lt;', () => {
    expect(escHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes > to &gt;', () => {
    expect(escHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes " to &quot;', () => {
    expect(escHtml('he said "hi"')).toBe('he said &quot;hi&quot;');
  });

  it('handles combined XSS vector', () => {
    const input = '<img src=x onerror=alert(1)>';
    expect(escHtml(input)).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('returns empty string for null', () => {
    expect(escHtml(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(escHtml(undefined)).toBe('');
  });

  it('converts number to string', () => {
    expect(escHtml(42)).toBe('42');
  });

  it('converts boolean to string', () => {
    expect(escHtml(true)).toBe('true');
  });

  it('handles empty string', () => {
    expect(escHtml('')).toBe('');
  });

  it('passes through safe strings unchanged', () => {
    expect(escHtml('Hello, мир!')).toBe('Hello, мир!');
  });

  it('handles object by converting to string', () => {
    expect(escHtml({})).toBe('[object Object]');
  });
});

describe('buildCancellationMessage', () => {
  const base = { clientName: 'Олександр', date: '2026-06-10', startTime: '14:30', services: 'Стрижка' };

  it('returns a non-empty string', () => {
    const msg = buildCancellationMessage(base);
    expect(msg.length).toBeGreaterThan(0);
  });

  it('contains client name', () => {
    expect(buildCancellationMessage(base)).toContain('Олександр');
  });

  it('contains cancellation header', () => {
    expect(buildCancellationMessage(base)).toContain('Скасування запису');
  });

  it('contains date and time', () => {
    const msg = buildCancellationMessage(base);
    expect(msg).toContain('10');
    expect(msg).toContain('14:30');
  });

  it('escapes HTML in client name', () => {
    const msg = buildCancellationMessage({ ...base, clientName: '<b>hacker</b>' });
    expect(msg).toContain('&lt;b&gt;hacker&lt;/b&gt;');
    expect(msg).not.toContain('<b>hacker</b>');
  });
});

describe('buildReviewMessage', () => {
  const base = { clientName: 'Марія', rating: 5, comment: 'Чудово' };

  it('returns a non-empty string', () => {
    expect(buildReviewMessage(base).length).toBeGreaterThan(0);
  });

  it('contains rating stars', () => {
    const msg = buildReviewMessage({ ...base, rating: 4 });
    expect(msg).toContain('⭐⭐⭐⭐');
    expect(msg).toContain('4/5');
  });

  it('includes comment when present', () => {
    expect(buildReviewMessage(base)).toContain('Чудово');
  });

  it('works without comment', () => {
    const msg = buildReviewMessage({ clientName: 'Іван', rating: 5, comment: null });
    expect(msg).toContain('Іван');
    expect(msg).not.toContain('undefined');
  });

  it('handles 1-star rating', () => {
    expect(buildReviewMessage({ ...base, rating: 1 })).toContain('1/5');
  });
});

describe('buildBookingMessage', () => {
  const base = {
    clientName: 'Ольга',
    date: '2026-06-10',
    startTime: '14:30',
    services: 'Стрижка, фарбування',
    totalPrice: 1500,
    notes: 'Без сульфатів',
    products: [{ name: 'Шампунь', quantity: 2 }],
  };

  it('returns a non-empty string', () => {
    expect(buildBookingMessage(base).length).toBeGreaterThan(0);
  });

  it('contains client name, date, services, price', () => {
    const msg = buildBookingMessage(base);
    expect(msg).toContain('Ольга');
    expect(msg).toContain('10-го');
    expect(msg).toContain('Стрижка, фарбування');
    expect(msg).toContain('1500');
  });

  it('includes product lines', () => {
    const msg = buildBookingMessage(base);
    expect(msg).toContain('Шампунь');
    expect(msg).toContain('× 2');
  });

  it('includes notes', () => {
    expect(buildBookingMessage(base)).toContain('Без сульфатів');
  });

  it('works without products', () => {
    const msg = buildBookingMessage({ ...base, products: undefined });
    expect(msg).not.toContain('undefined');
  });

  it('works without notes', () => {
    const msg = buildBookingMessage({ ...base, notes: undefined });
    expect(msg).not.toContain('undefined');
  });

  it('escapes XSS in client name', () => {
    const msg = buildBookingMessage({ ...base, clientName: '<script>alert("xss")</script>' });
    expect(msg).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(msg).not.toContain('<script>');
  });
});
