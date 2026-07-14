# College ERP Rewrite — Phase 1c: Admin / Finance

Status: Approved
Date: 2026-07-14

## Context

Third content sub-phase of Phase 1 (Admin portal), covering
**Fee Structure, Fee Ledger, Payments** — 3 of the Admin portal's 26
original sections. Conventions from
`2026-07-13-foundation-scaffold-design.md`,
`2026-07-13-admin-academics-core-design.md`, and
`2026-07-14-admin-academic-operations-design.md` (stack, folder layout,
fake-async-API pattern, functional filters, real per-record Add/Edit,
demo-data generation approach, sidebar grouping) apply unchanged and
aren't repeated here.

## Source content (from `index.html`, verified against the live file)

- **Fee Structure** (`getFeeStructureScreen`, sidebar label "Fee
  Structure"): descriptive blurb (kept verbatim) + a table (Program /
  Year / Tuition Fee / Hostel Fee / Other Fees / Total / Actions), only
  3 hardcoded rows. Add/Edit modals collect Program, Year, Tuition Fee,
  Hostel Fee, Transport Fee, Other Charges (4 fee-component fields) —
  more granular than the table's 3 fee columns, an inconsistency in the
  source. "View" is a stub notification (no modal). `editFeeStructure(feeId)`
  ignores its own `feeId` parameter and always opens the modal with the
  same hardcoded values regardless of which row's Edit was clicked.
- **Fee Ledger** (`getFeeLedgerScreen`, sidebar label "Student Fee
  Ledger"): 4 KPI cards (Total Collectible, Collected, Pending,
  Overdue) + Program/Status filters + search (none wired in the
  source) + a table (Roll No / Student Name / Program / Total Fee /
  Paid / Balance / Status), 4 hardcoded rows, with Pending/Overdue rows
  given an inline orange/red background tint in addition to their
  status badge. "Export Report" and "Record Payment" and "View Ledger"
  are all stub notifications.
- **Payments** (`getPaymentsScreen`, sidebar label "Payments &
  Waivers"): descriptive blurb + Payment-Mode/Date filters + search
  (none wired) + a table (Receipt No / Date / Student / Amount / Mode /
  Status), 3 hardcoded rows, "Student" column combines name and roll
  number in one cell (`Name (ID)`) unlike Fee Ledger's separate
  columns. "Export", "Record Payment", "Print", "View" are all stub
  notifications.
- **Cross-cutting**: no dedicated "Record Payment" modal exists
  anywhere in the 16,784-line source — both Fee Ledger's and Payments'
  "Record Payment" buttons are identical
  `showNotification('Opening payment form...', 'info')` stubs. No
  function-name shadowing/duplication exists for any of these 3
  screens (unlike Phase 1a's Department-detail case). The Overview
  Dashboard's existing "Fee Collection" KPI card already links to Fee
  Ledger and currently shows a static `₹3.2 Cr` placeholder.

## Decisions

- **Fee Structure table shows all 4 fee components.** Rather than
  reproduce the table/modal mismatch (table shows 3 columns, modal
  collects 4 fields), the rebuild's table shows Tuition/Hostel/
  Transport/Other/Total — matching what its own Add/Edit modal
  actually collects, per Phase 1a's "Edit modals match Add modal's
  fields" precedent.
- **Edit Fee Structure fixed to show the clicked row's own data** —
  same fix already applied to Students/Courses/Faculty (Phase 1a) and
  Exams (Phase 1b).
- **Fee Ledger gets its own `status` field, not reused from
  `Student.feeStatus`.** Phase 1a's `Student.feeStatus` is only
  `"paid" | "pending"` and is already depended on by the shipped
  Students table and StudentProfile page — widening it to add
  `"overdue"` would be an unrelated ripple into already-verified work.
  A ledger entry is its own record with its own richer 3-value status,
  computed from that entry's own `paidAmount` vs `totalFee`.
- **Fee Ledger backed by one real entry per student** (500 rows,
  reusing Phase 1a's `students` — `totalFee` is looked up from that
  student's own program+year fee structure record, not invented
  independently), replacing the 4 hardcoded sample rows. The 4 KPIs
  are real sums over these 500 entries.
- **Payments backed by ~40 real transaction records** referencing real
  students, replacing the 3 hardcoded sample rows.
- **Payments' Date filter dropped** (decorative in the source — no
  real multi-date filtering dataset behind it in the original either).
  Payment-Mode filter and search are real and functional, matching
  Phase 1a/1b's "no decorative no-op controls" rule.
- **"Record Payment" stays a stub notification in both Fee Ledger and
  Payments** — the source never built a real payment-recording flow
  anywhere, so building one now would be new content, not a rebuild of
  existing content (same reasoning already applied to Attendance's
  "Mark Attendance" Continue stub in Phase 1b).
- **Overview Dashboard's "Fee Collection" KPI wired to real data** —
  the sum of `paidAmount` across the fee ledger, formatted as
  `₹X.X Cr`. Small, targeted edit to the existing `Dashboard.tsx`, per
  the same pattern used for "Avg Attendance"/"Upcoming Exams" in
  Phase 1b.

## Data model (additions to `src/types/index.ts`)

```ts
export interface FeeStructureItem {
  id: string; // "FEE-001"
  program: string; // matches Student.program, e.g. "B.Tech CSE"
  year: 1 | 2 | 3 | 4;
  tuitionFee: number;
  hostelFee: number;
  transportFee: number;
  otherCharges: number;
  total: number; // sum of the 4 fields above
}

export type FeeLedgerStatus = "paid" | "pending" | "overdue";
export interface FeeLedgerEntry {
  id: string;
  studentId: string;
  totalFee: number;
  paidAmount: number;
  balance: number; // totalFee - paidAmount
  status: FeeLedgerStatus;
}

export type PaymentMode = "online" | "cash" | "cheque" | "dd";
export type PaymentStatus = "verified" | "pending_clearance";
export interface Payment {
  id: string; // "REC-2024-1842" style receipt number
  date: string; // ISO date
  studentId: string;
  amount: number;
  mode: PaymentMode;
  status: PaymentStatus;
}
```

## Folder additions

```
src/
  demo-data/
    fees/
      feeStructure.ts
      feeLedger.ts
      payments.ts
  api/
    feeStructure.ts
    feeLedger.ts
    payments.ts
  pages/admin/
    FeeStructure.tsx
    FeeLedger.tsx
    Payments.tsx
```

## Routing additions (`router.tsx`)

```
/admin/fees/structure -> FeeStructure
/admin/fees/ledger    -> FeeLedger
/admin/fees/payments  -> Payments
```

No per-record detail routes — none of these 3 screens have a
per-record "View" page in the original (all "View" actions are stub
notifications, not pages or modals).

## Navigation changes (`navigation.tsx`, `"admin"` case)

Add a **Finance** group (matching the source's own "Finance" sidebar
section title) between the existing Academics and Administration
groups:

```
Dashboard                          (ungrouped)
Academics group:                   (unchanged from Phase 1b)
Finance group:
  Fee Structure, Student Fee Ledger, Payments & Waivers
Administration group:              (unchanged from Phase 1b)
```

## Component reuse

Same as Phase 1a/1b: `PageHeader`, `StatCard`, `DataTable`,
`StatusChip` (needs `verified`/`pending_clearance` added — `paid`/
`pending`/`overdue` already exist from Phase 1a), plus MUI `Dialog`/
`TextField`/`Select`/`Snackbar` for modals and stub-action feedback.
No new shared components.

## Error handling

Same as Phase 1a/1b — in-memory array operations only, no simulated
failure. Add/Edit Fee Structure resolves through the existing
`simulateRequest`-based API pattern.

## Testing / verification

Same as Phase 0/1a/1b: `tsc -b` via `npm run build`, `eslint .`, and a
browser-driven pass confirming: Fee Structure's table shows all 4 fee
components and Edit shows the clicked row's own data (verified against
2 different rows); Fee Ledger's 4 KPIs are real, its Program/Status
filters and search actually filter, and Pending/Overdue rows keep
their tint; Payments' Payment-Mode filter and search actually filter;
Overview's "Fee Collection" KPI now reflects real computed data; both
light/dark modes render correctly.

## Out of scope for Phase 1c

Assets/Tickets/Hostel/Facility/Library (1d); Notices/Document
Signatures/Audit Logs/System Health/Configurations/Profile/Settings
(1e).
