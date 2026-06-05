import { describe, it, expect } from 'vitest';

// ── Pure extraction from useServices.ts ──────────────────────────────────

interface ServiceRow {
  id: string;
  name: string;
  icon_name: string;
  category: string | null;
  price: number;
  duration_minutes: number;
  is_popular: boolean;
  is_active: boolean;
  is_archived: boolean;
  description: string | null;
  image_url: string | null;
}

interface Service {
  id: string;
  name: string;
  icon_name: string;
  category: string;
  price: number;
  duration: number;
  popular: boolean;
  active: boolean;
  description?: string;
  imageUrl?: string;
}

function rowToService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    icon_name: row.icon_name ?? 'sparkles',
    category: row.category ?? 'Інше',
    price: Number(row.price),
    duration: row.duration_minutes,
    popular: row.is_popular,
    active: row.is_active,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
  };
}

function serviceToRow(data: Omit<Service, 'id'>, masterId: string) {
  return {
    master_id: masterId,
    name: data.name,
    icon_name: data.icon_name,
    category: data.category,
    price: data.price,
    duration_minutes: data.duration,
    is_popular: data.popular,
    is_active: data.active,
    description: data.description ?? null,
    image_url: data.imageUrl ?? null,
  };
}

describe('rowToService', () => {
  it('converts full row to service', () => {
    const r = rowToService({
      id: 'srv-1', name: 'Стрижка', icon_name: 'scissors',
      category: 'Зачіски', price: 500, duration_minutes: 60,
      is_popular: true, is_active: true, is_archived: false,
      description: 'Класична стрижка', image_url: 'https://img.url',
    });
    expect(r.name).toBe('Стрижка');
    expect(r.price).toBe(500);
    expect(r.duration).toBe(60);
    expect(r.popular).toBe(true);
    expect(r.active).toBe(true);
    expect(r.description).toBe('Класична стрижка');
    expect(r.imageUrl).toBe('https://img.url');
  });

  it('keeps empty icon_name as-is (?? only catches null/undefined)', () => {
    const r = rowToService({
      id: 'srv-2', name: 'Тест', icon_name: '',
      category: null, price: 0, duration_minutes: 30,
      is_popular: false, is_active: true, is_archived: false,
      description: null, image_url: null,
    });
    expect(r.icon_name).toBe('');
    expect(r.category).toBe('Інше');
  });

  it('handles null description and imageUrl', () => {
    const r = rowToService({
      id: 'srv-3', name: 'Тест', icon_name: 'star',
      category: 'Інше', price: 100, duration_minutes: 15,
      is_popular: false, is_active: true, is_archived: false,
      description: null, image_url: null,
    });
    expect(r.description).toBeUndefined();
    expect(r.imageUrl).toBeUndefined();
  });
});

describe('serviceToRow', () => {
  it('converts service to DB row', () => {
    const r = serviceToRow({
      name: 'Стрижка', icon_name: 'scissors', category: 'Зачіски',
      price: 500, duration: 60, popular: true, active: true,
      description: 'Класична', imageUrl: 'https://img.url',
    }, 'master-1');
    expect(r.master_id).toBe('master-1');
    expect(r.price).toBe(500);
    expect(r.duration_minutes).toBe(60);
    expect(r.is_popular).toBe(true);
    expect(r.is_active).toBe(true);
    expect(r.image_url).toBe('https://img.url');
  });

  it('converts nullish description/imageUrl to DB null', () => {
    const r = serviceToRow({
      name: 'Тест', icon_name: 'star', category: 'Інше',
      price: 100, duration: 30, popular: false, active: true,
    }, 'master-1');
    expect(r.description).toBeNull();
    expect(r.image_url).toBeNull();
  });
});
