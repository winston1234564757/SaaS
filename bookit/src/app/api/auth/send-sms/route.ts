import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const { phone: rawPhone } = await req.json();

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
  console.log('[send-sms] cleaned phone:', phone);

  if (!/^380\d{9}$/.test(phone)) {
    console.warn('[send-sms] invalid phone format:', phone);
    return NextResponse.json(
      { error: 'Некоректний номер. Формат: +38 0XX XXX XX XX' },
      { status: 400 }
    );
  }

  const otp = (100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)).toString();

  const supabaseAdmin = createAdminClient();

  const { data: upsertData, error: dbError } = await supabaseAdmin
    .from('sms_otps')
    .upsert({ phone, otp }, { onConflict: 'phone' })
    .select();

  console.log('[send-sms] upsert result:', { upsertData, dbError });

  if (dbError) {
    console.error('[send-sms] DB Error Details:', dbError);
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
  console.log('[send-sms] TurboSMS response:', JSON.stringify(smsData, null, 2));

  // TurboSMS: response_code 800 або 0 = успіх
  if (smsData.response_code !== 800 && smsData.response_code !== 0) {
    console.error(
      '[send-sms] TurboSMS error — code:',
      smsData.response_code,
      '| status:',
      smsData.response_status
    );
    return NextResponse.json(
      { success: false, error: smsData.response_status ?? 'Помилка TurboSMS' },
      { status: 400 }
    );
  }

  console.log('[send-sms] SMS sent successfully to', phone);
  return NextResponse.json({ success: true });
}
