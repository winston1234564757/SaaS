import { createAdminClient } from '../src/lib/supabase/admin';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function find() {
  const admin = createAdminClient();
  const userId = '551c7a11-a02b-4944-9b34-594c41ccb951';

  const { data: bookings } = await admin
    .from('bookings')
    .select('id, client_id, date, start_time')
    .eq('master_id', userId)
    .limit(5);

  console.log(`\n📅 Bookings for Viktor:`);
  console.log(JSON.stringify(bookings, null, 2));
}

find();
