🚨 GLOBAL RESILIENCE DIRECTIVE: AGGRESSIVE WAKE-UP FOR WEB & PWA (RUFLO SWARM) 🚨

STATUS: Both standard browser tabs (Web App) and the PWA are completely dying after being placed in the background. When the OS or browser suspends the tab and later resumes it, the Supabase token is dead, and React Query deadlocks with infinite skeletons. We need a universal, aggressive "Force Soft-Reload" upon waking up that applies to ALL environments (Web and PWA).

SWARM MISSION (Coder & Architect):
Do not use native editing. Use your Ruflo MCP tool to implement a bulletproof global visibilitychange and focus listener that acts as a defibrillator for the app.

IMPLEMENTATION REQUIREMENTS:

Universal Wake-Up Hook: Go to src/lib/providers/QueryProvider.tsx (or the relevant sleep/wake hook). This logic MUST apply globally to the web app, not just in standalone PWA mode.

Time Tracking: Track the exact timestamp when document.visibilityState === 'hidden'.

The Wake-Up Threshold (1 MINUTE): When the state changes back to 'visible', calculate the elapsed time. If the app was sleeping for more than 1 minute (60,000 ms), trigger the Aggressive Wake-Up sequence.

Aggressive Wake-Up Sequence:

Step 1: Force a network request to renew the token: await supabase.auth.refreshSession().

Step 2: Violently wipe the React Query error states and force a refetch of all active data: queryClient.resetQueries({ type: 'active' }).

Step 3 (Fallback): If refreshSession() throws a fatal error (meaning the user's session is completely unrecoverable), ONLY THEN use window.location.reload() to hard-reset the app.

Debounce/Lock: Ensure this logic is debounced or locked by a ref so it doesn't fire multiple times if the user switches tabs rapidly.

ACTION: Deploy the Swarm, inject this 1-minute aggressive wake-up logic for all environments, and confirm when it's done.