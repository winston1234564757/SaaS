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

  // Rate limiting — паралельні запити для мінімальної затримки
  // IP: окрема таблиця sms_ip_logs (до 10 запитів на годину з одного IP)
  // Phone: sms_logs (до 3 SMS на 15 хвилин на один номер)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const [{ count: ipCount }, { count: phoneCount }] = await Promise.all([
    supabaseAdmin
      .from('sms_ip_logs')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', oneHourAgo),
    supabaseAdmin
      .from('sms_logs')
      .select('id', { count: 'exact', head: true })
      .eq('phone', phone)
      .gte('created_at', fifteenMinAgo),
  ]);

  if (ipCount !== null && ipCount >= 10) {
    console.warn('[send-sms] IP rate limit exceeded:', ip);
    return NextResponse.json(
      { success: false, error: 'Забагато спроб з вашого пристрою. Спробуйте пізніше.' },
      { status: 429 }
    );
  }

  if (phoneCount !== null && phoneCount >= 3) {
    console.warn('[send-sms] Phone rate limit exceeded:', phone);
    return NextResponse.json(
      { success: false, error: 'Забагато СМС на цей номер. Зачекайте 15 хвилин.' },
      { status: 429 }
    );
  }

  const { error: dbError } = await supabaseAdmin
    .from('sms_otps')
    .upsert({ phone, otp }, { onConflict: 'phone' });

  if (dbError) {
    console.error('[send-sms] DB error:', dbError.message);
    return NextResponse.json(
      { success: false, error: `DB Error: ${dbError.message}` },
      { status: 500 }
    );
  }

  const smsRes = await fetch('https://api.turbosms.ua/message/send.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.TURBOSMS_TOKEN}`,
    },
    body: JSON.stringify({
      recipients: [phone],
      sms: {
        sender: 'BEAUTY',
        text: `Код підтвердження BookIt: ${otp}`,
      },
    }),
  });

  const smsData = await smsRes.json();

  // TurboSMS: response_code 800 або 0 = успіх
  if (smsData.response_code !== 800 && smsData.response_code !== 0) {
    console.error('[send-sms] TurboSMS error:', smsData.response_code, smsData.response_status);
    return NextResponse.json(
      { success: false, error: smsData.response_status ?? 'Помилка TurboSMS' },
      { status: 400 }
    );
  }

  // Логуємо окремо: IP (для IP rate-limit) і phone (для phone rate-limit)
  await Promise.all([
    supabaseAdmin.from('sms_ip_logs').insert({ ip_address: ip }),
    supabaseAdmin.from('sms_logs').insert({ phone, ip }),
  ]);

  return NextResponse.json({ success: true });
}
