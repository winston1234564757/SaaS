# CRM Analytics Redesign (BookIT v8.4)

## 🎯 Context
We refactored and completely redesigned the BookIT CRM Analytics page (`/dashboard/analytics`). The page was transformed from a slow, query-waterfall 990+ LOC monolith into a clean, modular page orchestrator utilizing a unified high-performance PostgreSQL RPC (`get_analytics_extras`), responsive Bento structures, custom interactive SVG charts, and lazy-loaded drill-down analytics tabs.

## 🛠️ Key Technical Decisions & Architectures

### 1. Unified Analytics RPC Aggregator
To eliminate client-side watermarks, RLS bottlenecks, and parallel network round-trips, we defined a consolidation migration [20260605000000_analytics_system.sql](file:///C:/Users/Vitos/SaaS/bookit/supabase/migrations/20260605000000_analytics_system.sql).
- **Functions:**
  - `get_occupancy_heatmap`: Computes hourly occupancy percentages per day of the week.
  - `get_cohort_retention`: Evaluates monthly new client cohort sizes and subsequent return rates.
  - `get_ltv_concentration`: Evaluates customer lifetime value deciles and outputs high-value winback candidates.
  - `get_dynamic_pricing_uplift`: Evaluates smart pricing rules utilization and absolute ROI.
  - `get_anomaly_alerts`: Standard deviation deviations detector identifying future days with low occupancy.
  - `get_service_pairing`: Tracks services booked together for cross-selling opportunities.
- **Orchestrator RPC:** `get_analytics_extras` queries and constructs a single unified JSONB object based on active date range and the master's subscription tier.

### 2. URL State Synchronization via nuqs
Instead of local state modals, we integrated the sliding pill-shaped tab switcher synchronized with the browser address bar via `useQueryState`:
- **State:** Saved in `?tab=...` parameter (Default: `overview`).
- **Tabs:**
  - `overview` (Core statistics, line charts, top lists, CSV export)
  - `growth` (LTV Deciles, Cohorts Heatmap, Loyalty & Referral metrics)
  - `behavior` (Occupancy heatmap grid, No-shows stats, Lead times, Vacation lost income analysis)
  - `reviews` (NPS scores, rating distributions, recent comments)
  - `source` (Attribution channels donut chart)

### 3. Pure custom SVG Charts
All graphics are rendered as light, theme-compliant SVG elements:
- **RevenueLineChart:** Renders historical month-by-month revenue as a smooth area path with a custom dashed prediction interval computed via linear regression.
- **CohortHeatmap & HeatmapGrid:** Grid matrices using tailwind theme opacity backgrounds and dynamic fixed-positioned cells tooltips anchored via `getBoundingClientRect()`. Corrected touch events parameter signatures to support touch devices.

### 4. Code Isolation & Stability
- Extracted and cleaned up modular components: `KpiTicker`, `HeroStory` insights carousel, `BentoSecondary` grid, `GrowthLists`.
- Handled edge cases where `EmptyCell` callbacks differed (`onActionClick`), synchronized missing referrals query counts, and resolved implicit `any` type check errors in TanStack Query callbacks.
- Verified compilation and static pages build through `npm run build` successfully.
