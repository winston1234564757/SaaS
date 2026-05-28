const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Starting seed for design audit...');
  
  const { data: masters } = await supabase.from('master_profiles').select('id, business_name').limit(1);
  if (!masters?.length) {
    console.error('No master profiles found.');
    return;
  }
  const masterId = masters[0].id;
  console.log(`Using Master: ${masters[0].business_name} (${masterId})`);

  const { data: services } = await supabase.from('services').select('id, name, price, duration_minutes').eq('master_id', masterId).limit(3);
  if (!services?.length) {
    console.error('No services found for master.');
    return;
  }

  // Use a future date to avoid collisions with real data
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 2); // 2 days in future
  const targetDateStr = targetDate.toISOString().split('T')[0];
  
  console.log(`Target Date: ${targetDateStr}`);

  const statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
  const clientNames = [
    'Олександр Довженко',
    'Марія Примаченко',
    'Іван Котляревський',
    'Леся Українка',
    'Тарас Шевченко',
    'Ліна Костенко',
    'Григорій Сковорода',
    'Михайло Грушевський',
    'Соломія Крушельницька',
    'Богдан Хмельницький'
  ];

  // Clean up target date first
  await supabase.from('bookings').delete().eq('master_id', masterId).eq('date', targetDateStr);

  const bookings = [];
  for (let i = 0; i < 10; i++) {
    const status = statuses[i % statuses.length];
    const hour = 9 + i;
    const start_time = `${hour.toString().padStart(2, '0')}:15`;
    const end_time = `${hour.toString().padStart(2, '0')}:45`;
    
    bookings.push({
      master_id: masterId,
      client_name: clientNames[i],
      client_phone: '+38099000000' + i,
      date: targetDateStr,
      start_time,
      end_time,
      total_price: services[i % services.length].price,
      status: status,
      dynamic_pricing_label: i % 3 === 0 ? 'Час пік' : null
    });
  }

  const { data: seededBookings, error } = await supabase.from('bookings').insert(bookings).select();
  
  if (error) {
    console.error('Error seeding bookings:', error);
    return;
  }

  console.log(`Successfully seeded ${seededBookings.length} bookings.`);

  const bookingServices = [];
  seededBookings.forEach((b, idx) => {
    const s = services[idx % services.length];
    bookingServices.push({
      booking_id: b.id,
      service_id: s.id, // Keep FK if it exists
      service_name: s.name,
      service_price: s.price,
      duration_minutes: s.duration_minutes
    });
  });

  const { error: svcError } = await supabase.from('booking_services').insert(bookingServices);
  if (svcError) {
    console.error('Error seeding booking_services:', svcError);
  } else {
    console.log('Seeded booking_services relations.');
  }
  
  console.log('Seed completed successfully for date:', targetDateStr);
}

seed();
