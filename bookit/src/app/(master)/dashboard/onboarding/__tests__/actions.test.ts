/**
 * saveOnboardingProgress — захист від класу бага, який УЖЕ регресив (2026-05-29).
 *
 * Симптом того бага: майстер проходив онбординг, а прогрес не зберігався.
 * Причина: запис ішов звичайним (user) клієнтом, і RLS його блокувала — але
 * Supabase у цьому разі повертає `{ error: null }` з нуля оновлених рядків.
 * Тобто збій БЕЗЗВУЧНИЙ: код бачить «успіх», у базі не змінюється нічого.
 *
 * Тому головний тест тут не «функція повертає null», а «запис пішов admin-клієнтом».
 * Якщо хтось колись поверне user-клієнт, ці тести впадуть.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveOnboardingProgress } from '../actions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { OnboardingData } from '@/types/onboarding';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const USER_ID = 'master-1';

/** Записує всі виклики .from(...).update(...).eq(...) для перевірок. */
function makeSpyClient(updateError: { message: string } | null = null) {
  const calls: Array<{ table: string; payload: unknown; eqField: string; eqValue: unknown }> = [];

  const from = vi.fn((table: string) => ({
    update: (payload: unknown) => ({
      eq: (eqField: string, eqValue: unknown) => {
        calls.push({ table, payload, eqField, eqValue });
        return Promise.resolve({ error: updateError });
      },
    }),
  }));

  return { client: { from } as never, calls, from };
}

function makeUserClient(user: { id: string } | null = { id: USER_ID }) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn(() => {
      throw new Error('user-клієнт НЕ повинен писати профіль: RLS зробить збій беззвучним');
    }),
  } as never;
}

const DATA = { fullName: 'Оля' } as unknown as OnboardingData;

beforeEach(() => vi.clearAllMocks());

describe('saveOnboardingProgress', () => {
  it('пише профіль ADMIN-клієнтом, а не user-клієнтом (регресія 2026-05-29)', async () => {
    const admin = makeSpyClient();
    vi.mocked(createClient).mockResolvedValue(makeUserClient());
    vi.mocked(createAdminClient).mockReturnValue(admin.client);

    const res = await saveOnboardingProgress('PROFILE' as never, DATA);

    expect(res.error).toBeNull();
    expect(createAdminClient).toHaveBeenCalled();

    const write = admin.calls.find(c => c.table === 'profiles');
    expect(write, 'профіль мусить оновлюватись admin-клієнтом').toBeDefined();
    expect(write!.payload).toMatchObject({ onboarding_step: 'PROFILE', onboarding_data: DATA });
  });

  it('пише СВОЄМУ профілю — id береться з сесії, не з аргументів', async () => {
    const admin = makeSpyClient();
    vi.mocked(createClient).mockResolvedValue(makeUserClient({ id: USER_ID }));
    vi.mocked(createAdminClient).mockReturnValue(admin.client);

    await saveOnboardingProgress('SERVICES' as never, DATA);

    const write = admin.calls.find(c => c.table === 'profiles')!;
    // admin обходить RLS, тож єдине, що стоїть між майстром і чужим профілем — цей фільтр
    expect(write.eqField).toBe('id');
    expect(write.eqValue).toBe(USER_ID);
  });

  it('без сесії нічого не пише', async () => {
    const admin = makeSpyClient();
    vi.mocked(createClient).mockResolvedValue(makeUserClient(null));
    vi.mocked(createAdminClient).mockReturnValue(admin.client);

    const res = await saveOnboardingProgress('PROFILE' as never, DATA);

    expect(res.error).toBe('Не авторизований');
    expect(admin.calls).toHaveLength(0);
  });

  it('помилку запису повертає назад, а не ковтає', async () => {
    const admin = makeSpyClient({ message: 'db down' });
    vi.mocked(createClient).mockResolvedValue(makeUserClient());
    vi.mocked(createAdminClient).mockReturnValue(admin.client);

    const res = await saveOnboardingProgress('PROFILE' as never, DATA);

    expect(res.error).toBe('db down');
  });

  it('на кроці SUCCESS вмикає activation tour', async () => {
    const admin = makeSpyClient();
    vi.mocked(createClient).mockResolvedValue(makeUserClient());
    vi.mocked(createAdminClient).mockReturnValue(admin.client);

    await saveOnboardingProgress('SUCCESS' as never, DATA);

    const tour = admin.calls.find(c => c.table === 'master_profiles');
    expect(tour, 'після завершення онбордингу тур мусить ініціалізуватись').toBeDefined();
    expect(tour!.payload).toMatchObject({ activation_tour_step: 0 });
    expect(tour!.eqValue).toBe(USER_ID);
  });

  it('на проміжних кроках тур НЕ чіпає', async () => {
    const admin = makeSpyClient();
    vi.mocked(createClient).mockResolvedValue(makeUserClient());
    vi.mocked(createAdminClient).mockReturnValue(admin.client);

    await saveOnboardingProgress('SCHEDULE' as never, DATA);

    expect(admin.calls.some(c => c.table === 'master_profiles')).toBe(false);
  });
});
