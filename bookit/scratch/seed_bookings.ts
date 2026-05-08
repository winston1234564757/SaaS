
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MASTER_ID = '551c7a11-a02b-4944-9b34-594c41ccb951';

const UA_NAMES = [
  'Олена Мельник', 'Марія Ковальчук', 'Ірина Бондаренко', 'Наталія Шевченко',
  'Тетяна Коваленко', 'Юлія Петренко', 'Оксана Лисенко', 'Анна Кравченко'
];

async function seed() {
  console.log('Seeding bookings for master:', MASTER_ID);

  const { data: services, error: sErr } = await admin
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('master_id', MASTER_ID)
    .limit(1);

  if (sErr || !services || services.length === 0) {
    console.error('No services found for master. Cannot seed.');
    process.exit(1);
  }

  const service = services[0];
  console.log('Using service:', service.name);

  const bookings = [];

  // Seed 20 future bookings starting from 2026-05-15
  for (let i = 0; i < 20; i++) {
    const date = new Date('2026-05-15');
    date.setDate(date.getDate() + Math.floor(i / 2)); // 2 bookings per day
    const dateStr = date.toISOString().split('T')[0];
    
    // Skip Sunday (assuming it's off)
    if (date.getDay() === 0) continue;

    const hour = (i % 2 === 0) ? 10 : 14;
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
    const status = i < 15 ? 'confirmed' : 'pending';

    bookings.push({
      master_id: MASTER_ID,
      client_name: UA_NAMES[Math.floor(Math.random() * UA_NAMES.length)],
      client_phone: '+38096' + Math.floor(Math.random() * 9000000 + 1000000),
      date: dateStr,
      start_time: startTime,
      end_time: endTime,
      status: status,
      total_services_price: service.price,
      total_price: service.price,
      source: 'online'
    });
  }

  const { data, error } = await admin.from('bookings').insert(bookings).select('id');

  if (error) {
    console.error('Error seeding bookings:', error.message);
    process.exit(1);
  }

  console.log(`Successfully seeded ${data.length} bookings.`);

  const bServices = data.map(b => ({
    booking_id: b.id,
    service_id: service.id,
    service_name: service.name,
    service_price: service.price,
    duration_minutes: service.duration_minutes
  }));

  const { error: bsErr } = await admin.from('booking_services').insert(bServices);
  if (bsErr) {
    console.error('Error linking services:', bsErr.message);
  } else {
    console.log('Services linked successfully.');
  }
}

seed();
