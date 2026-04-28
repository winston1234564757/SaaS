import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRealtime() {
  // Query pg_publication_tables to see if 'notifications' is included in 'supabase_realtime'
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: "SELECT count(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'"
  });

  if (error) {
    // If execute_sql doesn't exist, try another way or just report error
    console.error('Error checking realtime (maybe RPC execute_sql is missing):', error);
  } else {
    console.log('Realtime check result:', data);
  }
}

checkRealtime();
