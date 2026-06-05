import { describe, it, expect } from 'vitest';
import { bookingClientSchema } from './booking';

describe('bookingClientSchema', () => {
  describe('clientName', () => {
    it('accepts valid Ukrainian name', () => {
      const r = bookingClientSchema.safeParse({ clientName: 'Олександр', clientPhone: '+380671234567' });
      expect(r.success).toBe(true);
    });

    it('accepts name with apostrophe', () => {
      const r = bookingClientSchema.safeParse({ clientName: "Мар'яна", clientPhone: '+380671234567' });
      expect(r.success).toBe(true);
    });

    it('accepts hyphenated name', () => {
      const r = bookingClientSchema.safeParse({ clientName: 'Анна-Марія', clientPhone: '+380671234567' });
      expect(r.success).toBe(true);
    });

    it('rejects Latin letters', () => {
      const r = bookingClientSchema.safeParse({ clientName: 'Alex', clientPhone: '+380671234567' });
      expect(r.success).toBe(false);
    });

    it('rejects too short name', () => {
      const r = bookingClientSchema.safeParse({ clientName: 'А', clientPhone: '+380671234567' });
      expect(r.success).toBe(false);
    });

    it('rejects numbers in name', () => {
      const r = bookingClientSchema.safeParse({ clientName: 'Олег123', clientPhone: '+380671234567' });
      expect(r.success).toBe(false);
    });

    it('rejects empty name', () => {
      const r = bookingClientSchema.safeParse({ clientName: '', clientPhone: '+380671234567' });
      expect(r.success).toBe(false);
    });
  });

  describe('clientPhone transform + refine', () => {
    it('transforms 0671234567 (10-digit) to +380671234567', () => {
      const r = bookingClientSchema.parse({ clientName: 'Олена', clientPhone: '0671234567' });
      expect(r.clientPhone).toBe('+380671234567');
    });

    it('transforms 380671234567 (12-digit) to +380671234567', () => {
      const r = bookingClientSchema.parse({ clientName: 'Олена', clientPhone: '380671234567' });
      expect(r.clientPhone).toBe('+380671234567');
    });

    it('transforms 0XXXXXXXXX to +380XXXXXXXXX', () => {
      const r = bookingClientSchema.parse({ clientName: 'Олена', clientPhone: '0671234567' });
      expect(r.clientPhone).toBe('+380671234567');
    });

    it('normalizes +38 (067) 123-45-67 to +380671234567', () => {
      const r = bookingClientSchema.parse({ clientName: 'Олена', clientPhone: '+38 (067) 123-45-67' });
      expect(r.clientPhone).toBe('+380671234567');
    });

    it('rejects non-Ukrainian phone', () => {
      const r = bookingClientSchema.safeParse({ clientName: 'Олена', clientPhone: '+49123456789' });
      expect(r.success).toBe(false);
    });

    it('rejects too short phone', () => {
      const r = bookingClientSchema.safeParse({ clientName: 'Олена', clientPhone: '123' });
      expect(r.success).toBe(false);
    });

    it('rejects empty phone', () => {
      const r = bookingClientSchema.safeParse({ clientName: 'Олена', clientPhone: '' });
      expect(r.success).toBe(false);
    });

    it('handles 80XXXXXXXXX (11-digit) format', () => {
      const r = bookingClientSchema.parse({ clientName: 'Олена', clientPhone: '80671234567' });
      expect(r.clientPhone).toBe('+380671234567');
    });
  });
});
