# 10 — Marketing Hub Domain Map

## 1. Domain Overview

Маркетинговий хаб: Story Generator (візуальний контент вільних слотів) + Targeted Broadcasts (сегментовані розсилки клієнтам через In-App/Push/Telegram/SMS).

### Key Files
- `src/app/(master)/dashboard/marketing/page.tsx` — Marketing hub page
- `src/app/(master)/dashboard/marketing/actions.ts` — Server actions
- `src/app/(master)/dashboard/marketing/new/page.tsx` — New broadcast
- `src/app/(master)/dashboard/marketing/[id]/page.tsx` — Broadcast detail
- `src/components/master/marketing/StoryGenerator.tsx` — Story generator
- `src/components/master/marketing/BroadcastEditor.tsx` — Broadcast editor
- `src/components/master/marketing/BroadcastHistory.tsx` — Past broadcasts
- `src/components/master/marketing/BroadcastDetailPage.tsx` — Per-client results

### DB Tables
- `broadcasts` — Campaign: message, discount_percent, target_tags[], service_id, product_id, channels[], status
- `broadcast_recipients` — Per-recipient: push_sent, telegram_sent, sms_sent, clicked_at, booked_at, discount_used_at
- `broadcast_links` — Short links: code (6-char), target_url, clicks
- `phone_discounts` — Phone-bound: discount_percent, service_id, broadcast_id, expires_at, used_at

---

## 2. State Machine

### 2.1 Story Generator

```
[OPEN] → fetch free slots for next 7 days
  → [LOADING] → skeleton
  → [READY] → canvas editor:
    → slot grid (day × time)
    → click slot → add to story
    → palette selection
    → preview render
    → EXPORT → JPEG
  → [EMPTY] → no free slots → message
  → [ERROR] → fetch failed
```

**States:**
- LOADING — fetching slots
- READY — canvas with slot grid
- EMPTY — no free slots
- EXPORTING — generating JPEG
- EXPORTED — file ready to share
- ERROR — generation failed

### 2.2 Broadcast Editor

```
[OPEN] → /dashboard/marketing/new
  → [EDITING]:
    → Tab: "Повідомлення" — rich text editor
      → {client_name} personalization
      → discount percentage (optional)
      → service/product link (optional)
    → Tab: "Отримувачі" — client filter
      → tag filter (include/exclude)
      → segment filter (VIP/Regular/Sleeping/At Risk)
      → preview recipient count
    → Tab: "Канали" — In-App / Push / TG / SMS checkboxes
  → [PREVIEW] → sample rendered message
  → [SENDING] → createBroadcast:
    → INSERT broadcasts (status: draft)
    → compute target clients → INSERT broadcast_recipients
    → send via NotificationOrchestrator (per recipient)
    → status: sent
  → [SENT] → redirect to broadcast detail
  → [ERROR] → validation error
```

**Broadcast Statuses:**
| Status | Description |
|---|---|
| `draft` | Not sent yet |
| `scheduled` | Queued for later |
| `sending` | In progress |
| `sent` | All recipients processed |
| `cancelled` | Aborted |

### 2.3 Broadcast Detail (`/[id]`)

```
[LOADING] → fetch broadcast + recipients
  → [READY] → stats:
    → total recipients
    → push_sent / telegram_sent / sms_sent counts
    → clicked count
    → booked count
    → discount_used count
    → per-client table with delivery status
```

### 2.4 Short Link Flow

```
/broadcast creates short link:
  → generateShortCode() → 6-char unique code
  → INSERT broadcast_links (code, target_url, recipient_id)
  → URL: bookit.com.ua/r/[code]

Client clicks /r/[code]:
  → broadcast_links.clicks++
  → redirect to target_url
  → if ?serviceId= → auto-select service in BookingWizard
  → phone_discounts matched by phone → discount applied at booking
```

### 2.5 Phone Discount Lifecycle

```
Broadcast sent:
  → INSERT phone_discounts (phone, master_id, discount%, service_id, broadcast_id, expires_at)
  
Client books (with same phone):
  → createBooking checks phone_discounts
  → valid discount found → apply to total
  → phone_discounts.used_at = now
  → broadcast_recipients.discount_used_at = now
```

**Phone Discount States:**
| State | Description |
|---|---|
| ACTIVE | Not used, not expired |
| USED | Applied to a booking |
| EXPIRED | past expires_at |
| VOID | Manually cancelled |

---

## 3. Environment Matrix

| Environment | Marketing Features |
|---|---|
| Desktop | Full editor with preview |
| Mobile | Simplified editor |
| Tablet | Hybrid |

### Plan Tier
| Feature | Starter | Pro | Studio |
|---|---|---|---|
| Story Generator | ❌ | ✅ | ✅ |
| Broadcasts | ❌ | ✅ | ✅ |
| Broadcast limit/mo | — | 50 | 200 |

---

## 4. Load & Concurrency Vectors

| Vector | Risk |
|---|---|
| Broadcast to 1000 clients | 1000 notification calls |
| Short link click spike | Concurrent clicks++ |
| Phone discount race | Two bookings same phone |

---

## 5. Data Variations

| Variation | Effect |
|---|---|
| Empty message | Validation error |
| No recipients match filters | "Немає отримувачів" |
| All channels disabled | Warning: "хоча б один канал" |
| Personalization var missing | Leave as {client_name} or replace with "" |
| Broadcast discount + existing discounts | Stack? Replace? |
| Short code collision | Retry generate |
| Phone discount expired | Not applied |
| Phone discount used | Not applied again |

---

## 6. Test Vectors

### Unit Tests
- [ ] `matchesTagFilters` — include/exclude logic
- [ ] `personalizeMessage` — {client_name} replaced
- [ ] `personalizeMessage` — missing variable
- [ ] `buildTargetUrl` — ?serviceId= appended
- [ ] `generateShortCode` — 6-char uniqueness
- [ ] `matchesTagFilters` — empty tags → match all
- [ ] `matchesTagFilters` — AND vs OR logic

### Integration Tests
- [ ] Create broadcast → INSERT + recipients generated
- [ ] Send broadcast → orchestrator called per recipient
- [ ] Short link click → clicks++ → redirect
- [ ] Phone discount: insert → match at booking → use
- [ ] Phone discount: expired → not used

### E2E Tests
- [ ] Story Generator: load free slots → preview → export JPEG
- [ ] Broadcast editor: create message
- [ ] Broadcast editor: filter recipients by tag
- [ ] Broadcast editor: preview recipient count
- [ ] Broadcast: send → history shows sent
- [ ] Broadcast detail: per-client delivery status
- [ ] Short link: click → redirect to master page
- [ ] Short link: click count increments

### Security Tests
- [ ] Master A cannot see Master B's broadcasts
- [ ] Auth required for marketing pages
- [ ] Short link: only valid codes redirect

---

## 7. File Inventory

### Pages
- `src/app/(master)/dashboard/marketing/page.tsx`
- `src/app/(master)/dashboard/marketing/actions.ts`
- `src/app/(master)/dashboard/marketing/new/page.tsx`
- `src/app/(master)/dashboard/marketing/[id]/page.tsx`

### Components
- `src/components/master/marketing/StoryGenerator.tsx`
- `src/components/master/marketing/BroadcastEditor.tsx`
- `src/components/master/marketing/BroadcastHistory.tsx`
- `src/components/master/marketing/BroadcastDetailPage.tsx`

### Lib
- `src/lib/utils/broadcastUtils.ts`
- `src/lib/actions/UrlActionBus.ts` (marketing:broadcast action)

### DB Tables
- `broadcasts`
- `broadcast_recipients`
- `broadcast_links`
- `phone_discounts`

### Existing Tests
- `src/lib/utils/broadcastUtils.test.ts` (8+ tests)
- `e2e/tests/18-marketing-broadcasts.spec.ts`
