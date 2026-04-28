import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const userId = '551c7a11-a02b-4944-9b34-594c41ccb951';

async function testBooking() {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      master_id: userId,
      client_name: 'Realtime Test',
      client_phone: '+380991234567',
      date: new Date().toISOString().split('T')[0],
      start_time: '20:00',
      end_time: '21:00',
      status: 'pending',
      total_price: 100
    });

  if (error) {
    console.error('Error inserting booking:', error);
  } else {
    console.log('Booking inserted successfully');
  }
}

testBooking();
