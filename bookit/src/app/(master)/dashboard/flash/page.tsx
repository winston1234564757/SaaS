import { redirect } from 'next/navigation';

export interface FlashDealRow {
  id: string;
  service_name: string;
  slot_date: string;
  slot_time: string;
  original_price: number;
  discount_pct: number;
  expires_at: string;
  status: string;
}

export default async function FlashPage({ searchParams }: { searchParams: Promise<{ date?: string; time?: string }> }) {
  const { date, time } = await searchParams;
  let target = '/dashboard/revenue?drawer=flash_deals';
  if (date) target += `&date=${encodeURIComponent(date)}`;
  if (time) target += `&time=${encodeURIComponent(time)}`;
  redirect(target);
}
