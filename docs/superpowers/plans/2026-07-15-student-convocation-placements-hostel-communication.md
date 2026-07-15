# Student / Convocation, Fellowship, Placements, Hostel, Resources, Reports, Communication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `student.html`'s remaining 8 pages (Convocation, Fellowship, Placements, Hostel & Mess, Facility & Resource Booking, Reports, Notices, Messages) into `app/` as Phase 4b — the **final phase** of the entire rewrite. Once complete, `student.html` is deleted.

**Architecture:** Same fake-async-API layer as every prior phase. No role-switcher — single student identity, reusing Phase 4a's `studentProfile` where relevant.

**Tech Stack:** React 19, TypeScript 5.8, MUI v7, react-router-dom v7, `motion` v12, Vite 6.

## Global Constraints

- `StudentNotice`/`StudentMessage` are distinct from the existing shared `Notice`/`Message`/`MessageContact` types (topbar badge and Teacher Phase 2a) — never reuse those.
- `downloadFile`-equivalent actions stay stub `Snackbar`s everywhere (no real files exist to download in the source).
- Every new demo-data module owns its own independent hand-authored array (no `createRng` needed at this scale, matching Teacher's `requests.ts`/`calendar.ts` style).
- All reads/writes go through `simulateRequest`.
- Verify with `npm run build` (run from `app/`) after every task; commit every task individually.
- **This is the final plan in the entire rewrite** — Task 18 deletes `student.html`, completing the migration.

---

### Task 1: Type definitions

**Files:**
- Modify: `app/src/types/index.ts` (append at the end of the file)

**Interfaces:**
- Produces: `StudentScholarship`, `ScholarshipAppStatus`, `ScholarshipApplication`, `PlacementDrive`, `PlacementAppStatus`, `PlacementApplication`, `HostelRequestType`, `HostelRequestStatus`, `HostelRequest`, `ResourceBookingStatus`, `ResourceBooking`, `StudentNoticeCategory`, `StudentNoticeUrgency`, `StudentNotice`, `StudentMessage`.

- [ ] **Step 1: Append new types**

```ts
// --- Student / Convocation, Fellowship, Placements, Hostel, Resources, Reports, Communication (Phase 4b) ---

export interface StudentScholarship {
  name: string;
  amount: number;
  eligibility: string;
  deadline: string;
  applied: boolean;
}

export type ScholarshipAppStatus = "pending" | "approved" | "rejected";
export interface ScholarshipApplication {
  name: string;
  appliedOn: string;
  status: ScholarshipAppStatus;
}

export interface PlacementDrive {
  company: string;
  role: string;
  ctc: string;
  date: string;
  eligibility: string;
}

export type PlacementAppStatus = "applied" | "shortlisted" | "rejected" | "selected";
export interface PlacementApplication {
  company: string;
  role: string;
  appliedOn: string;
  status: PlacementAppStatus;
}

export type HostelRequestType = "room_change" | "maintenance" | "leave" | "visitor_pass" | "lost_item";
export type HostelRequestStatus = "pending" | "in_progress" | "resolved";
export interface HostelRequest {
  id: string;
  type: HostelRequestType;
  details: string;
  submittedOn: string;
  status: HostelRequestStatus;
  timeline: { time: string; action: string }[];
}

export type ResourceBookingStatus = "confirmed" | "pending";
export interface ResourceBooking {
  id: string;
  resourceName: string;
  date: string;
  timeSlot: string;
  purpose: string;
  status: ResourceBookingStatus;
}

export type StudentNoticeCategory = "academic" | "hostel" | "placement" | "library" | "general";
export type StudentNoticeUrgency = "urgent" | "important" | "normal";
export interface StudentNotice {
  id: string;
  title: string;
  body: string;
  date: string;
  author: string;
  category: StudentNoticeCategory;
  urgency: StudentNoticeUrgency;
  read: boolean;
}

export interface StudentMessage {
  id: string;
  from: string;
  subject: string;
  category: string;
  timeAgo: string;
  body: string;
  read: boolean;
}
```

- [ ] **Step 2: Verify build** — `npm run build` (from `app/`), expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/types/index.ts
git commit -m "Add Phase 4b (Student final sections) type definitions"
```

---

### Task 2: Scholarships demo data + API

**Files:**
- Create: `app/src/demo-data/student/scholarships.ts`
- Create: `app/src/api/studentScholarships.ts`

**Interfaces:**
- Produces: `getScholarships()`, `getScholarshipApplications()`, `applyScholarship(name)` — consumed by Task 10 (Fellowship page).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/student/scholarships.ts
import type { StudentScholarship, ScholarshipApplication } from "@/types";

export const scholarships: StudentScholarship[] = [
  { name: "Merit Scholarship", amount: 50000, eligibility: "CGPA >= 8.5", deadline: "2026-08-30", applied: true },
  { name: "Need-Based Grant", amount: 30000, eligibility: "Family income below ₹5,00,000/year", deadline: "2026-09-15", applied: false },
  { name: "Sports Excellence Award", amount: 20000, eligibility: "State/National level sports achievement", deadline: "2026-09-01", applied: false },
];

export const scholarshipApplications: ScholarshipApplication[] = [
  { name: "Merit Scholarship", appliedOn: "2025-08-15", status: "approved" },
];
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/studentScholarships.ts
import { simulateRequest } from "@/api/http";
import { scholarships, scholarshipApplications } from "@/demo-data/student/scholarships";
import type { StudentScholarship, ScholarshipApplication } from "@/types";

export function getScholarships(): Promise<StudentScholarship[]> {
  return simulateRequest(scholarships);
}

export function getScholarshipApplications(): Promise<ScholarshipApplication[]> {
  return simulateRequest(scholarshipApplications);
}

export function applyScholarship(name: string): Promise<void> {
  const row = scholarships.find((s) => s.name === name);
  if (row) row.applied = true;
  scholarshipApplications.unshift({ name, appliedOn: new Date().toISOString().slice(0, 10), status: "pending" });
  return simulateRequest(undefined);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/student/scholarships.ts app/src/api/studentScholarships.ts
git commit -m "Add student scholarships demo data and API"
```

---

### Task 3: Placements demo data + API

**Files:**
- Create: `app/src/demo-data/student/placements.ts`
- Create: `app/src/api/studentPlacements.ts`

**Interfaces:**
- Produces: `getPlacementDrives()`, `getPlacementApplications()`, `applyPlacement(company, role)` — consumed by Task 11 (Placements page).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/student/placements.ts
import type { PlacementDrive, PlacementApplication } from "@/types";

export const placementDrives: PlacementDrive[] = [
  { company: "Microsoft", role: "Software Engineer", ctc: "₹28 LPA", date: "2026-08-20", eligibility: "CGPA >= 7.5, no active backlogs" },
  { company: "TCS", role: "Systems Engineer", ctc: "₹7 LPA", date: "2026-08-25", eligibility: "CGPA >= 6.0" },
];

export const placementApplications: PlacementApplication[] = [
  { company: "Amazon", role: "SDE-1", appliedOn: "2026-06-10", status: "shortlisted" },
];
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/studentPlacements.ts
import { simulateRequest } from "@/api/http";
import { placementDrives, placementApplications } from "@/demo-data/student/placements";
import type { PlacementDrive, PlacementApplication } from "@/types";

export function getPlacementDrives(): Promise<PlacementDrive[]> {
  return simulateRequest(placementDrives);
}

export function getPlacementApplications(): Promise<PlacementApplication[]> {
  return simulateRequest(placementApplications);
}

export function applyPlacement(company: string, role: string): Promise<void> {
  placementApplications.unshift({ company, role, appliedOn: new Date().toISOString().slice(0, 10), status: "applied" });
  return simulateRequest(undefined);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/student/placements.ts app/src/api/studentPlacements.ts
git commit -m "Add student placements demo data and API"
```

---

### Task 4: Hostel demo data + API

**Files:**
- Create: `app/src/demo-data/student/hostel.ts`
- Create: `app/src/api/studentHostel.ts`

**Interfaces:**
- Produces: `getHostelRequests()`, `getHostelRequestById(id)`, `submitHostelRequest(type, details)`, `getMealPlan()`, `updateMealPlan(plan)` — consumed by Task 12 (Hostel page). Fixes the source's `trackRequest` ID-ignored bug (each request keeps its own real `timeline`).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/student/hostel.ts
import type { HostelRequest } from "@/types";

function tl(time: string, action: string) {
  return { time, action };
}

export const hostelRequests: HostelRequest[] = [
  { id: "HR-001", type: "maintenance", details: "AC not cooling properly in Room A-205", submittedOn: "2026-07-05", status: "in_progress", timeline: [tl("2026-07-05", "Request submitted"), tl("2026-07-06", "Assigned to maintenance staff"), tl("2026-07-08", "Technician visited, replacement part on order")] },
  { id: "HR-002", type: "visitor_pass", details: "Visitor pass for parents, 2026-07-20 to 2026-07-22", submittedOn: "2026-07-12", status: "resolved", timeline: [tl("2026-07-12", "Request submitted"), tl("2026-07-13", "Approved by warden")] },
];

export function nextHostelRequestId(): string {
  const max = hostelRequests.reduce((m, r) => Math.max(m, Number(r.id.split("-")[1])), 0);
  return `HR-${String(max + 1).padStart(3, "0")}`;
}

export const messState = { mealPlan: "Standard" };
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/studentHostel.ts
import { simulateRequest } from "@/api/http";
import { hostelRequests, nextHostelRequestId, messState } from "@/demo-data/student/hostel";
import type { HostelRequest, HostelRequestType } from "@/types";

export function getHostelRequests(): Promise<HostelRequest[]> {
  return simulateRequest(hostelRequests);
}

export function getHostelRequestById(id: string): Promise<HostelRequest | undefined> {
  return simulateRequest(hostelRequests.find((r) => r.id === id));
}

export function submitHostelRequest(type: HostelRequestType, details: string): Promise<HostelRequest> {
  const request: HostelRequest = {
    id: nextHostelRequestId(),
    type,
    details,
    submittedOn: new Date().toISOString().slice(0, 10),
    status: "pending",
    timeline: [{ time: new Date().toISOString().slice(0, 10), action: "Request submitted" }],
  };
  hostelRequests.unshift(request);
  return simulateRequest(request);
}

export function getMealPlan(): Promise<string> {
  return simulateRequest(messState.mealPlan);
}

export function updateMealPlan(plan: string): Promise<void> {
  messState.mealPlan = plan;
  return simulateRequest(undefined);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/student/hostel.ts app/src/api/studentHostel.ts
git commit -m "Add student hostel demo data and API"
```

---

### Task 5: Resources demo data + API

**Files:**
- Create: `app/src/demo-data/student/resources.ts`
- Create: `app/src/api/studentResources.ts`

**Interfaces:**
- Produces: `getFacilityCatalog()`, `getEquipmentCatalog()`, `getResourceBookings()`, `bookResource(resourceName, date, timeSlot, purpose)` — consumed by Task 13 (Resources page).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/student/resources.ts
import type { ResourceBooking } from "@/types";

export const facilityCatalog = ["Auditorium", "Conference Room", "Computer Lab", "Sports Complex"];
export const equipmentCatalog = ["Projector", "Laptop", "Camera", "Sound System"];

export const resourceBookings: ResourceBooking[] = [
  { id: "RB-001", resourceName: "Computer Lab", date: "2026-07-18", timeSlot: "10:00 - 12:00", purpose: "Group project work", status: "confirmed" },
];

export function nextBookingId(): string {
  const max = resourceBookings.reduce((m, b) => Math.max(m, Number(b.id.split("-")[1])), 0);
  return `RB-${String(max + 1).padStart(3, "0")}`;
}
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/studentResources.ts
import { simulateRequest } from "@/api/http";
import { facilityCatalog, equipmentCatalog, resourceBookings, nextBookingId } from "@/demo-data/student/resources";
import type { ResourceBooking } from "@/types";

export function getFacilityCatalog(): Promise<string[]> {
  return simulateRequest(facilityCatalog);
}

export function getEquipmentCatalog(): Promise<string[]> {
  return simulateRequest(equipmentCatalog);
}

export function getResourceBookings(): Promise<ResourceBooking[]> {
  return simulateRequest(resourceBookings);
}

export function bookResource(resourceName: string, date: string, timeSlot: string, purpose: string): Promise<ResourceBooking> {
  const booking: ResourceBooking = { id: nextBookingId(), resourceName, date, timeSlot, purpose, status: "confirmed" };
  resourceBookings.unshift(booking);
  return simulateRequest(booking);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/student/resources.ts app/src/api/studentResources.ts
git commit -m "Add student facility/resource booking demo data and API"
```

---

### Task 6: Notices demo data + API

**Files:**
- Create: `app/src/demo-data/student/notices.ts`
- Create: `app/src/api/studentNotices.ts`

**Interfaces:**
- Produces: `getStudentNotices()`, `markNoticeRead(id)`, `markAllNoticesRead()` — consumed by Task 14 (Notices page). Fixes the source's `viewNotice` ID-ignored bug (each notice keeps its own real `body`) and `markAllRead`/`filterNotices` no-ops.

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/student/notices.ts
import type { StudentNotice } from "@/types";

export const studentNotices: StudentNotice[] = [
  { id: "SN-001", title: "Semester Examination Schedule Released", body: "The semester 6 examination schedule has been published. Please check the Exams & Results page for your subject-wise timetable.", date: "2026-07-10", author: "Examination Cell", category: "academic", urgency: "urgent", read: false },
  { id: "SN-002", title: "Hostel Fee Payment Reminder", body: "Semester 7 hostel fee payment is due by 2026-08-15. Late payments will attract a fine.", date: "2026-07-08", author: "Hostel Office", category: "hostel", urgency: "important", read: false },
  { id: "SN-003", title: "TCS Campus Placement Drive", body: "TCS will be conducting a campus placement drive on 2026-08-25. Eligible students must register by 2026-08-20.", date: "2026-07-05", author: "Placement Cell", category: "placement", urgency: "normal", read: false },
  { id: "SN-004", title: "Library Book Return Reminder", body: "Please return all overdue library books by 2026-07-20 to avoid fines.", date: "2026-07-01", author: "Library", category: "library", urgency: "normal", read: true },
];
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/studentNotices.ts
import { simulateRequest } from "@/api/http";
import { studentNotices } from "@/demo-data/student/notices";
import type { StudentNotice } from "@/types";

export function getStudentNotices(): Promise<StudentNotice[]> {
  return simulateRequest(studentNotices);
}

export function markNoticeRead(id: string): Promise<void> {
  const row = studentNotices.find((n) => n.id === id);
  if (row) row.read = true;
  return simulateRequest(undefined);
}

export function markAllNoticesRead(): Promise<void> {
  studentNotices.forEach((n) => { n.read = true; });
  return simulateRequest(undefined);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/student/notices.ts app/src/api/studentNotices.ts
git commit -m "Add student notices demo data and API"
```

---

### Task 7: Messages demo data + API

**Files:**
- Create: `app/src/demo-data/student/messages.ts`
- Create: `app/src/api/studentMessages.ts`

**Interfaces:**
- Produces: `getStudentMessages()`, `markMessageRead(id)`, `sendStudentMessage(recipient, subject, category, body)` — consumed by Task 15 (Messages page). Fixes the source's 5 identical Quick Contact wrappers (recipient is now a real parameter).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/student/messages.ts
import type { StudentMessage } from "@/types";

export const studentMessages: StudentMessage[] = [
  { id: "MSG001", from: "Dr. Priya Menon (Instructor)", subject: "Regarding Assignment 3 Submission", category: "academic", timeAgo: "2 hours ago", body: "Hi Rahul, I noticed your Assignment 3 submission is pending. Please submit it by tomorrow to avoid a late penalty.", read: false },
  { id: "MSG002", from: "Warden Office", subject: "Room Inspection Notice", category: "hostel", timeAgo: "1 day ago", body: "Routine room inspection is scheduled for this Friday. Please ensure your room is tidy.", read: false },
  { id: "MSG003", from: "Placement Cell", subject: "Resume Review Feedback", category: "placement", timeAgo: "2 days ago", body: "Your resume has been reviewed. A few suggestions have been noted — please check the placement portal for details.", read: true },
  { id: "MSG004", from: "Library", subject: "Book Reservation Confirmed", category: "library", timeAgo: "3 days ago", body: "Your reservation for 'Introduction to Algorithms' has been confirmed. Please collect it within 2 days.", read: true },
];

export function nextMessageId(): string {
  const max = studentMessages.reduce((m, msg) => Math.max(m, Number(msg.id.replace("MSG", ""))), 0);
  return `MSG${String(max + 1).padStart(3, "0")}`;
}
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/studentMessages.ts
import { simulateRequest } from "@/api/http";
import { studentMessages, nextMessageId } from "@/demo-data/student/messages";
import type { StudentMessage } from "@/types";

export function getStudentMessages(): Promise<StudentMessage[]> {
  return simulateRequest(studentMessages);
}

export function markMessageRead(id: string): Promise<void> {
  const row = studentMessages.find((m) => m.id === id);
  if (row) row.read = true;
  return simulateRequest(undefined);
}

export function sendStudentMessage(recipient: string, subject: string, category: string, body: string): Promise<StudentMessage> {
  const message: StudentMessage = { id: nextMessageId(), from: `You (to ${recipient})`, subject, category, timeAgo: "just now", body, read: true };
  studentMessages.unshift(message);
  return simulateRequest(message);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/student/messages.ts app/src/api/studentMessages.ts
git commit -m "Add student messages demo data and API"
```

---

### Task 8: StatusChip additions

**Files:**
- Modify: `app/src/components/StatusChip.tsx`

**Interfaces:**
- Produces: `STATUS_MAP.shortlisted`, `STATUS_MAP.selected`, `STATUS_MAP.confirmed` — consumed by Tasks 11 and 13. (`pending`/`approved`/`rejected`/`applied`-as-`pending`/`in_progress`/`resolved`/`read`/`unread` already exist and are reused.)

- [ ] **Step 1: Add the entries**

In `app/src/components/StatusChip.tsx`, add to `STATUS_MAP` (after the `fail` entry):

```ts
  // Placements
  shortlisted: { label: "Shortlisted", color: statusTokens.warning, icon: HourglassTopIcon },
  selected: { label: "Selected", color: statusTokens.good, icon: CheckCircleIcon },
  // Resource bookings
  confirmed: { label: "Confirmed", color: statusTokens.good, icon: CheckCircleIcon },
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/StatusChip.tsx
git commit -m "Add shortlisted/selected/confirmed StatusChip entries"
```

---

### Task 9: Convocation page

**Files:**
- Create: `app/src/pages/student/Convocation.tsx`

**Interfaces:**
- Consumes: nothing new (static eligibility table + a self-contained request dialog). Fixes the source's `requestDocument('Provisional Certificate')` missing-forms-map bug with a real dialog, matching Phase 4a's Fee Clearance Certificate treatment.

- [ ] **Step 1: Create the page**

```tsx
import { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Paper, Stack, TextField, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";

const eligibility = [
  { criteria: "Minimum CGPA of 6.0", status: "approved" },
  { criteria: "No pending backlogs", status: "approved" },
  { criteria: "No disciplinary action", status: "approved" },
  { criteria: "Fee clearance", status: "pending" },
];

export default function Convocation() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const handleSubmit = () => {
    setOpen(false);
    setReason("");
    setSnackbar("Provisional Certificate request submitted");
  };

  return (
    <>
      <PageHeader eyebrow="Convocation" title="Convocation" />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600}>Convocation Status</Typography>
        <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>PENDING</Typography>
        <Typography variant="body2" color="text.secondary">Expected convocation: May 2027</Typography>
      </Paper>
      <DataTable
        title="Eligibility Criteria"
        columns={[
          { key: "criteria", label: "Criteria" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={eligibility}
        emptyTitle="No eligibility data found"
      />
      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
        <Button variant="contained" onClick={() => setOpen(true)}>Request Provisional Certificate</Button>
        <Button variant="outlined" onClick={() => setSnackbar("Convocation guidelines download is not available in this demo")}>Download Guidelines</Button>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Provisional Certificate</DialogTitle>
        <DialogContent>
          <TextField label="Purpose" fullWidth multiline minRows={2} sx={{ mt: 1 }} value={reason} onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/student/Convocation.tsx
git commit -m "Add Convocation page"
```

---

### Task 10: Fellowship page

**Files:**
- Create: `app/src/pages/student/Fellowship.tsx`

**Interfaces:**
- Consumes: `getScholarships()`, `getScholarshipApplications()`, `applyScholarship()` (Task 2).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Paper, Snackbar, Typography } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getScholarships, getScholarshipApplications, applyScholarship } from "@/api/studentScholarships";
import type { StudentScholarship, ScholarshipApplication } from "@/types";

export default function Fellowship() {
  const [scholarships, setScholarships] = useState<StudentScholarship[]>([]);
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => {
    getScholarships().then(setScholarships);
    getScholarshipApplications().then(setApplications);
  };
  useEffect(() => { load(); }, []);

  const handleApply = (name: string) => applyScholarship(name).then(() => { load(); setSnackbar(`Applied for ${name}`); });

  return (
    <>
      <PageHeader eyebrow="Fellowship" title="Fellowship & Scholarships" />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600}>Current Scholarship</Typography>
        <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>Merit Scholarship — ₹50,000/year</Typography>
        <Typography variant="body2" color="text.secondary">Active since 2025-08-15</Typography>
      </Paper>
      <DataTable<StudentScholarship>
        title="Available Scholarships"
        columns={[
          { key: "name", label: "Name" },
          { key: "amount", label: "Amount", render: (row) => `₹${row.amount.toLocaleString("en-IN")}` },
          { key: "eligibility", label: "Eligibility" },
          { key: "deadline", label: "Deadline" },
          { key: "actions", label: "Action", render: (row) => <Button size="small" disabled={row.applied} onClick={() => handleApply(row.name)}>{row.applied ? "Applied" : "Apply"}</Button> },
        ]}
        rows={scholarships}
        emptyTitle="No scholarships available"
      />
      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>Application History</Typography>
      <DataTable<ScholarshipApplication>
        columns={[
          { key: "name", label: "Scholarship" },
          { key: "appliedOn", label: "Applied On" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={applications}
        emptyTitle="No applications yet"
      />
      <Button variant="outlined" sx={{ mt: 3 }} onClick={() => setSnackbar("Scholarship guidelines download is not available in this demo")}>Download Guidelines</Button>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/student/Fellowship.tsx
git commit -m "Add Fellowship page with functional scholarship applications"
```

---

### Task 11: Placements page

**Files:**
- Create: `app/src/pages/student/Placements.tsx`

**Interfaces:**
- Consumes: `getPlacementDrives()`, `getPlacementApplications()`, `applyPlacement()` (Task 3).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Grid, LinearProgress, Paper, Snackbar, Typography } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getPlacementDrives, getPlacementApplications, applyPlacement } from "@/api/studentPlacements";
import type { PlacementDrive, PlacementApplication } from "@/types";
import WorkIcon from "@mui/icons-material/Work";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

export default function Placements() {
  const { mode } = useColorMode();
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => {
    getPlacementDrives().then(setDrives);
    getPlacementApplications().then(setApplications);
  };
  useEffect(() => { load(); }, []);

  const hasApplied = (company: string) => applications.some((a) => a.company === company);
  const handleApply = (drive: PlacementDrive) => applyPlacement(drive.company, drive.role).then(() => { load(); setSnackbar(`Applied to ${drive.company}`); });

  return (
    <>
      <PageHeader eyebrow="Placements" title="Placements" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Upcoming Drives" icon={<WorkIcon />} color={getIconAccent(mode, "drives")} numericValue={drives.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="My Applications" icon={<AssignmentTurnedInIcon />} color={getIconAccent(mode, "applications")} numericValue={applications.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Profile Completion" icon={<AssignmentTurnedInIcon />} color={getIconAccent(mode, "profile-completion")} value="85%" />
        </Grid>
      </Grid>
      <DataTable<PlacementDrive>
        title="Upcoming Drives"
        columns={[
          { key: "company", label: "Company" },
          { key: "role", label: "Role" },
          { key: "ctc", label: "CTC" },
          { key: "date", label: "Date" },
          { key: "eligibility", label: "Eligibility" },
          { key: "actions", label: "Action", render: (row) => <Button size="small" disabled={hasApplied(row.company)} onClick={() => handleApply(row)}>{hasApplied(row.company) ? "Applied" : "Apply"}</Button> },
        ]}
        rows={drives}
        emptyTitle="No upcoming drives"
      />
      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>My Applications</Typography>
      <DataTable<PlacementApplication>
        columns={[
          { key: "company", label: "Company" },
          { key: "role", label: "Role" },
          { key: "appliedOn", label: "Applied On" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={applications}
        emptyTitle="No applications yet"
      />
      <Paper elevation={0} sx={{ p: 3, mt: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Profile Completion</Typography>
        <LinearProgress variant="determinate" value={85} sx={{ height: 8, borderRadius: 4 }} />
      </Paper>
      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        <Grid><Button variant="outlined" onClick={() => setSnackbar("Placement profile editing is not available in this demo")}>Update Placement Profile</Button></Grid>
        <Grid><Button variant="outlined" onClick={() => setSnackbar("Resume download is not available in this demo")}>Download Resume</Button></Grid>
        <Grid><Button variant="outlined" onClick={() => setSnackbar("Placement calendar is not available in this demo")}>View Placement Calendar</Button></Grid>
      </Grid>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/student/Placements.tsx
git commit -m "Add Placements page with functional applications"
```

---

### Task 12: Hostel & Mess page

**Files:**
- Create: `app/src/pages/student/Hostel.tsx`

**Interfaces:**
- Consumes: `getHostelRequests()`, `submitHostelRequest()`, `getMealPlan()`, `updateMealPlan()` (Task 4). Fixes the source's `trackRequest` ID-ignored bug — clicking different requests shows each one's own real timeline.

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getHostelRequests, submitHostelRequest, getMealPlan, updateMealPlan } from "@/api/studentHostel";
import type { HostelRequest, HostelRequestType } from "@/types";

const requestTypeLabels: Record<HostelRequestType, string> = {
  room_change: "Room Change",
  maintenance: "Maintenance",
  leave: "Leave Application",
  visitor_pass: "Visitor Pass",
  lost_item: "Lost Item Report",
};

export default function Hostel() {
  const [requests, setRequests] = useState<HostelRequest[]>([]);
  const [mealPlan, setMealPlan] = useState("Standard");
  const [formOpen, setFormOpen] = useState<HostelRequestType | null>(null);
  const [details, setDetails] = useState("");
  const [selected, setSelected] = useState<HostelRequest | null>(null);
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getHostelRequests().then(setRequests);
  useEffect(() => { load(); getMealPlan().then(setMealPlan); }, []);

  const pendingCount = requests.filter((r) => r.status === "pending" || r.status === "in_progress").length;

  const handleSubmitRequest = () => {
    if (!formOpen || !details) { setSnackbar("Please describe your request"); return; }
    submitHostelRequest(formOpen, details).then(() => { load(); setFormOpen(null); setDetails(""); setSnackbar("Request submitted"); });
  };

  const handleSaveMealPlan = (plan: string) => updateMealPlan(plan).then(() => { setMealPlan(plan); setMealDialogOpen(false); setSnackbar("Meal plan updated"); });

  return (
    <>
      <PageHeader eyebrow="Hostel & Mess" title="Hostel & Mess" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 3 }}><Paper elevation={0} sx={{ p: 2.5 }}><Typography variant="caption" color="text.secondary">Room</Typography><Typography variant="h6" fontWeight={700}>A-205</Typography></Paper></Grid>
        <Grid size={{ xs: 12, sm: 3 }}><Paper elevation={0} sx={{ p: 2.5 }}><Typography variant="caption" color="text.secondary">Mess Balance</Typography><Typography variant="h6" fontWeight={700}>₹2,350</Typography></Paper></Grid>
        <Grid size={{ xs: 12, sm: 3 }}><Paper elevation={0} sx={{ p: 2.5 }}><Typography variant="caption" color="text.secondary">Pending Requests</Typography><Typography variant="h6" fontWeight={700}>{pendingCount}</Typography></Paper></Grid>
        <Grid size={{ xs: 12, sm: 3 }}><Paper elevation={0} sx={{ p: 2.5 }}><Typography variant="caption" color="text.secondary">Hostel Score</Typography><Typography variant="h6" fontWeight={700}>8.5/10</Typography></Paper></Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, mb: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Mess Details</Typography>
            <Typography variant="body2">Current Plan: <strong>{mealPlan}</strong></Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
              <Button variant="outlined" onClick={() => setMealDialogOpen(true)}>Change Meal Plan</Button>
              <Button variant="outlined" onClick={() => setSnackbar("Mess menu preview is not available in this demo")}>View Mess Menu</Button>
              <Button variant="outlined" onClick={() => setSnackbar("Mess bill download is not available in this demo")}>Download Mess Bill</Button>
            </Stack>
          </Paper>

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Quick Actions</Typography>
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            {(Object.keys(requestTypeLabels) as HostelRequestType[]).map((type) => (
              <Grid key={type}><Button variant="outlined" onClick={() => setFormOpen(type)}>{requestTypeLabels[type]}</Button></Grid>
            ))}
            <Grid><Button variant="outlined" onClick={() => setSnackbar("Room photos preview is not available in this demo")}>View Room Photos</Button></Grid>
            <Grid><Button variant="outlined" onClick={() => setSnackbar("Hostel rules download is not available in this demo")}>Download Hostel Rules</Button></Grid>
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Active Requests</Typography>
          <DataTable<HostelRequest>
            columns={[
              { key: "type", label: "Type", render: (row) => requestTypeLabels[row.type] },
              { key: "submittedOn", label: "Submitted" },
              { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
              { key: "actions", label: "Action", render: (row) => <Button size="small" onClick={() => setSelected(row)}>Track</Button> },
            ]}
            rows={requests}
            emptyTitle="No hostel requests found"
          />
        </Grid>
      </Grid>

      <Dialog open={!!formOpen} onClose={() => setFormOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{formOpen ? requestTypeLabels[formOpen] : ""}</DialogTitle>
        <DialogContent>
          <TextField label="Details" fullWidth multiline minRows={3} sx={{ mt: 1 }} value={details} onChange={(e) => setDetails(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitRequest}>Submit</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Request {selected?.id} — {selected ? requestTypeLabels[selected.type] : ""}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{selected?.details}</Typography>
          <Stack spacing={1}>
            {selected?.timeline.map((entry, i) => (
              <Stack key={i} direction="row" spacing={1.5}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>{entry.time}</Typography>
                <Typography variant="body2">{entry.action}</Typography>
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setSelected(null)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={mealDialogOpen} onClose={() => setMealDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Meal Plan</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Meal Plan</InputLabel>
            <Select label="Meal Plan" value={mealPlan} onChange={(e: SelectChangeEvent) => setMealPlan(e.target.value)}>
              <MenuItem value="Standard">Standard</MenuItem>
              <MenuItem value="Vegetarian">Vegetarian</MenuItem>
              <MenuItem value="Jain">Jain</MenuItem>
              <MenuItem value="No Mess">No Mess</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMealDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => handleSaveMealPlan(mealPlan)}>Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/student/Hostel.tsx
git commit -m "Add Hostel & Mess page with real per-request tracking"
```

---

### Task 13: Facility & Resource Booking page

**Files:**
- Create: `app/src/pages/student/Resources.tsx`

**Interfaces:**
- Consumes: `getFacilityCatalog()`, `getEquipmentCatalog()`, `getResourceBookings()`, `bookResource()` (Task 5).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Paper, Stack, TextField, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getFacilityCatalog, getEquipmentCatalog, getResourceBookings, bookResource } from "@/api/studentResources";
import type { ResourceBooking } from "@/types";
import EventIcon from "@mui/icons-material/Event";

export default function Resources() {
  const { mode } = useColorMode();
  const [facilities, setFacilities] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [bookings, setBookings] = useState<ResourceBooking[]>([]);
  const [target, setTarget] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [purpose, setPurpose] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getResourceBookings().then(setBookings);
  useEffect(() => {
    getFacilityCatalog().then(setFacilities);
    getEquipmentCatalog().then(setEquipment);
    load();
  }, []);

  const handleBook = () => {
    if (!target || !date || !timeSlot) { setSnackbar("Please fill in date and time slot"); return; }
    bookResource(target, date, timeSlot, purpose).then(() => {
      load();
      setTarget(null); setDate(""); setTimeSlot(""); setPurpose("");
      setSnackbar(`${target} booked successfully`);
    });
  };

  return (
    <>
      <PageHeader eyebrow="Resources" title="Facility & Resource Booking" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Facilities" icon={<EventIcon />} color={getIconAccent(mode, "facilities")} numericValue={facilities.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Equipment" icon={<EventIcon />} color={getIconAccent(mode, "equipment")} numericValue={equipment.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Current Bookings" icon={<EventIcon />} color={getIconAccent(mode, "bookings")} numericValue={bookings.length} />
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Available Facilities</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {facilities.map((f) => (
          <Grid key={f} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, textAlign: "center" }}>
              <Typography variant="subtitle2" fontWeight={600}>{f}</Typography>
              <Button size="small" variant="outlined" sx={{ mt: 1.5 }} onClick={() => setTarget(f)}>Book</Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Equipment Inventory</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {equipment.map((e) => (
          <Grid key={e} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, textAlign: "center" }}>
              <Typography variant="subtitle2" fontWeight={600}>{e}</Typography>
              <Button size="small" variant="outlined" sx={{ mt: 1.5 }} onClick={() => setTarget(e)}>Book</Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Current Bookings</Typography>
      <DataTable<ResourceBooking>
        columns={[
          { key: "resourceName", label: "Resource" },
          { key: "date", label: "Date" },
          { key: "timeSlot", label: "Time Slot" },
          { key: "purpose", label: "Purpose" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={bookings}
        emptyTitle="No current bookings"
      />
      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={() => setSnackbar("Booking calendar is not available in this demo")}>View Booking Calendar</Button>
        <Button variant="outlined" onClick={() => setTarget("Custom Equipment Request")}>Request Equipment</Button>
        <Button variant="outlined" onClick={() => setSnackbar("Usage report download is not available in this demo")}>Download Usage Report</Button>
      </Stack>

      <Dialog open={!!target} onClose={() => setTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Book {target}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Date" type="date" fullWidth value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="Time Slot" fullWidth placeholder="e.g. 10:00 - 12:00" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} />
            <TextField label="Purpose" fullWidth multiline minRows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleBook}>Confirm Booking</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/student/Resources.tsx
git commit -m "Add Facility & Resource Booking page with functional bookings"
```

---

### Task 14: Reports page

**Files:**
- Create: `app/src/pages/student/Reports.tsx`

**Interfaces:**
- No new API — static stat cards and stub download tiles, matching the source's "no real report engine" reality.

- [ ] **Step 1: Create the page**

```tsx
import { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Stack, Typography, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DownloadIcon from "@mui/icons-material/Download";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TuneIcon from "@mui/icons-material/Tune";

const academicReports = ["Transcript", "Attendance Report", "Marks Report", "Semester Result"];
const financialReports = ["Fee Statement", "Payment History", "Scholarship Summary", "Tax Certificate"];

export default function Reports() {
  const { mode } = useColorMode();
  const [customOpen, setCustomOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [reportType, setReportType] = useState("Transcript");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const stub = (label: string) => setSnackbar(`${label} is not available in this demo`);

  return (
    <>
      <PageHeader eyebrow="Reports" title="Reports" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Academic Reports" icon={<AssessmentIcon />} color={getIconAccent(mode, "academic-reports")} numericValue={academicReports.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Downloads" icon={<DownloadIcon />} color={getIconAccent(mode, "downloads")} numericValue={12} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="CGPA Trend" icon={<TrendingUpIcon />} color={getIconAccent(mode, "cgpa-trend")} value="↗ 8.75" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Custom Reports" icon={<TuneIcon />} color={getIconAccent(mode, "custom-reports")} numericValue={2} />
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Academic Reports</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {academicReports.map((r) => (
          <Grid key={r} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, textAlign: "center", cursor: "pointer" }} onClick={() => stub(`${r} download`)}>
              <Typography variant="subtitle2" fontWeight={600}>{r}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Financial Reports</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {financialReports.map((r) => (
          <Grid key={r} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, textAlign: "center", cursor: "pointer" }} onClick={() => stub(`${r} download`)}>
              <Typography variant="subtitle2" fontWeight={600}>{r}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" spacing={1.5}>
        <Button variant="contained" onClick={() => setCustomOpen(true)}>Generate Custom Report</Button>
        <Button variant="outlined" onClick={() => stub("Report download")}>Download Report</Button>
        <Button variant="outlined" onClick={() => setScheduleOpen(true)}>Schedule Reports</Button>
      </Stack>

      <Dialog open={customOpen} onClose={() => setCustomOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Custom Report</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Report Type</InputLabel>
            <Select label="Report Type" value={reportType} onChange={(e: SelectChangeEvent) => setReportType(e.target.value)}>
              {[...academicReports, ...financialReports].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setCustomOpen(false); setSnackbar(`${reportType} report generated`); }}>Generate</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Reports</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Report Type</InputLabel>
            <Select label="Report Type" value={reportType} onChange={(e: SelectChangeEvent) => setReportType(e.target.value)}>
              {[...academicReports, ...financialReports].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setScheduleOpen(false); setSnackbar(`${reportType} report scheduled`); }}>Schedule</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/student/Reports.tsx
git commit -m "Add Reports page"
```

---

### Task 15: Notices page

**Files:**
- Create: `app/src/pages/student/Notices.tsx`

**Interfaces:**
- Consumes: `getStudentNotices()`, `markNoticeRead()`, `markAllNoticesRead()` (Task 6). Fixes the source's `filterNotices` no-op and `viewNotice` ID-ignored bug.

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useMemo, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getStudentNotices, markNoticeRead, markAllNoticesRead } from "@/api/studentNotices";
import type { StudentNotice, StudentNoticeCategory } from "@/types";
import CampaignIcon from "@mui/icons-material/Campaign";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const categories: { label: string; value: StudentNoticeCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Academic", value: "academic" },
  { label: "Hostel", value: "hostel" },
  { label: "Placement", value: "placement" },
  { label: "Library", value: "library" },
  { label: "General", value: "general" },
];

export default function Notices() {
  const { mode } = useColorMode();
  const [notices, setNotices] = useState<StudentNotice[]>([]);
  const [category, setCategory] = useState<StudentNoticeCategory | "all">("all");
  const [selected, setSelected] = useState<StudentNotice | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getStudentNotices().then(setNotices);
  useEffect(() => { load(); }, []);

  const visible = useMemo(() => (category === "all" ? notices : notices.filter((n) => n.category === category)), [notices, category]);
  const unreadCount = notices.filter((n) => !n.read).length;
  const urgentCount = notices.filter((n) => n.urgency === "urgent").length;

  const handleOpen = (notice: StudentNotice) => {
    setSelected(notice);
    if (!notice.read) markNoticeRead(notice.id).then(load);
  };

  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="Notices"
        action={<Button variant="outlined" onClick={() => markAllNoticesRead().then(() => { load(); setSnackbar("All notices marked as read"); })}>Mark all read</Button>}
      />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Notices" icon={<CampaignIcon />} color={getIconAccent(mode, "notices")} numericValue={notices.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Unread" icon={<MarkEmailUnreadIcon />} color={getIconAccent(mode, "unread")} numericValue={unreadCount} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Urgent" icon={<WarningAmberIcon />} color={getIconAccent(mode, "urgent")} numericValue={urgentCount} />
        </Grid>
      </Grid>

      <ToggleButtonGroup exclusive value={category} onChange={(_, v) => v && setCategory(v)} sx={{ mb: 2.5, flexWrap: "wrap" }}>
        {categories.map((c) => <ToggleButton key={c.value} value={c.value} size="small">{c.label}</ToggleButton>)}
      </ToggleButtonGroup>

      <Stack spacing={2}>
        {visible.length === 0 && <Typography variant="body2" color="text.secondary">No notices in this category.</Typography>}
        {visible.map((n) => (
          <Paper key={n.id} elevation={0} sx={{ p: 2.5, cursor: "pointer" }} onClick={() => handleOpen(n)}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="subtitle2" fontWeight={600}>{n.title}</Typography>
              <Stack direction="row" spacing={1}>
                <StatusChip status={n.urgency} />
                <StatusChip status={n.read ? "read" : "unread"} />
              </Stack>
            </Stack>
            <Typography variant="caption" color="text.secondary">{n.author} · {n.date}</Typography>
          </Paper>
        ))}
      </Stack>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{selected?.author} · {selected?.date}</Typography>
          <Typography variant="body2">{selected?.body}</Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setSelected(null)}>Close</Button></DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/student/Notices.tsx
git commit -m "Add Notices page with real per-notice detail and category filter"
```

---

### Task 16: Messages page

**Files:**
- Create: `app/src/pages/student/Messages.tsx`

**Interfaces:**
- Consumes: `getStudentMessages()`, `markMessageRead()`, `sendStudentMessage()` (Task 7). Collapses the source's 5 identical Quick Contact wrappers into one parameterized compose action.

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useMemo, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getStudentMessages, markMessageRead, sendStudentMessage } from "@/api/studentMessages";
import type { StudentMessage } from "@/types";
import ChatIcon from "@mui/icons-material/Chat";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";

const categories = ["all", "academic", "hostel", "placement", "library"];
const quickContacts: { label: string; recipient: string }[] = [
  { label: "Instructor", recipient: "Instructor" },
  { label: "Warden", recipient: "Warden" },
  { label: "Placement Cell", recipient: "Placement Cell" },
  { label: "Library", recipient: "Library" },
  { label: "Admin", recipient: "Admin Office" },
];

export default function Messages() {
  const { mode } = useColorMode();
  const [messages, setMessages] = useState<StudentMessage[]>([]);
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<StudentMessage | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipient, setRecipient] = useState("Instructor");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getStudentMessages().then(setMessages);
  useEffect(() => { load(); }, []);

  const visible = useMemo(() => (category === "all" ? messages : messages.filter((m) => m.category === category)), [messages, category]);
  const unreadCount = messages.filter((m) => !m.read).length;

  const handleOpen = (message: StudentMessage) => {
    setSelected(message);
    if (!message.read) markMessageRead(message.id).then(load);
  };

  const openCompose = (prefillRecipient?: string) => {
    setRecipient(prefillRecipient ?? "Instructor");
    setSubject("");
    setBody("");
    setComposeOpen(true);
  };

  const handleSend = () => {
    if (!subject || !body) { setSnackbar("Please fill in subject and message"); return; }
    sendStudentMessage(recipient, subject, "academic", body).then(() => { load(); setComposeOpen(false); setSnackbar("Message sent"); });
  };

  return (
    <>
      <PageHeader eyebrow="Communication" title="Messages" action={<Button variant="contained" onClick={() => openCompose()}>Compose</Button>} />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard title="Total Messages" icon={<ChatIcon />} color={getIconAccent(mode, "messages")} numericValue={messages.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard title="Unread" icon={<MarkEmailUnreadIcon />} color={getIconAccent(mode, "unread-messages")} numericValue={unreadCount} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, flexWrap: "wrap", gap: 1 }}>
        {quickContacts.map((c) => <Button key={c.recipient} variant="outlined" size="small" onClick={() => openCompose(c.recipient)}>{c.label}</Button>)}
      </Stack>

      <ToggleButtonGroup exclusive value={category} onChange={(_, v) => v && setCategory(v)} sx={{ mb: 2.5 }}>
        {categories.map((c) => <ToggleButton key={c} value={c} size="small" sx={{ textTransform: "capitalize" }}>{c}</ToggleButton>)}
      </ToggleButtonGroup>

      <Stack spacing={2}>
        {visible.length === 0 && <Typography variant="body2" color="text.secondary">No messages in this category.</Typography>}
        {visible.map((m) => (
          <Paper key={m.id} elevation={0} sx={{ p: 2.5, cursor: "pointer" }} onClick={() => handleOpen(m)}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="subtitle2" fontWeight={600}>{m.subject}</Typography>
              <StatusChip status={m.read ? "read" : "unread"} />
            </Stack>
            <Typography variant="caption" color="text.secondary">{m.from} · {m.timeAgo}</Typography>
          </Paper>
        ))}
      </Stack>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.subject}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{selected?.from} · {selected?.timeAgo}</Typography>
          <Typography variant="body2">{selected?.body}</Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setSelected(null)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Compose Message</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Recipient</InputLabel>
              <Select label="Recipient" value={recipient} onChange={(e: SelectChangeEvent) => setRecipient(e.target.value)}>
                {quickContacts.map((c) => <MenuItem key={c.recipient} value={c.recipient}>{c.recipient}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Subject" fullWidth value={subject} onChange={(e) => setSubject(e.target.value)} />
            <TextField label="Message" fullWidth multiline minRows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposeOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSend}>Send</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/student/Messages.tsx
git commit -m "Add Messages page with functional compose and category filter"
```

---

### Task 17: Navigation + router wiring

**Files:**
- Modify: `app/src/components/navigation.tsx`
- Modify: `app/src/router.tsx`

**Interfaces:**
- Produces: the completed `"student"` case of `getNavItems`; 8 new routes under `/student/*`.

- [ ] **Step 1: Add new icon imports**

In `app/src/components/navigation.tsx`, add (all others used below are already imported elsewhere in this file):

```ts
import SchoolIcon from "@mui/icons-material/School";
import WorkIcon from "@mui/icons-material/Work";
import HotelIcon from "@mui/icons-material/Hotel";
import EventIcon from "@mui/icons-material/Event";
import BarChartIcon from "@mui/icons-material/BarChart";
```

(`CampaignIcon`, `ChatIcon`, `AccountCircleIcon` are already imported from Phase 4a/earlier phases.)

- [ ] **Step 2: Extend the `"student"` case**

Replace:

```ts
        { label: "Fee Ledger", path: "/student/fees/ledger", icon: <AccountBalanceWalletIcon />, group: "Finance" },
        { label: "My Profile", path: "/student/profile", icon: <AccountCircleIcon />, group: "_bottom" },
      ];
```

with:

```ts
        { label: "Fee Ledger", path: "/student/fees/ledger", icon: <AccountBalanceWalletIcon />, group: "Finance" },
        { label: "Convocation", path: "/student/convocation", icon: <SchoolIcon /> },
        { label: "Fellowship", path: "/student/fellowship", icon: <PaymentIcon /> },
        { label: "Placements", path: "/student/placements", icon: <WorkIcon /> },
        { label: "Hostel & Mess", path: "/student/hostel", icon: <HotelIcon /> },
        { label: "Facility & Resource Booking", path: "/student/resources", icon: <EventIcon /> },
        { label: "Reports", path: "/student/reports", icon: <BarChartIcon /> },
        { label: "Notices", path: "/student/notices", icon: <CampaignIcon />, group: "Communication" },
        { label: "Messages", path: "/student/messages", icon: <ChatIcon />, group: "Communication" },
        { label: "My Profile", path: "/student/profile", icon: <AccountCircleIcon />, group: "_bottom" },
      ];
```

- [ ] **Step 3: Add lazy imports and routes to `router.tsx`**

Replace:

```ts
const StudentProfilePage = lazy(() => import("@/pages/student/Profile"));
```

with:

```ts
const StudentProfilePage = lazy(() => import("@/pages/student/Profile"));
const StudentConvocation = lazy(() => import("@/pages/student/Convocation"));
const StudentFellowship = lazy(() => import("@/pages/student/Fellowship"));
const StudentPlacements = lazy(() => import("@/pages/student/Placements"));
const StudentHostel = lazy(() => import("@/pages/student/Hostel"));
const StudentResources = lazy(() => import("@/pages/student/Resources"));
const StudentReports = lazy(() => import("@/pages/student/Reports"));
const StudentNotices = lazy(() => import("@/pages/student/Notices"));
const StudentMessages = lazy(() => import("@/pages/student/Messages"));
```

Replace:

```ts
      { path: "student/profile", element: <StudentProfilePage /> },
```

with:

```ts
      { path: "student/profile", element: <StudentProfilePage /> },
      { path: "student/convocation", element: <StudentConvocation /> },
      { path: "student/fellowship", element: <StudentFellowship /> },
      { path: "student/placements", element: <StudentPlacements /> },
      { path: "student/hostel", element: <StudentHostel /> },
      { path: "student/resources", element: <StudentResources /> },
      { path: "student/reports", element: <StudentReports /> },
      { path: "student/notices", element: <StudentNotices /> },
      { path: "student/messages", element: <StudentMessages /> },
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/navigation.tsx app/src/router.tsx
git commit -m "Wire Student final-sections navigation and routes"
```

---

### Task 18: End-to-end manual verification, lint, and `student.html` deletion

**Files:**
- None created — verification only, plus final deletion of the legacy file. **This is the last task of the entire rewrite.**

- [ ] **Step 1: Lint check**

Run (from `app/`): `npm run lint`
Expected: 0 errors (pre-existing advisory warnings acceptable, matching every prior phase's bar).

- [ ] **Step 2: Start dev server and verify via browser-driver**

Use the `browser-driver` skill. In a single script invocation (fresh browser, full flow each time; the Student role is the Login page's default, so Sign In can be clicked directly without touching the role select):
1. Sign in, visit Fellowship — apply to an unapplied scholarship, confirm it becomes disabled ("Applied") and a new record appears in Application History.
2. Visit Placements — apply to a drive, confirm it appears in My Applications and the "Apply" button becomes disabled for that company.
3. Visit Hostel & Mess — submit a Maintenance request, confirm it appears in Active Requests; click "Track" on two different requests and confirm each shows its own distinct timeline (not the same static content — the source's `trackRequest` ID-ignored bug fix). Change the meal plan and confirm the Mess Details display updates.
4. Visit Facility & Resource Booking — book a facility, confirm it appears in Current Bookings.
5. Visit Convocation — submit a Provisional Certificate request, confirm a real dialog opens (not a generic fallback) and a confirmation toast fires.
6. Visit Notices — click through the category filter buttons and confirm the visible list actually changes; open two different notices and confirm each shows its own distinct title/body (the source's `viewNotice` ID-ignored bug fix); click "Mark all read" and confirm the Unread stat card drops to 0.
7. Visit Messages — filter by category and confirm the list changes; click a Quick Contact button (e.g. "Warden") and confirm Compose opens pre-filled with that recipient; send a message and confirm it appears at the top of the list.
8. Toggle dark mode — confirm all 8 new pages render correctly in both themes.

If any step fails, stop and fix before proceeding — do not delete `student.html` until every step above passes.

- [ ] **Step 3: Delete the fully-ported legacy file**

```bash
git rm student.html
git commit -m "Delete legacy student.html — fully ported to app/ (Student portal Phase 4a-4b complete, entire erp-college rewrite finished)"
```

- [ ] **Step 4: Update local todo tracking**

Mark Phase 4b complete. All four portals (Admin, Teacher, Staff, Student) are now fully rewritten into `app/`, and the entire legacy static-HTML `erp-college` app has been retired.
