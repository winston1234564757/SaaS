import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Підвантажуємо ключі
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE credentials in .env.local");
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  const masterPhone = '+380967953455';
  const clientPhone = '+380967953488';

  console.log(`\n🔍 Пошук Майстра (${masterPhone})...`);
  const { data: mProfile } = await admin.from('profiles').select('id, full_name, phone').like('phone', `%${masterPhone.slice(-9)}%`).single();
  if (!mProfile) return console.error('❌ Майстра не знайдено в БД');
  console.log(`✅ Майстер знайдений: ${mProfile.full_name} (${mProfile.id}, ${mProfile.phone})`);

  console.log(`\n🔍 Пошук Клієнта (${clientPhone})...`);
  const { data: cProfile } = await admin.from('profiles').select('id, full_name, phone').like('phone', `%${clientPhone.slice(-9)}%`).single();
  if (!cProfile) return console.error('❌ Клієнта не знайдено в БД');
  console.log(`✅ Клієнт знайдений: ${cProfile.full_name} (${cProfile.id}, ${cProfile.phone})`);

  // Очистка перед тестом
  await admin.from('bookings').delete().eq('master_id', mProfile.id).eq('client_id', cProfile.id);

  // Створюємо relation, якщо його немає, щоб RPC бачив клієнта
  await admin.from('client_master_relations').upsert({
    client_id: cProfile.id,
    master_id: mProfile.id,
    total_visits: 1,
    total_spent: 0,
    average_check: 0
  });

  const checkRPC = async (expectedText) => {
    // Вказуємо слот, який звільнився "прямо зараз"
    const slotTimestamp = new Date().toISOString(); 
    const { data, error } = await admin.rpc('get_freed_slot_clients', {
      p_master_id: mProfile.id,
      p_slot_timestamp: slotTimestamp
    });

    if (error) {
      console.error("RPC Error:", error);
      return;
    }

    const found = data?.some(r => r.client_id === cProfile.id);
    console.log(`   Результат RPC: ${found ? '🟢 ТАК (Отримає пуш)' : '🔴 НІ (Проігноровано)'}`);
    console.log(`   Очікувалось:   ${expectedText}`);
  };

  const createBooking = async (daysOffset, status) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const dateStr = d.toISOString().split('T')[0];
    
    const { data, error } = await admin.from('bookings').insert({
      master_id: mProfile.id,
      client_id: cProfile.id,
      status: status,
      client_name: cProfile.full_name,
      client_phone: clientPhone,
      source: 'manual',
      total_services_price: 0, total_products_price: 0, total_price: 0, deposit_amount: 0, commission_amount: 0,
      date: dateStr,
      start_time: '23:55',
      end_time: '23:59'
    }).select('id').single();
    
    if (error) {
      console.error("Insert Error:", error);
      return null;
    }
    return data.id;
  };

  console.log('\n=========================================');
  console.log('🧪 ТЕСТ 1: Жодного запису в базі (ні старих, ні нових)');
  console.log('=========================================');
  await checkRPC('🔴 НІ (Немає старої активності >14 днів або майбутньої >3 днів)');

  console.log('\n=========================================');
  console.log('🧪 ТЕСТ 2: Запис через 2 дні від сьогодні (Близьке майбутнє)');
  console.log('=========================================');
  const b1 = await createBooking(2, 'confirmed');
  await checkRPC('🔴 НІ (Клієнт і так скоро прийде, не спамимо)');
  await admin.from('bookings').delete().eq('id', b1);

  console.log('\n=========================================');
  console.log('🧪 ТЕСТ 3: Запис був рівно 15 днів тому (Давній візит)');
  console.log('=========================================');
  const b2 = await createBooking(-15, 'completed');
  await checkRPC('🟢 ТАК (Клієнт давно не був, треба запросити)');

  console.log('\n=========================================');
  console.log('🧪 ТЕСТ 4: Запис 15 днів тому + Запис через 1 день (Колізія)');
  console.log('=========================================');
  const b3 = await createBooking(1, 'confirmed');
  await checkRPC('🔴 НІ (Клієнт був давно, АЛЕ він вже записаний на завтра! Не спамимо)');
  await admin.from('bookings').delete().eq('id', b3);
  await admin.from('bookings').delete().eq('id', b2);

  console.log('\n=========================================');
  console.log('🧪 ТЕСТ 5: Запис через 6 днів від сьогодні (Далеке майбутнє)');
  console.log('=========================================');
  const b4 = await createBooking(6, 'confirmed');
  await checkRPC('🟢 ТАК (Пропонуємо йому перенести запис з "через 6 днів" на "прямо зараз")');
  await admin.from('bookings').delete().eq('id', b4);

  // Фінальна очистка
  console.log('\n🧹 Прибираємо тестові записи...');
  await admin.from('client_master_relations').delete().eq('client_id', cProfile.id).eq('master_id', mProfile.id);
  console.log('✅ Тестування завершено!');
}

runTests();
