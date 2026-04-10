import { z } from 'zod';

/**
 * Shared validation schema for booking client details.
 * Enforces Cyrillic-only names and strict Ukrainian phone format.
 */
export const bookingClientSchema = z.object({
  clientName: z
    .string()
    .min(2, "Введіть ім'я (мінімум 2 символи)")
    .regex(/^[А-Яа-яІіЇїЄєҐґ\s'-]+$/, "Ім'я повинно містити лише кирилицю"),
  clientPhone: z
    .string()
    .min(1, "Введіть номер телефону")
    // Use transform to normalize the string. 
    // This allows the input to be a string while the output is the normalized format.
    .transform((val) => {
      // Remove all non-digits
      let digits = val.replace(/\D/g, '');
      
      // Handle formats like 0XXXXXXXXX -> 380XXXXXXXXX
      if (digits.length === 10 && digits.startsWith('0')) {
        digits = '38' + digits;
      } 
      // Handle formats like 80XXXXXXXXX -> 380XXXXXXXXX
      else if (digits.length === 11 && digits.startsWith('80')) {
        digits = '3' + digits;
      }
      
      // Ensure it starts with +
      const normalized = digits.startsWith('+') ? digits : '+' + digits;
      return normalized;
    })
    // Validation happens AFTER transformation when using .refine or .pipe
    // But for simpler integration with react-hook-form, we use refine
    .refine((val) => /^\+380\d{9}$/.test(val), {
      message: 'Невірний формат телефону (очікується +380...)',
    }),
});

export type BookingClientData = z.infer<typeof bookingClientSchema>;
