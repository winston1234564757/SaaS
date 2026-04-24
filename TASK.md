ROLE: Senior Fullstack Developer & Compliance Architect.
CONTEXT: We need to link the legal documents (public-offer, terms-of-service, privacy-policy, refund-policy) across the entire "BookIT" platform: Landing, Master Dashboard, and Client Dashboard.

GOAL: Implement legally binding access points and ensure UI consistency.

IMMEDIATE ACTIONS:

Centralize Constants:

Create src/lib/constants/legal.ts containing the slugs and names of all legal documents to avoid hardcoding URLs everywhere.

Shared UI Component:

Create src/components/shared/LegalFooterLinks.tsx — a clean, minimalist list of links that will be used in:

The main Landing Page footer.

The Master Dashboard (under "Settings" or "More").

The Client Dashboard (in the profile/sidebar).

Registration & Payment Hardening:

RegisterForm: Ensure the mandatory checkbox links to /legal/terms-of-service and /legal/public-offer.

Checkout UI: In BillingPage.tsx (Master), add a notice under the payment buttons: "Здійснюючи оплату, ви погоджуєтесь з умовами [Публічної оферти] та [Правил повернення коштів]".

Database Traceability (Crucial):

Update the registration Server Action (src/app/(auth)/register/actions.ts).

When a new master/client is created, set a hidden field in metadata or a new column legal_acceptance with the current date and document versions.

SEO & Indexing:

Ensure legal pages have robots: "noindex, follow" (we want them reachable but not necessarily polluting search results unless someone looks for them).

CONSTRAINTS:

Links must open in a new tab (target="_blank").

Design: Minimalist, semi-transparent text in footers, clear and accessible in dashboards.

Use the dynamic route /legal/[slug] implemented earlier.

DOCUMENTATION: Update bookit/BOOKIT.md confirming the placement of legal links in all 3 entry points (Landing, Master, Client).