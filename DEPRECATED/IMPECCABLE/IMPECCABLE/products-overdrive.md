# Overdrive: Products + Orders

> **Date:** 2026-05-31 | **Reference:** impeccable/overdrive
> **Goal:** Push past conventional limits — what would make this module exceptional?

---

## Proposals

### 1. Unified Multi-Select Mode
Tap "Режим вибору" → batch-select products → bulk archive, bulk restock (+N to selected), bulk category change. Power move for boutique owners with 30+ products.

### 2. Live Stock Dashboard
Convert the Products tab header into a live mini-stock dashboard: red dot for out-of-stock count, amber for low stock, green for healthy. Click any dot to filter.

### 3. Visual Stock Timeline
In ProductEditor, add a mini transaction timeline: "Last 5 restocks + sales" shown as a compact sparkline or stepper list. "+10 шт — 3 дні тому" / "-2 шт — сьогодні".

### 4. Quick-Edit Sheet from ProductCard
Long-press or swipe ProductCard → opens inline edit for price + stock without navigating away. No full-page load.

### 5. Order Fulfillment Flow with Auto-Notify
After marking "Відправлено", prompt: "Повідомити клієнта?" → sends SMS with Nova Poshta tracking or pickup details. Currently only notifies on new order — completion is silent.

### 6. Predictive Restock
After 5+ sales of a product, show: "На основі продажів, рекомендуємо поповнити +15 шт" with one-tap restock.

## Risk
- Items 1-3 require moderate backend work (no existing batch endpoints)
- Item 4 can be done in ~2 hours (ProductFormDrawer already exists)
- Items 5-6 are high-value, low-effort (notifications exist, just need triggers)

## Verdict
Products module is functionally solid. Overdrive should focus on **stock management power tools** (Items 2+4+6) — this is the module's biggest differentiator opportunity.
