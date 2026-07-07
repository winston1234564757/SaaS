import { createAdminClient } from '@/lib/supabase/admin';

export async function sendTurboSMS(phone: string, text: string): Promise<{ ok: boolean; code?: number }> {
  if (!process.env.TURBOSMS_TOKEN) {
    console.warn('[TurboSMS] Missing TURBOSMS_TOKEN');
    return { ok: false };
  }

  // Spend guard: per-recipient + global daily cap (atomic, advisory-locked). This is the
  // only path for notification SMS; OTP SMS use Supabase's provider + a separate limiter
  // and never reach here. Fail-open on a transient RPC error so a critical SMS is not lost.
  try {
    const admin = createAdminClient();
    const { data: allowed, error } = await admin.rpc('check_notification_sms_budget', { p_phone: phone });
    if (error) {
      console.error('[TurboSMS] budget RPC failed, sending anyway:', error.message);
    } else if (allowed === false) {
      console.warn('[TurboSMS] daily SMS cap reached — send suppressed');
      return { ok: false, code: -1 };
    }
  } catch (e) {
    console.error('[TurboSMS] budget guard threw, sending anyway:', e);
  }

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 8_000);
  let data: Record<string, unknown> | undefined;
  try {
    const res = await fetch('https://api.turbosms.ua/message/send.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TURBOSMS_TOKEN}`,
      },
      body: JSON.stringify({
        recipients: [phone],
        sms: { sender: process.env.TURBOSMS_SENDER ?? 'BookIT', text },
      }),
      signal: ctrl.signal,
    });
    data = await res.json();
  } catch (error) {
    console.error(`[TurboSMS] Fetch error for phone ${phone}:`, error);
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
  const rc = data?.response_code as number | undefined;
  const ok = rc === 0 || rc === 800 || rc === 801;
  if (!ok) {
    console.error(`[TurboSMS] API error for phone ${phone}: response_code=${rc}`, data);
  }
  return { ok, code: rc };
}
