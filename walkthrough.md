**FEEDBACK ON YOUR PLAN:**

Your analysis is spot on. You correctly identified the financial vulnerabilities (timezone mismatch and lack of backend validation).

**ANSWERS TO OPEN QUESTIONS:**

1. **Discount Combination:** APPROVED. The sequence is excellent for business logic:
   - Step 1: Apply `Dynamic Pricing` ONLY to the specific service price.
   - Step 2: Add Product prices (if any) to get the Subtotal.
   - Step 3: Apply `Loyalty` (and/or Flash Deal) to the Subtotal.
   This encourages retail sales while dynamically filling slots.

2. **Safety Limit (Discount Cap):** YES. Implement a strict MAXIMUM TOTAL DISCOUNT of 40%.
   - Rule: Regardless of how many discounts stack (Dynamic + Loyalty + Flash), the `Final Price` MUST NEVER be less than `Original Total * 0.60`.
   - Enforce this cap at the very end of the pricing calculation engine.

3. **Timezone Strategy:** Do NOT completely hardcode it without an escape hatch. 
   - You must pass or fetch the `masterTimezone` from the Master's settings/profile context. 
   - If (and only if) it's missing or undefined, strictly fallback to `Europe/Kyiv`. This makes our SaaS scalable for other countries while fixing the immediate Vercel UTC bug for the current market.

**EXECUTION INSTRUCTIONS:**
Proceed immediately with rewriting the Pricing Engine. 
1. Fix the time-math using `date-fns-tz`.
2. Implement the strict backend Loyalty count check in the booking action.
3. Implement the 40% max discount cap.
Output the core pricing calculation function so I can review the math and the discount cap logic.