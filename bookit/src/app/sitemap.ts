import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bookit.com.ua';
  const admin = createAdminClient();

  // Та сама умова, що й у /explore: у sitemap потрапляють лише майстри, у яких є
  // хоч одна активна послуга. Інакше Google індексує сторінки, де нема чого бронювати.
  const { data: masters } = await admin
    .from('master_profiles')
    .select('slug, updated_at, services!inner(id)')
    .eq('is_published', true)
    .eq('services.is_active', true)
    .not('slug', 'is', null);

  const masterUrls: MetadataRoute.Sitemap = (masters ?? []).map(m => ({
    url: `${baseUrl}/${m.slug}`,
    lastModified: m.updated_at ? new Date(m.updated_at) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...masterUrls,
  ];
}
