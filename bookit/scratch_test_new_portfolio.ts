import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey);

async function test() {
  console.log('Fetching a master profile from database...');
  const { data: profile, error: profError } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'master')
    .limit(1)
    .single();

  if (profError || !profile) {
    console.error('Failed to fetch master profile:', profError);
    process.exit(1);
  }

  console.log('Using master:', profile.full_name, 'ID:', profile.id);

  console.log('Trying to insert portfolio item draft...');
  const { data: item, error } = await admin
    .from('portfolio_items')
    .insert({
      master_id: profile.id,
      title: 'Нова робота',
      description: '',
      is_published: false,
      display_order: 0,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Insert failed with error:', error);
  } else {
    console.log('Insert success! Item ID:', item.id);
    
    // Clean up
    console.log('Cleaning up inserted item...');
    await admin.from('portfolio_items').delete().eq('id', item.id);
    console.log('Cleanup done.');
  }
}

test().catch(console.error);
