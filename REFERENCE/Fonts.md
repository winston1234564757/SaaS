[STRICT TYPOGRAPHY CONTRACT: LUXURY MINIMALISM]
Define typography tokens exactly as follows, with no aesthetic compromises:

1. font-accent (Great Vibes):
   - Usage: ONLY for h1 tags that are emotional/greetings and STRICTLY <= 2 words.
   - Core Classes: `font-accent font-normal text-4xl leading-loose normal-case tracking-normal animate-fade-in`
   - STRICT PROHIBITION: Never apply `uppercase`, `font-bold`, or use for system-heavy screen names.

2. font-serif (Cormorant Garamond):
   - Usage: For h2/subtitles and fallback h1 elements that exceed 2 words.
   - Core Classes: `font-serif tracking-widest uppercase font-medium text-sm text-muted-foreground leading-none`

3. font-sans (Geist Sans):
   - Usage: 95% of the operational UI. Tables, booking slots, schedule calendar, pricing digits, form controls.
   - Core Classes for Data: `font-sans antialiased text-sm font-normal tabular-nums tracking-normal`

[FAIL-FAST DIRECTION]
If any script auto-generates font-accent (Great Vibes) for an input label, button text, table cell, or digital price container — STOP IMMEDIATELY and prompt the user for validation. This is a critical interface failure.



