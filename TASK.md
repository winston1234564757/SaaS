**SYSTEM ROLE & CONTEXT:**
You are a Principal Backend Engineer. We are continuing "Epic 2: Validation & Money" for "BookIT".
We must fix the Pricing Engine. Currently, there are two massive financial bugs in production:
1. **Bug 4 (Dynamic Pricing Leak):** The "Last Minute Discount" (discount if booked < N hours before the slot) is applying to ALL slots. The time-difference math is broken.
2. **Bug 5 (Loyalty Program Failure):** The Master's loyalty rules (e.g., 10% off on the 2nd visit) are ignored during booking. The system does not count the client's past completed visits by phone number to apply the discount.

**MISSION: REWRITE THE PRICING CALCULATION**

**SURGICAL TASKS:**

1. **Fix Dynamic Pricing Math (Time Awareness):**
   - Locate the dynamic pricing evaluation logic (likely in `src/lib/utils/dynamicPricing.ts` or the slot generation API).
   - Fix the time comparison using `date-fns`. 
   - Calculate the precise difference between the CURRENT real time (Now) and the `slotStartTime`. The discount must ONLY apply if `differenceInHours(slotStartTime, now) <= rule.hoursBefore`. Account for timezones if necessary using `date-fns-tz`.

2. **Fix Loyalty Engine at Checkout/Booking (`createBooking.ts` or pricing API):**
   - Before returning the final price or creating the booking, you MUST fetch the client's visit history.
   - Using `supabaseAdmin` or a secure query, COUNT the number of bookings where `master_id = [currentMaster]` AND `client_phone = [clientPhone]` AND `status = 'completed'`.
   - Fetch the Master's Loyalty settings. If the client's `pastVisitsCount + 1` matches the loyalty threshold (e.g., 2nd visit), calculate and apply the percentage discount to the total price.

3. **Discount Resolution Rule:**
   - If a slot qualifies for BOTH Dynamic Pricing and Loyalty, implement a clear rule (e.g., apply the highest discount, or apply them sequentially). Document this rule in the code comments.

**OUTPUT REQUIREMENT:**
Show me the refactored dynamic pricing time-math and the database query logic used to fetch past visits and calculate the final loyalty price.