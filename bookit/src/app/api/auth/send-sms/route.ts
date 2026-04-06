import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Невірний формат запиту' }, { status: 400 });
  }
  const rawPhone = body.phone;

  if (!rawPhone) {
    return NextResponse.json({ error: 'Введіть номер телефону' }, { status: 400 });
  }

  // Guard: перевірка env на момент запиту
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[send-sms] CRITICAL: env variables missing at runtime!');
    return NextResponse.json(
      { success: false, error: 'Server configuration error (Keys missing)' },
      { status: 500 }
    );
  }

  // Жорстке очищення: лише цифри → формат 380XXXXXXXXX
  const phone = String(rawPhone).replace(/\D/g, '');

  if (!/^380\d{9}$/.test(phone)) {
    console.warn('[send-sms] invalid phone format:', phone);
    return NextResponse.json(
      { error: 'Некоректний номер. Формат: +38 0XX XXX XX XX' },
      { status: 400 }
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const otp = (100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)).toString();

  const supabaseAdmin = createAdminClient();

  // Перевірка: чи не зайнятий цей номер іншим акаунтом.
  // SMS-власник телефону має email = `${phone}@bookit.app`.
  // Якщо в profiles є рядок з цим phone, але з іншим email — конфлікт.
  {
    const virtualEmail = `${phone}@bookit.app`;
    const { data: conflict } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .neq('email', virtualEmail)
      .not('email', 'is', null)
      .maybeSingle();

    if (conflict) {
      return NextResponse.json(
        { success: false, error: 'Цей номер вже прив\'язаний до іншого акаунту. Увійдіть через Google або зверніться до підтримки.' },
        { status: 409 },
      );
    }
  }

  // Atomic rate-limit check via PostgreSQL RPC (fixes TOCTOU race condition).
  // check_and_log_sms_send() uses pg_advisory_xact_lock to serialize
  // concurrent requests for the same phone/IP, preventing SELECT+INSERT race.
  const { data: rlResult, error: rlError } = await supabaseAdmin.rpc(
    'check_and_log_sms_send',
    { p_phone: phone, p_ip: ip }
  );

  if (rlError) {
    console.error('[send-sms] rate-limit RPC error:', rlError.message);
    return NextResponse.json(
      { success: false, error: 'Помилка перевірки. Спробуйте пізніше.' },
      { status: 500 }
    );
  }

  if (rlResult === 'phone_limit') {
    console.warn('[send-sms] phone rate limit exceeded:', phone);
    return NextResponse.json(
      { success: false, error: 'Забагато СМС на цей номер. Зачекайте 15 хвилин.' },
      { status: 429 }
    );
  }

  if (rlResult === 'ip_limit') {
    console.warn('[send-sms] IP rate limit exceeded:', ip);
    return NextResponse.json(
      { success: false, error: 'Забагато спроб з вашого пристрою. Спробуйте пізніше.' },
      { status: 429 }
    );
  }

  const { error: dbError } = await supabaseAdmin
    .from('sms_otps')
    .upsert({ phone, otp, created_at: new Date().toISOString() }, { onConflict: 'phone' });

  if (dbError) {
    console.error('[send-sms] DB error:', dbError.message);
    return NextResponse.json(
      { success: false, error: 'Помилка сервера. Спробуйте пізніше.' },
      { status: 500 }
    );
  }

  // 8s timeout — TurboSMS may be slow; without it the route hangs until Vercel's 30s limit
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);

  let smsData: { response_code?: number; response_status?: string; [key: string]: unknown };
  try {
    const smsRes = await fetch('https://api.turbosms.ua/message/send.json', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TURBOSMS_TOKEN}`,
      },
      body: JSON.stringify({
        recipients: [phone],
        sms: {
          sender: 'BookIT',
          text: `Код підтвердження BookIt: ${otp}`,
        },
      }),
    });
    smsData = await smsRes.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[send-sms] TurboSMS fetch failed:', err);
    return NextResponse.json(
      { success: false, error: 'Не вдалося надіслати SMS. Спробуйте ще раз.' },
      { status: 503 }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // TurboSMS: 800=queued, 801=sent, 0=ok; або response_status містить SUCCESS/OK
  const isSuccess =
    smsData.response_code === 800 ||
    smsData.response_code === 801 ||
    smsData.response_code === 0 ||
    smsData.response_status === 'OK' ||
    smsData.response_status === 'SUCCESS_MESSAGE_SENT';

  if (!isSuccess) {
    console.error('[send-sms] TurboSMS unexpected response:', JSON.stringify(smsData));
    return NextResponse.json(
      { success: false, error: 'Не вдалося надіслати SMS. Спробуйте пізніше.' },
      { status: 400 }
    );
  }

  console.log('[send-sms] TurboSMS success:', smsData.response_code, smsData.response_status);

  return NextResponse.json({ success: true });
}
