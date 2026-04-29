import type { BroadcastTagFilter } from '@/types/database';

export interface ClientForFilter {
  is_vip: boolean;
  total_visits: number;
  average_check: number;
  retention_status: string | null;
}

export function matchesTagFilters(
  client: ClientForFilter,
  filters: BroadcastTagFilter[],
): boolean {
  if (filters.length === 0) return true;
  return filters.some(f => {
    switch (f) {
      case 'vip':       return client.is_vip;
      case 'new':       return client.total_visits === 1;
      case 'regular':   return client.total_visits >= 5;
      case 'big_check': return client.average_check >= 150000; // kopecks = 1500 UAH
      case 'active':    return client.retention_status === 'active';
      case 'sleeping':  return client.retention_status === 'sleeping';
      case 'at_risk':   return client.retention_status === 'at_risk';
      case 'lost':      return client.retention_status === 'lost';
      default:          return false;
    }
  });
}

export function personalizeMessage(
  template: string,
  vars: { name: string; visits: number; discount?: number | null },
): string {
  return template
    .replace(/\{\{ім'я\}\}/g, vars.name)
    .replace(/\{\{кількість_візитів\}\}/g, String(vars.visits))
    .replace(/\{\{знижка\}\}/g, vars.discount ? `${vars.discount}%` : '');
}

export function buildTargetUrl(
  slug: string,
  siteUrl: string,
  serviceId: string | null,
  productId: string | null,
): string {
  const base = `${siteUrl}/${slug}`;
  if (!serviceId && !productId) return base;
  const params = new URLSearchParams();
  // PublicMasterPage reads ?serviceId= (auto-opens BookingFlow with service pre-selected)
  if (serviceId) params.set('serviceId', serviceId);
  if (productId) params.set('add_product', productId);
  return `${base}?${params.toString()}`;
}

export function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join('');
}
