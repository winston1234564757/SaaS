
DIRECTIVE: PLAN APPROVED & BENTO UI SPECIFICATIONS
ROLE: Principal UX/UI Engineer & Next.js Architect.
CONTEXT: The implementation plan is APPROVED. We are proceeding with the URL-driven drawer architecture. Here are the definitive answers to your Open Questions, specifically focusing on a "Golden Mean" approach for information density (Smart Progressive Disclosure).
DIRECTIVE & RESOLUTIONS:
1. Libraries (nuqs vs vaul):
• YES, install nuqs (npm install nuqs). It is our standard for Next.js URL search param state management. Use it for controlling the drawer states (e.g., ?drawer=flash_deals).
• NO, do not install vaul or any new drawer primitives. Strictly use our existing <DashboardDrawer> (for desktop) and <BottomSheet> (for mobile) components currently found in src/components/ui/. Wire their isOpen state to the nuqs URL parameter.
2. Navigation Icons (Lucide-React):
• Sidebar/Bottom Nav: Use Wallet for Revenue Hub, and Rocket for Growth Hub.
• Inside the Bento Cards: Use Zap (Flash Deals), BadgePercent (Dynamic Pricing), Gift (Loyalty), Users (Referrals), and Network (Partners).
3. Bento Card Content (The "Golden Mean"):
• We want high functionality but clean mobile aesthetics. Do NOT render full lists, complex tables, or multiple interactive toggles inside the Bento cards.
• Card Anatomy:
• Header: Subtle icon (Lucide) and the feature title (e.g., "Flash Deals").
• Body: The primary metric in large, bold typography (e.g., "2 Active" or "+15%").
• Micro-Context: A subtle status badge (e.g., a green dot), a tiny sparkline, or a short text hint (e.g., "Ends in 4h" or "Weekend rule ON").
• Interaction: The ENTIRE card must act as the clickable trigger. When tapped, it updates the URL via nuqs, which seamlessly slides out the corresponding Drawer/Sheet containing the actual complex forms and lists.
EXECUTE: 1. Run npm install nuqs.
2. Implement the Revenue Hub (/dashboard/revenue/page.tsx) and the reusable BentoCard.tsx component using these specifications.
3. Wire up the Flash Deals and Dynamic Pricing views inside the existing Drawer/Sheet components driven by the URL.
4. Show me the code for the main Hub page and the Bento Card.
