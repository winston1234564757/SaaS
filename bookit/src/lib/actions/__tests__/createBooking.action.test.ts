/**
 * Integration tests for createBooking() server action.
 * Tests the real exported function with mocked Supabase clients.
 *
 * Architecture:
 *   makeChain(result) — Proxy-based Supabase query builder that supports
 *     both chaining (.select().eq()...) and direct await (insert, update).
 *   makeAdmin(tables) — per-table queue mock so consecutive calls to the
 *     same table can return different values.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBooking, type CreateBookingPayload } from '../createBooking';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyDynamicPricing } from '@/lib/utils/dynamicPricing';
import { computeEndTime } from '@/lib/utils/bookingEngine';
import { notifyMasterNewBooking } from '@/lib/notifications';

// ── Module mocks ───────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/admin',  () => ({ createAdminClient: vi.fn() }));
vi.mock('@/lib/utils/dynamicPricing', () => ({ applyDynamicPricing: vi.fn() }));
vi.mock('@/lib/utils/bookingEngine',  () => ({ computeEndTime: vi.fn(() => '11:00') }));
vi.mock('@/lib/notifications',        () => ({ notifyMasterNewBooking: vi.fn() }));
vi.mock('@/lib/utils/now',            () => ({ getNow: vi.fn(() => new Date('2026-01-15T10:00:00Z')) }));
vi.mock('next/cache',                 () => ({ revalidatePath: vi.fn() }));

// ── Supabase chain mock ────────────────────────────────────────────────────────

type MockResult = { data?: unknown; error?: unknown; count?: number | null };

/**
 * Returns an object that:
 *  - chains any Supabase query method back to itself (.select, .eq, …)
 *  - is directly awaitable (for `await admin.from('t').insert(…)`)
 *  - provides .single() and .maybeSingle() that resolve to `result`
 */
function makeChain(r: MockResult = {}): any {
  const resolved = {
    data:  r.data  !== undefined ? r.data  : null,
    error: r.error !== undefined ? r.error : null,
    count: r.count !== undefined ? r.count : null,
  };
  const p = Promise.resolve(resolved);
  const chain: any = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'gte', 'gt', 'is', 'not', 'limit', 'order', 'or',
  ];
  for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain);
  chain.single      = vi.fn().mockResolvedValue(resolved);
  chain.maybeSingle = vi.fn().mockResolvedValue(resolved);
  chain.then        = p.then.bind(p);
  chain.catch       = p.catch.bind(p);
  chain.finally     = p.finally.bind(p);
  return chain;
}

/**
 * Creates a fake Supabase admin client.
 * `tables` maps table names to an ordered queue of MockResults.
 * Consecutive calls to `admin.from(tableName)` consume the queue in order;
 * the last item is reused once the queue is exhausted.
 */
function makeAdmin(
  tables: Record<string, MockResult[]> = {},
  rpcResult: MockResult = {},
): any {
  const idx: Record<string, number> = {};
  return {
    from: vi.fn().mockImplementation((table: string) => {
      const queue = tables[table] ?? [{}];
      const i     = idx[table] ?? 0;
      idx[table]  = i + 1;
      return makeChain(queue[Math.min(i, queue.length - 1)]);
    }),
    rpc: vi.fn().mockResolvedValue({
      data:  rpcResult.data  ?? null,
      error: rpcResult.error ?? null,
    }),
  };
}

// ── Shared fixtures ────────────────────────────────────────────────────────────

const MASTER_ID = 'aaaaaaaa-0000-4000-8000-000000000001';
const SVC_ID    = 'bbbbbbbb-0000-4000-8000-000000000002';
const CLIENT_ID = 'cccccccc-0000-4000-8000-000000000003';
const PROD_ID   = 'dddddddd-0000-4000-8000-000000000004';

const BASE_MASTER = {
  subscription_tier:            'pro',
  pricing_rules:                null,
  dynamic_pricing_extra_earned: 0,
  telegram_chat_id:             null,
  is_published:                 true,
  timezone:                     'Europe/Kyiv',
  c2c_enabled:                  false,
  c2c_discount_pct:             10,
};

const BASE_SERVICE = {
  id:               SVC_ID,
  name:             'Haircut',
  price:            500,
  duration_minutes: 60,
  is_active:        true,
};

/** Minimum valid payload for an online anonymous booking. */
function buildPayload(overrides: Partial<CreateBookingPayload> = {}): CreateBookingPayload {
  return {
    masterId:                MASTER_ID,
    clientName:              'Аня',
    clientPhone:             '+380501234567',
    clientEmail:             null,
    clientId:                null,
    services:                [{ id: SVC_ID, name: 'Haircut', price: 500, duration: 60 }],
    products:                [],
    source:                  'online',
    discountPercent:         0,
    applyDynamicPricing:     true,
    date:                    '2026-01-15',
    startTime:               '10:00',
    notes:                   null,
    flashDealId:             null,
    referral_code_used:      null,
    c2c_discount_pct:        null,
    c2c_bonus_to_use:        null,
    durationOverrideMinutes: null,
    ...overrides,
  };
}

/**
 * Default happy-path admin for online anonymous + pro master.
 * bookings[0] = loyalty past-visits count (0)
 * bookings[1] = insert (success)
 */
function makeHappyAdmin(
  masterOverrides: Partial<typeof BASE_MASTER> = {},
): ReturnType<typeof makeAdmin> {
  return makeAdmin({
    master_profiles:  [{ data: { ...BASE_MASTER, ...masterOverrides } }],
    services:         [{ data: [BASE_SERVICE] }],
    bookings:         [{ count: 0 }, { error: null }],
    loyalty_programs: [{ data: [] }],
    phone_discounts:  [{ data: null }],
    booking_services: [{ error: null }],
  });
}

function mockAnonClient(): void {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  } as any);
}

function mockAuthClient(userId: string): void {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
  } as any);
}

// ── Test suite ─────────────────────────────────────────────────────────────────

describe('createBooking() — server action integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyDynamicPricing).mockImplementation((basePrice) => ({ adjustedPrice: basePrice, modifier: 0, label: null }));
    vi.mocked(computeEndTime).mockReturnValue('11:00');
    vi.mocked(notifyMasterNewBooking).mockResolvedValue(undefined as any);
  });

  // ── Schema validation ────────────────────────────────────────────────────────

  describe('schema validation', () => {
    it('returns error for a payload with an invalid masterId (not a UUID)', async () => {
      const result = await createBooking({ masterId: 'not-a-uuid' } as any);
      expect(result.bookingId).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('returns error when both services and products are empty arrays', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({ master_profiles: [{ data: BASE_MASTER }] }) as any,
      );
      const result = await createBooking(buildPayload({ services: [], products: [] }));
      expect(result.bookingId).toBeNull();
      expect(result.error).toBe('Оберіть хоча б одну послугу або товар');
    });
  });

  // ── Manual source auth gate ──────────────────────────────────────────────────

  describe('manual source auth gate', () => {
    it('blocks an unauthenticated caller (no session)', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(makeHappyAdmin() as any);
      const result = await createBooking(buildPayload({ source: 'manual' }));
      expect(result.error).toBe('Не авторизований');
    });

    it('blocks a caller whose session ID does not match masterId', async () => {
      mockAuthClient('completely-different-user');
      vi.mocked(createAdminClient).mockReturnValue(makeHappyAdmin() as any);
      const result = await createBooking(buildPayload({ source: 'manual' }));
      expect(result.error).toBe('Не авторизований');
    });

    it('blocks a caller authenticated as masterId but carrying the client role', async () => {
      mockAuthClient(MASTER_ID);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          profiles:         [{ data: { role: 'client' } }],
          master_profiles:  [{ data: BASE_MASTER }],
          services:         [{ data: [BASE_SERVICE] }],
          bookings:         [{ error: null }],
          booking_services: [{ error: null }],
        }) as any,
      );
      const result = await createBooking(buildPayload({ source: 'manual' }));
      expect(result.error).toBe('Не авторизований');
    });
  });

  // ── Master visibility guards ─────────────────────────────────────────────────

  describe('master guards', () => {
    it('returns Майстра не знайдено when master_profiles row does not exist', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles: [{ data: null, error: { message: 'PGRST116', code: '406' } }],
        }) as any,
      );
      const result = await createBooking(buildPayload());
      expect(result.error).toBe('Майстра не знайдено');
    });

    it('blocks an online booking when master is_published = false', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles: [{ data: { ...BASE_MASTER, is_published: false } }],
        }) as any,
      );
      const result = await createBooking(buildPayload({ source: 'online' }));
      expect(result.error).toBe('Майстра не знайдено');
    });
  });

  // ── Starter tier monthly booking limit ───────────────────────────────────────

  describe('starter tier monthly limit', () => {
    it('proceeds when current-month booking count is 39 (below the 40 cap)', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles:  [{ data: { ...BASE_MASTER, subscription_tier: 'starter' } }],
          services:         [{ data: [BASE_SERVICE] }],
          bookings:         [{ count: 39 }, { count: 0 }, { error: null }],
          loyalty_programs: [{ data: [] }],
          phone_discounts:  [{ data: null }],
          booking_services: [{ error: null }],
        }) as any,
      );
      const result = await createBooking(buildPayload());
      expect(result.error).toBeNull();
      expect(result.bookingId).toBeTruthy();
    });

    it('returns upgradeRequired = true when count reaches 40', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles: [{ data: { ...BASE_MASTER, subscription_tier: 'starter' } }],
          bookings:        [{ count: 40 }],
        }) as any,
      );
      const result = await createBooking(buildPayload());
      expect(result.upgradeRequired).toBe(true);
      expect(result.bookingId).toBeNull();
      expect(result.error).toContain('40');
    });
  });

  // ── Service validation ───────────────────────────────────────────────────────

  describe('service validation', () => {
    it('returns error when DB returns 0 services for the requested IDs (not found)', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles: [{ data: BASE_MASTER }],
          services:        [{ data: [] }],
        }) as any,
      );
      const result = await createBooking(buildPayload());
      expect(result.error).toBe('Одну або більше послуг не знайдено');
    });

    it('returns error containing service name when the service is inactive', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles: [{ data: BASE_MASTER }],
          services:        [{ data: [{ ...BASE_SERVICE, is_active: false }] }],
        }) as any,
      );
      const result = await createBooking(buildPayload());
      expect(result.error).toContain('більше не активна');
    });
  });

  // ── Product validation ───────────────────────────────────────────────────────

  describe('product validation', () => {
    const PRODUCT_PAYLOAD = buildPayload({
      services:  [],
      products:  [{ id: PROD_ID, name: 'Shampoo', price: 200, quantity: 2 }],
      date:      null,
      startTime: null,
    });

    it('returns error when the product is not found in DB', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles: [{ data: BASE_MASTER }],
          products:        [{ data: [] }],
        }) as any,
      );
      const result = await createBooking(PRODUCT_PAYLOAD);
      expect(result.error).toBe('Один або більше товарів не знайдено');
    });

    it('returns error containing product name when stock_qty < requested quantity', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles: [{ data: BASE_MASTER }],
          products: [{
            data: [{
              id:            PROD_ID,
              name:          'Shampoo',
              price_kopecks: 20000,
              stock_qty:     1,
              is_active:     true,
            }],
          }],
        }) as any,
      );
      const result = await createBooking(PRODUCT_PAYLOAD);
      expect(result.error).toContain('Недостатньо товару');
      expect(result.error).toContain('Shampoo');
    });
  });

  // ── Atomic stock decrement (RPC mid-flight) ──────────────────────────────────

  describe('atomic stock decrement', () => {
    const PRODUCT_WITH_STOCK = {
      id:            PROD_ID,
      name:          'Shampoo',
      price_kopecks: 20000,
      stock_qty:     5,
      is_active:     true,
    };
    const PRODUCT_PAYLOAD = buildPayload({
      services:  [],
      products:  [{ id: PROD_ID, name: 'Shampoo', price: 200, quantity: 2 }],
      date:      null,
      startTime: null,
    });

    it('rolls back booking and returns oversold error when RPC returns data: false', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin(
          {
            master_profiles: [{ data: BASE_MASTER }],
            products:        [{ data: [PRODUCT_WITH_STOCK] }],
            // bookings[0]=insert (success), bookings[1]=delete (rollback)
            bookings:        [{ error: null }, { error: null }],
            loyalty_programs: [{ data: [] }],
            phone_discounts:  [{ data: null }],
          },
          { data: false }, // RPC: stock exhausted mid-flight
        ) as any,
      );
      const result = await createBooking(PRODUCT_PAYLOAD);
      expect(result.bookingId).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('rolls back booking and returns error when RPC returns an error object', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin(
          {
            master_profiles: [{ data: BASE_MASTER }],
            products:        [{ data: [PRODUCT_WITH_STOCK] }],
            // bookings[0]=insert (success), bookings[1]=delete (rollback)
            bookings:        [{ error: null }, { error: null }],
            loyalty_programs: [{ data: [] }],
            phone_discounts:  [{ data: null }],
          },
          { error: { message: 'connection timeout', code: 'PGRST000' } }, // RPC: DB failure
        ) as any,
      );
      const result = await createBooking(PRODUCT_PAYLOAD);
      expect(result.bookingId).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  // ── Dynamic pricing ──────────────────────────────────────────────────────────

  describe('dynamic pricing', () => {
    it('applies peak-hour markup when pricing_rules are set and applyDynamicPricing = true', async () => {
      vi.mocked(applyDynamicPricing).mockReturnValue({
        adjustedPrice: 600,
        modifier:      0.2,
        label:         'Пік +20%',
      } as any);
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeHappyAdmin({ pricing_rules: { peak: { modifier: 0.2, hours: [10, 11] } } as any }) as any,
      );
      const result = await createBooking(buildPayload());
      expect(applyDynamicPricing).toHaveBeenCalledOnce();
      expect(result.finalTotal).toBe(600);
      expect(result.error).toBeNull();
    });

    it('does not call applyDynamicPricing when Starter trial cap (100 000 kop.) is exhausted', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles: [{
            data: {
              ...BASE_MASTER,
              subscription_tier:            'starter',
              dynamic_pricing_extra_earned: 100_000,
              pricing_rules:                { peak: { modifier: 0.2 } } as any,
            },
          }],
          services:         [{ data: [BASE_SERVICE] }],
          // bookings[0]=limit count, bookings[1]=loyalty count, bookings[2]=insert
          bookings:         [{ count: 0 }, { count: 0 }, { error: null }],
          loyalty_programs: [{ data: [] }],
          phone_discounts:  [{ data: null }],
          booking_services: [{ error: null }],
        }) as any,
      );
      const result = await createBooking(buildPayload());
      expect(applyDynamicPricing).not.toHaveBeenCalled();
      expect(result.finalTotal).toBe(500);
    });
  });

  // ── Loyalty discount ─────────────────────────────────────────────────────────

  describe('loyalty discount engine', () => {
    it('applies the percent_discount rule when client visit count meets target_visits', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles:  [{ data: BASE_MASTER }],
          services:         [{ data: [BASE_SERVICE] }],
          bookings:         [{ count: 4 }, { error: null }],
          loyalty_programs: [{
            data: [{
              name:          'Постійний клієнт',
              target_visits: 5,
              reward_type:   'percent_discount',
              reward_value:  10,
            }],
          }],
          phone_discounts:  [{ data: null }],
          booking_services: [{ error: null }],
        }) as any,
      );
      const result = await createBooking(buildPayload());
      // 4 past completed visits + this = 5 → qualifies for 10 % discount
      // loyaltyDiscountAmount = round(500 * 10 / 100) = 50 → finalTotal = 450
      expect(result.finalTotal).toBe(450);
      expect(result.error).toBeNull();
    });
  });

  // ── Combined 40 % discount cap ───────────────────────────────────────────────

  describe('40 % discount cap', () => {
    it('limits combined discounts to 40 % of originalTotal even when calculation exceeds it', async () => {
      // Dynamic pricing returns a deep quiet-hour discount that would yield -80 %
      vi.mocked(applyDynamicPricing).mockReturnValue({
        adjustedPrice: 100,   // 500 - 80 % = 100
        modifier:      -0.8,
        label:         'Тихий -80 %',
      } as any);
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeHappyAdmin({ pricing_rules: { quiet: { modifier: -0.8 } } as any }) as any,
      );
      const result = await createBooking(buildPayload());
      // originalTotal = 500, maxAllowedDiscount = floor(500 * 0.40) = 200
      // dynamicDiscount = 400 → capped to 200
      // preFinalTotal   = 500 + 0 (no markup) - 200 = 300
      expect(result.finalTotal).toBe(300);
      expect(result.error).toBeNull();
    });
  });

  // ── C2C referral discount ────────────────────────────────────────────────────

  describe('C2C referral discount', () => {
    it('applies friend discount when all 5 eligibility conditions are met', async () => {
      mockAuthClient(CLIENT_ID);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          profiles:          [{ data: { role: 'client' } }],
          // client_profiles[0] = upsert result (no return needed)
          // client_profiles[1] = referrer lookup by referral_code
          client_profiles:   [{ data: null }, { data: { id: 'referrer-uuid' } }],
          client_promocodes: [{ data: null }],
          master_profiles:   [{ data: { ...BASE_MASTER, c2c_enabled: true, c2c_discount_pct: 10 } }],
          services:          [{ data: [BASE_SERVICE] }],
          // bookings[0]=loyalty count, bookings[1]=prior-bookings count (0=new), bookings[2]=insert
          bookings:          [{ count: 0 }, { count: 0 }, { error: null }],
          loyalty_programs:  [{ data: [] }],
          // c2c_referrals[0]=existence check (null=no prior), c2c_referrals[1]=insert
          c2c_referrals:     [{ data: null }, { error: null }],
          phone_discounts:   [{ data: null }],
          booking_services:  [{ error: null }],
        }) as any,
      );
      const result = await createBooking(
        buildPayload({ referral_code_used: 'REF001', clientId: CLIENT_ID }),
      );
      // c2cFriendAmount = round(500 * 10 / 100) = 50 → finalTotal = 500 - 50 = 450
      expect(result.finalTotal).toBe(450);
      expect(result.error).toBeNull();
    });

    it('skips C2C discount entirely when master has c2c_enabled = false', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeHappyAdmin({ c2c_enabled: false }) as any,
      );
      const result = await createBooking(buildPayload({ referral_code_used: 'REF001' }));
      expect(result.finalTotal).toBe(500);
      expect(result.error).toBeNull();
    });
  });

  // ── Booking insert ───────────────────────────────────────────────────────────

  describe('booking insert', () => {
    it('returns a valid UUID bookingId and correct finalTotal on a successful happy-path call', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(makeHappyAdmin() as any);
      const result = await createBooking(buildPayload());
      expect(result.bookingId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(result.finalTotal).toBe(500);
      expect(result.error).toBeNull();
    });

    it('returns the slot-collision message when DB responds with 23505 containing "booking_slot_collision"', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles:  [{ data: BASE_MASTER }],
          services:         [{ data: [BASE_SERVICE] }],
          bookings:         [{ count: 0 }, { error: { code: '23505', message: 'booking_slot_collision' } }],
          loyalty_programs: [{ data: [] }],
          phone_discounts:  [{ data: null }],
        }) as any,
      );
      const result = await createBooking(buildPayload());
      expect(result.error).toBe('Цей час уже зайнятий. Оберіть інший.');
      expect(result.bookingId).toBeNull();
    });

    // 23P01 = exclusion_violation від `bookings_no_overlap`: запис не збігається
    // початком з чужим, але ПЕРЕТИНАЄТЬСЯ з ним (09:15-10:05 проти 10:00-10:50).
    // Unique-індекс такого не ловив — саме так на прод потрапили перекриті записи.
    // Для клієнта це той самий випадок, що й точний збіг: час не вільний.
    it('returns the same "slot taken" message when DB responds with 23P01 (bookings_no_overlap)', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles:  [{ data: BASE_MASTER }],
          services:         [{ data: [BASE_SERVICE] }],
          bookings:         [{ count: 0 }, { error: { code: '23P01', message: 'conflicting key value violates exclusion constraint "bookings_no_overlap"' } }],
          loyalty_programs: [{ data: [] }],
          phone_discounts:  [{ data: null }],
        }) as any,
      );
      const result = await createBooking(buildPayload());
      expect(result.error).toBe('Цей час уже зайнятий. Оберіть інший.');
      expect(result.bookingId).toBeNull();
    });

    it('returns Помилка збереження послуг. and rolling back when booking_services insert fails', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          master_profiles:  [{ data: BASE_MASTER }],
          services:         [{ data: [BASE_SERVICE] }],
          // bookings[0]=loyalty, bookings[1]=insert (success), bookings[2]=delete (rollback)
          bookings:         [{ count: 0 }, { error: null }, { error: null }],
          loyalty_programs: [{ data: [] }],
          phone_discounts:  [{ data: null }],
          booking_services: [{ error: { code: '23503', message: 'fk_violation' } }],
        }) as any,
      );
      const result = await createBooking(buildPayload());
      expect(result.error).toBe('Помилка збереження послуг.');
      expect(result.bookingId).toBeNull();
    });

    it('calls notifyMasterNewBooking with correct masterId and clientName after success', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(makeHappyAdmin() as any);
      await createBooking(buildPayload({ clientName: 'Тест-Клієнт' }));
      expect(notifyMasterNewBooking).toHaveBeenCalledOnce();
      expect(notifyMasterNewBooking).toHaveBeenCalledWith(
        expect.objectContaining({ masterId: MASTER_ID, clientName: 'Тест-Клієнт' }),
      );
    });
  });

  // ── Manual source ────────────────────────────────────────────────────────────

  describe('manual source', () => {
    it('creates a confirmed booking when caller is authenticated as master with master role', async () => {
      mockAuthClient(MASTER_ID);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          profiles:         [{ data: { role: 'master' } }],
          master_profiles:  [{ data: BASE_MASTER }],
          services:         [{ data: [BASE_SERVICE] }],
          bookings:         [{ error: null }],
          booking_services: [{ error: null }],
        }) as any,
      );
      const result = await createBooking(buildPayload({ source: 'manual', discountPercent: 0 }));
      expect(result.error).toBeNull();
      expect(result.bookingId).toBeTruthy();
      expect(result.finalTotal).toBe(500);
    });

    it('caps a manual discountPercent of 80 at 50 then further caps the result at 40 % of originalTotal', async () => {
      mockAuthClient(MASTER_ID);
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdmin({
          profiles:         [{ data: { role: 'master' } }],
          master_profiles:  [{ data: BASE_MASTER }],
          services:         [{ data: [BASE_SERVICE] }],
          bookings:         [{ error: null }],
          booking_services: [{ error: null }],
        }) as any,
      );
      const result = await createBooking(buildPayload({ source: 'manual', discountPercent: 80 }));
      // discountPercent(80) → capped to 50 via Math.min(80, 50)
      // loyaltyDiscountAmount = round(500 * 50 / 100) = 250
      // effectiveDiscount     = min(floor(500 * 0.40) = 200, 250) = 200
      // finalTotal            = 500 - 200 = 300
      expect(result.error).toBeNull();
      expect(result.finalTotal).toBe(300);
    });
  });

  // ── Flash deal slot validation ───────────────────────────────────────────────

  describe('flash deal slot validation', () => {
    const FLASH_DEAL_ID = 'eeeeeeee-0000-4000-8000-000000000005';

    function makeAdminWithFlashDeal(
      dealData: Record<string, unknown>,
    ): ReturnType<typeof makeAdmin> {
      return makeAdmin({
        master_profiles:  [{ data: BASE_MASTER }],
        services:         [{ data: [BASE_SERVICE] }],
        bookings:         [{ count: 0 }, { error: null }],
        loyalty_programs: [{ data: [] }],
        phone_discounts:  [{ data: null }],
        flash_deals:      [{ data: dealData }, { error: null }], // fetch + claim update
        booking_services: [{ error: null }],
      });
    }

    it('applies 20% discount when flash deal slot matches booking date and time', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdminWithFlashDeal({
          discount_pct: 20,
          status:       'active',
          master_id:    MASTER_ID,
          slot_date:    '2026-01-15',
          slot_time:    '10:00:00',
        }) as any,
      );
      const result = await createBooking(buildPayload({ flashDealId: FLASH_DEAL_ID }));
      // flashDealAmount = round(500 * 20 / 100) = 100 → finalTotal = 400
      expect(result.finalTotal).toBe(400);
      expect(result.error).toBeNull();
    });

    it('does NOT apply discount when slot_date differs from booking date', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdminWithFlashDeal({
          discount_pct: 20,
          status:       'active',
          master_id:    MASTER_ID,
          slot_date:    '2026-01-20', // different date
          slot_time:    '10:00:00',
        }) as any,
      );
      const result = await createBooking(buildPayload({ flashDealId: FLASH_DEAL_ID }));
      expect(result.finalTotal).toBe(500);
      expect(result.error).toBeNull();
    });

    it('does NOT apply discount when slot_time differs from booking startTime', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdminWithFlashDeal({
          discount_pct: 20,
          status:       'active',
          master_id:    MASTER_ID,
          slot_date:    '2026-01-15',
          slot_time:    '14:00:00', // different time
        }) as any,
      );
      const result = await createBooking(buildPayload({ flashDealId: FLASH_DEAL_ID }));
      expect(result.finalTotal).toBe(500);
      expect(result.error).toBeNull();
    });

    it('does NOT apply discount when flash deal status is not active', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdminWithFlashDeal({
          discount_pct: 20,
          status:       'claimed', // already used
          master_id:    MASTER_ID,
          slot_date:    '2026-01-15',
          slot_time:    '10:00:00',
        }) as any,
      );
      const result = await createBooking(buildPayload({ flashDealId: FLASH_DEAL_ID }));
      expect(result.finalTotal).toBe(500);
      expect(result.error).toBeNull();
    });

    it('does NOT apply discount when master_id does not match', async () => {
      mockAnonClient();
      vi.mocked(createAdminClient).mockReturnValue(
        makeAdminWithFlashDeal({
          discount_pct: 20,
          status:       'active',
          master_id:    'ffffffff-0000-4000-8000-000000000099', // different master
          slot_date:    '2026-01-15',
          slot_time:    '10:00:00',
        }) as any,
      );
      const result = await createBooking(buildPayload({ flashDealId: FLASH_DEAL_ID }));
      expect(result.finalTotal).toBe(500);
      expect(result.error).toBeNull();
    });

    it('marks deal as claimed: flash_deals table called at least twice (fetch + update)', async () => {
      mockAnonClient();
      const admin = makeAdminWithFlashDeal({
        discount_pct: 20,
        status:       'active',
        master_id:    MASTER_ID,
        slot_date:    '2026-01-15',
        slot_time:    '10:00:00',
      });
      vi.mocked(createAdminClient).mockReturnValue(admin as any);
      const result = await createBooking(buildPayload({ flashDealId: FLASH_DEAL_ID }));
      expect(result.finalTotal).toBe(400);
      expect(result.error).toBeNull();
      const flashDealsCallCount = (admin.from as ReturnType<typeof vi.fn>).mock.calls
        .filter((call: string[]) => call[0] === 'flash_deals').length;
      expect(flashDealsCallCount).toBeGreaterThanOrEqual(2);
    });
  });
});
