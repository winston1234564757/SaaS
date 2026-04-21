SYSTEM OVERRIDE: LOYALTY TIER SYSTEM & MULTIPLE PROGRAMS
[AGENT ASSIGNMENT: CLAUDE CODE (HEAVY ARTILLERY)]

The Principal Architect has corrected a fundamental flaw in the Loyalty Engine business logic. This is NOT a cyclical "punch-card" system (e.g., every 15th visit). It is a Tier/Status System (e.g., a permanent discount applied to ALL visits starting from the 15th). Also, a master can have MULTIPLE active tiers (e.g., Tier 1 at 5 visits, Tier 2 at 15 visits).

IMMEDIATE ACTIONS (Target: app/[slug]/page.tsx & LoyaltyWidget.tsx):

1. Smart Tier Calculation (Data Layer):

Fetch ALL active loyalty_programs for the master. Sort them by visits_required ASCENDING.

Get the client's currentVisits from client_master_relations (default 0 if unauth).

Calculate the currentTier (highest tier where visits_required <= currentVisits).

Calculate the nextTier (first tier where visits_required > currentVisits).

2. Update Copy & Logic (Output Layer):
Modify the <LoyaltyWidget> to accept the computed tiers and update the text strictly to reflect the "Permanent Status" model:

Unauth State (Marketing): Show the first (lowest) tier.

Text: "Знижка [X]% на всі візити, починаючи з [N]-го."

Auth State (Progress towards next tier): If currentVisits < nextTier.visits_required.

Text: "Ще [N - currentVisits] візитів до постійної знижки [X]%."

(If they already have a currentTier, add a badge/text: "Ваша поточна знижка: [Y]%").

Auth State (Max Tier Reached): If there is no nextTier (they hit the cap).

Text: "Ви досягли максимального рівня! Ваша постійна знижка: [X]%."

The progress bar should be full.

3. Agent Sync: - Append this Tier System logic update to the BOOKIT.md Changelog.

Execute this logic update. The component must gracefully handle cases where the master has 1, 2, or 5 active loyalty programs by always targeting the user's next immediate threshold. Confirm when done.

PART 2
DIAGNOSIS: 1. Server-side auth checking in app/[slug]/page.tsx is failing or returning null.
2. The client_master_relations query is failing or missing.
3. The Tier Calculation logic does not handle currentVisits > maxTier correctly, causing a fallback to 0 or incorrect states.

IMMEDIATE ACTIONS:

1. Bulletproof Server Auth & Data Fetching (app/[slug]/page.tsx):

Ensure you are using the correct SSR Supabase client (e.g., import { createClient } from '@/lib/supabase/server' or however your SSR client is structured).

Await supabase.auth.getUser().

If user exists, query client_master_relations explicitly:
SELECT total_visits FROM client_master_relations WHERE client_id = user.id AND master_id = master.id.

Extract currentVisits securely (fallback to 0 if no row exists).

2. Fix Tier Calculation Logic (LoyaltyWidget.tsx or the data prep function):

You must handle the "Max Tier Reached" state.

If currentVisits is GREATER THAN OR EQUAL TO the highest visits_required in the master's active programs:

Do NOT show 0 / 15.

Do NOT show a progress bar.

Set a maxReached boolean to true.

Display UI text: "Ви досягли максимального рівня! Ваша постійна знижка: [Max Reward]%." (Ensure Antigravity's UI accommodates this gracefully, perhaps showing a full progress bar or a golden badge).

If currentVisits is LESS than the highest tier, correctly find the current tier and the next tier, and display the progress: currentVisits / nextTier.visits_required.

3. Agent Sync: Append this critical bug fix to the BOOKIT.md Changelog.

Execute this fix immediately. Output the updated fetching logic and the corrected calculation logic.