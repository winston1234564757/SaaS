# 04 — Client CRM Domain Map

## 1. Domain Overview

CRM-система майстра для управління клієнтською базою: список, фільтрація, сегменти, VIP-мітки, нотатки, медичні записи, LTV, реферали.

### Key Files
- `src/app/(master)/dashboard/clients/page.tsx` — Server page
- `src/app/(master)/dashboard/clients/actions.ts` — Server actions
- `src/components/master/clients/ClientsPage.tsx` — Main component
- `src/components/master/clients/ClientDetailSheet.tsx` — Client detail drawer
- `src/components/master/clients/ClientWidgets.tsx` — CRM analytics widgets
- `src/components/master/clients/SegmentBuilder.tsx` — Custom segment builder

### DB Tables
- `client_master_relations` — total_visits, total_spent, average_check, last_visit_at, is_vip, tags[], health_notes, medical_notes, is_archived
- `profiles` — full_name, phone, health_notes, medical_notes
- `bookings` — Visit history
- `booking_services` — Service details per booking
- `reviews` — Client reviews

### RPC
- `get_master_clients(p_master_id)` — CRM data + retention status + VIP + notes
- `get_retention_status` — Retention dashboard

---

## 2. State Machine

### 2.1 Client List States

```
[LOADING] → fetch clients via RPC
  → [READY] — render client list
    → SORT: visits | alpha | check | recent
    → VIEW: list | grid
    → FILTER: segment chips (All / VIP / Regular / New / At Risk / Archived)
    → SEARCH: by name or phone
  → [EMPTY] — no clients → "Ще немає клієнтів" + CTA
  → [ERROR] — fetch failed → retry
```

### 2.2 Client Segments (Automatic)

| Segment | Criteria | Color |
|---|---|---|
| VIP | is_vip=true OR total_spent > threshold | Purple/gold |
| Regular | 5+ visits | Blue |
| New | 1-2 visits | Green |
| Sleeping | last_visit > 90 days ago | Amber |
| At Risk | last_visit > 60 days AND total_visits < 3 | Red |
| Archived | is_archived=true | Gray |

### 2.3 ClientDetailSheet States

```
[OPEN] → fetch client full data
  → [LOADING] — skeleton
  → [READY] — tabs:
    → INFO — name, phone, tags, VIP toggle
    → HISTORY — booking list with services
    → NOTES — health/medical notes editor
    → STATS — LTV, avg check, retention
  → [ERROR] — fetch failed

Actions from sheet:
  → EDIT_TAGS → tag selector
  → TOGGLE_VIP → set is_vip
  → ARCHIVE → 2-step confirm → is_archived=true
  → UNARCHIVE → is_archived=false
  → SAVE_NOTE → update health/medical notes (sync to profiles)
  → CREATE_BOOKING → open ManualBookingForm with prefill
```

### 2.4 SegmentBuilder States

```
[OPEN] → current segment config loaded
  → [EDITING] — filter builder:
    → VISITS: min / max
    → SPENT: min / max
    → LAST_VISIT: within / before / after
    → TAGS: include / exclude
    → VIP: yes / no / any
  → [APPLY] → save segment config → filter list
  → [RESET] → clear all filters
```

---

## 3. Environment Matrix

| Environment | CRM Behavior |
|---|---|
| Desktop | Full sidebar + detail sheet |
| Mobile | List view + BottomSheet for detail |
| Tablet | Hybrid: list + slide-over |

### Role Access
| Role | Access |
|---|---|
| Master (own) | All client data |
| Studio admin | All studio clients |
| Client | Own profile only |
| Guest | None |

---

## 4. Load & Concurrency Vectors

| Vector | Risk |
|---|---|
| RPC `get_master_clients` with 1000+ clients | Performance |
| Concurrent note edits | Last-write-wins (no merge) |
| VIP toggle race | Double toggle |
| Archive + booking create | Must check archived status |

---

## 5. Data Variations

| Field | Empty | Normal | Edge |
|---|---|---|---|
| total_visits | 0 | 1-100 | NULL |
| total_spent | 0 | 100-100000 | NULL, overflow |
| average_check | 0 | 500-5000 | Division by zero |
| last_visit_at | NULL | Date | Far past, future? |
| tags[] | [] | ["vip","regular"] | Empty array vs NULL |
| health_notes | "" | "Алергія на..." | Very long (>10KB) |
| is_vip | false | true | Toggle rapidly |
| is_archived | false | true | Client has active bookings? |

### Retention Cycle
| Cycle | Behavior |
|---|---|
| Set per master | `retention_cycle_days` in master_profiles |
| Default | 30 days |
| Min | 1 day |
| Max | 365 days |
| NULL | Use system default |

---

## 6. Test Vectors

### Unit Tests
- [ ] Segment classification (visits/spent/recency → segment)
- [ ] Retention status calculation
- [ ] LTV calculation (total_spent / visits)
- [ ] Average check (total_spent / visits, 0-division safe)
- [ ] Tag filter matching (client.tags matches filter)
- [ ] Search filter (name/phone partial match)

### Integration Tests
- [ ] RPC `get_master_clients` returns correct data
- [ ] RPC with master_id → only that master's clients
- [ ] Notes update → sync to profiles
- [ ] VIP toggle → is_vip changes
- [ ] Archive → is_archived + bookings still visible

### E2E Tests
- [ ] Client list loads with all clients
- [ ] Sort by visits / name / check / recent
- [ ] Filter by segment chip (VIP/Regular/etc)
- [ ] Search by name → filtered
- [ ] Search by phone → filtered
- [ ] Click client → detail sheet opens
- [ ] Detail sheet: all tabs visible
- [ ] Detail sheet: toggle VIP
- [ ] Detail sheet: edit notes → save
- [ ] Detail sheet: archive → confirm → archived
- [ ] Detail sheet: unarchive → active
- [ ] Empty state (0 clients) → CTA visible
- [ ] Segment builder: create segment → apply

### Security Tests
- [ ] Master A cannot see Master B's clients
- [ ] Client cannot access /dashboard/clients
- [ ] Archived client: no new bookings allowed

---

## 7. File Inventory

### Pages & Components
- `src/app/(master)/dashboard/clients/page.tsx`
- `src/app/(master)/dashboard/clients/actions.ts`
- `src/components/master/clients/ClientsPage.tsx`
- `src/components/master/clients/ClientDetailSheet.tsx`
- `src/components/master/clients/ClientWidgets.tsx`
- `src/components/master/clients/SegmentBuilder.tsx`

### DB
- `client_master_relations`
- `profiles` (health/medical notes)
- `bookings` (history)

### RPC
- `get_master_clients (p_master_id)` — main CRM query
- `get_retention_status` — retention analytics

### Migrations
- `047_master_client_notes.sql`
- `048_get_master_clients_rpc.sql`
- `068_*` — client relations fixes
- `118_*` — health notes system
- `126_segment_config.sql`
- `137_client_health_notes.sql`
- `20260516000000_client_health_system_update.sql`
