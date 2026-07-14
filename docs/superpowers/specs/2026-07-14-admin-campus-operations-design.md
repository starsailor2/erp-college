# College ERP Rewrite — Phase 1d: Admin / Campus Operations

Status: Approved
Date: 2026-07-14

## Context

Fourth content sub-phase of Phase 1 (Admin portal), covering **Assets,
Tickets, Hostel, Facility, Library** — the 5 sections the source groups
under its own "Operations" sidebar heading. Conventions from
`2026-07-13-foundation-scaffold-design.md`,
`2026-07-13-admin-academics-core-design.md`,
`2026-07-14-admin-academic-operations-design.md`, and
`2026-07-14-admin-finance-design.md` (stack, folder layout,
fake-async-API pattern, functional filters, real per-record Add/Edit,
demo-data generation approach, sidebar grouping) apply unchanged and
aren't repeated here.

## Source content (from `index.html`, verified against the live file)

- **Assets** (`getAssetsScreen`, sidebar label "Asset Master"): Export
  Report / Add Asset actions + Location/Type filters + search (none
  wired) + a table (Asset ID / Type / Location / Condition / Status /
  Last Maintenance / Actions), 5 hardcoded rows. Condition is rendered
  as a colored dot + text (Excellent/Good/Fair/Poor), not a badge.
  Status is a badge (Active/Maintenance/Retired). Row 1's Edit calls
  `editAsset(assetId)`, all other rows' Edit calls an inline
  `showNotification` stub — `editAsset` ignores its `assetId` parameter
  and always opens `editAssetModal` with the same hardcoded values
  ("Dell Latitude 5420 Laptop") regardless of which row was clicked.
  `viewAssetDetails(assetId)` has the identical bug: it renders a full
  "Asset Details" page but always shows the same hardcoded asset
  ("AST-2024-001", "Dell Latitude 5420 Laptop") plus a 2-entry
  "Maintenance History" list, regardless of `assetId`. That detail
  page's "Transfer Asset" is a stub notification.
- **Tickets** (`getTicketsScreen`, sidebar label "Maintenance
  Tickets"): 4 KPI cards (Total Open Requests, SLA Breaches, Unassigned
  Tickets, Avg Resolution Time) + Export Report/Create New Request
  actions + search/Status/Priority filters (none wired) + a table (Req
  ID / Issue & Description / Location / Priority / Assigned Staff / SLA
  Status / Actions), 4 hardcoded rows. SLA Status is rendered as
  colored text + a caption (e.g. "SLA Breached" / "2h 15m overdue"),
  not a badge. `viewTicketDetails(ticketId)` has the same
  ignore-the-parameter bug as assets: always renders "AC Not Working -
  Room 301" / "TKT-001" regardless of `ticketId`. That detail page's
  "Assign Technician" and "Mark Resolved" are stub notifications; the
  list's own "Assign Staff" action is also a stub.
- **Hostel** (`getHostelScreen`, sidebar label "Hostel Management"):
  descriptive blurb (kept verbatim) + 4 KPI cards (Total Beds:
  918, Occupied: 845, Available: 73, Maintenance: 18) + Export/Allocate
  Room actions. No table exists in this screen — it's KPI cards only.
  `allocateRoom()` opens a modal (Student/Hostel/Room Number/Bed Number
  selects, all hardcoded option lists) whose Submit just closes the
  modal and shows a browser `alert()` — no KPI or list is touched.
- **Facility** (`getFacilityScreen`, sidebar label "Facility /
  Booking"): descriptive blurb (kept verbatim) + 4 KPI cards (Today's
  Bookings: 24, Auditorium utilization: 85%, Sports Complex
  utilization: 72%, Pending Approvals: 8) + View Calendar/New Booking
  actions. Also KPI-cards-only, no table. `newBooking()` opens a modal
  (Facility select, Event Type text, Date, Time Slot select, Purpose
  textarea) whose Submit just closes the modal and `alert()`s — no KPI
  is touched.
- **Library** (`getLibraryScreen`, sidebar label "Library Management"):
  Export/Add Book actions + Category/Status filters + search (none
  wired) + a book-card grid (6 hardcoded books: title, author, ISBN,
  status badge — Available (N) / Issued / Reserved — category tag,
  Issue/View actions) + a separate "Recent Issues & Returns" table
  (Transaction ID / Student / Book / Issue Date / Due Date / Status /
  Actions), 3 hardcoded rows, with the overdue row given an inline red
  background tint. `issueBook`/`returnBook` are stub notifications;
  neither actually changes a book's available count or the
  transactions table.
- **Cross-cutting**: no dedicated route exists for a per-asset or
  per-ticket "Edit" beyond the buggy shared modal described above (no
  function-name shadowing/duplication otherwise). The Overview
  Dashboard's existing "Open Tickets" (42), "Total Assets" (1,842), and
  "Hostel Occupancy" (92%) KPI cards are currently static placeholders.

## Decisions

- **Asset Edit and Asset "View" details fixed to show the clicked
  row's own data** — same fix already applied to Students/Courses/
  Faculty/Exams/Fee Structure in prior phases. Asset "View" becomes a
  real per-asset profile page (`/admin/assets/:id`), matching the
  `CourseProfile`/`StudentProfile` precedent from Phase 1a, including
  its own small demo-data-backed Maintenance History sub-list.
- **Ticket "View" fixed the same way**, becoming a real per-ticket
  profile page (`/admin/tickets/:id`).
- **Asset condition rendered as a colored dot + label** (not a
  `StatusChip`) and **ticket SLA status rendered as colored text +
  caption** (not a `StatusChip`) — both kept as their own small inline
  renders since that's how the source visually distinguishes them from
  its badge-based `status`/`priority` columns.
- **Hostel "Allocate Room" and Facility "New Booking" become
  functional**: real forms (Allocate Room's Student select is
  populated from Phase 1a's real `students`; the rest keep the
  source's own hardcoded option lists since no backing data for
  hostel/room numbering exists anywhere in the source or our demo data)
  that, on submit, actually move the KPI numbers — Allocate Room moves
  one bed from Available to Occupied; New Booking increments Today's
  Bookings. This makes the existing KPIs genuinely reactive rather than
  decorative, without inventing a new table screen beyond the
  original's scope (per your explicit choice for this phase).
- **Ticket "Mark Resolved" becomes functional** — flips that ticket's
  own `status` to `"resolved"`, reflected in the Tickets list on
  return. A real list already backs this concept, so wiring it up is
  the same kind of fix as correcting a hardcoded Edit modal, not new
  scope. "Assign Technician" (profile page) and "Assign Staff" (list
  row) stay stub notifications — the source has no staff-picker UI
  anywhere to hook a real assignment into. "Transfer Asset" also stays
  a stub for the same reason.
- **Library Issue/Return become functional** — Issuing a book
  decrements its `availableCopies` (and flips its status to
  `"issued"` once copies reach 0) and appends a new active-loan row to
  the transactions table; Returning a transaction increments the
  book's `availableCopies` back and flips that transaction's status to
  `"returned"`. A real transactions table and real per-book copy counts
  already exist in the source screen, so this is a direct fix, not new
  functionality. "View" (book) stays a stub notification — the source
  has no per-book detail screen.
- **Category/Status/Location/Type/Priority filters and search made
  real and functional** across all 3 table-backed screens
  (Assets/Tickets/Library), matching every prior phase's "no decorative
  no-op controls" rule.
- **Overview Dashboard's "Open Tickets", "Total Assets", and "Hostel
  Occupancy" KPIs wired to real data** — counts/percentages computed
  from the new demo data, same targeted-edit pattern used for Fee
  Collection in Phase 1c.

## Data model (additions to `src/types/index.ts`)

```ts
export type AssetCondition = "excellent" | "good" | "fair" | "poor";
export type AssetStatus = "active" | "maintenance" | "retired";
export interface MaintenanceRecord {
  title: string;
  date: string; // e.g. "Dec 15, 2024"
}
export interface Asset {
  id: string; // "AST-2023-001"
  name: string; // e.g. "Dell Latitude 5420 Laptop"
  type: string; // e.g. "Projector", "Computer", "Furniture"
  location: string;
  condition: AssetCondition;
  status: AssetStatus;
  lastMaintenance: string; // e.g. "Nov 15, 2024"
  value: number;
  purchaseDate: string;
  maintenanceHistory: MaintenanceRecord[];
}

export type TicketPriority = "critical" | "high" | "medium" | "low";
export type TicketStatus = "open" | "in_progress" | "resolved";
export interface Ticket {
  id: string; // "REQ-2095"
  title: string;
  description: string;
  location: string;
  priority: TicketPriority;
  assignedTo: string | null;
  status: TicketStatus;
  createdAt: string; // ISO datetime
  slaDueAt: string; // ISO datetime — slaBreached derived by comparing to now
}

export interface HostelStats {
  totalBeds: number;
  occupied: number;
  available: number;
  maintenance: number;
}

export interface FacilityStats {
  todayBookings: number;
  auditoriumUtilizationPct: number;
  sportsUtilizationPct: number;
  pendingApprovals: number;
}

export type BookStatus = "available" | "issued" | "reserved";
export interface Book {
  id: string; // "BK001"
  title: string;
  author: string;
  isbn: string;
  category: string;
  status: BookStatus;
  availableCopies: number;
}

export type LibraryTransactionStatus = "active" | "overdue" | "returned";
export interface LibraryTransaction {
  id: string; // "LIB-1234"
  studentId: string;
  bookId: string;
  issueDate: string;
  dueDate: string;
  status: LibraryTransactionStatus;
}
```

## Folder additions

```
src/
  demo-data/
    campus/
      assets.ts
      tickets.ts
      hostelStats.ts
      facilityStats.ts
      books.ts
      libraryTransactions.ts
  api/
    assets.ts
    tickets.ts
    hostelStats.ts
    facilityStats.ts
    books.ts
    libraryTransactions.ts
  pages/admin/
    Assets.tsx
    AssetProfile.tsx
    Tickets.tsx
    TicketProfile.tsx
    Hostel.tsx
    Facility.tsx
    Library.tsx
```

## Routing additions (`router.tsx`)

```
/admin/assets       -> Assets
/admin/assets/:id   -> AssetProfile
/admin/tickets      -> Tickets
/admin/tickets/:id  -> TicketProfile
/admin/hostel       -> Hostel
/admin/facility     -> Facility
/admin/library      -> Library
```

## Navigation changes (`navigation.tsx`, `"admin"` case)

Add an **Operations** group (matching the source's own "Operations"
sidebar section title) **between the existing Academics and Finance
groups**, matching the source's actual sidebar order (Academics →
Operations → Finance → Administration):

```
Dashboard                          (ungrouped)
Academics group:                   (unchanged from Phase 1b)
Operations group:
  Asset Master, Maintenance Tickets, Hostel Management,
  Facility / Booking, Library Management
Finance group:                     (unchanged from Phase 1c)
Administration group:              (unchanged from Phase 1b)
```

## Component reuse

Same as prior phases: `PageHeader`, `StatCard`, `DataTable`,
`StatusChip` (needs `maintenance`, `retired`, `open`, `resolved`,
`critical`, `high`, `medium`, `low`, `available`, `reserved` added —
`in_progress`, `issued`, `returned`, `active` already exist from prior
phases), plus MUI `Dialog`/`TextField`/`Select`/`Snackbar` for modals
and stub-action feedback. No new shared components.

## Error handling

Same as prior phases — in-memory array/object mutations only, no
simulated failure. All Add/Edit/Allocate/Book/Issue/Return actions
resolve through the existing `simulateRequest`-based API pattern.

## Testing / verification

Same as prior phases: `tsc -b` via `npm run build`, `eslint .`, and a
browser-driven pass confirming: Assets' Edit and View show the clicked
row's own data (verified against 2+ different rows) and its
Location/Type filters + search actually filter; Tickets' 4 KPIs are
real, its Status/Priority filters + search actually filter, and Mark
Resolved actually changes that ticket's status in the list; Hostel's
Allocate Room actually moves Available → Occupied; Facility's New
Booking actually increments Today's Bookings; Library's Category/
Status filters + search actually filter, and Issue/Return actually
update both the book's available count and the transactions table;
Overview's "Open Tickets"/"Total Assets"/"Hostel Occupancy" KPIs now
reflect real computed data; both light/dark modes render correctly.

## Out of scope for Phase 1d

Notices/Document Signatures/Audit Logs/System Health/Configurations/
Profile/Settings (1e).
