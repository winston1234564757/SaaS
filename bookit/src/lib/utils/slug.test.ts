import { describe, it, expect } from 'vitest';
import { transliterate, generateSlug } from './slug';

describe('transliterate', () => {
  it('transliterates full Ukrainian alphabet', () => {
    const input = 'а б в г ґ д е є ж з и і ї й к л м н о п р с т у ф х ц ч ш щ ь ю я';
    const expected = 'a.b.v.h.g.d.e.ye.zh.z.y.i.yi.y.k.l.m.n.o.p.r.s.t.u.f.kh.ts.ch.sh.shch.yu.ya';
    expect(transliterate(input)).toBe(expected);
  });

  it('handles uppercase letters', () => {
    expect(transliterate('ОЛЕНА')).toBe('olena');
    expect(transliterate('ЇЖАК')).toBe('yizhak');
    expect(transliterate('ҐРУНТ')).toBe('grunt');
  });

  it('preserves Latin characters', () => {
    expect(transliterate('Olena Test')).toBe('olena.test');
  });

  it('collapses multiple separators', () => {
    expect(transliterate('Олена   Іван')).toBe('olena.ivan');
    expect(transliterate('hello--world')).toBe('hello.world');
  });

  it('removes leading/trailing non-alphanumeric', () => {
    expect(transliterate('  Михайло  ')).toBe('mykhaylo');
    expect(transliterate('...test...')).toBe('test');
  });

  it('replaces special characters with dots', () => {
    expect(transliterate('test!@#$%^&*()_+')).toBe('test');
    expect(transliterate('hello, world!')).toBe('hello.world');
  });

  it('handles empty string', () => {
    expect(transliterate('')).toBe('');
  });

  it('handles digits', () => {
    expect(transliterate('Київ2026')).toBe('kyyiv2026');
  });

  it('removes soft sign', () => {
    expect(transliterate('ть')).toBe('t');
    expect(transliterate('Ольга')).toBe('olha');
  });

  it('transliterates common Ukrainian names', () => {
    expect(transliterate('Олександр Ковальчук')).toBe('oleksandr.kovalchuk');
    expect(transliterate('Марія Шевченко')).toBe('mariya.shevchenko');
    expect(transliterate('Євген Петренко')).toBe('yevhen.petrenko');
  });
});

describe('generateSlug', () => {
  it('delegates to transliterate', () => {
    expect(generateSlug('Олександр Ковальчук')).toBe('oleksandr.kovalchuk');
    expect(generateSlug('  Анна-Марія  ')).toBe('anna.mariya');
  });
});
