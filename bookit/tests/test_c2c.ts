/**
 * C2C full-cycle smoke script.
 *
 * ⛔ Пише в БД під service-role: створює auth-користувачів, майстра, броні.
 *    Тільки локальний Supabase.
 *
 * Саме так у бойовий каталог потрапило сміття (2026-04-26): cleanup стояв у кінці
 * `try`, скрипт упав посеред циклу, `catch` проковтнув помилку — і опубліковані
 * тестові профілі лишились у /explore назавжди. Тому тепер: hard-abort на прод-реф,
 * cleanup у `finally` і ненульовий exit при падінні.
 */
import { createAdminClient } from '../src/lib/supabase/admin';
import { findProdRef } from '../src/lib/testing/e2eSeedGuard';

const prodRef = findProdRef(process.env.NEXT_PUBLIC_SUPABASE_URL);
if (prodRef) {
  console.error(`\n⛔ ВІДМОВА: скрипт цілить у ПРОД-проєкт (${prodRef}).`);
  console.error('   Він створює майстрів, клієнтів і броні. Запускай лише проти локального Supabase.\n');
  process.exit(1);
}

async function testC2CFullCycle() {
  const admin = createAdminClient();
  console.log('\n🚀 Starting C2C Full Cycle Test...');

  // Оголошені ДО try, щоб cleanup у finally дістав їх навіть після падіння всередині.
  const createdUserIds: string[] = [];
  let masterId: string | null = null;
  let failed = false;

  try {
    // --- STEP 1: Master Setup ---
    console.log('\n1️⃣ Master setting up C2C program (10%)...');
    const { data: um, error: uem } = await admin.auth.admin.createUser({
      email: `m_${Date.now()}@t.com`,
      password: 'password123',
      email_confirm: true
    });
    if (uem) throw uem;
    masterId = um.user.id;
    createdUserIds.push(masterId);

    await admin.from('profiles').upsert({ id: masterId, role: 'master', full_name: 'Master C2C' });
    const masterCode = `M${Date.now()}`;
    await admin.from('master_profiles').upsert({
      id: masterId,
      slug: `m-${Date.now()}`,
      c2c_enabled: true,
      c2c_discount_pct: 10,
      is_published: true,
      mood_theme: 'sand',
      avatar_emoji: '👤',
      referral_code: masterCode
    });
    console.log('   Master profile created and C2C enabled.');

    // --- STEP 2: Referrer (Client A) Setup ---
    console.log('\n2️⃣ Client A (Referrer) registers...');
    const { data: u1, error: ue1 } = await admin.auth.admin.createUser({
      email: `a_${Date.now()}@t.com`,
      password: 'password123',
      email_confirm: true
    });
    if (ue1) throw ue1;
    const referrerId = u1.user.id;
    createdUserIds.push(referrerId);
    const referrerCode = `REF_${Date.now()}`;
    await admin.from('profiles').upsert({ id: referrerId, role: 'client', full_name: 'Client A' });
    await admin.from('client_profiles').upsert({ id: referrerId, referral_code: referrerCode });

    const { data: bal0 } = await admin.rpc('get_c2c_balance', { p_referrer_id: referrerId, p_master_id: masterId });
    console.log(`   Initial balance of Client A: ${bal0}%`);

    // --- STEP 3: Friend (Client B) Booking via Client A's link ---
    console.log('\n3️⃣ Client B (Friend) books using Client A code...');
    const { data: u2, error: ue2 } = await admin.auth.admin.createUser({
      email: `b_${Date.now()}@t.com`,
      password: 'password123',
      email_confirm: true
    });
    if (ue2) throw ue2;
    const friendId = u2.user.id;
    createdUserIds.push(friendId);
    await admin.from('profiles').upsert({ id: friendId, role: 'client', full_name: 'Client B' });
    await admin.from('client_profiles').upsert({ id: friendId });

    const bookingBId = crypto.randomUUID();
    // Simulate createBooking.ts logic
    await admin.from('bookings').insert({
      id: bookingBId,
      master_id: masterId,
      client_id: friendId,
      client_name: 'Client B',
      client_phone: '+380991112233',
      date: '2026-06-01',
      start_time: '10:00',
      end_time: '11:00',
      status: 'pending',
      total_price: 900, // 1000 - 10% friend discount
      referral_code_used: referrerCode
    });
    await admin.from('c2c_referrals').insert({
      referrer_id: referrerId,
      referred_id: friendId,
      master_id: masterId,
      booking_id: bookingBId,
      discount_pct: 10,
      status: 'pending'
    });
    console.log('   Friend visit is pending...');

    // --- STEP 4: Friend completes visit -> Referrer gets reward ---
    console.log('\n4️⃣ Friend visit COMPLETED. Rewarding Client A...');
    await admin.from('bookings').update({ status: 'completed' }).eq('id', bookingBId);
    await new Promise(r => setTimeout(r, 1000)); // wait for trigger

    const { data: bal1 } = await admin.rpc('get_c2c_balance', { p_referrer_id: referrerId, p_master_id: masterId });
    console.log(`   New balance of Client A: ${bal1}% (Expected 10%)`);

    // --- STEP 5: Client A uses bonus ---
    console.log('\n5️⃣ Client A (Referrer) books own visit and uses bonus...');
    const bookingAId = crypto.randomUUID();
    await admin.from('bookings').insert({
      id: bookingAId,
      master_id: masterId,
      client_id: referrerId,
      client_name: 'Client A Self',
      client_phone: '+380990000000',
      date: '2026-06-05',
      start_time: '12:00',
      end_time: '13:00',
      status: 'confirmed',
      total_price: 900 // Paid with 10% bonus
    });
    await admin.from('c2c_bonus_uses').insert({
      referrer_id: referrerId,
      master_id: masterId,
      booking_id: bookingAId,
      discount_used: 10
    });

    const { data: balFinal } = await admin.rpc('get_c2c_balance', { p_referrer_id: referrerId, p_master_id: masterId });
    console.log(`   Final balance of Client A after usage: ${balFinal}% (Expected 0%)`);

  } catch (err) {
    failed = true;
    console.error('\n❌ Test failed:', err);
  } finally {
    console.log('\n🧹 Cleaning up test data...');
    if (masterId) {
      await admin.from('bookings').delete().eq('master_id', masterId);
    }
    for (const id of createdUserIds) {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) console.error(`   ⚠️ Не вдалося прибрати користувача ${id}:`, error.message);
    }
    console.log(failed ? '⚠️ Cycle test FAILED — тестові дані прибрано.' : '✅ Cycle test finished successfully.');
  }

  if (failed) process.exit(1);
}

testC2CFullCycle();
