'use server';

import { searchCities, getWarehouses, type NpCity, type NpWarehouse } from '@/lib/novaposhta/client';

/**
 * Public server actions for Nova Poshta address lookup (M-SHOP-05). Read-only,
 * used by the shop checkout to let a client pick an exact city + branch instead
 * of typing a free-text address. The API key stays server-side.
 */

export async function searchNpCities(query: string): Promise<NpCity[]> {
  return searchCities(query);
}

export async function getNpWarehouses(cityRef: string, query = ''): Promise<NpWarehouse[]> {
  return getWarehouses(cityRef, query);
}
