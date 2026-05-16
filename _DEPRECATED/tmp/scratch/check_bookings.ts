
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MASTER_ID = '551c7a11-a02b-4944-9b34-594c41ccb951';

async function checkBookings() {
  const { data, error } = await admin
    .from('bookings')
    .select('id, status, total_price, date')
    .eq('master_id', MASTER_ID);

  if (error) {
    console.error('Error checking bookings:', error.message);
    process.exit(1);
  }

  console.log('BOOKINGS COUNT:', data.length);
  console.log('STATUSES:', data.map(b => b.status));
  console.log('REVENUE SUM:', data.reduce((sum, b) => sum + b.total_price, 0));
}

checkBookings();
