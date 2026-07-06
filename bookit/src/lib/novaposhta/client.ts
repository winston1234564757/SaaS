import 'server-only';

/**
 * Nova Poshta API client (M-SHOP-05). Server-only — never expose the API key
 * to the browser. Consumers call the thin server actions in
 * `@/lib/actions/novaPoshta`, which wrap these read-only address lookups.
 *
 * Docs: https://developers.novaposhta.ua/documentation
 */

const NP_ENDPOINT = 'https://api.novaposhta.ua/v2.0/json/';

interface NpResponse<T> {
  success: boolean;
  data: T[];
  errors: string[];
}

async function npCall<T>(
  modelName: string,
  calledMethod: string,
  methodProperties: Record<string, unknown>,
): Promise<T[]> {
  const apiKey = process.env.NOVAPOSHTA_API_KEY;
  if (!apiKey) {
    console.error('[novaposhta] NOVAPOSHTA_API_KEY is not set');
    return [];
  }

  try {
    const res = await fetch(NP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, modelName, calledMethod, methodProperties }),
      // Address reference data is stable; cache briefly to spare the NP quota.
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`[novaposhta] HTTP ${res.status} on ${modelName}/${calledMethod}`);
      return [];
    }

    const json = (await res.json()) as NpResponse<T>;
    if (!json.success) {
      console.error(`[novaposhta] ${modelName}/${calledMethod} failed:`, json.errors);
      return [];
    }
    return json.data;
  } catch (err) {
    console.error(`[novaposhta] ${modelName}/${calledMethod} threw:`, err);
    return [];
  }
}

// ── City search ───────────────────────────────────────────────────────────────

interface NpCityRow {
  Ref: string;
  Description: string;
  AreaDescription?: string;
}

export interface NpCity {
  ref: string;
  name: string;
  area: string;
}

/** Cities matching a user query (autocomplete). Empty query → []. */
export async function searchCities(query: string): Promise<NpCity[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const rows = await npCall<NpCityRow>('Address', 'getCities', {
    FindByString: q,
    Limit: '20',
    Page: '1',
  });
  return rows.map(r => ({
    ref: r.Ref,
    name: r.Description,
    area: r.AreaDescription ?? '',
  }));
}

// ── Warehouse (branch) lookup ───────────────────────────────────────────────────

interface NpWarehouseRow {
  Ref: string;
  Description: string;
  Number: string;
  CategoryOfWarehouse?: string;
}

export interface NpWarehouse {
  ref: string;
  name: string;
  number: string;
}

/** Warehouses (branches + parcel lockers) in a city, optionally filtered. */
export async function getWarehouses(cityRef: string, query = ''): Promise<NpWarehouse[]> {
  if (!cityRef) return [];
  const props: Record<string, unknown> = { CityRef: cityRef, Limit: '50', Page: '1' };
  const q = query.trim();
  if (q) props.FindByString = q;
  const rows = await npCall<NpWarehouseRow>('Address', 'getWarehouses', props);
  return rows.map(r => ({
    ref: r.Ref,
    name: r.Description,
    number: r.Number,
  }));
}
