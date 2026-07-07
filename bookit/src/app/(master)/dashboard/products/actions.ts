'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { after } from 'next/server';
import type { ProductCategory, OrderStatus } from '@/types/database';
import { notifyMasterNewOrder, notifyMasterStockAlert, notifyClientOrderStatus } from '@/lib/notifications';
import type { ProductIconName } from '@/lib/product-icons';

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
  icon_name?:                ProductIconName;
  name:                      string;
  description?:              string | null;
  category:                  ProductCategory;
  product_type?:             'retail' | 'consumable';
  unit?:                     'pcs' | 'ml' | 'g';
  price_kopecks:             number;
  cost_kopecks?:             number | null;
  photos?:                   string[];
  stock_qty?:                number;
  stock_alert_threshold?:    number | null;
  purchase_unit?:            'pcs' | 'g' | 'kg' | 'ml' | 'L' | null;
  purchase_qty?:             number | null;
  purchase_price_kopecks?:   number | null;
  is_active?:                boolean;
  recommend_always?:         boolean;
  auto_deduct?:              boolean;
  sort_order?:               number;
}

export interface OrderItemPayload {
  product_id: string;
  qty:        number;
}

export interface CreateOrderPayload {
  master_id:         string;
  items:             OrderItemPayload[];
  delivery_type:     'pickup' | 'nova_poshta';
  client_name?:      string | null;
  client_phone?:     string | null;
  delivery_address?: string | null;
  // M-SHOP-05: structured Nova Poshta destination (city + branch).
  np_city_ref?:       string | null;
  np_city_name?:      string | null;
  np_warehouse_ref?:  string | null;
  np_warehouse_name?: string | null;
  note?:             string | null;
  pickup_at?:        string | null;
  booking_id?:       string | null;
}

export async function createProduct(
  payload: ProductPayload,
): Promise<{ id: string | null; error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { id: null, error: 'Не авторизований' };
  try {
    if (!payload.name.trim()) return { id: null, error: 'Назва обов\'язкова' };
    if (payload.product_type !== 'consumable' && payload.price_kopecks <= 0) {
      return { id: null, error: 'Ціна має бути більше 0' };
    }
    if ((payload.photos?.length ?? 0) > 5) return { id: null, error: 'Максимум 5 фото' };

    const { data, error } = await createAdminClient()
      .from('products')
      .insert({
        master_id:               masterId,
        icon_name:               payload.icon_name ?? 'package',
        name:                    payload.name.trim(),
        description:             payload.description ?? null,
        category:                payload.category,
        product_type:            payload.product_type ?? 'retail',
        unit:                    payload.unit ?? 'pcs',
        price_kopecks:           payload.price_kopecks,
        cost_kopecks:            payload.cost_kopecks ?? null,
        photos:                  payload.photos ?? [],
        stock_qty:               payload.stock_qty ?? 0,
        stock_alert_threshold:   payload.stock_alert_threshold ?? null,
        purchase_unit:           payload.purchase_unit ?? null,
        purchase_qty:            payload.purchase_qty ?? null,
        purchase_price_kopecks:  payload.purchase_price_kopecks ?? null,
        is_active:               payload.is_active ?? true,
        recommend_always:        payload.recommend_always ?? false,
        auto_deduct:             payload.auto_deduct ?? true,
        sort_order:              payload.sort_order ?? 0,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') return { id: null, error: 'Продукт з такою назвою вже існує' };
      throw error;
    }

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
  } catch (err: unknown) {
    console.error('[createProduct] error:', err);
    return { id: null, error: 'Не вдалося створити продукт. Перевірте дані та спробуйте ще раз.' };
  }
}

export async function updateProduct(
  id: string,
  payload: Partial<ProductPayload>,
): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизований' };
  try {
    if (payload.name !== undefined && !payload.name.trim()) return { error: 'Назва обов\'язкова' };
    if (
      payload.price_kopecks !== undefined &&
      payload.price_kopecks <= 0 &&
      payload.product_type !== 'consumable'
    ) {
      return { error: 'Ціна має бути більше 0' };
    }
    if ((payload.photos?.length ?? 0) > 5) return { error: 'Максимум 5 фото' };

    const { error } = await createAdminClient()
      .from('products')
      .update({
        ...(payload.name                 !== undefined && { name:                  payload.name.trim() }),
        ...(payload.icon_name            !== undefined && { icon_name:             payload.icon_name }),
        ...(payload.description          !== undefined && { description:           payload.description }),
        ...(payload.category             !== undefined && { category:              payload.category }),
        ...(payload.product_type         !== undefined && { product_type:          payload.product_type }),
        ...(payload.unit                 !== undefined && { unit:                  payload.unit }),
        ...(payload.price_kopecks        !== undefined && { price_kopecks:         payload.price_kopecks }),
        ...(payload.cost_kopecks         !== undefined && { cost_kopecks:          payload.cost_kopecks }),
        ...(payload.photos               !== undefined && { photos:                payload.photos }),
        ...(payload.is_active            !== undefined && { is_active:             payload.is_active }),
        ...(payload.recommend_always     !== undefined && { recommend_always:      payload.recommend_always }),
        ...(payload.auto_deduct          !== undefined && { auto_deduct:           payload.auto_deduct }),
        ...(payload.sort_order           !== undefined && { sort_order:            payload.sort_order }),
        ...(payload.stock_alert_threshold !== undefined && { stock_alert_threshold: payload.stock_alert_threshold }),
        ...(payload.purchase_unit        !== undefined && { purchase_unit:         payload.purchase_unit }),
        ...(payload.purchase_qty         !== undefined && { purchase_qty:          payload.purchase_qty }),
        ...(payload.purchase_price_kopecks !== undefined && { purchase_price_kopecks: payload.purchase_price_kopecks }),
      })
      .eq('id', id)
      .eq('master_id', masterId);

    if (error) throw error;

    revalidatePath('/dashboard/products');
    return { error: null };
  } catch (err: unknown) {
    console.error('[updateProduct] error:', err);
    return { error: 'Не вдалося оновити продукт.' };
  }
}

export async function deleteProduct(id: string): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизований' };
  try {
    const { error } = await createAdminClient()
      .from('products')
      .update({ is_active: false, is_archived: true })
      .eq('id', id)
      .eq('master_id', masterId);

    if (error) throw error;

    revalidatePath('/dashboard/products');
    return { error: null };
  } catch (err: unknown) {
    console.error('[deleteProduct] error:', err);
    return { error: 'Не вдалося видалити продукт.' };
  }
}

export async function reorderProducts(orderedIds: string[]) {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизований' };
  try {
    const admin = createAdminClient();
    await Promise.all(
      orderedIds.map((id, index) =>
        admin
          .from('products')
          .update({ sort_order: index + 1 })
          .eq('id', id)
          .eq('master_id', masterId)
      )
    );

    revalidatePath('/dashboard/products');
    return { error: null };
  } catch (err: unknown) {
    console.error('[reorderProducts] error:', err);
    return { error: 'Не вдалося змінити порядок.' };
  }
}

export async function restockProduct(
  productId: string,
  qty: number,
  note?: string,
  costKopecks?: number,
): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизований' };
  try {
    if (qty <= 0) return { error: 'Кількість має бути більше 0' };

    const admin = createAdminClient();

    const { data: product, error: fetchErr } = await admin
      .from('products')
      .select('id, stock_qty')
      .eq('id', productId)
      .eq('master_id', masterId)
      .single();

    if (fetchErr || !product) return { error: 'Продукт не знайдено' };

    const { error: updateError } = await admin
      .from('products')
      .update({
        stock_qty: product.stock_qty + qty,
        ...(costKopecks != null && { cost_kopecks: costKopecks }),
      })
      .eq('id', productId);

    if (updateError) throw updateError;

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
  } catch (err: unknown) {
    console.error('[restockProduct] error:', err);
    return { error: 'Не вдалося поповнити склад.' };
  }
}

export async function adjustStock(
  productId: string,
  newStockQty: number,
  note?: string,
): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизований' };
  try {
    if (newStockQty < 0) return { error: 'Залишок не може бути від\'ємним' };

    const admin = createAdminClient();

    const { data: product, error: fetchErr } = await admin
      .from('products')
      .select('id, stock_qty')
      .eq('id', productId)
      .eq('master_id', masterId)
      .single();

    if (fetchErr || !product) return { error: 'Продукт не знайдено' };

    const delta = newStockQty - product.stock_qty;

    const { error } = await admin
      .from('products')
      .update({ stock_qty: newStockQty })
      .eq('id', productId);

    if (error) throw error;

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
  } catch (err: unknown) {
    console.error('[adjustStock] error:', err);
    return { error: 'Не вдалося змінити залишок.' };
  }
}

// public action — clients can create orders without being logged in (shop flow)
export async function createOrder(
  payload: CreateOrderPayload,
): Promise<{ id: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && (!payload.client_name?.trim() || !payload.client_phone?.trim())) {
      return { id: null, error: "Вкажіть ім'я та номер телефону" };
    }

    if (!payload.items.length) return { id: null, error: 'Замовлення порожнє' };
    if (payload.delivery_type === 'nova_poshta' && !payload.np_warehouse_ref) {
      return { id: null, error: 'Оберіть місто та відділення Нової Пошти' };
    }

    const admin = createAdminClient();

    const productIds = payload.items.map(i => i.product_id);
    const { data: products, error: fetchErr } = await admin
      .from('products')
      .select('id, price_kopecks, stock_qty, name, stock_alert_threshold')
      .in('id', productIds)
      .eq('master_id', payload.master_id)
      .eq('is_active', true);

    if (fetchErr || !products) throw fetchErr || new Error('Products fetch failed');

    const productMap = new Map(products.map(p => [p.id, p]));

    let total_kopecks = 0;
    for (const item of payload.items) {
      // Guard against negative / zero / fractional qty (would pass the stock check,
      // produce a negative total, and INFLATE stock on decrement).
      if (!Number.isInteger(item.qty) || item.qty < 1) {
        return { id: null, error: 'Невірна кількість товару' };
      }
      const p = productMap.get(item.product_id);
      if (!p) return { id: null, error: `Продукт не знайдено` };
      if (p.stock_qty < item.qty) {
        return { id: null, error: `"${p.name}" — недостатньо на складі (є ${p.stock_qty})` };
      }
      total_kopecks += p.price_kopecks * item.qty;
    }

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
        np_city_ref:       payload.np_city_ref ?? null,
        np_city_name:      payload.np_city_name ?? null,
        np_warehouse_ref:  payload.np_warehouse_ref ?? null,
        np_warehouse_name: payload.np_warehouse_name ?? null,
        total_kopecks,
        status:           'new',
        note:             payload.note ?? null,
        pickup_at:        payload.pickup_at ?? null,
      })
      .select('id')
      .single();

    if (orderErr || !order) throw orderErr || new Error('Order creation failed');

    const { error: itemsErr } = await admin
      .from('order_items')
      .insert(
        payload.items.map(item => ({
          order_id:      order.id,
          product_id:    item.product_id,
          qty:           item.qty,
          price_kopecks: productMap.get(item.product_id)!.price_kopecks,
        }))
      );

    if (itemsErr) {
      await admin.from('orders').delete().eq('id', order.id);
      throw itemsErr;
    }

    // Atomic stock decrement — reserve each unit via decrement_product_stock_atomic
    // (relative UPDATE, safe under concurrency; FALSE when exhausted mid-flight). The
    // old `.update().gte()` never checked the affected-row count, so two concurrent
    // last-unit orders both wrote a `sale` ledger row while only one decrement landed
    // → oversell + ledger drift. On exhaustion we roll back reserved units + the order.
    const reserved: Array<{ id: string; qty: number }> = [];
    for (const item of payload.items) {
      const p = productMap.get(item.product_id)!;

      const { data: ok, error: decErr } = await admin.rpc('decrement_product_stock_atomic', {
        p_product_id: item.product_id,
        p_qty:        item.qty,
      });
      if (decErr || ok === false) {
        for (const r of reserved) {
          await admin.rpc('increment_stock', { p_product_id: r.id, p_qty: r.qty });
        }
        await admin.from('orders').delete().eq('id', order.id);
        return { id: null, error: `"${p.name}" щойно закінчився. Спробуйте ще раз.` };
      }
      reserved.push({ id: item.product_id, qty: item.qty });

      await admin
        .from('product_transactions')
        .insert({
          product_id: item.product_id,
          type:       'sale',
          qty_delta:  -item.qty,
          order_id:   order.id,
        });

      // Stock alert — threshold now comes from the initial fetch (was a per-item N+1 query).
      const newStock  = p.stock_qty - item.qty;
      const threshold = p.stock_alert_threshold ?? 3;
      if (newStock <= threshold && newStock >= 0) {
        after(() => notifyMasterStockAlert(payload.master_id, p.name, newStock));
      }
    }

    const orderItemsText = payload.items
      .map(i => {
        const p = productMap.get(i.product_id);
        return `${p?.name ?? 'Товар'} × ${i.qty}`;
      })
      .join(', ');
    after(() => notifyMasterNewOrder({ masterId: payload.master_id, orderId: order.id, orderItems: orderItemsText }));

    revalidatePath('/dashboard/products');
    return { id: order.id, error: null };
  } catch (err: unknown) {
    console.error('[createOrder] error:', err);
    return { id: null, error: 'Помилка при оформленні замовлення. Спробуйте пізніше.' };
  }
}

export async function saveProductLinks(
  productId: string,
  links: { serviceId: string; quantity: number }[],
): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизований' };
  try {
    const admin = createAdminClient();

    const { data: product, error: fetchErr } = await admin
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('master_id', masterId)
      .single();
    if (fetchErr || !product) return { error: 'Продукт не знайдено' };

    const { error: delErr } = await admin
      .from('product_service_links')
      .delete()
      .eq('product_id', productId);
    if (delErr) throw delErr;

    if (links.length > 0) {
      const { error: insErr } = await admin
        .from('product_service_links')
        .insert(links.map(l => ({
          product_id: productId,
          service_id: l.serviceId,
          quantity:   l.quantity,
        })));
      if (insErr) throw insErr;
    }

    revalidatePath('/dashboard/products');
    return { error: null };
  } catch (err: unknown) {
    console.error('[saveProductLinks] error:', err);
    return { error: 'Не вдалося зберегти зв\'язки з послугами.' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PER-PRODUCT ANALYTICS (read-side)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductStats {
  soldQty:    number;        // total units sold (orders, excl. cancelled)
  revenue:    number;        // Σ price_kopecks × qty, in грн
  profit:     number;        // revenue − current cost × soldQty, in грн
  marginPct:  number;        // profit as % of revenue
  lastSaleAt: string | null; // ISO timestamp of the latest order
}

interface SaleRow {
  qty:           number;
  price_kopecks: number;
  orders: { created_at: string } | { created_at: string }[] | null;
}

interface BookingSaleRow {
  quantity:      number;
  product_price: number; // stored in UAH (createBooking: round(price_kopecks / 100))
  bookings: { created_at: string } | { created_at: string }[] | null;
}

/**
 * Per-product sales analytics for the shop.
 * Admin client is scoped to the authenticated master; product ownership is
 * verified first. Counts BOTH sales channels except cancelled ones: shop orders
 * (order_items) and products sold during a booking (booking_products) — matching
 * the unified sales view in useOrders. Profit uses the product's CURRENT cost —
 * historical cost is not stored per line, so margin is an approximation.
 */
export async function getProductStats(
  productId: string,
): Promise<{ data: ProductStats | null; error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { data: null, error: 'Не авторизовано' };
  try {
    const admin = createAdminClient();

    // Ownership: product must belong to this master. Pull cost in the same trip.
    const { data: product } = await admin
      .from('products')
      .select('id, cost_kopecks')
      .eq('id', productId)
      .eq('master_id', masterId)
      .single();
    if (!product) return { data: null, error: 'Товар не знайдено' };

    const { data: rows, error: rErr } = await admin
      .from('order_items')
      .select('qty, price_kopecks, orders!inner(created_at, master_id, status)')
      .eq('product_id', productId)
      .eq('orders.master_id', masterId)
      .neq('orders.status', 'cancelled');
    if (rErr) throw rErr;

    let soldQty = 0;
    let revenueKopecks = 0;
    let lastSaleAt: string | null = null;

    for (const row of (rows ?? []) as SaleRow[]) {
      const qty = Number(row.qty) || 0;
      soldQty += qty;
      revenueKopecks += (Number(row.price_kopecks) || 0) * qty;
      const ord = Array.isArray(row.orders) ? row.orders[0] : row.orders;
      const at = ord?.created_at ?? null;
      if (at && (!lastSaleAt || at > lastSaleAt)) lastSaleAt = at;
    }

    // Channel 2: products sold during a booking (booking_products).
    const { data: bpRows, error: bpErr } = await admin
      .from('booking_products')
      .select('quantity, product_price, bookings!inner(created_at, master_id, status)')
      .eq('product_id', productId)
      .eq('bookings.master_id', masterId)
      .neq('bookings.status', 'cancelled');
    if (bpErr) throw bpErr;

    for (const row of (bpRows ?? []) as BookingSaleRow[]) {
      const qty = Number(row.quantity) || 0;
      soldQty += qty;
      revenueKopecks += (Number(row.product_price) || 0) * 100 * qty;
      const bk = Array.isArray(row.bookings) ? row.bookings[0] : row.bookings;
      const at = bk?.created_at ?? null;
      if (at && (!lastSaleAt || at > lastSaleAt)) lastSaleAt = at;
    }

    const revenue = Math.round(revenueKopecks / 100);
    const costKopecks = (Number(product.cost_kopecks) || 0) * soldQty;
    const profit = Math.round((revenueKopecks - costKopecks) / 100);
    const marginPct = revenueKopecks > 0
      ? Math.round(((revenueKopecks - costKopecks) / revenueKopecks) * 100)
      : 0;

    return {
      data: { soldQty, revenue, profit, marginPct, lastSaleAt },
      error: null,
    };
  } catch (err: unknown) {
    console.error('[getProductStats]', err);
    return { data: null, error: 'Не вдалося завантажити статистику' };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ error: string | null }> {
  const masterId = await getMasterId();
  if (!masterId) return { error: 'Не авторизований' };
  try {
    const admin = createAdminClient();

    const { data: order, error: fetchErr } = await admin
      .from('orders')
      .select('id, status, client_id')
      .eq('id', orderId)
      .eq('master_id', masterId)
      .single();

    if (fetchErr || !order) return { error: 'Замовлення не знайдено' };

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

    if (error) throw error;

    if ((status === 'shipped' || status === 'completed') && order.client_id) {
      after(() => notifyClientOrderStatus(order.client_id as string, masterId, status, orderId));
    }

    revalidatePath('/dashboard/products');
    return { error: null };
  } catch (err: unknown) {
    console.error('[updateOrderStatus] error:', err);
    return { error: 'Не вдалося оновити статус замовлення.' };
  }
}
