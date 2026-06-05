# 12 — Portfolio Consent Domain Map

## 1. Domain Overview

Система управління портфоліо майстра з легальним consent-флоу: клієнт має схвалити публікацію фотографій своїх робіт. Три рівні захисту ліміту Starter.

### Key Files
- `src/app/(master)/dashboard/portfolio/page.tsx` — Portfolio list
- `src/app/(master)/dashboard/portfolio/[id]/page.tsx` — Portfolio item editor
- `src/app/(master)/dashboard/portfolio/actions.ts` — CRUD server actions
- `src/app/[slug]/portfolio/page.tsx` — Public gallery (SSR)
- `src/app/[slug]/portfolio/[id]/page.tsx` — Public item detail (SSR)
- `src/app/my/portfolio-consent/actions.ts` — Client consent actions
- `src/components/master/portfolio/PortfolioPage.tsx` — List component
- `src/components/master/portfolio/PortfolioItemPage.tsx` — Edit component
- `src/components/master/portfolio/PortfolioItemCard.tsx` — Card component
- `src/components/master/portfolio/PortfolioPhotoUploader.tsx` — Photo upload
- `src/components/public/portfolio/PublicPortfolioGallery.tsx` — Public gallery
- `src/components/public/portfolio/PortfolioBookingButton.tsx` — Booking CTA
- `src/components/client/ClientNotificationsPage.tsx` — Consent approval UI

### DB Tables
- `portfolio_items` — title, description, service_id FK, tagged_client_id FK, consent_status (pending/approved/declined), is_published, display_order
- `portfolio_item_photos` — storage_path, url, display_order (up to 5 per item)
- `portfolio_item_reviews` — portfolio_item_id + review_id (composite PK)
- Storage bucket: `portfolios`, path: `{master_id}/items/{item_id}/{file}`

---

## 2. State Machine

### 2.1 Portfolio Item Lifecycle

```
Master creates:
  → [DRAFT] → title + description + service selection
    → [ADD_PHOTOS] → upload up to 5 photos → storage bucket
    → [TAG_CLIENT] → link to a booking/client
    → [CONSENT_PENDING] → auto: notification to client
      → Client receives notification (portfolio_consent_request)
      → Client opens /my/notifications → sees photos
        → [APPROVED] → consent_status: approved, is_published: true → public
        → [DECLINED] → consent_status: declined → NOT public
      → Master can also:
        → SET_MANUAL: override to approved (future feature?)
        → REMOVE_TAG: untag client → auto-approved
    → [PUBLISH] → set is_published: true
    → [UNPUBLISH] → set is_published: false
```

**Portfolio Item States:**
| State | Description | Public Visibility |
|---|---|---|
| `draft` | New, not finalized | Hidden |
| `pending` | Client consent requested | Hidden |
| `approved` | Client consented | ✅ Published (if is_published) |
| `declined` | Client refused | ❌ Hidden |
| `published` | Master published it | ✅ Visible |
| `unpublished` | Master hid it | ❌ Hidden |

### 2.2 Photo Upload States

```
[IDLE] → no photos
[SELECTING] → file picker open
[UPLOADING] → uploading to storage bucket
  → [SUCCESS] → thumbnail shown
  → [ERROR] → toast "Помилка завантаження"
  → [TOO_LARGE] → max 10MB per file
  → [WRONG_TYPE] → only images
[COMPLETE] → up to 5 photos
[REORDERING] → drag to reorder
[DELETING] → remove photo
```

### 2.3 Starter Plan Limit

```
3-level protection:
  1. Server Action check: count portfolio_items WHERE master_id = X AND is_published = true
  2. Server Component check: same query before rendering page
  3. Client Component check: disable publish button if at limit

Starter: max 5 published items
Pro/Studio: unlimited
```

### 2.4 Consent Notification Flow

```
Master tags client & saves:
  → portfolio/actions.ts → saveItem()
    → IF tagged_client_id changed AND consent_status != 'approved':
      → INSERT portfolio_item (consent_status: 'pending')
      → notifyClientPortfolioConsent({
          masterId, clientId, portfolioItemId
        })
        → NotificationOrchestrator sends In-App + Push + TG
        → Client sees in /my/notifications

Client actions:
  → approvePortfolioConsent(itemId):
    → UPDATE consent_status = 'approved'
    → IF is_published = true → visible on public page
  → declinePortfolioConsent(itemId):
    → UPDATE consent_status = 'declined'
    → NEVER visible on public page
```

---

## 3. Environment Matrix

| Environment | Portfolio Experience |
|---|---|
| Desktop | Grid gallery + lightbox |
| Mobile | Single column, tap to view |
| Tablet | Grid, touch swipe |

### Role Access
| Role | Can Do |
|---|---|
| Master (own) | CRUD, upload, tag clients, publish |
| Client (tagged) | Approve/Decline consent |
| Guest | View published items |

### Plan Tier
| Tier | Published Limit | Photo Limit per Item |
|---|---|---|
| Starter | 5 | 5 |
| Pro | Unlimited | 5 |
| Studio | Unlimited | 5 |

---

## 4. Load & Concurrency Vectors

| Vector | Risk |
|---|---|
| Large photo upload (10MB) | Bandwidth + storage |
| Many portfolio items (100+) | SSR page size |
| Concurrent consent approval | Race: approved + unpublished → should show once published |

---

## 5. Data Variations

| Variation | Effect |
|---|---|
| 0 portfolio items | Gallery hidden from public page |
| All items unpublished | Public gallery shows "Немає робіт" |
| Client declines all | Public gallery empty |
| Client has no account | Cannot tag → auto-approve? |
| Photo deleted from storage | Broken image |
| Service deleted | Link broken → show "Послуга видалена" |
| Tagged client deleted | Show without client name |
| Display order gaps | Reorder fill |
| Photo max 5 | Upload button disabled at 5 |

---

## 6. Test Vectors

### Unit Tests
- [ ] Starter limit check: 5 published → block 6th
- [ ] Starter limit check: 4 published → allow 5th
- [ ] Pro: no limit
- [ ] Consent status: pending → cannot publish
- [ ] Consent status: declined → set is_published = false

### Integration Tests
- [ ] Create portfolio item → INSERT + storage upload
- [ ] Tag client → notification sent
- [ ] Approve consent → status='approved' → visible
- [ ] Decline consent → status='declined' → hidden
- [ ] Upload photo → storage bucket store
- [ ] Delete photo → storage + DB removal
- [ ] Reorder photos → display_order updated

### E2E Tests
- [ ] Portfolio CRUD: create item with photos
- [ ] Portfolio CRUD: edit title/description
- [ ] Portfolio CRUD: tag client → auto-consent request
- [ ] Portfolio CRUD: publish → visible on public page
- [ ] Portfolio CRUD: unpublish → hidden
- [ ] Photo upload: 1-5 photos → reorder → delete
- [ ] Client: approve consent → item becomes public
- [ ] Client: decline consent → item stays hidden
- [ ] Public portfolio gallery: grid renders
- [ ] Public portfolio detail: photo + service + booking CTA
- [ ] Starter limit: publish 5 → 6th blocked
- [ ] Empty portfolio: gallery not shown on public page

### Security Tests
- [ ] Master A cannot see Master B's portfolio
- [ ] Client can only consent to own tagged items
- [ ] Guest cannot access dashboard portfolio
- [ ] Storage bucket: only owner can upload

---

## 7. File Inventory

### Pages
- `src/app/(master)/dashboard/portfolio/page.tsx`
- `src/app/(master)/dashboard/portfolio/[id]/page.tsx`
- `src/app/(master)/dashboard/portfolio/actions.ts`
- `src/app/[slug]/portfolio/page.tsx`
- `src/app/[slug]/portfolio/[id]/page.tsx`
- `src/app/my/portfolio-consent/actions.ts`

### Components
- `src/components/master/portfolio/PortfolioPage.tsx`
- `src/components/master/portfolio/PortfolioItemPage.tsx`
- `src/components/master/portfolio/PortfolioItemCard.tsx`
- `src/components/master/portfolio/PortfolioPhotoUploader.tsx`
- `src/components/public/portfolio/PublicPortfolioGallery.tsx`
- `src/components/public/portfolio/PortfolioBookingButton.tsx`
- `src/components/client/ClientNotificationsPage.tsx`

### DB
- `portfolio_items`
- `portfolio_item_photos`
- `portfolio_item_reviews`
- Storage bucket: `portfolios`

### Migrations
- `114_portfolio_items.sql`
- `115_recreate_portfolios_bucket.sql`
- `052_portfolio_service_link.sql`
- `055_portfolio_bucket_10mb.sql`
- `056_drop_portfolio.sql`
