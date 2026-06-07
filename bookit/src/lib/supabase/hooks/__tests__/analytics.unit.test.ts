// @vitest-environment jsdom
/**
 * Analytics Unit Tests — pure functions
 * Tests: computeRange, getPrevPeriodRange, linearRegression, exportAnalyticsCsv
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeRange, getPrevPeriodRange } from '@/lib/supabase/hooks/useDateRange';
import { linearRegression, exportAnalyticsCsv } from '@/lib/supabase/hooks/useAnalytics';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/utils/now', () => ({
  getNow: vi.fn(() => new Date(2026, 0, 15, 12, 0, 0)), // Jan 15, 2026, Thursday
}));
vi.mock('@/lib/supabase/hooks/useDateRange', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('@/lib/supabase/hooks/useDateRange');
  return actual; // use real implementation, only mock getNow
});

// ── computeRange ──────────────────────────────────────────────────────────────

describe('computeRange', () => {
  describe('preset: day', () => {
    it('offset=0 → today label "Сьогодні"', () => {
      const { label, start, end } = computeRange('day', 0);
      expect(label).toBe('Сьогодні');
      expect(start.getDate()).toBe(15);
      expect(end.getHours()).toBe(23);
    });

    it('offset=-1 → yesterday label "Вчора"', () => {
      const { label, start } = computeRange('day', -1);
      expect(label).toBe('Вчора');
      expect(start.getDate()).toBe(14);
    });

    it('offset=-2 → numeric date label (e.g. "13 Січ")', () => {
      const { label } = computeRange('day', -2);
      expect(label).toMatch(/13/);
    });

    it('start is midnight, end is 23:59:59', () => {
      const { start, end } = computeRange('day', 0);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
    });
  });

  describe('preset: week', () => {
    it('offset=0 → "Цей тиждень"', () => {
      const { label } = computeRange('week', 0);
      expect(label).toBe('Цей тиждень');
    });

    it('offset=-1 → "Минулий тиждень"', () => {
      const { label } = computeRange('week', -1);
      expect(label).toBe('Минулий тиждень');
    });

    it('week starts on Monday', () => {
      const { start } = computeRange('week', 0);
      expect(start.getDay()).toBe(1); // Monday
    });

    it('week ends on Sunday', () => {
      const { end } = computeRange('week', 0);
      expect(end.getDay()).toBe(0); // Sunday
    });

    it('week span is 7 days', () => {
      const { start, end } = computeRange('week', 0);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      // Mon 00:00 → Sun 23:59:59 = 7 full calendar days
      expect(diffDays).toBe(7);
    });
  });

  describe('preset: month', () => {
    it('offset=0 → "Січень 2026"', () => {
      const { label } = computeRange('month', 0);
      expect(label).toBe('Січень 2026');
    });

    it('offset=-1 → "Грудень 2025"', () => {
      const { label } = computeRange('month', -1);
      expect(label).toBe('Грудень 2025');
    });

    it('offset=-12 → same month previous year', () => {
      const { label } = computeRange('month', -12);
      expect(label).toBe('Січень 2025');
    });

    it('start is first day of month', () => {
      const { start } = computeRange('month', 0);
      expect(start.getDate()).toBe(1);
    });

    it('end is last day of month (January = 31)', () => {
      const { end } = computeRange('month', 0);
      expect(end.getDate()).toBe(31);
    });

    it('February boundary — last day correct', () => {
      const { end } = computeRange('month', -11); // March 2025 → Feb 2025
      // Feb 2025 has 28 days
      expect(end.getDate()).toBe(28);
    });
  });

  describe('preset: year', () => {
    it('offset=0 → label "2026"', () => {
      const { label } = computeRange('year', 0);
      expect(label).toBe('2026');
    });

    it('offset=-1 → label "2025"', () => {
      const { label } = computeRange('year', -1);
      expect(label).toBe('2025');
    });

    it('start is Jan 1', () => {
      const { start } = computeRange('year', 0);
      expect(start.getMonth()).toBe(0);
      expect(start.getDate()).toBe(1);
    });

    it('end is Dec 31', () => {
      const { end } = computeRange('year', 0);
      expect(end.getMonth()).toBe(11);
      expect(end.getDate()).toBe(31);
    });
  });

  describe('preset: all', () => {
    it('label → "За весь час"', () => {
      const { label } = computeRange('all', 0);
      expect(label).toBe('За весь час');
    });

    it('start is 2020-01-01', () => {
      const { start } = computeRange('all', 0);
      expect(start.getFullYear()).toBe(2020);
      expect(start.getMonth()).toBe(0);
      expect(start.getDate()).toBe(1);
    });
  });
});

// ── getPrevPeriodRange ────────────────────────────────────────────────────────

describe('getPrevPeriodRange', () => {
  it('preset=all → returns null', () => {
    expect(getPrevPeriodRange('all', 0)).toBeNull();
  });

  it('preset=month offset=0 → December 2025 range', () => {
    const range = getPrevPeriodRange('month', 0);
    expect(range).not.toBeNull();
    expect(range!.startDate).toBe('2025-12-01');
    expect(range!.endDate).toBe('2025-12-31');
  });

  it('preset=week offset=0 → previous week Mon-Sun', () => {
    const range = getPrevPeriodRange('week', 0);
    expect(range).not.toBeNull();
    // Previous week: Jan 5-11 2026 (Mon-Sun)
    expect(range!.startDate).toBe('2026-01-05');
    expect(range!.endDate).toBe('2026-01-11');
  });

  it('preset=year offset=0 → 2025 full year', () => {
    const range = getPrevPeriodRange('year', 0);
    expect(range).not.toBeNull();
    expect(range!.startDate).toBe('2025-01-01');
    expect(range!.endDate).toBe('2025-12-31');
  });

  it('startDate format is YYYY-MM-DD', () => {
    const range = getPrevPeriodRange('month', 0);
    expect(range!.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(range!.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── linearRegression (extended) ───────────────────────────────────────────────

describe('linearRegression', () => {
  it('empty array → { forecast: 0, slope: 0, r2: 0 }', () => {
    expect(linearRegression([])).toEqual({ forecast: 0, slope: 0, r2: 0 });
  });

  it('single value → slope 0, r2 0, forecast = that value', () => {
    const { forecast, slope, r2 } = linearRegression([42]);
    expect(slope).toBe(0);
    expect(forecast).toBe(42);
    expect(r2).toBe(0);
  });

  it('flat series [10,10,10,10] → slope ≈ 0, r2 = 1, forecast = 10', () => {
    const { slope, r2, forecast } = linearRegression([10, 10, 10, 10]);
    expect(slope).toBeCloseTo(0);
    expect(r2).toBe(1);
    expect(forecast).toBe(10);
  });

  it('strictly increasing [0,1,2,3,4] → slope ≈ 1, forecast = 5', () => {
    const { slope, forecast } = linearRegression([0, 1, 2, 3, 4]);
    expect(slope).toBeCloseTo(1);
    expect(forecast).toBe(5);
  });

  it('forecast is never negative — even with declining series', () => {
    const { forecast } = linearRegression([100, 50, 10, 0]);
    expect(forecast).toBeGreaterThanOrEqual(0);
  });

  it('r2 is between 0 and 1', () => {
    const { r2 } = linearRegression([10, 20, 15, 30, 25]);
    expect(r2).toBeGreaterThanOrEqual(0);
    expect(r2).toBeLessThanOrEqual(1);
  });

  it('perfect linear fit → r2 = 1', () => {
    const { r2 } = linearRegression([0, 100, 200, 300, 400]);
    expect(r2).toBeCloseTo(1);
  });

  it('two equal values → slope = 0, forecast = same value', () => {
    const { slope, forecast } = linearRegression([500, 500]);
    expect(slope).toBeCloseTo(0);
    expect(forecast).toBe(500);
  });

  it('large revenue values (kopecks scale) — no overflow', () => {
    const series = [10_000_000, 12_000_000, 11_000_000, 13_000_000, 14_000_000];
    const { forecast } = linearRegression(series);
    expect(forecast).toBeGreaterThan(0);
    expect(Number.isFinite(forecast)).toBe(true);
  });

  it('result shape always has forecast, slope, r2', () => {
    const result = linearRegression([1, 2, 3]);
    expect(result).toHaveProperty('forecast');
    expect(result).toHaveProperty('slope');
    expect(result).toHaveProperty('r2');
  });
});

// ── exportAnalyticsCsv ────────────────────────────────────────────────────────

describe('exportAnalyticsCsv', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  function mockSupabaseData(rows: unknown[]) {
    // Need chainable chain that supports double .order() for exportAnalyticsCsv
    const chain: Record<string, unknown> = {};
    const methods = ['select', 'eq', 'gte', 'lte'];
    for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain);
    // First .order() returns a new chain that also has .order()
    const chain2: Record<string, unknown> = {};
    for (const m of methods) chain2[m] = vi.fn().mockReturnValue(chain2);
    chain2['order'] = vi.fn().mockResolvedValue({ data: rows, error: null });
    chain['order'] = vi.fn().mockReturnValue(chain2);

    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as any);
  }

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockReturnValue(undefined);
    vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n);
    vi.spyOn(document.body, 'removeChild').mockImplementation((n) => n);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns early without calling createObjectURL if data is empty', async () => {
    mockSupabaseData([]);
    await exportAnalyticsCsv('master-1', '2026-01-01', '2026-01-31');
    expect(createObjectURLSpy).not.toHaveBeenCalled();
  });

  it('creates a Blob with UTF-8 BOM when data is present', async () => {
    let capturedParts: string[] = [];
    class FakeBlob {
      size = 100;
      type: string;
      constructor(parts: string[], opts?: { type?: string }) {
        capturedParts = parts as string[];
        this.type = opts?.type ?? '';
      }
    }
    vi.stubGlobal('Blob', FakeBlob);

    mockSupabaseData([{
      date: '2026-01-15', start_time: '10:00:00', client_name: 'Аня',
      client_phone: '+380501234567', total_price: 50000, status: 'completed',
      discount_percent: 0, source: 'online',
      booking_services: [{ service_name: 'Haircut', service_price: 50000 }],
      booking_products: [],
    }]);

    await exportAnalyticsCsv('master-1', '2026-01-01', '2026-01-31');
    expect(capturedParts.length).toBeGreaterThan(0);
    expect(capturedParts[0].charCodeAt(0)).toBe(0xFEFF);
    vi.unstubAllGlobals();
  });

  it('CSV header has correct Ukrainian columns', async () => {
    let capturedContent = '';
    class FakeBlob {
      size = 100; type = 'text/csv';
      constructor(parts: string[]) { capturedContent = parts[0]; }
    }
    vi.stubGlobal('Blob', FakeBlob);
    mockSupabaseData([{
      date: '2026-01-15', start_time: '10:00', client_name: 'Test', client_phone: '+380',
      total_price: 100, status: 'completed', discount_percent: 0, source: 'online',
      booking_services: [], booking_products: [],
    }]);
    await exportAnalyticsCsv('master-1', '2026-01-01', '2026-01-31');
    expect(capturedContent).toContain('Дата');
    expect(capturedContent).toContain('Клієнт');
    expect(capturedContent).toContain('Сума');
    expect(capturedContent).toContain('Статус');
    vi.unstubAllGlobals();
  });

  it('status "completed" → "Завершено" in CSV', async () => {
    let capturedContent = '';
    class FakeBlob {
      size = 100; type = 'text/csv';
      constructor(parts: string[]) { capturedContent = parts[0]; }
    }
    vi.stubGlobal('Blob', FakeBlob);
    mockSupabaseData([{
      date: '2026-01-15', start_time: '10:00', client_name: 'Аня', client_phone: '+380',
      total_price: 100, status: 'completed', discount_percent: 0, source: 'online',
      booking_services: [], booking_products: [],
    }]);
    await exportAnalyticsCsv('master-1', '2026-01-01', '2026-01-31');
    expect(capturedContent).toContain('Завершено');
    vi.unstubAllGlobals();
  });

  it('source "manual" → "Вручну" in CSV', async () => {
    let capturedContent = '';
    class FakeBlob {
      size = 100; type = 'text/csv';
      constructor(parts: string[]) { capturedContent = parts[0]; }
    }
    vi.stubGlobal('Blob', FakeBlob);
    mockSupabaseData([{
      date: '2026-01-15', start_time: '10:00', client_name: 'Аня', client_phone: '+380',
      total_price: 100, status: 'completed', discount_percent: 0, source: 'manual',
      booking_services: [], booking_products: [],
    }]);
    await exportAnalyticsCsv('master-1', '2026-01-01', '2026-01-31');
    expect(capturedContent).toContain('Вручну');
    vi.unstubAllGlobals();
  });

  it('quotes in client_name are escaped in CSV', async () => {
    let capturedContent = '';
    class FakeBlob {
      size = 100; type = 'text/csv';
      constructor(parts: string[]) { capturedContent = parts[0]; }
    }
    vi.stubGlobal('Blob', FakeBlob);
    mockSupabaseData([{
      date: '2026-01-15', start_time: '10:00',
      client_name: 'O"Brien',
      client_phone: '+380',
      total_price: 100, status: 'completed', discount_percent: 0, source: 'online',
      booking_services: [], booking_products: [],
    }]);
    await exportAnalyticsCsv('master-1', '2026-01-01', '2026-01-31');
    expect(capturedContent).toContain('O""Brien');
    vi.unstubAllGlobals();
  });
});
