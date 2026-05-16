import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationOrchestrator } from '../NotificationOrchestrator';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPush } from '@/lib/push';
import { sendTelegramMessage } from '@/lib/telegram';
import { sendTurboSMS } from '@/lib/turbosms';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));
vi.mock('@/lib/push', () => ({ sendPush: vi.fn() }));
vi.mock('@/lib/telegram', () => ({ sendTelegramMessage: vi.fn() }));
vi.mock('@/lib/turbosms', () => ({ sendTurboSMS: vi.fn() }));

describe('NotificationOrchestrator', () => {
  let mockAdmin: any;
  let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ error: null }),
    };
    mockAdmin = {
      from: vi.fn().mockReturnValue(mockQuery),
    };
    (createAdminClient as any).mockReturnValue(mockAdmin);
  });

  it('cascades correctly', async () => {
    // Mock profiles check
    mockQuery.maybeSingle.mockResolvedValueOnce({ data: { phone: '123', telegram_chat_id: 'tg' }, error: null }); // profile
    mockQuery.maybeSingle.mockResolvedValueOnce({ data: null, error: null }); // master_profile
    mockQuery.eq.mockResolvedValueOnce({ data: [], error: null }); // push_subscriptions (none)
    
    (sendTelegramMessage as any).mockResolvedValue(true);

    await NotificationOrchestrator.send({
      eventType: 'booking_created',
      recipientId: 'u1',
      recipientRole: 'client',
      data: { date: '2026-05-16', startTime: '10:00', services: 'X' },
    });

    expect(sendTelegramMessage).toHaveBeenCalled();
  });
});
