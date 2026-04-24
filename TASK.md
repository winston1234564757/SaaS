SYSTEM OVERRIDE: FLASH DEAL BOOKING FLOW & DATE FORMATTING FIX
[AGENT ASSIGNMENT: CLAUDE CODE (STATE MANAGEMENT & UI LOGIC)]

The Principal Architect has reported critical bugs in the public-facing Flash Deal flow. The date formatting is broken (undefined month), and clicking the Flash Deal button triggers the standard booking flow instead of locking the user into the specific deal parameters. This defeats the entire business purpose of Flash Deals.

IMMEDIATE ACTIONS:

1. Fix Date Formatting (undefined bug):

Locate the component rendering the Flash Deal card on the public page (likely FlashDealCard.tsx or inside PublicBookingPage.tsx).

The current output is 4 undefined о 09:30.

Fix: Use date-fns with the Ukrainian locale properly.

TypeScript
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
// Example implementation:
const formattedDate = format(new Date(deal.date), "d MMMM 'о' HH:mm", { locale: uk });
2. Implement Flash Deal Fast-Track Flow (State Hydration):

Locate the onClick handler for the "Записатися за акцією" button.

Currently, it merely opens the booking modal/page without context.

Fix: You must inject the deal's exact parameters into the booking state (e.g., Zustand store, React Context, or URL params) and fast-forward the wizard.

The execution flow upon clicking the button MUST be:

Set the selected Service to deal.service_id.

Set the selected Date to deal.date.

Set the selected Time to deal.start_time.

Advance the booking wizard's step directly to the Final/Client Details step (skipping Service, Date, and Time selection screens).

Optional but recommended: Set a flash_deal_id flag in the state so the final payload to createBooking includes the deal reference.

3. Lock the State:

Ensure that when the user is in this "Fast-Track" flow, if they click "Back" inside the wizard, it warns them or clears the deal state, so they don't accidentally book a different time with the deal's discount.

4. Agent Sync:

Append "Bugfix: Flash Deal fast-track booking flow & date locale fixes" to the BOOKIT.md Changelog.

Execute this logic repair immediately. A Flash Deal is a strict constraint, not a generic discount coupon. Confirm when the exact state overrides are implemented.