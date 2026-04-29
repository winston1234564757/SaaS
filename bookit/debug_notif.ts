import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://sqlrxsopllgztvgrerqk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbHJ4c29wbGxnenR2Z3JlcnFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5NjIyMSwiZXhwIjoyMDg3OTcyMjIxfQ.LyC0D5uqF2PrZAw4a_d1oWmUJ1D-LXZJnVfLhqh4VV4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PHONE = "+380967953488";

async function debugRecipient() {
  console.log(`Debugging recipient: ${PHONE}...`);

  // 1. Find the recipient log
  const { data: rec, error } = await supabase
    .from('broadcast_recipients')
    .select('*, broadcasts(title)')
    .eq('phone', PHONE)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !rec || rec.length === 0) {
    console.log('Recipient not found in broadcast_recipients.');
    return;
  }

  const r = rec[0];
  console.log('Recipient Log:', {
    id: r.id,
    broadcast: r.broadcasts.title,
    push_sent: r.push_sent,
    telegram_sent: r.telegram_sent,
    sms_sent: r.sms_sent,
    created_at: r.created_at
  });

  // 2. Check profile for push/telegram info
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, telegram_chat_id')
    .eq('id', r.client_id)
    .single();
  console.log('Client Profile:', profile);

  // 3. Check push subscriptions
  if (profile) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', profile.id);
    console.log('Push Subscriptions:', subs?.length ?? 0);
  }
}

debugRecipient();
