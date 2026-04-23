export async function sendTurboSMS(phone: string, text: string): Promise<{ ok: boolean; code?: number }> {
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
  } finally {
    clearTimeout(timeout);
  }
  const rc = data?.response_code as number | undefined;
  return { ok: rc === 0 || rc === 800 || rc === 801, code: rc };
}
