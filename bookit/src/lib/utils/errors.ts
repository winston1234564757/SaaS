import { ZodError } from 'zod';

/**
 * Parses generic Error, ZodError, or unknown objects into user-friendly Ukrainian messages.
 * Prevents raw technical strings (e.g. "Failed to fetch") from leaking into the UI.
 */
export function parseError(err: unknown): string {
  if (err instanceof ZodError) {
    const zodErr = err as ZodError<any>;
    const firstError = zodErr.errors[0];
    return firstError ? firstError.message : 'Перевірте правильність введених даних';
  }
  
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    
    // Auth & Identity
    if (msg.includes('invalid login credentials')) return 'Невірний логін або пароль';
    if (msg.includes('user already exists')) return 'Користувач з таким телефоном або email вже існує';
    if (msg.includes('email already in use')) return 'Ця електронна пошта вже використовується';
    if (msg.includes('password should be at least')) return 'Пароль надто короткий (мінімум 6 символів)';
    if (msg.includes('rate limit')) return 'Занадто багато спроб. Будь ласка, зачекайте хвилинку';
    
    // Database & Integrity
    if (msg.includes('duplicate key value')) return 'Такий запис вже існує в системі';
    if (msg.includes('row not found')) return 'Запис не знайдено';
    if (msg.includes('violates foreign key')) return 'Неможливо виконати дію через зв\'язані дані';
    if (msg.includes('violates check constraint')) return 'Перевірте правильність введених даних';
    if (msg.includes('timeout')) return 'Час очікування минув. Перевірте інтернет та спробуйте ще раз';
    
    // Network
    if (msg.includes('failed to fetch') || msg.includes('network request failed')) {
      return 'Помилка мережі. Перевірте підключення до інтернету';
    }
    
    // Pass through custom localized errors (if they start with Cyrillic characters)
    if (/^[А-Яа-яІіЇїЄєҐґ]/.test(err.message)) return err.message;
    
    // Fallback for unrecognized technical errors
    console.error('Unhandled system error:', err.message);
    return 'Сталася системна помилка. Спробуйте пізніше';
  }
  
  if (typeof err === 'string') {
    if (/^[А-Яа-яІіЇїЄєҐґ]/.test(err)) return err;
    return 'Щось пішло не так';
  }
  
  return 'Сталася невідома помилка';
}
