import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const userId = '551c7a11-a02b-4944-9b34-594c41ccb951';

async function sendNotifications() {
  const now = new Date();
  
  const notifications = [
    {
      recipient_id: userId,
      type: 'new_booking',
      title: 'Запис 1',
      body: 'Тест 1',
      is_read: false,
      created_at: now.toISOString()
    },
    {
      recipient_id: userId,
      type: 'new_booking',
      title: 'Запис 2',
      body: 'Тест 2',
      is_read: false,
      created_at: new Date(now.getTime() + 1000).toISOString()
    },
    {
      recipient_id: userId,
      type: 'new_booking',
      title: 'Запис 3',
      body: 'Тест 3',
      is_read: false,
      created_at: new Date(now.getTime() + 2000).toISOString()
    }
  ];

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications);

  if (error) {
    console.error('Error inserting notifications:', error);
  } else {
    console.log('Notifications inserted successfully');
  }
}

sendNotifications();
