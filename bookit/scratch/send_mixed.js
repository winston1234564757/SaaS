import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const userId = '551c7a11-a02b-4944-9b34-594c41ccb951';

async function sendMixed() {
  // 1. Persistent (Success)
  await supabase.from('notifications').insert([
    {
      recipient_id: userId,
      type: 'new_booking',
      title: 'Запис 1',
      body: 'Цей тост має висіти вічно',
      is_read: false
    },
    {
      recipient_id: userId,
      type: 'new_review',
      title: 'Новий відгук',
      body: 'Від Вікторії: "Все супер!"',
      is_read: false
    }
  ]);

  // 2. Temporary (Warning) - should disappear in 5s
  await supabase.from('notifications').insert([
    {
      recipient_id: userId,
      type: 'booking_cancelled',
      title: 'Запис скасовано',
      body: 'Сергій скасував запис на 20:00',
      is_read: false
    }
  ]);

  console.log('Mixed notifications sent!');
}

sendMixed();
