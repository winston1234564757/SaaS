import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs'; // Required for buffer/file operations

export async function POST(request: NextRequest) {
  try {
    const { dataUrl, filename, caption } = await request.json();

    if (!dataUrl) {
      return NextResponse.json({ error: 'No dataUrl provided' }, { status: 400 });
    }

    // 1. Get user from session to find their telegram_id
    const supabase = createAdminClient();
    const token = request.headers.get('Authorization')?.split(' ')[1] || '';
    console.log('[SendStory] Request with token length:', token.length);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[SendStory] Auth error or no user:', authError);
      return NextResponse.json({ error: 'Сесія недійсна. Спробуйте перезавантажити додаток.' }, { status: 401 });
    }

    console.log('[SendStory] Identified user:', user.id);

    // 2. Get the Telegram ID from either master_profiles or profiles
    // We check master_profiles first because that's where masters connect their bot
    const { data: masterProfile } = await supabase
      .from('master_profiles')
      .select('telegram_chat_id')
      .eq('id', user?.id)
      .maybeSingle();

    let telegramId = masterProfile?.telegram_chat_id;

    if (!telegramId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('telegram_id')
        .eq('id', user?.id)
        .single();
      telegramId = profile?.telegram_id;
      if (telegramId) console.log('[SendStory] Found telegramId in profiles:', telegramId);
    } else {
      console.log('[SendStory] Found telegramId in master_profiles:', telegramId);
    }

    if (!telegramId) {
      return NextResponse.json({ error: 'Telegram не підключено. Перейдіть у Налаштування -> Профіль та підключіть бота.' }, { status: 404 });
    }

    // 2. Prepare the image buffer from dataUrl
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // 3. Send to Telegram via Bot API
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }

    const formData = new FormData();
    formData.append('chat_id', telegramId);
    formData.append('caption', caption || 'Ваша сторіс готова! ✨');
    
    // Create a blob from the buffer to send as a file
    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append('photo', blob, filename || 'story.png');

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      console.error('[SendStory] Telegram API error:', tgData);
      return NextResponse.json({ error: 'Помилка Telegram: ' + (tgData.description || 'Невідома помилка') }, { status: 502 });
    }

    return NextResponse.json({ success: true, message_id: tgData.result.message_id });
  } catch (err: any) {
    console.error('[SendStory] General error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
