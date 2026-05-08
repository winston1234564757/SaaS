
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findMaster() {
  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, phone')
    .ilike('phone', '%67953455%');

  if (error) {
    console.error('Error finding master:', error.message);
    process.exit(1);
  }

  console.log('FOUND:', data);
}

findMaster();
