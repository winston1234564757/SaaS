# 08 — Public Client Zone Domain Map

## 1. Domain Overview

Публічна сторінка майстра `/[slug]`, портфоліо, магазин, каталог майстрів та Studio-сторінки. SSR/ISR, 3 теми, JSON-LD структуровані дані, OG Images.

### Key Files
- `src/app/[slug]/page.tsx` — SSR master page
- `src/app/[slug]/data.ts` — Shared data layer (React.cache)
- `src/app/[slug]/actions.ts` — Server actions
- `src/components/public/PublicMasterPage.tsx` — Main component (~40KB)
- `src/app/[slug]/portfolio/page.tsx` — Portfolio gallery
- `src/app/[slug]/portfolio/[id]/page.tsx` — Portfolio item detail
- `src/components/public/portfolio/PublicPortfolioGallery.tsx`
- `src/app/[slug]/shop/page.tsx` — Shop page
- `src/components/public/ShopPage.tsx` — Shop component
- `src/app/explore/page.tsx` — Master discovery
- `src/components/public/ExplorePage.tsx` — Explore component
- `src/app/studio/[slug]/page.tsx` — Studio page
- `src/components/public/StudioPublicPage.tsx` — Studio component
- `src/app/[slug]/opengraph-image.tsx` — Dynamic OG image (Edge Runtime)

### DB Tables
- `master_profiles` — slug, business_name, theme, categories
- `services` — Service catalog (public)
- `products` — Product catalog (public)
- `reviews` — Client reviews
- `portfolio_items` — Published portfolio items
- `portfolio_item_photos` — Photos per item
- `flash_deals` — Active flash deals

---

## 2. State Machine

### 2.1 Public Master Page (`/[slug]`)

```
[LOADING] → SSR fetch via data.ts (React.cache)
  → [READY] → render sections:
    1. HERO: avatar, name, badge, specialty, rating, location
    2. LOYALTY_WIDGET: progress bar (client only)
    3. LOCATION: Google Maps card
    4. SHOP_BANNER: link to /shop
    5. PORTFOLIO_STRIP: 2 items + "Всі роботи"
    6. SERVICES: by category + flash deals strip
    7. PRODUCT_PREVIEWS: up to 3 products
    8. REVIEWS: client testimonials
    9. TRUSTED_PARTNERS: partner masters
    10. C2C_BANNER: referral share
    11. FLOATING_CTA: "Записатися"
  → [ERROR] → 404 (slug not found) or error page
  → [NOT_FOUND] → slug doesn't exist
```

**States:**
| State | Description |
|---|---|
| SSR_LOADING | Server rendering |
| SSR_READY | Full page rendered |
| SSR_ERROR | Server error during fetch |
| NOT_FOUND | Invalid slug → 404 |
| DARK_THEME | Studio theme applied |
| LIGHT_THEME | Blossom or Frost theme |
| BOOKING_ACTIVE | BookingWizard open on page |

### 2.2 Sections Behavior

| Section | Data State | Empty State |
|---|---|---|
| Hero | Master has slug/name | Can't publish (slug required) |
| Services | Has active services | "Послуги скоро з'являться" |
| Reviews | Has reviews | Not shown |
| Portfolio | Has published items | Not shown |
| Shop | Has products + Pro tier | Shop banner hidden |
| Flash Deals | Has active deals | Not shown |
| C2C | c2c_enabled=true | Not shown |
| Trusted Partners | Has partners | Not shown |

### 2.3 Portfolio Gallery (`/[slug]/portfolio`)

```
[LOADING] → SSR fetch published items
  → [READY] → photo grid + lightbox
  → [EMPTY] → no published items
  → [ERROR] → fetch failed
```

### 2.4 Public Shop (`/[slug]/shop`)

```
[LOADING] → SSR fetch products + active orders
  → [READY] → catalog + cart
  → [EMPTY] → no products for sale
  → [ERROR] → fetch failed
  → [PRO_ONLY] → Pro/Studio tier required → block if Starter
```

**Cart States:**
```
[EMPTY] → "Кошик порожній"
[ADDING] → product added → toast
[HAS_ITEMS] → show cart total
[CHECKOUT] → order form → name/phone/delivery
  → [PICKUP] → optional pickup time
  → [NOVA_POSHTA] → address input (if master ships)
[SUBMITTING] → createOrder
  → [SUCCESS] → order confirmation
  → [OUT_OF_STOCK] → error toast
  → [ERROR] → general error
```

### 2.5 Explore Page (`/explore`)

```
[LOADING] → fetch masters list
  → [READY] → search + filter + sort + cards
  → [EMPTY] → no masters match filter
  → [ERROR] → fetch failed
  → [SEARCHING] → debounced API call

Filters:
  → CATEGORY_CHIPS: select multiple
  → CITY: dropdown
  → SORT: popular / rating / newest

Card: avatar, rating, categories, city, PRO badge
```

### 2.6 Studio Page (`/studio/[slug]`)

```
[LOADING] → SSR fetch studio + members
  → [READY] → studio info + member cards with services
  → [NOT_FOUND] → invalid slug
  → [EMPTY] → no members active
```

---

## 3. Environment Matrix

| Environment | Experience |
|---|---|
| Desktop | Full layout, sidebar |
| Mobile | Stacked sections, floating CTA |
| Tablet | Hybrid layout |
| PWA | Like mobile |
| TMA (Telegram) | In-app browser, limited |
| Slow network | Progressive loading |
| Offline | Cached via ISR |

### Theme Variants
| Theme | Public Page | Shop | Portfolio |
|---|---|---|---|
| Blossom | Warm taupe, glassmorphism | Same | Same |
| Studio | Dark teal + gold | Same | Same |
| Frost | Lavender + slate | Same | Same |

### Plan Tier (Shop Gating)
| Tier | Shop Available | Portfolio Public |
|---|---|---|
| Starter | ❌ | Limited (5 items) |
| Pro | ✅ | Unlimited |
| Studio | ✅ | Unlimited |

---

## 4. Load & Concurrency Vectors

| Vector | Risk |
|---|---|
| SSR for popular master | High server load |
| ISR revalidation | Stale data window |
| OG Image generation | Edge function compute |
| Multiple images (portfolio) | Bandwidth |
| Shop concurrent orders | Stock race (atomic RPC handles) |

---

## 5. Data Variations

| Slug Variation | Effect |
|---|---|
| Valid slug | Normal page |
| Invalid slug | 404 |
| Slug with special chars | URL encoded |
| Very long slug | Truncated? |
| Cyrillic slug | URL encoded in browser |
| Unpublished master | Has profile but inactive |

### Shop Variations
| Product Variation | Effect |
|---|---|
| 0 stock | "Немає в наявності" |
| Out of stock | Greyed out |
| High stock (100+) | Shows "В наявності" |
| No products | Shop page hidden |
| Ships NP | NP address form shown |
| Pickup only | No address field |

---

## 6. Test Vectors

### Integration Tests
- [ ] SSR slug fetch → correct master data
- [ ] SSR invalid slug → 404 page
- [ ] OG Image generation for valid slug
- [ ] OG Image generation for dark-themed master
- [ ] ISR revalidate after 60s (shop) / 300s (portfolio)
- [ ] JSON-LD structured data valid (Google test)

### E2E Tests
- [ ] Public page: all sections render for active master
- [ ] Public page: portrait mobile layout
- [ ] Public page: click "Записатися" → BookingWizard opens
- [ ] Public page: flash deal visible → click → booking with flash
- [ ] Public page: portfolio strip → click → gallery page
- [ ] Public page: shop banner → click → shop page
- [ ] Public page: C2C referral banner → share link
- [ ] Portfolio gallery: grid with photos → lightbox
- [ ] Portfolio detail: photo + service + book button
- [ ] Shop: browse → add to cart → checkout → order
- [ ] Shop: out-of-stock product → cannot add
- [ ] Shop: Nova Poshta delivery → address form
- [ ] Explore: search by name → results
- [ ] Explore: filter by category → filtered
- [ ] Explore: sort by rating → correct order
- [ ] Studio: members listed + services

### Security Tests
- [ ] Slug: cannot access unpublished master
- [ ] Shop: Starter master → 403 or hidden
- [ ] Portfolio: unpublished item not visible

---

## 7. File Inventory

### Pages
- `src/app/[slug]/page.tsx`
- `src/app/[slug]/data.ts`
- `src/app/[slug]/actions.ts`
- `src/app/[slug]/opengraph-image.tsx`
- `src/app/[slug]/portfolio/page.tsx`
- `src/app/[slug]/portfolio/[id]/page.tsx`
- `src/app/[slug]/shop/page.tsx`
- `src/app/explore/page.tsx`
- `src/app/studio/[slug]/page.tsx`

### Components
- `src/components/public/PublicMasterPage.tsx`
- `src/components/public/ShopPage.tsx`
- `src/components/public/ExplorePage.tsx`
- `src/components/public/StudioPublicPage.tsx`
- `src/components/public/LoyaltyWidget.tsx`
- `src/components/public/MasterLocationCard.tsx`
- `src/components/public/TrustedPartnersBlock.tsx`
- `src/components/public/portfolio/PublicPortfolioGallery.tsx`
- `src/components/public/portfolio/PortfolioBookingButton.tsx`

### DB
- `master_profiles`
- `services`
- `products`
- `reviews`
- `portfolio_items`
- `portfolio_item_photos`
- `flash_deals`
