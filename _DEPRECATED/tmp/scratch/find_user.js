import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUser() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', 'viktor.koshel24@gmail.com')
    .single();

  if (error) {
    console.error('Error finding user:', error);
    process.exit(1);
  }

  console.log('USER_ID:', data.id);
}

findUser();
