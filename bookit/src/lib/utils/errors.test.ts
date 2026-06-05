import { describe, it, expect } from 'vitest';
import { ZodError, ZodIssue } from 'zod';
import { parseError } from './errors';

function makeZodError(message: string): ZodError {
  return new ZodError([{ message, path: [], code: 'custom' } as ZodIssue]);
}

describe('parseError', () => {
  describe('ZodError', () => {
    it('returns first issue message', () => {
      const err = makeZodError("Ім'я обов'язкове");
      expect(parseError(err)).toBe("Ім'я обов'язкове");
    });

    it('returns default message for empty issues', () => {
      const err = new ZodError([]);
      expect(parseError(err)).toBe('Перевірте правильність введених даних');
    });
  });

  describe('Error with known messages (case insensitive)', () => {
    it('invalid login credentials', () => {
      expect(parseError(new Error('Invalid login credentials'))).toBe('Невірний логін або пароль');
    });

    it('user already exists', () => {
      expect(parseError(new Error('User already exists'))).toBe('Користувач з таким телефоном або email вже існує');
    });

    it('email already in use', () => {
      expect(parseError(new Error('Email already in use'))).toBe('Ця електронна пошта вже використовується');
    });

    it('password too short', () => {
      expect(parseError(new Error('Password should be at least 6 characters'))).toBe('Пароль надто короткий (мінімум 6 символів)');
    });

    it('rate limit', () => {
      expect(parseError(new Error('Rate limit exceeded'))).toBe('Занадто багато спроб. Будь ласка, зачекайте хвилинку');
    });

    it('duplicate key value', () => {
      expect(parseError(new Error('duplicate key value violates unique constraint'))).toBe('Такий запис вже існує в системі');
    });

    it('row not found', () => {
      expect(parseError(new Error('Row not found'))).toBe('Запис не знайдено');
    });

    it('foreign key violation', () => {
      expect(parseError(new Error('violates foreign key constraint'))).toBe('Неможливо виконати дію через зв\'язані дані');
    });

    it('check constraint violation', () => {
      expect(parseError(new Error('violates check constraint'))).toBe('Перевірте правильність введених даних');
    });

    it('timeout', () => {
      expect(parseError(new Error('Timeout occurred'))).toBe('Час очікування минув. Перевірте інтернет та спробуйте ще раз');
    });

    it('network error', () => {
      expect(parseError(new Error('Failed to fetch'))).toBe('Помилка мережі. Перевірте підключення до інтернету');
    });

    it('network request failed', () => {
      expect(parseError(new Error('Network request failed'))).toBe('Помилка мережі. Перевірте підключення до інтернету');
    });
  });

  describe('Error with Cyrillic message', () => {
    it('passes through Ukrainian text', () => {
      expect(parseError(new Error('Бронювання недоступне на цю дату'))).toBe('Бронювання недоступне на цю дату');
    });

    it('passes through Ukrainian text with ї, є, ґ', () => {
      expect(parseError(new Error('Їжа та напої не входять'))).toBe('Їжа та напої не входять');
      expect(parseError(new Error('Ґудзик відірвався'))).toBe('Ґудзик відірвався');
    });
  });

  describe('Error with unrecognized message', () => {
    it('returns system error fallback for English', () => {
      expect(parseError(new Error('Some cryptic error message'))).toBe('Сталася системна помилка. Спробуйте пізніше');
    });
  });

  describe('string error', () => {
    it('passes through Cyrillic string', () => {
      expect(parseError('Щось пішло не так')).toBe('Щось пішло не так');
    });

    it('returns fallback for English string', () => {
      expect(parseError('something bad')).toBe('Щось пішло не так');
    });
  });

  describe('unknown / null / undefined', () => {
    it('null returns unknown error', () => {
      expect(parseError(null)).toBe('Сталася невідома помилка');
    });

    it('undefined returns unknown error', () => {
      expect(parseError(undefined)).toBe('Сталася невідома помилка');
    });

    it('number returns unknown error', () => {
      expect(parseError(42)).toBe('Сталася невідома помилка');
    });

    it('object returns unknown error', () => {
      expect(parseError({ some: 'thing' })).toBe('Сталася невідома помилка');
    });
  });
});
