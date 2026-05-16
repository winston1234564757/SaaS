import { createAdminClient } from '../src/lib/supabase/admin';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function check() {
  const admin = createAdminClient();
  const userId = '551c7a11-a02b-4944-9b34-594c41ccb951';

  console.log(`\n🔍 Auditing Database for Notification System`);
  
  // 1. Check tables
  const { error: logsError } = await admin.from('notification_logs').select('count').limit(1);
  console.log(`- notification_logs table: ${logsError ? '❌ Missing/Error' : '✅ OK'}`);
  if (logsError) console.log(`  Error: ${logsError.message}`);

  // 2. Check Viktor's Channels
  const [p, mp, subs] = await Promise.all([
    admin.from('profiles').select('phone, telegram_chat_id').eq('id', userId).maybeSingle(),
    admin.from('master_profiles').select('telegram_chat_id').eq('id', userId).maybeSingle(),
    admin.from('push_subscriptions').select('endpoint').eq('user_id', userId),
  ]);

  console.log(`\n👤 User Config (Viktor):`);
  console.log(`  - Phone: ${p.data?.phone ?? 'None'}`);
  console.log(`  - Profile TG: ${p.data?.telegram_chat_id ?? 'None'}`);
  console.log(`  - Master TG: ${mp.data?.telegram_chat_id ?? 'None'}`);
  console.log(`  - Push Subs: ${subs.data?.length ?? 0} active endpoints`);
  if (subs.data && subs.data.length > 0) {
    subs.data.forEach((s, i) => console.log(`    [${i}] ${s.endpoint.slice(0, 50)}...`));
  }

  // 3. Check Logs
  const { data: lastLogs } = await admin.from('notification_logs')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`\n📜 Last 5 Notification Logs:`);
  if (!lastLogs || lastLogs.length === 0) {
    console.log(`  (No logs found)`);
  } else {
    lastLogs.forEach(l => {
      console.log(`  [${l.created_at}] ${l.channel.padEnd(8)} | ${l.status.padEnd(8)} | ${l.event_type}`);
      if (l.error_text) console.log(`    ⚠️ Error: ${l.error_text}`);
    });
  }
}

check();
