SYSTEM OVERRIDE: STORY GENERATOR BUGFIXES & SLOT LOGIC REWRITE
[AGENT ASSIGNMENT: CLAUDE CODE (DEBUGGING & ALGORITHMS)]

The Principal Architect has identified three critical bugs in the StoryGenerator and slot calculation logic. These must be fixed immediately to make the feature production-ready.

IMMEDIATE ACTIONS:

1. Fix Export Failure (CORS & Next.js Image Conflict):

Issue: html-to-image fails silently. This is usually caused by cross-origin avatars or Next.js <Image> components inside the exportable ref.

Solution: - Update the html-to-image options to include { useCORS: true, allowTaint: true }.

Ensure the avatar image inside the preview canvas uses a standard HTML <img> tag with crossOrigin="anonymous", NOT the next/image component.

Wrap the export logic in a try/catch block and display a toast.error with the actual error message if it fails, and toast.success when downloaded.

2. Prevent "Time Travel" (Past Slots):

Issue: Generating slots for "today" includes times that have already passed (e.g., showing a 09:00 slot when it's 19:00).

Solution: In the slot generation utility/function, add a check: if selectedDate is today, filter out any slots where the slot's start time is less than or equal to new Date().

3. Rewrite Slot Calculation (Fluid Anchors vs. Fixed Grid):

Issue: The algorithm is using a fixed grid from the start of the day. If a step (e.g., 80 mins) lands inside a break (13:00-14:30), it skips that grid point and jumps to the next valid one (e.g., 15:40), leaving a massive empty gap from 14:30 to 15:40.

Solution: The slot generation must use a "Fluid Anchor" approach.

Loop through the working hours. Let currentTime = dayStart.

If currentTime to currentTime + serviceDuration overlaps with a break or existing booking, DO NOT just increment by the standard step.

Instead, snap/fast-forward currentTime to the exact endTime of that break or booking.

Example: Service 50m + Buffer 30m. Slot 11:40 ends at 13:00. Break is 13:00-14:30. The loop should jump currentTime to exactly 14:30, making the next available slot 14:30 (not 15:40).

4. Agent Sync:

Test the logic conceptually.

Apply the fixes to StoryGenerator.tsx and the underlying slot generation utility (e.g., src/lib/slots.ts or wherever it resides).

Append "Bugfixes: Story Generator Export, Time Travel prevention, and Fluid Anchor slot logic" to BOOKIT.md.

Execute these fixes with absolute precision. No half-measures. Confirm when done.