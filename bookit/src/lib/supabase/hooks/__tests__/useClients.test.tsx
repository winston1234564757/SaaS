// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClients } from '../useClients';
import { useMasterContext } from '@/lib/supabase/context';
import { createClient } from '@/lib/supabase/client';
import { makeBrowserClient, createWrapper, MASTER_ID, makeDbError } from './hookTestUtils';

vi.mock('@/lib/supabase/context', () => ({ useMasterContext: vi.fn() }));
vi.mock('@/lib/supabase/client',  () => ({ createClient:     vi.fn() }));

// ── Fixtures ───────────────────────────────────────────────────────────────────

const RAW_CLIENT = {
  client_phone:      '380501234567',
  client_name:       'Олена',
  client_id:         'cid-01',
  total_visits:      '5',           // DB may return numeric-as-string
  total_spent:       '25000',
  average_check:     '5000',
  last_visit_at:     '2026-01-10T00:00:00Z',
  last_service_name: 'Haircut',
  is_vip:            true,
  relation_id:       'rel-01',
  retention_status:  'active' as const,
  health_notes:      'no allergies',
  medical_notes:     null,
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useClients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMasterContext).mockReturnValue({
      user:          null,
      profile:       null,
      masterProfile: { id: MASTER_ID, subscription_tier: 'pro' } as any,
      subscription:  null,
      isLoading:     false,
      refresh:       vi.fn(),
    });
  });

  it('is disabled when masterId is null', () => {
    vi.mocked(useMasterContext).mockReturnValue({
      user: null, profile: null, masterProfile: null,
      subscription: null, isLoading: false, refresh: vi.fn(),
    });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClients(), { wrapper });
    expect(result.current.clients).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('calls rpc("get_master_clients") with correct p_master_id', async () => {
    const client = makeBrowserClient({}, { data: [] });
    vi.mocked(createClient).mockReturnValue(client as any);
    const { wrapper } = createWrapper();
    renderHook(() => useClients(), { wrapper });
    await waitFor(() =>
      expect(client.rpc).toHaveBeenCalledWith(
        'get_master_clients',
        { p_master_id: MASTER_ID },
      ),
    );
  });

  it('maps row correctly — numeric coercions and id = client_phone', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({}, { data: [RAW_CLIENT] }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClients(), { wrapper });
    await waitFor(() => expect(result.current.clients).toHaveLength(1));
    const c = result.current.clients[0];
    expect(c.id).toBe('380501234567');        // id = client_phone
    expect(c.client_id).toBe('cid-01');
    expect(c.total_visits).toBe(5);           // '5' → 5
    expect(c.total_spent).toBe(25000);
    expect(c.average_check).toBe(5000);
    expect(c.is_vip).toBe(true);
    expect(c.health_notes).toBe('no allergies');
    expect(c.medical_notes).toBeNull();
  });

  it('retention_status defaults to "active" when DB returns null', async () => {
    const row = { ...RAW_CLIENT, retention_status: null };
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({}, { data: [row] }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClients(), { wrapper });
    await waitFor(() => expect(result.current.clients).toHaveLength(1));
    expect(result.current.clients[0].retention_status).toBe('active');
  });

  it('client_name defaults to "Клієнт" when DB returns null', async () => {
    const row = { ...RAW_CLIENT, client_name: null };
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({}, { data: [row] }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClients(), { wrapper });
    await waitFor(() => expect(result.current.clients).toHaveLength(1));
    expect(result.current.clients[0].client_name).toBe('Клієнт');
  });

  it('is_vip defaults to false when DB returns null', async () => {
    const row = { ...RAW_CLIENT, is_vip: null };
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({}, { data: [row] }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClients(), { wrapper });
    await waitFor(() => expect(result.current.clients).toHaveLength(1));
    expect(result.current.clients[0].is_vip).toBe(false);
  });

  it('sets error when RPC returns a DB error', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({}, { data: null, error: makeDbError('RPC failed') }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClients(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.clients).toEqual([]);
  });

  it('empty RPC result yields empty clients array', async () => {
    vi.mocked(createClient).mockReturnValue(
      makeBrowserClient({}, { data: [] }) as any,
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useClients(), { wrapper });
    await waitFor(() => !result.current.isLoading);
    expect(result.current.clients).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
