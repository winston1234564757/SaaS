import { createAdminClient } from '../src/lib/supabase/admin';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function find() {
  const admin = createAdminClient();
  const email = process.argv[2] || 'testclient@gmail.com';

  const { data: user } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('email', email)
    .maybeSingle();

  console.log(`\n👤 User found:`);
  console.log(JSON.stringify(user, null, 2));
}

find();
