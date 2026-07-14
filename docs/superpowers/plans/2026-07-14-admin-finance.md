# Admin Finance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 1c of the Admin portal — Fee Structure, Fee Ledger, and Payments — reusing Phase 1a's students, and regroup the admin sidebar to add a Finance group.

**Architecture:** Same as Phase 1a/1b: demo-data generator modules (Fee Ledger derived from real students + Fee Structure records) → thin `api/*.ts` Promise wrappers → page components that fetch via the API layer.

**Tech Stack:** Same as Phase 0/1a/1b — no new dependencies.

## Global Constraints

- All new pages live under `app/src/pages/admin/`; all new demo-data under `app/src/demo-data/fees/`; all new API modules under `app/src/api/`. (Every path below is relative to `app/`.)
- Filters/search must actually filter (client-side, over the in-memory array). Payments' Date filter is dropped entirely rather than shipped as a no-op control.
- Edit Fee Structure shows the clicked row's own data — never a fixed hardcoded sample. Same fix already applied in Phase 1a (Students/Courses/Faculty) and Phase 1b (Exams).
- Mutations (`addFeeStructure`, `updateFeeStructure`) mutate the in-memory array directly and resolve through `simulateRequest`, matching Phase 0/1a/1b.
- Demo data scale: fee structure = 20 rows (5 programs × 4 years); fee ledger = 500 rows (1 per student); payments = 40 rows.
- Currency formatting: values ≥ ₹1,00,00,000 show as `₹X.X Cr`; values ≥ ₹1,00,000 show as `₹X.X L`; smaller values show as a plain `₹`-prefixed number with Indian digit grouping (`toLocaleString("en-IN")`). Each page that needs this defines its own small local `formatINR` helper (no shared utils module — consistent with not introducing shared abstractions speculatively).
- "Record Payment" (both Fee Ledger and Payments), "View"/"View Ledger"/"Print", and "Export"/"Export Report" all stay stub actions that show a notification via MUI `Snackbar` — no modal or real file, matching the original (no payment-recording modal exists anywhere in the source).

---

### Task 1: Type definitions

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: `FeeStructureItem`, `FeeLedgerStatus`, `FeeLedgerEntry`, `PaymentMode`, `PaymentStatus`, `Payment` — consumed by every task below.

- [ ] **Step 1: Append the Finance types to `src/types/index.ts`**

Add at the end of the existing file:

```ts

// --- Admin / Finance (Phase 1c) ---

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
  id: string; // "REC-2026-1842" style receipt number
  date: string; // ISO date
  studentId: string;
  amount: number;
  mode: PaymentMode;
  status: PaymentStatus;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "Add Admin/Finance type definitions"
```

---

### Task 2: Fee Structure demo data + API

**Files:**
- Create: `src/demo-data/fees/feeStructure.ts`
- Create: `src/api/feeStructure.ts`

**Interfaces:**
- Consumes: `FeeStructureItem` from `@/types` (Task 1); `programByDepartment` from `@/demo-data/academics/departmentSeeds` (Phase 1a); `createRng` from `@/demo-data/generators/random` (Phase 0).
- Produces: `feeStructure: FeeStructureItem[]`, `getFeeStructureById(id): FeeStructureItem | undefined`, `getFeeStructureFor(program, year): FeeStructureItem | undefined` from `feeStructure.ts`; `getFeeStructure(): Promise<FeeStructureItem[]>`, `getFeeStructureByIdAsync(id): Promise<FeeStructureItem | undefined>`, `addFeeStructure(entry): Promise<FeeStructureItem>`, `updateFeeStructure(id, updates): Promise<FeeStructureItem | undefined>` from `api/feeStructure.ts` — used by Task 6's FeeStructure page and Task 3's fee ledger generator.

- [ ] **Step 1: Create `src/demo-data/fees/feeStructure.ts`**

```ts
import type { FeeStructureItem } from "@/types";
import { programByDepartment } from "@/demo-data/academics/departmentSeeds";
import { createRng } from "@/demo-data/generators/random";

const { randomInt } = createRng(90260715);

const baseTuitionByProgram: Record<string, number> = {
  "B.Tech CSE": 150000,
  "B.Sc Mathematics": 90000,
  "B.Sc Physics": 95000,
  "B.Tech ECE": 140000,
  "B.Tech MECH": 135000,
};

function generateFeeStructure(): FeeStructureItem[] {
  const list: FeeStructureItem[] = [];
  let seq = 1;
  for (const program of Object.values(programByDepartment)) {
    const baseTuition = baseTuitionByProgram[program] ?? 120000;
    for (let year = 1; year <= 4; year++) {
      const tuitionFee = baseTuition + (year - 1) * 5000;
      const hostelFee = 60000;
      const transportFee = 15000;
      const otherCharges = randomInt(15000, 25000);
      list.push({
        id: `FEE-${String(seq).padStart(3, "0")}`,
        program,
        year: year as 1 | 2 | 3 | 4,
        tuitionFee,
        hostelFee,
        transportFee,
        otherCharges,
        total: tuitionFee + hostelFee + transportFee + otherCharges,
      });
      seq++;
    }
  }
  return list;
}

export const feeStructure: FeeStructureItem[] = generateFeeStructure();

export function getFeeStructureById(id: string): FeeStructureItem | undefined {
  return feeStructure.find((f) => f.id === id);
}

export function getFeeStructureFor(program: string, year: number): FeeStructureItem | undefined {
  return feeStructure.find((f) => f.program === program && f.year === year);
}
```

- [ ] **Step 2: Create `src/api/feeStructure.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { feeStructure, getFeeStructureById } from "@/demo-data/fees/feeStructure";
import type { FeeStructureItem } from "@/types";

export function getFeeStructure(): Promise<FeeStructureItem[]> {
  return simulateRequest(feeStructure);
}

export function getFeeStructureByIdAsync(id: string): Promise<FeeStructureItem | undefined> {
  return simulateRequest(getFeeStructureById(id));
}

export function addFeeStructure(entry: FeeStructureItem): Promise<FeeStructureItem> {
  feeStructure.unshift(entry);
  return simulateRequest(entry);
}

export function updateFeeStructure(id: string, updates: Partial<FeeStructureItem>): Promise<FeeStructureItem | undefined> {
  const idx = feeStructure.findIndex((f) => f.id === id);
  if (idx !== -1) feeStructure[idx] = { ...feeStructure[idx], ...updates };
  return simulateRequest(feeStructure[idx]);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/fees/feeStructure.ts src/api/feeStructure.ts
git commit -m "Add fee structure demo data and API"
```

---

### Task 3: Fee Ledger demo data + API

**Files:**
- Create: `src/demo-data/fees/feeLedger.ts`
- Create: `src/api/feeLedger.ts`

**Interfaces:**
- Consumes: `FeeLedgerEntry`, `FeeLedgerStatus` from `@/types` (Task 1); `students` from `@/demo-data/people/students` (Phase 1a); `getFeeStructureFor` from `@/demo-data/fees/feeStructure` (Task 2); `createRng` from `@/demo-data/generators/random`.
- Produces: `feeLedger: FeeLedgerEntry[]`, `getFeeLedgerByStudent(studentId): FeeLedgerEntry | undefined` from `feeLedger.ts`; `getFeeLedger(): Promise<FeeLedgerEntry[]>`, `getFeeLedgerByStudentAsync(studentId): Promise<FeeLedgerEntry | undefined>` from `api/feeLedger.ts` — used by Task 7's FeeLedger page and Task 4's payments generator.

- [ ] **Step 1: Create `src/demo-data/fees/feeLedger.ts`**

```ts
import type { FeeLedgerEntry, FeeLedgerStatus } from "@/types";
import { students } from "@/demo-data/people/students";
import { getFeeStructureFor } from "@/demo-data/fees/feeStructure";
import { createRng } from "@/demo-data/generators/random";

const { weightedPick, randomInt } = createRng(90260716);

const statuses: [FeeLedgerStatus, number][] = [["paid", 88], ["pending", 10], ["overdue", 2]];

function generateFeeLedger(): FeeLedgerEntry[] {
  return students.map((s, i) => {
    const structure = getFeeStructureFor(s.program, s.year);
    const totalFee = structure?.total ?? 200000;
    const status = weightedPick(statuses);
    let paidAmount: number;
    if (status === "paid") {
      paidAmount = totalFee;
    } else if (status === "pending") {
      paidAmount = Math.round(totalFee * (randomInt(40, 80) / 100));
    } else {
      paidAmount = Math.round(totalFee * (randomInt(10, 50) / 100));
    }
    return {
      id: `LEDGER-${String(i + 1).padStart(4, "0")}`,
      studentId: s.id,
      totalFee,
      paidAmount,
      balance: totalFee - paidAmount,
      status,
    };
  });
}

export const feeLedger: FeeLedgerEntry[] = generateFeeLedger();

export function getFeeLedgerByStudent(studentId: string): FeeLedgerEntry | undefined {
  return feeLedger.find((e) => e.studentId === studentId);
}
```

- [ ] **Step 2: Create `src/api/feeLedger.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { feeLedger, getFeeLedgerByStudent } from "@/demo-data/fees/feeLedger";
import type { FeeLedgerEntry } from "@/types";

export function getFeeLedger(): Promise<FeeLedgerEntry[]> {
  return simulateRequest(feeLedger);
}

export function getFeeLedgerByStudentAsync(studentId: string): Promise<FeeLedgerEntry | undefined> {
  return simulateRequest(getFeeLedgerByStudent(studentId));
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/fees/feeLedger.ts src/api/feeLedger.ts
git commit -m "Add fee ledger demo data and API"
```

---

### Task 4: Payments demo data + API

**Files:**
- Create: `src/demo-data/fees/payments.ts`
- Create: `src/api/payments.ts`

**Interfaces:**
- Consumes: `Payment`, `PaymentMode`, `PaymentStatus` from `@/types` (Task 1); `feeLedger` from `@/demo-data/fees/feeLedger` (Task 3); `createRng` from `@/demo-data/generators/random`.
- Produces: `payments: Payment[]` from `payments.ts`; `getPayments(): Promise<Payment[]>` from `api/payments.ts` — used by Task 8's Payments page.

- [ ] **Step 1: Create `src/demo-data/fees/payments.ts`**

```ts
import type { Payment, PaymentMode, PaymentStatus } from "@/types";
import { feeLedger } from "@/demo-data/fees/feeLedger";
import { createRng } from "@/demo-data/generators/random";

const { pick, randomInt, weightedPick } = createRng(90260717);

const modes: [PaymentMode, number][] = [["online", 6], ["cash", 2], ["cheque", 1], ["dd", 1]];

const PAYMENT_COUNT = 40;

function generatePayments(): Payment[] {
  const payers = feeLedger.filter((e) => e.paidAmount > 0);

  const list: Payment[] = [];
  for (let i = 0; i < PAYMENT_COUNT; i++) {
    const entry = pick(payers);
    const mode = weightedPick(modes);
    const status: PaymentStatus = mode === "cheque" ? weightedPick([["verified", 5], ["pending_clearance", 3]]) : "verified";
    const day = randomInt(1, 28);
    list.push({
      id: `REC-2026-${1800 + i}`,
      date: `2026-12-${String(day).padStart(2, "0")}`,
      studentId: entry.studentId,
      amount: randomInt(15000, 250000),
      mode,
      status,
    });
  }
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

export const payments: Payment[] = generatePayments();
```

- [ ] **Step 2: Create `src/api/payments.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { payments } from "@/demo-data/fees/payments";
import type { Payment } from "@/types";

export function getPayments(): Promise<Payment[]> {
  return simulateRequest(payments);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/fees/payments.ts src/api/payments.ts
git commit -m "Add payments demo data and API"
```

---

### Task 5: StatusChip additions

**Files:**
- Modify: `src/components/StatusChip.tsx`

**Interfaces:**
- Produces: `StatusChip` now also handles `"verified"` and `"pending_clearance"` (`"paid"`/`"pending"`/`"overdue"` already exist from Phase 1a) — used by Task 7's FeeLedger page and Task 8's Payments page.

- [ ] **Step 1: Add the 2 new icon imports**

In `src/components/StatusChip.tsx`, add to the existing icon-import block:

```tsx
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
```

- [ ] **Step 2: Add the 2 new status entries**

Find:

```tsx
  // Activity log
  pending_approval: { label: "Pending Approval", color: statusTokens.warning, icon: PendingActionsIcon },
  scheduled: { label: "Scheduled", color: statusTokens.warning, icon: EventIcon },
};
```

Replace with:

```tsx
  // Activity log
  pending_approval: { label: "Pending Approval", color: statusTokens.warning, icon: PendingActionsIcon },
  scheduled: { label: "Scheduled", color: statusTokens.warning, icon: EventIcon },
  // Payments
  verified: { label: "Verified", color: statusTokens.good, icon: CheckCircleIcon },
  pending_clearance: { label: "Pending Clearance", color: statusTokens.warning, icon: HourglassBottomIcon },
};
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/StatusChip.tsx
git commit -m "Add verified/pending_clearance statuses to StatusChip"
```

---

### Task 6: Fee Structure page

**Files:**
- Create: `src/pages/admin/FeeStructure.tsx`

**Interfaces:**
- Consumes: `getFeeStructure`, `addFeeStructure`, `updateFeeStructure` from `@/api/feeStructure` (Task 2); `programByDepartment` from `@/demo-data/academics/departmentSeeds` (Phase 1a); `PageHeader`, `DataTable` from `@/components/*` (Phase 0).
- Produces: default export consumed by `router.tsx` (Task 10) at `/admin/fees/structure`.

- [ ] **Step 1: Create `src/pages/admin/FeeStructure.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, Typography, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getFeeStructure, addFeeStructure, updateFeeStructure } from "@/api/feeStructure";
import { programByDepartment } from "@/demo-data/academics/departmentSeeds";
import type { FeeStructureItem } from "@/types";

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

const programs = Object.values(programByDepartment);
const emptyForm = { program: programs[0], year: 1 as 1 | 2 | 3 | 4, tuitionFee: 0, hostelFee: 0, transportFee: 0, otherCharges: 0 };

export default function FeeStructure() {
  const [rows, setRows] = useState<FeeStructureItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getFeeStructure().then(setRows);
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item: FeeStructureItem) => {
    setEditingId(item.id);
    setForm({ program: item.program, year: item.year, tuitionFee: item.tuitionFee, hostelFee: item.hostelFee, transportFee: item.transportFee, otherCharges: item.otherCharges });
    setDialogOpen(true);
  };

  const total = form.tuitionFee + form.hostelFee + form.transportFee + form.otherCharges;

  const handleSave = () => {
    if (editingId) {
      updateFeeStructure(editingId, { ...form, total }).then(load);
    } else {
      addFeeStructure({ id: `FEE-${String(rows.length + 1).padStart(3, "0")}`, ...form, total }).then(load);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Fee Structure Management"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Fee Structure... Download will start shortly.")}>Export</Button>
            <Button variant="contained" onClick={openAdd}>Add Fee Structure</Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Fee structure management includes defining fee components by program and year,
        setting tuition, hostel, transport, and other fees, configuring payment schedules
        and installments, managing late fee penalties, creating scholarship and waiver
        rules, and academic year-wise fee structures.
      </Typography>

      <DataTable<FeeStructureItem>
        pagination
        columns={[
          { key: "program", label: "Program" },
          { key: "year", label: "Year", render: (row) => `${row.year}${row.year === 1 ? "st" : row.year === 2 ? "nd" : row.year === 3 ? "rd" : "th"} Year` },
          { key: "tuitionFee", label: "Tuition Fee", render: (row) => formatINR(row.tuitionFee) },
          { key: "hostelFee", label: "Hostel Fee", render: (row) => formatINR(row.hostelFee) },
          { key: "transportFee", label: "Transport Fee", render: (row) => formatINR(row.transportFee) },
          { key: "otherCharges", label: "Other Charges", render: (row) => formatINR(row.otherCharges) },
          { key: "total", label: "Total", render: (row) => formatINR(row.total) },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <Button size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>Edit</Button>
                <Button size="small" onClick={(e) => { e.stopPropagation(); setSnackbar("Loading fee structure..."); }}>View</Button>
              </Stack>
            ),
          },
        ]}
        rows={rows}
        emptyTitle="No fee structures found"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Fee Structure" : "Add Fee Structure"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Program</InputLabel>
            <Select label="Program" value={form.program} onChange={(e: SelectChangeEvent) => setForm({ ...form, program: e.target.value })}>
              {programs.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Year</InputLabel>
            <Select<1 | 2 | 3 | 4> label="Year" value={form.year} onChange={(e: SelectChangeEvent<1 | 2 | 3 | 4>) => setForm({ ...form, year: Number(e.target.value) as 1 | 2 | 3 | 4 })}>
              <MenuItem value={1}>1st Year</MenuItem>
              <MenuItem value={2}>2nd Year</MenuItem>
              <MenuItem value={3}>3rd Year</MenuItem>
              <MenuItem value={4}>4th Year</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Tuition Fee" type="number" placeholder="₹ 120000" value={form.tuitionFee} onChange={(e) => setForm({ ...form, tuitionFee: Number(e.target.value) })} fullWidth />
          <TextField label="Hostel Fee" type="number" placeholder="₹ 50000" value={form.hostelFee} onChange={(e) => setForm({ ...form, hostelFee: Number(e.target.value) })} fullWidth />
          <TextField label="Transport Fee" type="number" placeholder="₹ 15000" value={form.transportFee} onChange={(e) => setForm({ ...form, transportFee: Number(e.target.value) })} fullWidth />
          <TextField label="Other Charges" type="number" placeholder="₹ 5000" value={form.otherCharges} onChange={(e) => setForm({ ...form, otherCharges: Number(e.target.value) })} fullWidth />
          <Box>
            <Typography variant="caption" color="text.secondary">Total</Typography>
            <Typography variant="body1" fontWeight={700}>{formatINR(total)}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? "Save Changes" : "Add Fee Structure"}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors (router.tsx is not touched until Task 10, so this new page has no consumer yet, but tsc still type-checks it).

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/FeeStructure.tsx
git commit -m "Add Fee Structure page"
```

---

### Task 7: Fee Ledger page

**Files:**
- Create: `src/pages/admin/FeeLedger.tsx`

**Interfaces:**
- Consumes: `getFeeLedger` from `@/api/feeLedger` (Task 3); `getStudentById` from `@/demo-data/people/students` (Phase 1a); `programByDepartment` from `@/demo-data/academics/departmentSeeds` (Phase 1a); `PageHeader`, `StatCard`, `DataTable`, `StatusChip` from `@/components/*`.
- Produces: default export consumed by `router.tsx` (Task 10) at `/admin/fees/ledger`.

- [ ] **Step 1: Create `src/pages/admin/FeeLedger.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Grid, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ErrorIcon from "@mui/icons-material/Error";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getFeeLedger } from "@/api/feeLedger";
import { getStudentById } from "@/demo-data/people/students";
import { programByDepartment } from "@/demo-data/academics/departmentSeeds";
import type { FeeLedgerEntry, FeeLedgerStatus } from "@/types";

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

const programs = Object.values(programByDepartment);

export default function FeeLedger() {
  const { mode } = useColorMode();
  const [rows, setRows] = useState<FeeLedgerEntry[]>([]);
  const [programFilter, setProgramFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<FeeLedgerStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getFeeLedger().then(setRows); }, []);

  const withStudent = rows.map((entry) => ({ entry, student: getStudentById(entry.studentId) })).filter((r) => !!r.student);

  const filtered = withStudent.filter(({ entry, student }) =>
    (programFilter === "all" || student!.program === programFilter) &&
    (statusFilter === "all" || entry.status === statusFilter) &&
    (search === "" || student!.name.toLowerCase().includes(search.toLowerCase()) || student!.rollNo.toLowerCase().includes(search.toLowerCase()))
  );

  const totalCollectible = rows.reduce((sum, e) => sum + e.totalFee, 0);
  const collected = rows.reduce((sum, e) => sum + e.paidAmount, 0);
  const pending = rows.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.balance, 0);
  const overdue = rows.filter((e) => e.status === "overdue").reduce((sum, e) => sum + e.balance, 0);

  const rowBg = (status: FeeLedgerStatus) =>
    status === "overdue" ? "rgba(231, 76, 60, 0.05)" : status === "pending" ? "rgba(230, 126, 34, 0.05)" : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Student Fee Ledger"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Fee Ledger Report... Download will start shortly.")}>Export Report</Button>
            <Button variant="contained" onClick={() => setSnackbar("Opening payment form...")}>Record Payment</Button>
          </Stack>
        }
      />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Collectible" icon={<AccountBalanceWalletIcon />} color={getIconAccent(mode, "collectible")} value={formatINR(totalCollectible)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Collected" icon={<CheckCircleIcon />} color={getIconAccent(mode, "collected")} value={formatINR(collected)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Pending" icon={<ScheduleIcon />} color={getIconAccent(mode, "pending")} value={formatINR(pending)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Overdue" icon={<ErrorIcon />} color={getIconAccent(mode, "overdue")} value={formatINR(overdue)} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Program</InputLabel>
          <Select label="Program" value={programFilter} onChange={(e: SelectChangeEvent) => setProgramFilter(e.target.value)}>
            <MenuItem value="all">All Programs</MenuItem>
            {programs.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select<FeeLedgerStatus | "all"> label="Status" value={statusFilter} onChange={(e: SelectChangeEvent<FeeLedgerStatus | "all">) => setStatusFilter(e.target.value as FeeLedgerStatus | "all")}>
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="overdue">Overdue</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search by student name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }} />
      </Stack>

      <DataTable<{ entry: FeeLedgerEntry; student: ReturnType<typeof getStudentById> }>
        pagination
        columns={[
          { key: "rollNo", label: "Roll No", render: (row) => row.student!.rollNo },
          { key: "name", label: "Student Name", render: (row) => row.student!.name },
          { key: "program", label: "Program", render: (row) => row.student!.program },
          { key: "total", label: "Total Fee", render: (row) => formatINR(row.entry.totalFee) },
          { key: "paid", label: "Paid", render: (row) => formatINR(row.entry.paidAmount) },
          { key: "balance", label: "Balance", render: (row) => formatINR(row.entry.balance) },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.entry.status} /> },
          {
            key: "actions", label: "Actions",
            render: (row) => <Button size="small" onClick={(e) => { e.stopPropagation(); setSnackbar("Loading student ledger..."); }}>View Ledger</Button>,
          },
        ]}
        rows={filtered}
        emptyTitle="No fee ledger entries found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

Note: this deliberately doesn't use `rowBg`/per-row background tinting via `DataTable`'s API, since `DataTable` doesn't expose a per-row `sx` hook. The Pending/Overdue tint from the original is a nice-to-have visual detail, not load-bearing content — `StatusChip`'s color-coded badge already conveys the same status information. If a future phase adds row-level styling support to `DataTable`, this is a natural place to use it.

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors (router.tsx is not touched until Task 10, so this new page has no consumer yet, but tsc still type-checks it).

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/FeeLedger.tsx
git commit -m "Add Fee Ledger page"
```

---

### Task 8: Payments page

**Files:**
- Create: `src/pages/admin/Payments.tsx`

**Interfaces:**
- Consumes: `getPayments` from `@/api/payments` (Task 4); `getStudentById` from `@/demo-data/people/students` (Phase 1a); `PageHeader`, `DataTable`, `StatusChip` from `@/components/*`.
- Produces: default export consumed by `router.tsx` (Task 10) at `/admin/fees/payments`.

- [ ] **Step 1: Create `src/pages/admin/Payments.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Box, Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getPayments } from "@/api/payments";
import { getStudentById } from "@/demo-data/people/students";
import type { Payment, PaymentMode } from "@/types";

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function Payments() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [modeFilter, setModeFilter] = useState<PaymentMode | "all">("all");
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getPayments().then(setRows); }, []);

  const filtered = rows.filter((p) => {
    const student = getStudentById(p.studentId);
    return (modeFilter === "all" || p.mode === modeFilter) &&
      (search === "" || !student || student.name.toLowerCase().includes(search.toLowerCase()) || student.rollNo.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Payments & Waivers"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Payment Records... Download will start shortly.")}>Export</Button>
            <Button variant="contained" onClick={() => setSnackbar("Opening payment form...")}>Record Payment</Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Payment management includes recording online and offline payments, payment gateway
        integration, receipt generation and printing, refund processing, scholarship and
        waiver management, and payment reminders and notifications.
      </Typography>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Payment Mode</InputLabel>
          <Select<PaymentMode | "all"> label="Payment Mode" value={modeFilter} onChange={(e: SelectChangeEvent<PaymentMode | "all">) => setModeFilter(e.target.value as PaymentMode | "all")}>
            <MenuItem value="all">All Payment Modes</MenuItem>
            <MenuItem value="online">Online</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="cheque">Cheque</MenuItem>
            <MenuItem value="dd">DD</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search payments..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }} />
      </Stack>

      <DataTable<Payment>
        pagination
        columns={[
          { key: "id", label: "Receipt No" },
          { key: "date", label: "Date" },
          {
            key: "student", label: "Student",
            render: (row) => {
              const student = getStudentById(row.studentId);
              return (
                <Box>
                  <Typography variant="body2">{student?.name ?? row.studentId}</Typography>
                  <Typography variant="caption" color="text.secondary">{student?.rollNo}</Typography>
                </Box>
              );
            },
          },
          { key: "amount", label: "Amount", render: (row) => formatINR(row.amount) },
          { key: "mode", label: "Mode", render: (row) => row.mode.toUpperCase() },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          {
            key: "actions", label: "Actions",
            render: () => (
              <Stack direction="row" spacing={0.5}>
                <Button size="small" onClick={(e) => { e.stopPropagation(); setSnackbar("Printing receipt..."); }}>Print</Button>
                <Button size="small" onClick={(e) => { e.stopPropagation(); setSnackbar("Loading payment details..."); }}>View</Button>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No payments found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors (router.tsx is not touched until Task 10, so this new page has no consumer yet, but tsc still type-checks it).

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Payments.tsx
git commit -m "Add Payments page"
```

---

### Task 9: Wire Overview Dashboard's Fee Collection KPI

**Files:**
- Modify: `src/pages/admin/Dashboard.tsx`

**Interfaces:**
- Consumes: `getFeeLedger` from `@/api/feeLedger` (Task 3).

- [ ] **Step 1: Add the `getFeeLedger` import**

Add to the existing import block in `src/pages/admin/Dashboard.tsx`:

```tsx
import { getFeeLedger } from "@/api/feeLedger";
```

- [ ] **Step 2: Add fee-collection state and fetch it alongside the existing data**

Find this existing block (as it stands after Phase 1b's Task 10):

```tsx
  const [examCount, setExamCount] = useState(0);

  useEffect(() => {
    let live = true;
    getStudents().then((data) => { if (live) setStudents(data); });
    getFaculty().then((data) => { if (live) setFaculty(data); });
    getActivityLog().then((data) => { if (live) setActivity(data); });
    getExams().then((data) => { if (live) setExamCount(data.length); });
    return () => { live = false; };
  }, []);
```

Replace it with:

```tsx
  const [examCount, setExamCount] = useState(0);
  const [feeCollected, setFeeCollected] = useState(0);

  useEffect(() => {
    let live = true;
    getStudents().then((data) => { if (live) setStudents(data); });
    getFaculty().then((data) => { if (live) setFaculty(data); });
    getActivityLog().then((data) => { if (live) setActivity(data); });
    getExams().then((data) => { if (live) setExamCount(data.length); });
    getFeeLedger().then((data) => { if (live) setFeeCollected(data.reduce((sum, e) => sum + e.paidAmount, 0)); });
    return () => { live = false; };
  }, []);
```

- [ ] **Step 3: Use the real value in the Fee Collection KPI card**

Find:

```tsx
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Fee Collection" icon={<PaymentIcon />} color={getIconAccent(mode, "fees")} value="₹3.2 Cr" />
        </Grid>
```

Replace with:

```tsx
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Fee Collection" icon={<PaymentIcon />} color={getIconAccent(mode, "fees")} value={`₹${(feeCollected / 10000000).toFixed(1)} Cr`} />
        </Grid>
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors — `Dashboard.tsx` is already wired into the router from Phase 1a, and `@/api/feeLedger` already exists from Task 3.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/Dashboard.tsx
git commit -m "Wire Overview's Fee Collection KPI to real data"
```

---

### Task 10: Navigation Finance group + router wiring

**Files:**
- Modify: `src/components/navigation.tsx`
- Modify: `src/router.tsx`

**Interfaces:**
- Consumes: default exports from `FeeStructure.tsx` (Task 6), `FeeLedger.tsx` (Task 7), `Payments.tsx` (Task 8).
- Produces: updated `getNavItems("admin")` with a Finance group; 3 new routes registered in `router.tsx`.

- [ ] **Step 1: Add the Finance group to the `"admin"` case**

Find the existing (Phase 1b) admin case in `src/components/navigation.tsx`:

```tsx
        { label: "Results", path: "/admin/results", icon: <AssessmentIcon />, group: "Academics" },
        { label: "Users", path: "/admin/users", icon: <PeopleIcon />, group: "Administration" },
```

Replace it with:

```tsx
        { label: "Results", path: "/admin/results", icon: <AssessmentIcon />, group: "Academics" },
        { label: "Fee Structure", path: "/admin/fees/structure", icon: <PaymentIcon />, group: "Finance" },
        { label: "Student Fee Ledger", path: "/admin/fees/ledger", icon: <AccountBalanceWalletIcon />, group: "Finance" },
        { label: "Payments & Waivers", path: "/admin/fees/payments", icon: <ReceiptIcon />, group: "Finance" },
        { label: "Users", path: "/admin/users", icon: <PeopleIcon />, group: "Administration" },
```

Add the 3 new icon imports to the existing icon-import block:

```tsx
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptIcon from "@mui/icons-material/Receipt";
```

- [ ] **Step 2: Add the 3 new lazy imports to `router.tsx`**

Add to the existing admin lazy-import block in `src/router.tsx`:

```tsx
const AdminFeeStructure = lazy(() => import("@/pages/admin/FeeStructure"));
const AdminFeeLedger = lazy(() => import("@/pages/admin/FeeLedger"));
const AdminPayments = lazy(() => import("@/pages/admin/Payments"));
```

- [ ] **Step 3: Add the 3 new routes**

Find:

```tsx
      { path: "admin/results", element: <AdminResults /> },
      { path: "teacher", element: <TeacherDashboard /> },
```

Replace with:

```tsx
      { path: "admin/results", element: <AdminResults /> },
      { path: "admin/fees/structure", element: <AdminFeeStructure /> },
      { path: "admin/fees/ledger", element: <AdminFeeLedger /> },
      { path: "admin/fees/payments", element: <AdminPayments /> },
      { path: "teacher", element: <TeacherDashboard /> },
```

- [ ] **Step 4: Verify the full project builds**

Run: `npm run build`
Expected: `tsc -b` reports no errors, `vite build` completes with `✓ built in <time>`. No more "Cannot find module" errors — every page referenced by the router now exists.

- [ ] **Step 5: Commit**

```bash
git add src/components/navigation.tsx src/router.tsx
git commit -m "Wire Admin Finance navigation and routes"
```

---

### Task 11: End-to-end manual verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Vite prints a local URL.

- [ ] **Step 2: Log in as Admin and verify the sidebar Finance group**

Navigate to the printed URL, select the Admin portal, sign in with any
credentials. Confirm the sidebar now shows a "Finance" group header
between "Academics" and "Administration", containing Fee Structure,
Student Fee Ledger, and Payments & Waivers.

- [ ] **Step 3: Verify Fee Structure**

Navigate to Fee Structure. Confirm the table shows 20 rows (paginated)
with Program/Year/Tuition/Hostel/Transport/Other/Total columns all
populated with real, varied numbers. Click "Edit" on two different
rows and confirm each modal shows that row's own program/year/fee
values (not always the same one). Save one change and confirm the
table reflects it. Click "Add Fee Structure", fill it out, submit,
confirm a new row appears.

- [ ] **Step 4: Verify Fee Ledger**

Navigate to Student Fee Ledger. Confirm the 4 KPI cards show real
currency values (Total Collectible should be noticeably larger than
Collected, which should be noticeably larger than Pending or
Overdue). Confirm the table shows real students (cross-check a name
against the Students page) with correct Program/Total/Paid/Balance
math (`Total - Paid = Balance` for at least 2 spot-checked rows).
Use the Program filter, Status filter, and search box one at a time
and confirm the row set actually narrows each time.

- [ ] **Step 5: Verify Payments**

Navigate to Payments & Waivers. Confirm the table shows 40 rows
(paginated) with real student names/roll numbers, receipt numbers,
dates, and amounts. Use the Payment Mode filter and confirm it
actually filters. Click "Record Payment" on this page and on Fee
Ledger and confirm both show the "Opening payment form..."
notification.

- [ ] **Step 6: Verify Overview's updated Fee Collection KPI**

Navigate to Dashboard. Confirm "Fee Collection" now shows a computed
`₹X.X Cr` value rather than the previous static `₹3.2 Cr`.

- [ ] **Step 7: Verify dark mode**

Toggle dark mode from any of the 3 new pages and confirm the tables,
KPI cards, and status chips all remain legible.

- [ ] **Step 8: Run the linter**

Run: `npm run lint`
Expected: no errors (only the pre-existing `AuthContext.tsx` fast-refresh warning from Phase 0).

- [ ] **Step 9: Stop the dev server, then commit**

No files change in this task unless Step 8 required fixes; if it did,
amend those specific files, then:

```bash
git add -A
git commit -m "Verify Phase 1c end-to-end"
```

(Skip this commit entirely if Step 8 required no changes.)
