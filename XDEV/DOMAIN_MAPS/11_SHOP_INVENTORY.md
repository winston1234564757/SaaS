# 11 — Shop & Inventory Domain Map

## 1. Domain Overview

Модуль товарного ритейлу: публічний магазин, кошик, оформлення замовлення, контроль залишків, сповіщення про поповнення, доставка Новою Поштою, крос-сейл рекомендації.

### Key Files
- `src/app/[slug]/shop/page.tsx` — Shop SSR page
- `src/components/public/ShopPage.tsx` — Shop component
- `src/app/(master)/dashboard/products/page.tsx` — Products management
- `src/app/(master)/dashboard/products/actions.ts` — Product server actions
- `src/components/master/products/ProductsPage.tsx` — Products dashboard
- `src/components/master/products/ProductEditor.tsx` — Product editor
- `src/components/master/products/RestockDrawer.tsx` — Stock restock
- `src/lib/notifications.ts` — notifyMasterStockAlert

### DB Tables
- `products` — id, master_id, name, price (kopecks), stock, is_active, stock_alert_threshold (default 3), icon_name, product_type
- `orders` — id, master_id, client_name, phone, delivery_type (pickup/nova_poshta), delivery_address, status, total_kopecks
- `order_items` — order_id, product_id, quantity, price_kopecks
- `product_service_links` — product_id, service_id (cross-sell)

### RPC
- `increment_stock_rpc` — Atomic stock decrement (prevents double-buy)

---

## 2. State Machine

### 2.1 Order Lifecycle

```
[CART] → client adds products
  → [CHECKOUT] → fill name/phone/delivery
    → [VALIDATING] → check stock availability
      → INSUFFICIENT → error
      → OK → [SUBMITTING]
        → createOrder server action:
          → INSERT orders (status: new)
          → INSERT order_items (per product)
          → CALL increment_stock_rpc (atomic per product)
          → notifyMasterNewOrder (master notification)
          → IF stock <= stock_alert_threshold: notifyMasterStockAlert
          → [SUCCESS] → order confirmation
  → [FULFILLMENT]:
    → Master changes status:
      → NEW → PROCESSING
      → PROCESSING → SHIPPED (if NP) or READY (if pickup)
      → SHIPPED → COMPLETED
      → At each transition: notifyClientOrderStatus
  → [CANCELLED] → at any point by master
```

**Order Statuses:**
| Status | Description | Notify |
|---|---|---|
| `new` | Just created | Master |
| `processing` | Master acknowledged | — |
| `shipped` | NP: sent to client | Client |
| `ready` | Pickup: ready for client | Client |
| `completed` | Delivered/picked up | Client |
| `cancelled` | Cancelled | Client |

### 2.2 Stock Management States

```
Product stock levels:
  → IN_STOCK (stock > threshold) → normal display
  → LOW_STOCK (0 < stock <= threshold) → "Мало" badge + alert
  → OUT_OF_STOCK (stock = 0) → "Немає" badge, cannot order
  → UNLIMITED (stock = -1 or NULL?) → always available

Stock Alert:
  → On order: newStock = oldStock - quantity
  → IF newStock <= stock_alert_threshold AND newStock >= 0
    → notifyMasterStockAlert(masterId, productName, newStock)
  → stock_alert_threshold default: 3 (configurable per product)
```

### 2.3 Cart States

```
[EMPTY] → "Кошик порожній"
[ADDING] → click "Додати" → product added → toast
[HAS_ITEMS] → show cart summary + total
  → qty stepper (min 1, max = stock)
  → remove item
[CHECKOUT_OPEN] → delivery form
  → PICKUP → optional pickup_at time
  → NOVA_POSHTA → address fields (if ships_nova_poshta)
[SUBMITTING] → loading spinner
[SUCCESS] → "Замовлення оформлено"
[ERROR_STOCK] → "Товару недостатньо"
[ERROR_GENERAL] → toast error
```

---

## 3. Environment Matrix

| Environment | Shop Behavior |
|---|---|
| Desktop | Full product grid + cart sidebar |
| Mobile | Single column, cart bottom sheet |
| Tablet | Grid with slide-over cart |

### Plan Tier Access
| Tier | Shop Available | Product Limit |
|---|---|---|
| Starter | ❌ | — |
| Pro | ✅ | Unlimited |
| Studio | ✅ | Unlimited |

### Delivery Options
| Config | Pickup | Nova Poshta |
|---|---|---|
| `ships_nova_poshta=true` | ✅ | ✅ |
| `ships_nova_poshta=false` | ✅ | ❌ |

---

## 4. Load & Concurrency Vectors

| Vector | Risk | Mitigation |
|---|---|---|
| Two clients buy last item | Double-sell race | `increment_stock_rpc` atomic RPC |
| Same client double-click order | Duplicate order | Idempotency (client guard) |
| 100+ products in catalog | Render perf | Pagination/SSR |
| Product photo heavy | Bandwidth | Image optimization |

---

## 5. Data Variations

| Variation | Effect |
|---|---|
| 0 products | Shop page hidden or "Немає товарів" |
| 0 stock | Out of stock badge, cannot order |
| NULL stock | Treat as unlimited? |
| Negative stock | Bug → floor at 0 |
| Stock = 1 | After order → 0 → out of stock |
| Price = 0 (free) | "Безкоштовно" |
| Price very high (1M+) | Format correctly |
| No delivery options | Pickup only (default) |
| No threshold set | Default 3 |
| Product linked to service | Cross-sell in booking wizard |

---

## 6. Test Vectors

### Unit Tests
- [ ] `increment_stock_rpc` — decrement atomically
- [ ] `increment_stock_rpc` — not below 0
- [ ] `increment_stock_rpc` — concurrent calls → correct final stock
- [ ] Stock alert: newStock <= threshold → true
- [ ] Stock alert: newStock > threshold → false
- [ ] Stock alert: newStock < 0 (error) → no alert
- [ ] Order total: sum of (qty × price) for all items

### Integration Tests
- [ ] Create order → INSERT + stock decrement + notification
- [ ] Create order with insufficient stock → error, no INSERT
- [ ] Stock alert triggers on threshold
- [ ] Order status change → notify client
- [ ] Cross-sell links: product_service_links fetch

### E2E Tests
- [ ] Shop: products listed → add to cart → update quantity
- [ ] Shop: checkout → pickup → order success
- [ ] Shop: checkout → Nova Poshta → address form → success
- [ ] Shop: out of stock → cannot add
- [ ] Shop: empty → "Немає товарів"
- [ ] Master products: CRUD create product
- [ ] Master products: edit stock
- [ ] Master products: restock drawer
- [ ] Master orders: view incoming orders
- [ ] Master orders: change status (new→processing→shipped)
- [ ] Stock alert appears when stock low

### Security Tests
- [ ] Master A can't see Master B's products
- [ ] Guest can view shop but needs auth to order?
- [ ] Order: phone validation (E.164)

---

## 7. File Inventory

### Pages & Components
- `src/app/[slug]/shop/page.tsx`
- `src/components/public/ShopPage.tsx`
- `src/app/(master)/dashboard/products/page.tsx`
- `src/app/(master)/dashboard/products/actions.ts`
- `src/components/master/products/ProductsPage.tsx`
- `src/components/master/products/ProductEditor.tsx`
- `src/components/master/products/RestockDrawer.tsx`

### Notifications
- `src/lib/notifications.ts` (notifyMasterNewOrder, notifyMasterStockAlert, notifyClientOrderStatus)

### DB
- `products`
- `orders`
- `order_items`
- `product_service_links`

### Migrations
- `008_inventory_trigger.sql`
- `043_product_indexes.sql`
- `137_product_type_and_emoji.sql`
- `136_notification_logs.sql` (stock_alert_threshold)
