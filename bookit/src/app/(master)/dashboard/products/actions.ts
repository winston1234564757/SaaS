'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ProductCategory, OrderStatus } from '@/types/database';

// ── Shared auth helper ────────────────────────────────────────────────────────

async function getMasterId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductPayload {
  name: string;
  description?: string | null;
  category: ProductCategory;
  price_kopecks: number;
  photos?: string[];
  stock_qty?: number;
  is_active?: boolean;
  recommend_always?: boolean;
  sort_order?: number;
}

export async function createProduct(
  payload: ProductPayload,
): Promise<{ id: string | null; error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { id: null, error: 'Не авторизований' };

  if (!payload.name.trim()) return { id: null, error: 'Назва обов\'язкова' };
  if (payload.price_kopecks <= 0) return { id: null, error: 'Ціна має бути більше 0' };
  if ((payload.photos?.length ?? 0) > 5) return { id: null, error: 'Максимум 5 фото' };

  const { data, error } = await createAdminClient()
    .from('products')
    .insert({
      master_id:    masterId,
      name:         payload.name.trim(),
      description:  payload.description ?? null,
      category:     payload.category,
      price_kopecks: payload.price_kopecks,
      photos:       payload.photos ?? [],
      stock_qty:        payload.stock_qty ?? 0,
      is_active:        payload.is_active ?? true,
      recommend_always: payload.recommend_always ?? true,
      sort_order:       payload.sort_order ?? 0,
    })
    .select('id')
    .single();

  if (error) return { id: null, error: error.message };

  // Log initial stock as restock if provided
  if ((payload.stock_qty ?? 0) > 0) {
    await createAdminClient()
      .from('product_transactions')
      .insert({
        product_id: data.id,
        type:       'restock',
        qty_delta:  payload.stock_qty!,
        note:       'Початковий залишок',
      });
  }

  revalidatePath('/dashboard/products');
  return { id: data.id, error: null };
}

export async function updateProduct(
  id: string,
  payload: Partial<ProductPayload>,
): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизований' };

  if (payload.name !== undefined && !payload.name.trim()) return { error: 'Назва обов\'язкова' };
  if (payload.price_kopecks !== undefined && payload.price_kopecks <= 0) return { error: 'Ціна має бути більше 0' };
  if ((payload.photos?.length ?? 0) > 5) return { error: 'Максимум 5 фото' };

  const { error } = await createAdminClient()
    .from('products')
    .update({
      ...(payload.name        !== undefined && { name:          payload.name.trim() }),
      ...(payload.description !== undefined && { description:   payload.description }),
      ...(payload.category    !== undefined && { category:      payload.category }),
      ...(payload.price_kopecks !== undefined && { price_kopecks: payload.price_kopecks }),
      ...(payload.photos           !== undefined && { photos:           payload.photos }),
      ...(payload.is_active        !== undefined && { is_active:        payload.is_active }),
      ...(payload.recommend_always !== undefined && { recommend_always: payload.recommend_always }),
      ...(payload.sort_order       !== undefined && { sort_order:       payload.sort_order }),
    })
    .eq('id', id)
    .eq('master_id', masterId);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/products');
  return { error: null };
}

export async function deleteProduct(id: string): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизований' };

  // Soft delete — keeps order history intact
  const { error } = await createAdminClient()
    .from('products')
    .update({ is_active: false })
    .eq('id', id)
    .eq('master_id', masterId);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/products');
  return { error: null };
}

export async function restockProduct(
  productId: string,
  qty: number,
  note?: string,
): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизований' };
  if (qty <= 0) return { error: 'Кількість має бути більше 0' };

  const admin = createAdminClient();

  // Verify ownership
  const { data: product } = await admin
    .from('products')
    .select('id, stock_qty')
    .eq('id', productId)
    .eq('master_id', masterId)
    .single();

  if (!product) return { error: 'Продукт не знайдено' };

  const { error: updateError } = await admin
    .from('products')
    .update({ stock_qty: product.stock_qty + qty })
    .eq('id', productId);

  if (updateError) return { error: updateError.message };

  await admin
    .from('product_transactions')
    .insert({
      product_id: productId,
      type:       'restock',
      qty_delta:  qty,
      note:       note ?? null,
    });

  revalidatePath('/dashboard/products');
  return { error: null };
}

export async function adjustStock(
  productId: string,
  newStockQty: number,
  note?: string,
): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизований' };
  if (newStockQty < 0) return { error: 'Залишок не може бути від\'ємним' };

  const admin = createAdminClient();

  const { data: product } = await admin
    .from('products')
    .select('id, stock_qty')
    .eq('id', productId)
    .eq('master_id', masterId)
    .single();

  if (!product) return { error: 'Продукт не знайдено' };

  const delta = newStockQty - product.stock_qty;

  const { error } = await admin
    .from('products')
    .update({ stock_qty: newStockQty })
    .eq('id', productId);

  if (error) return { error: error.message };

  await admin
    .from('product_transactions')
    .insert({
      product_id: productId,
      type:       'adjustment',
      qty_delta:  delta,
      note:       note ?? 'Ручне коригування',
    });

  revalidatePath('/dashboard/products');
  return { error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderItemPayload {
  product_id: string;
  qty: number;
}

export interface CreateOrderPayload {
  master_id:        string;
  booking_id?:      string | null;
  delivery_type:    'pickup' | 'nova_poshta';
  delivery_address?: string | null;
  items:            OrderItemPayload[];
  note?:            string | null;
  client_name?:     string | null;
  client_phone?:    string | null;
  pickup_at?:       string | null;
}

export async function createOrder(
  payload: CreateOrderPayload,
): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && (!payload.client_name?.trim() || !payload.client_phone?.trim())) {
    return { id: null, error: "Вкажіть ім'я та номер телефону" };
  }

  if (!payload.items.length) return { id: null, error: 'Замовлення порожнє' };
  if (payload.delivery_type === 'nova_poshta' && !payload.delivery_address?.trim()) {
    return { id: null, error: 'Вкажіть адресу Нової Пошти' };
  }

  const admin = createAdminClient();

  // Fetch products with stock check (atomic reads)
  const productIds = payload.items.map(i => i.product_id);
  const { data: products, error: fetchErr } = await admin
    .from('products')
    .select('id, price_kopecks, stock_qty, name')
    .in('id', productIds)
    .eq('master_id', payload.master_id)
    .eq('is_active', true);

  if (fetchErr || !products) return { id: null, error: 'Помилка завантаження продуктів' };

  const productMap = new Map(products.map(p => [p.id, p]));

  // Validate stock and compute total
  let total_kopecks = 0;
  for (const item of payload.items) {
    const p = productMap.get(item.product_id);
    if (!p) return { id: null, error: `Продукт не знайдено` };
    if (p.stock_qty < item.qty) {
      return { id: null, error: `"${p.name}" — недостатньо на складі (є ${p.stock_qty})` };
    }
    total_kopecks += p.price_kopecks * item.qty;
  }

  // Create order
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      master_id:        payload.master_id,
      client_id:        user?.id ?? null,
      client_name:      payload.client_name ?? null,
      client_phone:     payload.client_phone ?? null,
      booking_id:       payload.booking_id ?? null,
      delivery_type:    payload.delivery_type,
      delivery_address: payload.delivery_address ?? null,
      total_kopecks,
      status:           'new',
      note:             payload.note ?? null,
      pickup_at:        payload.pickup_at ?? null,
    })
    .select('id')
    .single();

  if (orderErr || !order) return { id: null, error: orderErr?.message ?? 'Помилка створення замовлення' };

  // Insert order items
  const { error: itemsErr } = await admin
    .from('order_items')
    .insert(
      payload.items.map(item => ({
        order_id:     order.id,
        product_id:   item.product_id,
        qty:          item.qty,
        price_kopecks: productMap.get(item.product_id)!.price_kopecks,
      }))
    );

  if (itemsErr) {
    // Rollback order
    await admin.from('orders').delete().eq('id', order.id);
    return { id: null, error: itemsErr.message };
  }

  // Decrement stock atomically per product
  for (const item of payload.items) {
    const p = productMap.get(item.product_id)!;

    const { error: stockErr } = await admin
      .from('products')
      .update({ stock_qty: p.stock_qty - item.qty })
      .eq('id', item.product_id)
      .gte('stock_qty', item.qty); // prevents going below 0

    if (stockErr) {
      // If stock update fails — still keep order, notify via error (race condition edge case)
      console.error(`[createOrder] stock update failed for ${item.product_id}:`, stockErr.message);
    }

    // Audit log
    await admin
      .from('product_transactions')
      .insert({
        product_id: item.product_id,
        type:       'sale',
        qty_delta:  -item.qty,
        order_id:   order.id,
      });
  }

  return { id: order.id, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT-SERVICE LINKS (server-side, admin client to bypass RLS during save)
// ─────────────────────────────────────────────────────────────────────────────

export async function saveProductLinks(
  productId: string,
  serviceIds: string[],
): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизований' };

  const admin = createAdminClient();

  // Verify product ownership
  const { data: product } = await admin
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('master_id', masterId)
    .single();
  if (!product) return { error: 'Продукт не знайдено' };

  // Full-replace: delete existing, insert new
  const { error: delErr } = await admin
    .from('product_service_links')
    .delete()
    .eq('product_id', productId);
  if (delErr) return { error: delErr.message };

  if (serviceIds.length > 0) {
    const { error: insErr } = await admin
      .from('product_service_links')
      .insert(serviceIds.map(sid => ({ product_id: productId, service_id: sid })));
    if (insErr) return { error: insErr.message };
  }

  revalidatePath('/dashboard/products');
  return { error: null };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизований' };

  const admin = createAdminClient();

  const { data: order } = await admin
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .eq('master_id', masterId)
    .single();

  if (!order) return { error: 'Замовлення не знайдено' };

  // Return stock on cancellation
  if (status === 'cancelled' && order.status !== 'cancelled') {
    const { data: items } = await admin
      .from('order_items')
      .select('product_id, qty')
      .eq('order_id', orderId);

    if (items) {
      for (const item of items) {
        await admin.rpc('increment_stock', {
          p_product_id: item.product_id,
          p_qty:        item.qty,
        });

        await admin
          .from('product_transactions')
          .insert({
            product_id: item.product_id,
            type:       'return',
            qty_delta:  item.qty,
            order_id:   orderId,
            note:       'Повернення після скасування',
          });
      }
    }
  }

  const { error } = await admin
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .eq('master_id', masterId);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/products');
  return { error: null };
}
