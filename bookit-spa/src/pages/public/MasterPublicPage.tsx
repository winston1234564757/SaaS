import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function MasterPublicPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['master-public', slug],
    queryFn: async () => {

      const { data: mp } = await supabase
        .from('master_profiles')
        .select(`
          id, slug, bio, city, address, rating, rating_count,
          subscription_tier, instagram_url, telegram_url, categories,
          mood_theme, avatar_emoji, pricing_rules, working_hours,
          profiles!inner ( full_name, avatar_url ),
          services ( id, name, emoji, category, price, duration_minutes, is_popular, is_active, sort_order, description )
        `)
        .eq('slug', slug!)
        .single();

      if (!mp) return null;

      const monthStart = new Date(
        new Date().getFullYear(), new Date().getMonth(), 1
      ).toISOString();

      const [productsRes, reviewsRes, scheduleRes, monthlyCountRes, flashDealsRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, price, description, emoji, stock_quantity, stock_unlimited')
          .eq('master_id', mp.id)
          .eq('is_active', true)
          .order('sort_order')
          .limit(20),
        supabase
          .from('reviews')
          .select('id, rating, comment, client_name, created_at')
          .eq('master_id', mp.id)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('schedule_templates')
          .select('day_of_week, start_time, end_time, is_working')
          .eq('master_id', mp.id),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('master_id', mp.id)
          .gte('created_at', monthStart)
          .neq('status', 'cancelled'),
        supabase
          .from('flash_deals')
          .select('id, service_name, slot_date, slot_time, original_price, discount_pct, expires_at')
          .eq('master_id', mp.id)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: true })
          .limit(5),
      ]);

      const profile = mp.profiles as unknown as { full_name: string; avatar_url: string | null };

      const services = (mp.services as any[])
        .filter(s => s.is_active)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map(s => ({
          id: s.id as string,
          name: s.name as string,
          emoji: (s.emoji as string) ?? '✨',
          category: (s.category as string) ?? 'Інше',
          price: Number(s.price),
          duration: s.duration_minutes as number,
          popular: s.is_popular as boolean,
          description: (s.description as string) || null,
        }));

      const products = (productsRes.data ?? []).map((p: any) => ({
        id: p.id as string,
        name: p.name as string,
        price: Number(p.price),
        description: (p.description as string) || null,
        emoji: (p.emoji as string) ?? '✨',
        inStock: p.stock_unlimited ? true : (p.stock_quantity as number) > 0,
      }));

      const reviews = (reviewsRes.data ?? []).map((r: any) => ({
        id: r.id as string,
        rating: r.rating as number,
        comment: (r.comment as string) || null,
        clientName: (r.client_name as string) || 'Клієнт',
        createdAt: r.created_at as string,
      }));

      const schedule = (scheduleRes.data ?? []).map((s: any) => ({
        day: s.day_of_week as string,
        isWorking: s.is_working as boolean,
        startTime: (s.start_time as string | null)?.slice(0, 5) ?? '09:00',
        endTime: (s.end_time as string | null)?.slice(0, 5) ?? '18:00',
      }));

      const flashDeals = (flashDealsRes.data ?? []).map((d: any) => ({
        id: d.id as string,
        serviceName: d.service_name as string,
        slotDate: d.slot_date as string,
        slotTime: (d.slot_time as string).slice(0, 5),
        originalPrice: Math.round(Number(d.original_price) / 100),
        discountPct: d.discount_pct as number,
        expiresAt: d.expires_at as string,
      }));

      return {
        id: mp.id,
        slug: mp.slug,
        name: profile.full_name,
        specialty: ((mp.categories as string[]) ?? []).join(', ') || 'Майстер краси',
        location: [mp.city, mp.address].filter(Boolean).join(', ') || 'Україна',
        emoji: '💅',
        rating: Number(mp.rating) || 0,
        reviewsCount: mp.rating_count || 0,
        isVerified: true,
        tier: mp.subscription_tier as 'starter' | 'pro' | 'studio',
        bio: mp.bio ?? '',
        services,
        products,
        reviews,
        instagram: mp.instagram_url ?? null,
        telegram: mp.telegram_url ?? null,
        themeKey: (mp.mood_theme as string) || 'default',
        avatarEmoji: (mp.avatar_emoji as string) || '💅',
        avatarUrl: profile.avatar_url ?? null,
        schedule,
        bookingsThisMonth: monthlyCountRes.count ?? 0,
        pricingRules: (mp.pricing_rules as Record<string, any>) ?? {},
        workingHours: (mp.working_hours as Record<string, unknown>) ?? null,
        flashDeals,
      };
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="p-6 text-sm text-[#A8928D]">Завантаження...</div>;
  if (!data) return <div className="p-6 text-center text-[#A8928D]">Майстра не знайдено</div>;

  // TODO: <PublicMasterPage master={data} /> from @/components/public/PublicMasterPage
  return (
    <div className="p-6 text-sm text-[#A8928D]">
      PublicMasterPage ({data.name}) — TODO
    </div>
  );
}
