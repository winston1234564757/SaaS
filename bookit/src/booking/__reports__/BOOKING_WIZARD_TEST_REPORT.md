# Booking Wizard Domain — Test Report

**Date:** 2026-06-05
**Status:** ✅ 90/90 passed (4 files, 0 failed)
**Duration:** 5.19s

---

## Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `src/lib/actions/__tests__/createBooking.test.ts` | 25 | Discount resolution engine (7.6), bookingClientSchema, phone transform |
| `src/lib/utils/bookingEngine.test.ts` | 23 | computeEndTime, buildBookedTimeSet, buildOffDaySet, computeBookingTotals |
| `src/lib/utils/smartSlots.test.ts` | 30 | Slot generation (existing) — basic, overlaps, buffer, breaks, scoring |
| `src/lib/utils/dynamicPricing.test.ts` | 12 | Peak/Quiet/EarlyBird/LastMinute, stacking, limits (existing) |

---

## Key Tested Logic

### Discount Resolution (createBooking 7.6)
- Basic: no discounts → full price
- Dynamic pricing: markup vs discount separation
- **40% safety cap** on non-C2C discounts
- **C2C friend discount** — поверх cap, не входить в обмеження
- **Stacking order**: markup → cap(dynamicDiscount + loyalty + flash + phone) → C2C friend → C2C bonus → barter override
- **Barter override** — заміняє всю попередню калькуляцію
- Edge: discount > total → 0

### bookingClientSchema
- Phone transform: `050XXXXXXX` → `+380XXXXXXX`, `8050XXXXXXX` → `+380XXXXXXX`
- Strip non-digits from international format
- Refine rejects non-`+380` numbers
- Name: Cyrillic only, min 2 chars

### bookingEngine
- computeEndTime: basic, cap at 23:59
- buildBookedTimeSet: 30-min step iteration, end_time excluded
- buildOffDaySet: weekday matching, exception dates
- computeBookingTotals: services + products, discount%, dynamic pricing

---

## Coverage Gaps
- **createBooking full orchestration** — requires DB mocks (Supabase, auth)
- **Starter 40/month limit** — DB-dependent
- **Flash deal verification** — DB-dependent
- **C2C 5-condition validation** — DB-dependent
- **Stock atomic decrement** — DB-dependent
- **Barter promocode** — DB-dependent

---

## File Locations
```
src/lib/actions/__tests__/createBooking.test.ts
src/lib/utils/bookingEngine.test.ts
src/lib/utils/smartSlots.test.ts
src/lib/utils/dynamicPricing.test.ts
```
