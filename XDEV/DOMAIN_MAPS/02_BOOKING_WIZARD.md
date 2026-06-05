# 02 — Booking Wizard Domain Map

## 1. Domain Overview

Booking Wizard — багатокроковий інтерфейс запису клієнта до майстра. Підтримує guest flow (без реєстрації), multi-service booking, товари в записі, Smart Slots Engine та Dynamic Pricing.

### Key Files
- `src/components/shared/BookingWizard.tsx` — Main wizard (4-step)
- `src/components/shared/wizard/ServiceSelector.tsx` — Service picker
- `src/components/shared/wizard/DateTimePicker.tsx` — Calendar + slots
- `src/components/shared/wizard/ProductCart.tsx` — Product selection
- `src/components/shared/wizard/ClientDetails.tsx` — Name/phone/notes + price
- `src/components/shared/wizard/BookingSuccess.tsx` — Confirmation
- `src/components/shared/wizard/useBookingWizardState.ts` — State management
- `src/components/shared/wizard/useBookingPricing.ts` — Price computation
- `src/components/shared/wizard/useBookingScheduleData.ts` — Slot fetching
- `src/components/shared/wizard/types.ts` — Types
- `src/components/public/BookingFlow.tsx` — Public page adapter
- `src/lib/actions/createBooking.ts` — Booking creation SA (26KB)
- `src/lib/actions/computeBookingPrice.ts` — Price computation SA
- `src/lib/utils/smartSlots.ts` — Fluid Anchor algorithm
- `src/lib/utils/dynamicPricing.ts` — Dynamic pricing engine
- `src/lib/utils/bookingEngine.ts` — Booking utility functions
- `src/lib/validations/booking.ts` — Zod schemas
- `src/lib/hooks/useBookingPrices.ts` — Client-side price hook

### DB Tables
- `bookings` — Main booking record
- `booking_services` — Multi-service line items
- `booking_products` — Products in booking
- `services` — Master's services catalog
- `products` — Master's product catalog
- `schedule_templates` — Working hours template
- `schedule_exceptions` — Blocked dates
- `master_time_off` — Vacations/time-off
- `flash_deals` — Flash deal inventory
- `phone_discounts` — Phone-bound discounts
- `client_master_relations` — Client relationship data
- `loyalty_programs` — Loyalty program config
- `c2c_referrals` — C2C referral tracking

---

## 2. State Machine

### 2.1 Booking Wizard Flow

```
[INIT] → mode check (client/master)
  → STEP 1: SERVICE_SELECT
    → select service(s) → validate duration → navigate to STEP 2
  → STEP 2: DATE_TIME
    → fetch slots via useBookingScheduleData
    → select date → select time slot → navigate to STEP 3
  → STEP 3: PRODUCTS (optional)
    → browse products → add to cart → navigate to STEP 4
  → STEP 4: CLIENT_DETAILS
    → name/phone/notes → compute price → [CONFIRM]
      → createBooking server action
        → [SUCCESS] → BookingSuccess
          → guest → PostBookingAuth
          → auth → C2C share link
        → [ERROR] → show error → retry
```

### 2.2 Wizard-Level States

| State | Description | UI |
|---|---|---|
| INIT | Wizard opened, loading config | Skeleton |
| READY | Config loaded, service selection | Service list |
| SERVICE_SELECTING | User browsing services | Service cards |
| SERVICE_SELECTED | Service(s) chosen | Next button enabled |
| DATE_TIME | Calendar + slots rendered | Calendar grid |
| SLOT_SELECTED | Time chosen | Next button enabled |
| PRODUCT_BROWSING | Product catalog | Product grid |
| PRODUCT_SELECTED | Product(s) in cart | Cart badge |
| DETAILS | Client info form | Name/phone/notes/price |
| PRICE_COMPUTING | API call for price | Loading on price |
| PRICE_READY | Price computed | Show breakdown |
| SUBMITTING | createBooking API call | Full-screen loading |
| SUCCESS | Booking created | Confirmation UI |
| ERROR | Any API/validation error | Error toast/message |
| CLOSED | Wizard dismissed | — |

### 2.3 Smart Slots Engine States

Input: `masterId`, `date`, `service duration`, `working_hours`, `time_off`, `existing_bookings`

```
[LOAD_SCHEDULE] → fetch working_hours + exceptions + time_off + bookings
  → [GENERATE_SLOTS] → generateAvailableSlots(
      workingHours, existingBookings, duration, timeOff, services
    )
    → Fluid Anchor algorithm
      → snap slots to boundaries (breaks, start/end)
      → remove overlapping with existing bookings
      → remove slots in time-off / vacation
      → remove slots that exceed working hours
    → [SLOTS_READY] → scoreSlots(
        slots, pricingRules, dynamicPricingRules
      )
      → score each slot (peak = low score, off-peak = high)
      → label with dynamic price labels
    → [RENDER] → buildSlotRenderItems(slots, date)
```

**States:**
- LOADING — schedule data fetching
- COMPUTING — algorithm running
- READY — slots displayed
- EMPTY — no available slots (fully booked / day off / holiday)
- ERROR — schedule fetch failed
- ALL_DAY_FULL — every slot taken
- PARTIALLY_AVAILABLE — some slots free, some booked

**Edge Cases:**
- Midnight crossing (service ends next day)
- Multiple services stacking (total duration = sum)
- Break in middle of day (Fluid Anchor snap)
- Whole day off (vacation)
- Partial day off (half-day schedule)
- Daylight saving time transition
- Timezone mismatch (server UTC vs client Kyiv)
- 30-min slot overlap with 45-min service
- Duration exceeds remaining working hours
- Booking at exactly closing time (should be rejected)
- Buffer between bookings (per master config)

### 2.4 Dynamic Pricing States

```
[COMPUTE] → calculateDynamicPrice(basePrice, rules, slotDateTime)
  → check slot against rules:
    → peak_hours (mon-fri 17:00-20:00) → +MARKUP
    → early_bird (before 10:00) → -DISCOUNT
    → last_minute (within 2h) → -DISCOUNT
    → holiday → +MARKUP
    → low_season → -DISCOUNT
  → APPLY_FLOOR_CEIL:
    → floor: -30% of base
    → ceil: +50% of base
  → [LABEL] → return price + label ("Піковий час", "Early Bird", etc.)
```

**States:**
- BASE_PRICE — no rules apply
- MARKED_UP — peak time / holiday
- DISCOUNTED — early bird / last minute / low season
- FLOORED — hit -30% floor
- CEILED — hit +50% ceiling
- MULTI_RULE — multiple rules apply (stack?)
- LABELED — has dynamic pricing label

**Edge Cases:**
- Multiple rules conflict (peak + holiday → double markup?)
- Dynamic price + flash deal overlap
- Dynamic price + C2C referral overlap
- Dynamic price + loyalty discount stacking order
- Price below cost (floor only, no business rule to prevent)
- Price changes between price computation and booking creation

### 2.5 Price Computation States

```
computeBookingPrice(input):
  → base = sum(service prices * dynamic factors)
  → flash_deal → replace service price
  → c2c_discount → apply % off
  → phone_discount → apply % off (from broadcast)
  → loyalty_discount → apply % or points
  → total = base - all discounts
  → return { total_kopecks, breakdown, labels }
```

**States:**
- BASE_ONLY — no discounts
- FLASH_DEAL — flash deal applied
- C2C_DISCOUNT — friend referral
- PHONE_DISCOUNT — broadcast phone-bound discount
- LOYALTY — loyalty points/tier
- MULTI_STACK — multiple discounts combined
- NEGATIVE_EDGE — discounts exceed total (floor at 0)

### 2.6 Booking Creation States

```
createBooking(payload):
  → VALIDATE → Zod schema
  → CHECK_LIMIT → Starter = 40 bookings/month
  → CHECK_CONFLICT → slot still available?
  → COMPUTE_PRICE → fresh price computation
  → INSERT booking + booking_services + booking_products
  → NOTIFY → NotificationOrchestrator (booking_created)
  → LINK_GUEST → if guest, store anonymous link
  → RETURN → { bookingId, totalPrice, status }
```

**States:**
- VALIDATING — Zod check
- LIMIT_CHECK — Starter plan limit
- CONFLICT_CHECK — Slot double-booked
- PRICE_REFRESH — Fresh compute
- INSERTING — DB transaction
- NOTIFYING — Orchestrator send
- SUCCESS — Created
- STARTER_LIMIT_EXCEEDED — 40 booking/month hit
- SLOT_TAKEN — Race: someone else booked
- PRICE_CHANGED — Price differs from quote
- VALIDATION_ERROR — Zod failed
- DB_ERROR — Constraint violation

---

## 3. Environment Matrix

| Environment | Wizard Behavior |
|---|---|
| Desktop (≥1024px) | `MicaModal` centered |
| Mobile (<1024px) | `BottomSheet` full screen |
| Tablet (768-1023px) | BottomSheet or modal? |
| PWA standalone | Full-screen bottom sheet |
| Slow network (3G) | Loading skeletons, long slot fetch |
| Offline | Cannot book |

### Role Variants
| Role | Mode | Features |
|---|---|---|
| Master (own dashboard) | `mode="master"` | Manual booking, no auth, health notes visible |
| Client (public page) | `mode="client"` | Guest OTP, C2C, loyalty, discounts |
| Guest (no session) | `mode="client"` + Guest | PostBookingAuth required post-booking |

### Theme Variants
| Theme | Wizard Style |
|---|---|
| Blossom | Warm taupe tones |
| Studio | Dark teal + gold |
| Frost | Lavender + slate |

---

## 4. Load & Concurrency Vectors

| Vector | Risk | Mitigation |
|---|---|---|
| Double booking same slot | Two clients book last slot | Conflict check at insert time |
| Concurrent price compute | Stale price → wrong total | Fresh compute at creation |
| Starter limit concurrent | Two requests, 39→40→41 | Atomic counter or check after insert |
| Flash deal depletion | Two clients grab last flash slot | Atomic flash_deal booking check |
| Slot generation CPU | Heavy algorithm on many slots | Client-side generation from cached schedule |

---

## 5. Data Variations

| Variation | Effect |
|---|---|
| No services configured | Empty state at step 1 |
| No available slots | Empty state at step 2 |
| No products for sale | Skip step 3 (no ProductCart) |
| Single service only | Direct to step 2 |
| Maximum services (10+) | Scroll, visual overload |
| Service duration 15 min | Many slots generated |
| Service duration 4h | Few slots, may span breaks |
| Price 0 (free service) | "Безкоштовно" label |
| Price 1,000,000+ kopecks | Large number formatting |
| Flash deal + C2C + phone discount | Triple discount stack |
| C2C eligibility expired | No discount shown |
| Phone discount expired | No discount shown |
| Master at Starter plan, 40/40 | Block booking, upgrade prompt |
| Master at Starter plan, 39/40 | Allow last booking |
| Booking in past date | Rejected by validation |
| Booking too far future (>3 months?) | Configurable cutoff? |
| Client has no phone | Required at step 4 |
| Client has medical notes | Safety alert shown (master mode) |

---

## 6. Test Vectors

### Unit Tests
- [ ] `generateAvailableSlots` — basic schedule → slots
- [ ] `generateAvailableSlots` — with breaks → Fluid Anchor
- [ ] `generateAvailableSlots` — vacation overlap → no slots
- [ ] `generateAvailableSlots` — multi-service → chain slots
- [ ] `scoreSlots` — peak hours → lower score
- [ ] `scoreSlots` — early bird → higher score
- [ ] `calculateDynamicPrice` — base → no change
- [ ] `calculateDynamicPrice` — markup → +50% ceiling
- [ ] `calculateDynamicPrice` — discount → -30% floor
- [ ] `calculateDynamicPrice` — multi-rule → stack order
- [ ] `computeBookingTotals` — single service
- [ ] `computeBookingTotals` — multi-service + products
- [ ] `computeBookingTotals` — all discount types
- [ ] `buildBookedTimeSet` — existing bookings → set
- [ ] `buildOffDaySet` — vacation/exceptions → set
- [ ] Zod validation — valid payload → pass
- [ ] Zod validation — missing fields → fail
- [ ] Zod validation — past date → fail

### Integration Tests
- [ ] `computeBookingPrice` server action → correct price
- [ ] `computeBookingPrice` with flash deal → replaced price
- [ ] `computeBookingPrice` with C2C → discount applied
- [ ] `computeBookingPrice` with phone discount → discount
- [ ] `computeBookingPrice` stack order verification
- [ ] `createBooking` → INSERT + notify
- [ ] `createBooking` — slot conflict → error
- [ ] `createBooking` — Starter limit → block
- [ ] `createBooking` — guest → anonymous link

### E2E Tests
- [ ] Full booking flow: public page → select service → pick date → add product → enter details → success
- [ ] Booking with flash deal → discounted price
- [ ] Booking with C2C referral → friend discount
- [ ] Multi-service booking (2+ services)
- [ ] Booking with product add-on
- [ ] Booking when no slots available → empty state
- [ ] Booking when no services → empty state
- [ ] Booking at Starter limit → upgrade prompt
- [ ] Guest booking → PostBookingAuth appears
- [ ] Master manual booking from dashboard
- [ ] Booking cancellation after creation
- [ ] Reschedule booking

### Security Tests
- [ ] Price tampering (modify payload) → server re-computes
- [ ] C2C referral code reuse → blocked
- [ ] Flash deal code reuse → blocked
- [ ] Guest booking without OTP → blocked

---

## 7. File Inventory

### Wizard Components
- `src/components/shared/BookingWizard.tsx`
- `src/components/shared/wizard/ServiceSelector.tsx`
- `src/components/shared/wizard/DateTimePicker.tsx`
- `src/components/shared/wizard/ProductCart.tsx`
- `src/components/shared/wizard/ClientDetails.tsx`
- `src/components/shared/wizard/BookingSuccess.tsx`
- `src/components/shared/wizard/PushPrompt.tsx`
- `src/components/shared/wizard/useBookingWizardState.ts`
- `src/components/shared/wizard/useBookingPricing.ts`
- `src/components/shared/wizard/useBookingScheduleData.ts`
- `src/components/shared/wizard/types.ts`
- `src/components/public/BookingFlow.tsx`

### Server Actions & Lib
- `src/lib/actions/createBooking.ts`
- `src/lib/actions/computeBookingPrice.ts`
- `src/lib/utils/smartSlots.ts`
- `src/lib/utils/dynamicPricing.ts`
- `src/lib/utils/bookingEngine.ts`
- `src/lib/validations/booking.ts`
- `src/lib/hooks/useBookingPrices.ts`

### Existing Tests
- `src/lib/utils/smartSlots.test.ts` (15+ tests)
- `src/lib/utils/dynamicPricing.test.ts` (10+ tests)
