const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  const { data: masters } = await supabase.from('master_profiles').select('id').limit(1);
  if (!masters?.length) return;
  const masterId = masters[0].id;

  const { data: services } = await supabase.from('services').select('id, name, price').eq('master_id', masterId).limit(2);
  if (!services?.length) return;

  const bookings = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    // Add 2 bookings per day
    bookings.push({
      master_id: masterId,
      client_name: 'Тестовий Клієнт ' + (i + 1),
      client_phone: '+380991234567',
      date: dateStr,
      start_time: '10:00',
      end_time: '11:00',
      total_price: services[0].price,
      status: 'confirmed'
    });

    bookings.push({
      master_id: masterId,
      client_name: 'Анна ' + (i + 1),
      client_phone: '+380997654321',
      date: dateStr,
      start_time: '14:00',
      end_time: '15:30',
      total_price: services[1]?.price || services[0].price,
      status: 'confirmed'
    });
  }

  const { data, error } = await supabase.from('bookings').insert(bookings).select();
  
  if (error) {
    console.error('Error seeding bookings:', error);
  } else {
    console.log(`Successfully seeded ${data.length} bookings.`);
    
    // Also add services to these bookings for consistency if needed, 
    // but the UI joins them from the DB. 
    // Wait, the 'booking_services' table needs to be populated too.
    const bookingServices = [];
    data.forEach((b, idx) => {
        bookingServices.push({
            booking_id: b.id,
            service_id: (idx % 2 === 0) ? services[0].id : (services[1]?.id || services[0].id),
            price: (idx % 2 === 0) ? services[0].price : (services[1]?.price || services[0].price)
        });
    });
    await supabase.from('booking_services').insert(bookingServices);
    console.log('Seeded booking_services relations.');
  }
}

seed();
