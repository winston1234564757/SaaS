import { describe, it, expect } from 'vitest';

// ── Pure extraction from useBookings.ts ──────────────────────────────────

type BookingStatus = 'new' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';

interface BookingRow {
  id: string;
  client_name: string;
  client_phone: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: BookingStatus;
  total_price: number | string;
  notes: string | null;
  master_notes: string | null;
  source: string | null;
  dynamic_pricing_label: string | null;
  dynamic_extra_kopecks: number | null;
  booking_services: { service_name: string; service_price: number | string; duration_minutes: number }[] | null;
}

interface BookingWithServices {
  id: string;
  client_name: string;
  client_phone: string;
  date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  total_price: number;
  notes: string | null;
  master_notes: string | null;
  source: string | null;
  dynamic_pricing_label: string | null;
  dynamic_extra_kopecks: number;
  services: { name: string; price: number; duration: number }[];
}

function rowToBooking(row: BookingRow): BookingWithServices {
  return {
    id: row.id,
    client_name: row.client_name,
    client_phone: row.client_phone,
    date: row.date,
    start_time: row.start_time?.slice(0, 5) ?? '',
    end_time: row.end_time?.slice(0, 5) ?? '',
    status: row.status,
    total_price: Number(row.total_price),
    notes: row.notes,
    master_notes: row.master_notes ?? null,
    source: row.source ?? null,
    dynamic_pricing_label: row.dynamic_pricing_label ?? null,
    dynamic_extra_kopecks: row.dynamic_extra_kopecks ?? 0,
    services: (row.booking_services ?? []).map(s => ({
      name: s.service_name,
      price: Number(s.service_price),
      duration: s.duration_minutes,
    })),
  };
}

function mapBookingStatus(s: string): OrderStatus {
  if (s === 'completed') return 'completed';
  if (s === 'cancelled') return 'cancelled';
  if (s === 'confirmed') return 'confirmed';
  return 'new';
}

describe('rowToBooking', () => {
  it('converts full row', () => {
    const r = rowToBooking({
      id: 'b-1', client_name: 'Олександр', client_phone: '+380671234567',
      date: '2026-06-10', start_time: '14:30', end_time: '15:30',
      status: 'confirmed', total_price: '1200', notes: 'Без сульфатів',
      master_notes: null, source: 'website', dynamic_pricing_label: null,
      dynamic_extra_kopecks: 0,
      booking_services: [{ service_name: 'Стрижка', service_price: '500', duration_minutes: 60 }],
    });
    expect(r.client_name).toBe('Олександр');
    expect(r.start_time).toBe('14:30');
    expect(r.total_price).toBe(1200);
    expect(r.services).toHaveLength(1);
    expect(r.services[0].name).toBe('Стрижка');
  });

  it('handles null start_time/end_time', () => {
    const r = rowToBooking({
      id: 'b-2', client_name: 'Марія', client_phone: '+380671234567',
      date: '2026-06-10', start_time: null, end_time: null,
      status: 'new', total_price: 0, notes: null,
      master_notes: null, source: null, dynamic_pricing_label: null,
      dynamic_extra_kopecks: null,
      booking_services: null,
    });
    expect(r.start_time).toBe('');
    expect(r.end_time).toBe('');
    expect(r.services).toEqual([]);
    expect(r.dynamic_extra_kopecks).toBe(0);
  });

  it('handles numeric total_price', () => {
    const r = rowToBooking({
      id: 'b-3', client_name: 'Іван', client_phone: '+380671234567',
      date: '2026-06-10', start_time: '10:00', end_time: '10:30',
      status: 'cancelled', total_price: 800, notes: null,
      master_notes: 'No show', source: null, dynamic_pricing_label: 'early_bird',
      dynamic_extra_kopecks: 50,
      booking_services: [],
    });
    expect(r.total_price).toBe(800);
    expect(r.master_notes).toBe('No show');
    expect(r.dynamic_pricing_label).toBe('early_bird');
    expect(r.dynamic_extra_kopecks).toBe(50);
  });
});

type OrderStatus = 'new' | 'confirmed' | 'completed' | 'cancelled';

describe('mapBookingStatus', () => {
  it('maps completed → completed', () => {
    expect(mapBookingStatus('completed')).toBe('completed');
  });
  it('maps cancelled → cancelled', () => {
    expect(mapBookingStatus('cancelled')).toBe('cancelled');
  });
  it('maps confirmed → confirmed', () => {
    expect(mapBookingStatus('confirmed')).toBe('confirmed');
  });
  it('maps new → new', () => {
    expect(mapBookingStatus('new')).toBe('new');
  });
  it('maps rescheduled → new (fallback)', () => {
    expect(mapBookingStatus('rescheduled')).toBe('new');
  });
  it('maps any unknown → new', () => {
    expect(mapBookingStatus('pending')).toBe('new');
  });
});
