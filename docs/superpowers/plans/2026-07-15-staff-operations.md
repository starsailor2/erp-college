# Staff / Operations Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `ops.html` (the legacy Operations/Staff portal) into `app/` as a full React feature — task creation/assignment/tracking with an Assigner↔Executor role-switcher — so `ops.html` can be deleted.

**Architecture:** Same fake-async-API layer (`simulateRequest`) over in-memory demo-data modules as every prior phase. `StaffRoleContext` (mirrors Teacher Phase 2b's `TeacherRoleContext` exactly) drives a topbar Assigner/Executor `<Select>` and role-aware sidebar groups. Filter deep-links (dashboard KPI cards → Task Overview, Team View → Task Overview) use URL search params instead of the source's DOM-select-value approach, which is what caused the source's `viewMemberTasks` filter-reset bug.

**Tech Stack:** React 19, TypeScript 5.8, MUI v7, react-router-dom v7, recharts v2, `motion` v12, Vite 6.

## Global Constraints

- Reuse the existing global `Notification`/`api/notifications.ts` (shared topbar bell/badge) as-is — do not touch it. This phase's own `OpsNotification`/`staffNotifications.ts` is a separate, richer, task-linked notification list for the dedicated Notifications page only, matching the precedent set by every prior portal's own Notices/Notifications page being distinct from the shared badge.
- `overdue` is a **computed** value (`dueDate < today && status !== "completed"`), never a stored `OpsTask.status` value — compute it at render/query time, don't add it to the `TaskStatus` union.
- `StatusChip`'s `overdue` key already exists in `STATUS_MAP` (added in an earlier phase for fee ledgers) — reuse it, don't redefine it. Only `cannot_complete` is new.
- The source's dead code (`statusModal`/`openStatusModal`, `saveNotes`, the second notification-dropdown implementation, `window.history.back` override) is **not ported**.
- Every new demo-data module owns its own independent `createRng(seed)` instance where randomization is used.
- All reads/writes go through `simulateRequest` (250ms default), except `getStaffDisplayIdentity` in `api/staffProfile.ts`, which is a synchronous chrome-only helper Layout calls directly (see Task 10) — documented there.
- Verify with `npm run build` (run from `app/`) after every task; commit every task individually.

---

### Task 1: Type definitions

**Files:**
- Modify: `app/src/types/index.ts` (append at the end of the file)

**Interfaces:**
- Produces: `StaffRole`, `TaskPriority`, `TaskStatus`, `TaskCategory`, `TaskApprovalStatus`, `OpsTask`, `OpsTeamMember`, `OpsNotification`, `StaffProfile` — consumed by every later task in this plan.

- [ ] **Step 1: Append new types**

```ts
// --- Staff / Operations (Phase 3) ---

export type StaffRole = "assigner" | "executor";

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cannot_complete";
export type TaskCategory = "maintenance" | "administrative" | "facilities" | "supplies" | "events" | "other";
export type TaskApprovalStatus = "pending" | "approved" | "rejected";

export interface OpsTask {
  id: string;
  title: string;
  description: string;
  staffInstructions: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  assigneeId: string | null;
  createdAt: string;
  dueDate: string;
  completedAt?: string;
  estimatedHours: number;
  approvalStatus?: TaskApprovalStatus;
  needsHelp: boolean;
  helpNeededReason?: string;
  cannotCompleteReason?: string;
  notes?: string;
  timeline: { time: string; action: string }[];
}

export interface OpsTeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  department: string;
  email: string;
  phone: string;
}

export interface OpsNotification {
  id: string;
  message: string;
  read: boolean;
  time: string;
  taskId: string | null;
}

export interface StaffProfile {
  name: string;
  email: string;
  department: string;
  phone: string;
}
```

- [ ] **Step 2: Verify build** — `npm run build` (from `app/`), expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/types/index.ts
git commit -m "Add Phase 3 (Staff/Operations) type definitions"
```

---

### Task 2: StaffRoleContext

**Files:**
- Create: `app/src/context/StaffRoleContext.ts`

**Interfaces:**
- Produces: `StaffRoleContext`, `useStaffRoleState()`, `useStaffRole()` — consumed by Task 10 (Layout) and every page task that needs to know the current role.

- [ ] **Step 1: Create the context, mirroring `TeacherRoleContext.ts` exactly**

```ts
import { createContext, useContext, useState } from "react";
import type { StaffRole } from "@/types";

const STORAGE_KEY = "college_erp_staff_role";

interface StaffRoleContextType {
  role: StaffRole;
  setRole: (role: StaffRole) => void;
}

export const StaffRoleContext = createContext<StaffRoleContextType>({
  role: "assigner",
  setRole: () => {},
});

export function useStaffRoleState() {
  const [role, setRoleState] = useState<StaffRole>(() => (localStorage.getItem(STORAGE_KEY) as StaffRole) || "assigner");
  const setRole = (r: StaffRole) => {
    localStorage.setItem(STORAGE_KEY, r);
    setRoleState(r);
  };
  return { role, setRole };
}

export const useStaffRole = () => useContext(StaffRoleContext);
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/context/StaffRoleContext.ts
git commit -m "Add StaffRoleContext"
```

---

### Task 3: Team members demo data + API

**Files:**
- Create: `app/src/demo-data/staff/teamMembers.ts`
- Create: `app/src/api/staffTeamMembers.ts`

**Interfaces:**
- Produces: `teamMembers: OpsTeamMember[]`, `currentExecutorId: string`, `getTeamMemberById(id)` (demo-data); `getTeamMembers(): Promise<OpsTeamMember[]>` (API) — consumed by Tasks 4, 5, and every page task.

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/staff/teamMembers.ts
import type { OpsTeamMember } from "@/types";

export const teamMembers: OpsTeamMember[] = [
  { id: "TM001", name: "John Smith", role: "Maintenance Staff", avatar: "JS", department: "Facilities", email: "john.smith@kalnet.edu", phone: "9812300001" },
  { id: "TM002", name: "Sarah Johnson", role: "Administrative Assistant", avatar: "SJ", department: "Admin", email: "sarah.johnson@kalnet.edu", phone: "9812300002" },
  { id: "TM003", name: "Mike Davis", role: "Security Guard", avatar: "MD", department: "Security", email: "mike.davis@kalnet.edu", phone: "9812300003" },
  { id: "TM004", name: "Lisa Chen", role: "Cleaner", avatar: "LC", department: "Facilities", email: "lisa.chen@kalnet.edu", phone: "9812300004" },
  { id: "TM005", name: "Tom Wilson", role: "Lab Assistant", avatar: "TW", department: "Science", email: "tom.wilson@kalnet.edu", phone: "9812300005" },
];

// The single team member whose perspective the "Executor" role simulates —
// mirrors the source's hardcoded executorId, but named/exported so every
// consumer reads it from one place instead of re-hardcoding "1"/"TM001".
export const currentExecutorId = "TM001";

export function getTeamMemberById(id: string): OpsTeamMember | undefined {
  return teamMembers.find((m) => m.id === id);
}
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/staffTeamMembers.ts
import { simulateRequest } from "@/api/http";
import { teamMembers } from "@/demo-data/staff/teamMembers";
import type { OpsTeamMember } from "@/types";

export function getTeamMembers(): Promise<OpsTeamMember[]> {
  return simulateRequest(teamMembers);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/staff/teamMembers.ts app/src/api/staffTeamMembers.ts
git commit -m "Add team members demo data and API"
```

---

### Task 4: Staff profile demo data + API

**Files:**
- Create: `app/src/demo-data/staff/profile.ts`
- Create: `app/src/api/staffProfile.ts`

**Interfaces:**
- Consumes: `teamMembers`, `currentExecutorId` (Task 3).
- Produces: `getCurrentStaffProfile(role)`, `updateCurrentStaffProfile(role, updates)`, `getStaffDisplayIdentity(role)` — consumed by Task 10 (Layout) and Task 21 (Profile page).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/staff/profile.ts
import type { StaffProfile } from "@/types";

// The Assigner role represents the actually-logged-in operations
// supervisor (distinct from any of the 5 team members) — a singleton,
// same pattern as Admin/Teacher's own Profile singletons.
export const assignerProfile: StaffProfile = {
  name: "Admin User",
  email: "admin@kalnet.edu",
  department: "Operations",
  phone: "9812399999",
};
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/staffProfile.ts
import { simulateRequest } from "@/api/http";
import { assignerProfile } from "@/demo-data/staff/profile";
import { teamMembers, currentExecutorId } from "@/demo-data/staff/teamMembers";
import type { StaffProfile, StaffRole } from "@/types";

function currentExecutor() {
  return teamMembers.find((m) => m.id === currentExecutorId)!;
}

export function getCurrentStaffProfile(role: StaffRole): Promise<StaffProfile> {
  if (role === "executor") {
    const exec = currentExecutor();
    return simulateRequest({ name: exec.name, email: exec.email, department: exec.department, phone: exec.phone });
  }
  return simulateRequest(assignerProfile);
}

export function updateCurrentStaffProfile(role: StaffRole, updates: Partial<StaffProfile>): Promise<StaffProfile> {
  if (role === "executor") {
    const exec = currentExecutor();
    Object.assign(exec, updates);
    return simulateRequest({ name: exec.name, email: exec.email, department: exec.department, phone: exec.phone });
  }
  Object.assign(assignerProfile, updates);
  return simulateRequest(assignerProfile);
}

// Synchronous on purpose: Layout's sidebar header (chrome, not page content)
// needs the current role's display name/avatar-initial on every render
// without an async round-trip or loading flicker, the same way it already
// reads useAuth()'s user synchronously for every other portal.
export function getStaffDisplayIdentity(role: StaffRole): { name: string; initial: string } {
  if (role === "executor") {
    const exec = currentExecutor();
    return { name: exec.name, initial: exec.avatar.charAt(0) };
  }
  return { name: assignerProfile.name, initial: assignerProfile.name.charAt(0) };
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/staff/profile.ts app/src/api/staffProfile.ts
git commit -m "Add staff profile demo data and API"
```

---

### Task 5: Tasks demo data

**Files:**
- Create: `app/src/demo-data/staff/tasks.ts`

**Interfaces:**
- Produces: `tasks: OpsTask[]`, `nextTaskId()` — consumed by Task 6 (API) and, transitively, every page task.

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/staff/tasks.ts
import type { OpsTask } from "@/types";

function tl(time: string, action: string) {
  return { time, action };
}

export const tasks: OpsTask[] = [
  { id: "OT-001", title: "Fix leaking faucet in Room 204", description: "The staff room sink faucet has been leaking steadily for two days.", staffInstructions: "1. Turn off the water supply valve under the sink.\n2. Replace the worn washer.\n3. Test for leaks before closing up the area.", priority: "high", status: "in_progress", category: "maintenance", assigneeId: "TM001", createdAt: "2026-07-10", dueDate: "2026-07-14", estimatedHours: 2, needsHelp: false, timeline: [tl("2026-07-10", "Task created and assigned to John Smith"), tl("2026-07-11", "Started working on task")] },
  { id: "OT-002", title: "Update visitor log system", description: "Digitize the paper visitor log at the main gate into the new tablet system.", staffInstructions: "1. Set up the tablet at the security desk.\n2. Migrate the last 30 days of paper entries.\n3. Train the gate guard on the new flow.", priority: "medium", status: "pending", category: "administrative", assigneeId: "TM002", createdAt: "2026-07-12", dueDate: "2026-07-20", estimatedHours: 3, needsHelp: false, timeline: [tl("2026-07-12", "Task created and assigned to Sarah Johnson")] },
  { id: "OT-003", title: "Restock cleaning supplies - Building B", description: "Building B's supply closet is nearly empty for the second floor.", staffInstructions: "1. Check current inventory against the standard stock list.\n2. Requisition missing items from the central store.\n3. Restock the closet shelves.", priority: "low", status: "completed", category: "facilities", assigneeId: "TM004", createdAt: "2026-07-08", dueDate: "2026-07-13", completedAt: "2026-07-13", approvalStatus: "pending", estimatedHours: 1, needsHelp: false, timeline: [tl("2026-07-08", "Task created and assigned to Lisa Chen"), tl("2026-07-13", "Marked as done, awaiting approval")] },
  { id: "OT-004", title: "Order new lab equipment", description: "Chemistry lab needs 6 replacement burettes and 2 digital scales.", staffInstructions: "1. Get quotes from 2 approved vendors.\n2. Place the purchase order once approved.\n3. Confirm delivery date with the lab in-charge.", priority: "medium", status: "pending", category: "supplies", assigneeId: null, createdAt: "2026-07-14", dueDate: "2026-07-25", estimatedHours: 4, needsHelp: false, timeline: [tl("2026-07-14", "Task created")] },
  { id: "OT-005", title: "Set up chairs for annual day event", description: "Arrange 400 chairs in the main auditorium for the annual day rehearsal and event.", staffInstructions: "1. Coordinate with the event committee on the seating plan.\n2. Set up chairs in rows with center + side aisles.\n3. Leave the front 2 rows reserved.", priority: "high", status: "pending", category: "events", assigneeId: null, createdAt: "2026-07-13", dueDate: "2026-07-18", estimatedHours: 5, needsHelp: false, timeline: [tl("2026-07-13", "Task created")] },
  { id: "OT-006", title: "Repair broken window latch - Library", description: "A window latch on the library's second floor is broken and won't close fully.", staffInstructions: "1. Inspect the latch mechanism.\n2. Replace the latch hardware.\n3. Confirm the window locks securely.", priority: "medium", status: "pending", category: "maintenance", assigneeId: "TM001", createdAt: "2026-07-14", dueDate: "2026-07-16", estimatedHours: 1, needsHelp: false, timeline: [tl("2026-07-14", "Task created and assigned to John Smith")] },
  { id: "OT-007", title: "Prepare monthly security report", description: "Compile the incident log and gate-entry summary for last month.", staffInstructions: "1. Pull the incident log from the security register.\n2. Summarize gate-entry counts by day.\n3. Submit the report to administration.", priority: "low", status: "completed", category: "administrative", assigneeId: "TM003", createdAt: "2026-07-05", dueDate: "2026-07-10", completedAt: "2026-07-09", approvalStatus: "approved", estimatedHours: 2, needsHelp: false, timeline: [tl("2026-07-05", "Task created and assigned to Mike Davis"), tl("2026-07-09", "Marked as done, awaiting approval"), tl("2026-07-10", "Approved by supervisor")] },
  { id: "OT-008", title: "Deep clean cafeteria kitchen", description: "Full deep-clean of the cafeteria kitchen including exhaust hoods and floor drains.", staffInstructions: "1. Clear all surfaces and equipment.\n2. Deep-clean exhaust hoods and floor drains.\n3. Sanitize all food-prep surfaces.", priority: "high", status: "cannot_complete", category: "facilities", assigneeId: "TM004", createdAt: "2026-07-08", dueDate: "2026-07-12", cannotCompleteReason: "Required industrial cleaning equipment is currently under maintenance.", estimatedHours: 3, needsHelp: false, timeline: [tl("2026-07-08", "Task created and assigned to Lisa Chen"), tl("2026-07-12", "Marked as cannot complete")] },
  { id: "OT-009", title: "Replenish first-aid kits across campus", description: "Top up first-aid kits in every building to the standard checklist.", staffInstructions: "1. Audit each building's kit against the standard checklist.\n2. Note missing items per building.\n3. Restock from the medical store.", priority: "medium", status: "in_progress", category: "supplies", assigneeId: "TM005", createdAt: "2026-07-11", dueDate: "2026-07-17", estimatedHours: 2, needsHelp: true, helpNeededReason: "Need approval for additional budget — the medical store's replacement stock is empty.", timeline: [tl("2026-07-11", "Task created and assigned to Tom Wilson"), tl("2026-07-15", "Requested help: budget needed for restocking")] },
  { id: "OT-010", title: "Coordinate parking for alumni event", description: "Arrange overflow parking and signage for the alumni meet this weekend.", staffInstructions: "1. Mark overflow parking area with cones.\n2. Put up directional signage at both gates.\n3. Brief the gate guards on the parking plan.", priority: "medium", status: "pending", category: "events", assigneeId: "TM003", createdAt: "2026-07-14", dueDate: "2026-07-22", estimatedHours: 3, needsHelp: false, timeline: [tl("2026-07-14", "Task created and assigned to Mike Davis")] },
  { id: "OT-011", title: "Inspect fire extinguishers - all blocks", description: "Annual inspection and tagging of fire extinguishers in every academic block.", staffInstructions: "1. Check pressure gauge on every extinguisher.\n2. Tag each with the inspection date.\n3. Flag any needing refill or replacement.", priority: "high", status: "pending", category: "maintenance", assigneeId: "TM001", createdAt: "2026-07-14", dueDate: "2026-07-19", estimatedHours: 4, needsHelp: false, timeline: [tl("2026-07-14", "Task created and assigned to John Smith")] },
  { id: "OT-012", title: "Digitize old admission records", description: "Scan and organize admission records from 2015-2018 into the digital archive.", staffInstructions: "1. Sort paper records by year.\n2. Scan each folder into the archive system.\n3. Verify scanned files against the paper originals.", priority: "low", status: "pending", category: "administrative", assigneeId: null, createdAt: "2026-07-10", dueDate: "2026-08-01", estimatedHours: 6, needsHelp: false, timeline: [tl("2026-07-10", "Task created")] },
  { id: "OT-013", title: "Replace exhaust fan in server room", description: "The server room's exhaust fan is making noise and needs replacement.", staffInstructions: "1. Power down the affected rack section.\n2. Remove and replace the exhaust fan unit.\n3. Confirm airflow and temperature are back to normal.", priority: "high", status: "completed", category: "facilities", assigneeId: "TM001", createdAt: "2026-07-06", dueDate: "2026-07-11", completedAt: "2026-07-11", approvalStatus: "rejected", estimatedHours: 2, notes: "Replacement fan was the wrong model — needs to be redone with the correct part.", needsHelp: false, timeline: [tl("2026-07-06", "Task created and assigned to John Smith"), tl("2026-07-11", "Marked as done, awaiting approval"), tl("2026-07-11", "Rejected by supervisor: wrong replacement part")] },
  { id: "OT-014", title: "Organize sports day equipment", description: "Sort and inventory sports equipment ahead of the annual sports day.", staffInstructions: "1. Pull all equipment from the sports store.\n2. Check condition and discard damaged items.\n3. Organize by event and label crates.", priority: "low", status: "pending", category: "events", assigneeId: "TM005", createdAt: "2026-07-14", dueDate: "2026-07-30", estimatedHours: 3, needsHelp: false, timeline: [tl("2026-07-14", "Task created and assigned to Tom Wilson")] },
  { id: "OT-015", title: "Set up projector for auditorium event", description: "Install and test the projector and screen for this week's guest lecture.", staffInstructions: "1. Mount the projector and connect to the AV rack.\n2. Test the HDMI signal from the podium laptop.\n3. Confirm audio sync with the sound system.", priority: "medium", status: "in_progress", category: "events", assigneeId: "TM001", createdAt: "2026-07-13", dueDate: "2026-07-17", estimatedHours: 2, needsHelp: true, helpNeededReason: "Projector cable is damaged — need a replacement HDMI cable from IT stock.", timeline: [tl("2026-07-13", "Task created and assigned to John Smith"), tl("2026-07-14", "Started working on task"), tl("2026-07-15", "Requested help: needs replacement HDMI cable")] },
];

export function nextTaskId(): string {
  const max = tasks.reduce((m, t) => Math.max(m, Number(t.id.split("-")[1])), 1000);
  return `OT-${String(max + 1).padStart(3, "0")}`;
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/demo-data/staff/tasks.ts
git commit -m "Add tasks demo data"
```

---

### Task 6: Tasks API

**Files:**
- Create: `app/src/api/staffTasks.ts`

**Interfaces:**
- Consumes: `tasks`, `nextTaskId` (Task 5).
- Produces: `getTasks()`, `getTaskById(id)`, `addTask(entry)`, `quickAssign(taskId, assigneeId)`, `assignTask(taskId, assigneeId, notes?)`, `approveTask(id)`, `rejectTask(id)`, `deleteTask(id)`, `startTask(id)`, `completeTask(id)`, `resolveHelpRequest(id)`, `submitRequestHelp(id, reason)`, `submitCannotComplete(id, reason)` — consumed by every page task from Task 11 onward.

- [ ] **Step 1: Create the API**

```ts
// app/src/api/staffTasks.ts
import { simulateRequest } from "@/api/http";
import { tasks, nextTaskId } from "@/demo-data/staff/tasks";
import type { OpsTask } from "@/types";

function now(): string {
  return new Date().toISOString().slice(0, 10);
}

function findTask(id: string): OpsTask | undefined {
  return tasks.find((t) => t.id === id);
}

export function getTasks(): Promise<OpsTask[]> {
  return simulateRequest(tasks);
}

export function getTaskById(id: string): Promise<OpsTask | undefined> {
  return simulateRequest(findTask(id));
}

export function addTask(entry: Pick<OpsTask, "title" | "description" | "staffInstructions" | "priority" | "category" | "dueDate" | "estimatedHours">): Promise<OpsTask> {
  const task: OpsTask = {
    ...entry,
    id: nextTaskId(),
    status: "pending",
    assigneeId: null,
    createdAt: now(),
    needsHelp: false,
    timeline: [{ time: now(), action: "Task created" }],
  };
  tasks.unshift(task);
  return simulateRequest(task);
}

function assign(taskId: string, assigneeId: string, assigneeName: string, notes?: string) {
  const task = findTask(taskId);
  if (!task) return;
  task.assigneeId = assigneeId;
  task.timeline.push({ time: now(), action: `Assigned to ${assigneeName}` });
  if (notes) task.notes = notes;
}

export function quickAssign(taskId: string, assigneeId: string, assigneeName: string): Promise<void> {
  assign(taskId, assigneeId, assigneeName);
  return simulateRequest(undefined);
}

export function assignTask(taskId: string, assigneeId: string, assigneeName: string, notes?: string): Promise<void> {
  assign(taskId, assigneeId, assigneeName, notes);
  return simulateRequest(undefined);
}

export function approveTask(id: string): Promise<void> {
  const task = findTask(id);
  if (task) {
    task.approvalStatus = "approved";
    task.timeline.push({ time: now(), action: "Approved by supervisor" });
  }
  return simulateRequest(undefined);
}

export function rejectTask(id: string): Promise<void> {
  const task = findTask(id);
  if (task) {
    task.approvalStatus = "rejected";
    task.timeline.push({ time: now(), action: "Rejected by supervisor" });
  }
  return simulateRequest(undefined);
}

export function deleteTask(id: string): Promise<void> {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx !== -1) tasks.splice(idx, 1);
  return simulateRequest(undefined);
}

export function startTask(id: string): Promise<void> {
  const task = findTask(id);
  if (task) {
    task.status = "in_progress";
    task.timeline.push({ time: now(), action: "Started working on task" });
  }
  return simulateRequest(undefined);
}

export function completeTask(id: string): Promise<void> {
  const task = findTask(id);
  if (task) {
    task.status = "completed";
    task.completedAt = now();
    task.approvalStatus = "pending";
    task.timeline.push({ time: now(), action: "Marked as done, awaiting approval" });
  }
  return simulateRequest(undefined);
}

export function resolveHelpRequest(id: string): Promise<void> {
  const task = findTask(id);
  if (task) {
    task.needsHelp = false;
    task.timeline.push({ time: now(), action: "Help request resolved" });
  }
  return simulateRequest(undefined);
}

export function submitRequestHelp(id: string, reason: string): Promise<void> {
  const task = findTask(id);
  if (task) {
    task.needsHelp = true;
    task.helpNeededReason = reason;
    task.timeline.push({ time: now(), action: `Requested help: ${reason}` });
  }
  return simulateRequest(undefined);
}

export function submitCannotComplete(id: string, reason: string): Promise<void> {
  const task = findTask(id);
  if (task) {
    task.status = "cannot_complete";
    task.cannotCompleteReason = reason;
    task.timeline.push({ time: now(), action: "Marked as cannot complete" });
  }
  return simulateRequest(undefined);
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/api/staffTasks.ts
git commit -m "Add tasks API"
```

---

### Task 7: Notifications demo data + API

**Files:**
- Create: `app/src/demo-data/staff/notifications.ts`
- Create: `app/src/api/staffNotifications.ts`

**Interfaces:**
- Produces: `getOpsNotifications()`, `markNotificationRead(id)`, `markAllNotificationsRead()` — consumed by Task 22 (Notifications page).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/staff/notifications.ts
import type { OpsNotification } from "@/types";

export const opsNotifications: OpsNotification[] = [
  { id: "ON-001", message: "New task assigned: Fix leaking faucet in Room 204", read: false, time: "2026-07-10", taskId: "OT-001" },
  { id: "ON-002", message: "Task completed, awaiting approval: Restock cleaning supplies - Building B", read: false, time: "2026-07-13", taskId: "OT-003" },
  { id: "ON-003", message: "Help requested on: Replenish first-aid kits across campus", read: false, time: "2026-07-15", taskId: "OT-009" },
  { id: "ON-004", message: "Task marked as cannot complete: Deep clean cafeteria kitchen", read: true, time: "2026-07-12", taskId: "OT-008" },
  { id: "ON-005", message: "Task approved: Prepare monthly security report", read: true, time: "2026-07-10", taskId: "OT-007" },
  { id: "ON-006", message: "Task rejected: Replace exhaust fan in server room", read: false, time: "2026-07-11", taskId: "OT-013" },
  { id: "ON-007", message: "Help requested on: Set up projector for auditorium event", read: false, time: "2026-07-15", taskId: "OT-015" },
];
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/staffNotifications.ts
import { simulateRequest } from "@/api/http";
import { opsNotifications } from "@/demo-data/staff/notifications";
import type { OpsNotification } from "@/types";

export function getOpsNotifications(): Promise<OpsNotification[]> {
  return simulateRequest(opsNotifications);
}

export function markNotificationRead(id: string): Promise<void> {
  const row = opsNotifications.find((n) => n.id === id);
  if (row) row.read = true;
  return simulateRequest(undefined);
}

export function markAllNotificationsRead(): Promise<void> {
  opsNotifications.forEach((n) => { n.read = true; });
  return simulateRequest(undefined);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/staff/notifications.ts app/src/api/staffNotifications.ts
git commit -m "Add operations notifications demo data and API"
```

---

### Task 8: StatusChip addition

**Files:**
- Modify: `app/src/components/StatusChip.tsx`

**Interfaces:**
- Produces: `STATUS_MAP.cannot_complete` — consumed by every page task rendering a task status. (`overdue`, `pending`, `in_progress`, `completed`, `approved`, `rejected`, `low`/`medium`/`high` already exist from earlier phases — reused as-is.)

- [ ] **Step 1: Add the entry**

In `app/src/components/StatusChip.tsx`, add to `STATUS_MAP` (after the `overloaded` entry):

```ts
  // Operations tasks
  cannot_complete: { label: "Cannot Complete", color: statusTokens.critical, icon: CancelIcon },
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/StatusChip.tsx
git commit -m "Add cannot_complete StatusChip entry"
```

---

### Task 9: Shared AssignTaskDialog component

**Files:**
- Create: `app/src/components/staff/AssignTaskDialog.tsx`

**Interfaces:**
- Consumes: `getTeamMembers()` (Task 3).
- Produces: `<AssignTaskDialog open taskTitle onClose onConfirm(assigneeId, assigneeName, notes) />` — consumed by Task 14 (Task Overview) and Task 15 (Task Detail), replacing the source's single reused `#assignModal`.

- [ ] **Step 1: Create the component**

```tsx
import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, TextField, Stack, type SelectChangeEvent } from "@mui/material";
import { getTeamMembers } from "@/api/staffTeamMembers";
import type { OpsTeamMember } from "@/types";

interface AssignTaskDialogProps {
  open: boolean;
  taskTitle: string;
  onClose: () => void;
  onConfirm: (assigneeId: string, assigneeName: string, notes: string) => void;
}

export function AssignTaskDialog({ open, taskTitle, onClose, onConfirm }: AssignTaskDialogProps) {
  const [members, setMembers] = useState<OpsTeamMember[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) getTeamMembers().then(setMembers);
  }, [open]);

  const handleConfirm = () => {
    const member = members.find((m) => m.id === assigneeId);
    if (!member) return;
    onConfirm(member.id, member.name, notes);
    setAssigneeId("");
    setNotes("");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Task</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField label="Task" value={taskTitle} disabled fullWidth />
          <FormControl fullWidth>
            <InputLabel>Assign To</InputLabel>
            <Select label="Assign To" value={assigneeId} onChange={(e: SelectChangeEvent) => setAssigneeId(e.target.value)}>
              {members.map((m) => <MenuItem key={m.id} value={m.id}>{m.name} — {m.role}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Notes (optional)" fullWidth multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!assigneeId} onClick={handleConfirm}>Assign</Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/staff/AssignTaskDialog.tsx
git commit -m "Add shared AssignTaskDialog component"
```

---

### Task 10: StaffRoleContext wiring + role-switcher + staff identity in Layout

**Files:**
- Modify: `app/src/components/Layout.tsx`

**Interfaces:**
- Consumes: `StaffRoleContext`, `useStaffRoleState` (Task 2); `getStaffDisplayIdentity` (Task 4).
- Produces: `StaffRoleContext.Provider` ancestor for all `/staff/*` routes; topbar Assigner/Executor `<Select>`; sidebar header shows the correct identity for the active staff role.

- [ ] **Step 1: Add imports**

In `app/src/components/Layout.tsx`, add after the `TeacherRoleContext` import:

```ts
import { StaffRoleContext, useStaffRoleState } from "@/context/StaffRoleContext";
import type { StaffRole } from "@/types";
import { getStaffDisplayIdentity } from "@/api/staffProfile";
```

- [ ] **Step 2: Own the staff-role state**

Replace:

```ts
  const { role: teacherRole, setRole: setTeacherRole } = useTeacherRoleState();
```

with:

```ts
  const { role: teacherRole, setRole: setTeacherRole } = useTeacherRoleState();
  const { role: staffRole, setRole: setStaffRole } = useStaffRoleState();
```

- [ ] **Step 3: Compute the sidebar header identity**

Replace:

```ts
  const handleLogout = () => {
```

with:

```ts
  const staffIdentity = role === "staff" ? getStaffDisplayIdentity(staffRole) : null;

  const handleLogout = () => {
```

Then in `sidebarContent`, replace:

```tsx
        <Avatar sx={{ bgcolor: sidebarTokens.text, color: sidebarTokens.background, width: 36, height: 36, fontSize: 14, fontWeight: 700 }}>
          {user?.name.charAt(0) ?? "U"}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ color: sidebarTokens.text }}>
            {user?.name ?? "User"}
          </Typography>
```

with:

```tsx
        <Avatar sx={{ bgcolor: sidebarTokens.text, color: sidebarTokens.background, width: 36, height: 36, fontSize: 14, fontWeight: 700 }}>
          {staffIdentity?.initial ?? user?.name.charAt(0) ?? "U"}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ color: sidebarTokens.text }}>
            {staffIdentity?.name ?? user?.name ?? "User"}
          </Typography>
```

- [ ] **Step 4: Make `navItems` role-aware for staff too**

Replace:

```ts
  const navItems = useMemo(() => getNavItems(role, teacherRole), [role, teacherRole]);
```

with:

```ts
  const navItems = useMemo(() => getNavItems(role, teacherRole, staffRole), [role, teacherRole, staffRole]);
```

- [ ] **Step 5: Add the role-switcher `<Select>` to the Toolbar**

Replace:

```tsx
          {role === "teacher" && (
            <FormControl size="small" sx={{ minWidth: 130, mr: 1 }}>
              <Select
                value={teacherRole}
                onChange={(e) => setTeacherRole(e.target.value as TeacherRole)}
                sx={{ fontSize: 14 }}
              >
                <MenuItem value="professor">Professor</MenuItem>
                <MenuItem value="hod">HOD</MenuItem>
                <MenuItem value="dean">Dean</MenuItem>
              </Select>
            </FormControl>
          )}
```

with:

```tsx
          {role === "teacher" && (
            <FormControl size="small" sx={{ minWidth: 130, mr: 1 }}>
              <Select
                value={teacherRole}
                onChange={(e) => setTeacherRole(e.target.value as TeacherRole)}
                sx={{ fontSize: 14 }}
              >
                <MenuItem value="professor">Professor</MenuItem>
                <MenuItem value="hod">HOD</MenuItem>
                <MenuItem value="dean">Dean</MenuItem>
              </Select>
            </FormControl>
          )}

          {role === "staff" && (
            <FormControl size="small" sx={{ minWidth: 130, mr: 1 }}>
              <Select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                sx={{ fontSize: 14 }}
              >
                <MenuItem value="assigner">Assigner</MenuItem>
                <MenuItem value="executor">Executor</MenuItem>
              </Select>
            </FormControl>
          )}
```

- [ ] **Step 6: Wrap the return in the Provider (nested inside `TeacherRoleContext.Provider`)**

Replace:

```tsx
  return (
    <TeacherRoleContext.Provider value={{ role: teacherRole, setRole: setTeacherRole }}>
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
```

with:

```tsx
  return (
    <TeacherRoleContext.Provider value={{ role: teacherRole, setRole: setTeacherRole }}>
    <StaffRoleContext.Provider value={{ role: staffRole, setRole: setStaffRole }}>
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
```

And replace:

```tsx
    </Box>
    </TeacherRoleContext.Provider>
  );
}
```

with:

```tsx
    </Box>
    </StaffRoleContext.Provider>
    </TeacherRoleContext.Provider>
  );
}
```

- [ ] **Step 7: Add a temporary third parameter to `getNavItems` so this task compiles standalone**

In `app/src/components/navigation.tsx`, change the signature:

```ts
export function getNavItems(role: Role, teacherRole: TeacherRole = "professor"): NavItem[] {
```

to:

```ts
export function getNavItems(role: Role, teacherRole: TeacherRole = "professor", _staffRole?: import("@/types").StaffRole): NavItem[] {
```

(Task 23 replaces this signature properly and implements staff filtering.)

- [ ] **Step 8: Verify build** — `npm run build`, expect success.

- [ ] **Step 9: Commit**

```bash
git add app/src/components/Layout.tsx app/src/components/navigation.tsx
git commit -m "Wire StaffRoleContext, role-switcher, and staff identity into Layout"
```

---

### Task 11: Assigner Dashboard page (replaces Phase 0 placeholder)

**Files:**
- Modify: `app/src/pages/staff/Dashboard.tsx` (full rewrite)

**Interfaces:**
- Consumes: `getTasks()` (Task 6), `getTeamMembers()` (Task 3).

- [ ] **Step 1: Rewrite the page**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid, Paper, Typography, LinearProgress } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ScheduleIcon from "@mui/icons-material/Schedule";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getTasks } from "@/api/staffTasks";
import { getTeamMembers } from "@/api/staffTeamMembers";
import type { OpsTask, OpsTeamMember } from "@/types";

function isOverdue(task: OpsTask): boolean {
  return task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "completed";
}

export default function Dashboard() {
  const { mode } = useColorMode();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [members, setMembers] = useState<OpsTeamMember[]>([]);

  useEffect(() => {
    getTasks().then(setTasks);
    getTeamMembers().then(setMembers);
  }, []);

  const pending = tasks.filter((t) => t.status === "pending").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const overdue = tasks.filter(isOverdue).length;

  const recent = [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  const completionFor = (memberId: string) => {
    const assigned = tasks.filter((t) => t.assigneeId === memberId);
    const done = assigned.filter((t) => t.status === "completed").length;
    return { assigned: assigned.length, done };
  };

  return (
    <>
      <PageHeader eyebrow="Overview" title="Operations Dashboard" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard title="Total Tasks" icon={<AssignmentIcon />} color={getIconAccent(mode, "tasks")} numericValue={tasks.length} onClick={() => navigate("/staff/tasks")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard title="Pending" icon={<ScheduleIcon />} color={getIconAccent(mode, "pending")} numericValue={pending} onClick={() => navigate("/staff/tasks?status=pending")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard title="In Progress" icon={<HourglassTopIcon />} color={getIconAccent(mode, "in_progress")} numericValue={inProgress} onClick={() => navigate("/staff/tasks?status=in_progress")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard title="Completed" icon={<CheckCircleIcon />} color={getIconAccent(mode, "completed")} numericValue={completed} onClick={() => navigate("/staff/tasks?status=completed")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard title="Overdue" icon={<ErrorIcon />} color="#e34948" numericValue={overdue} onClick={() => navigate("/staff/tasks?status=overdue")} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <DataTable<OpsTask>
            title="Recent Tasks"
            onRowClick={(row) => navigate(`/staff/tasks/${row.id}`)}
            columns={[
              { key: "title", label: "Task" },
              { key: "assigneeId", label: "Assigned To", render: (row) => members.find((m) => m.id === row.assigneeId)?.name ?? "Unassigned" },
              { key: "status", label: "Status", render: (row) => <StatusChip status={isOverdue(row) ? "overdue" : row.status} /> },
              { key: "dueDate", label: "Due Date" },
            ]}
            rows={recent}
            emptyTitle="No tasks yet"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Team Performance</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {members.slice(0, 4).map((m) => {
                const { assigned, done } = completionFor(m.id);
                return (
                  <Box key={m.id}>
                    <Typography variant="body2" fontWeight={600}>{m.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{done}/{assigned} tasks completed</Typography>
                    <LinearProgress variant="determinate" value={assigned > 0 ? (done / assigned) * 100 : 0} sx={{ mt: 0.5, height: 6, borderRadius: 3 }} />
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/staff/Dashboard.tsx
git commit -m "Rewrite Assigner Dashboard page with real task data"
```

---

### Task 12: Create Task page

**Files:**
- Create: `app/src/pages/staff/CreateTask.tsx`

**Interfaces:**
- Consumes: `addTask()` (Task 6).

- [ ] **Step 1: Create the page**

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Grid, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { addTask } from "@/api/staffTasks";
import type { TaskCategory, TaskPriority } from "@/types";

const emptyForm = {
  title: "", description: "", priority: "medium" as TaskPriority, dueDate: "",
  category: "maintenance" as TaskCategory, estimatedHours: 1, staffInstructions: "",
};

export default function CreateTask() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!form.title) { setSnackbar("Task title is required"); return; }
    addTask(form).then(() => {
      setSnackbar("Task created successfully");
      navigate("/staff/assign-task");
    });
  };

  return (
    <>
      <PageHeader eyebrow="Task Management" title="Create Task" />
      <Paper elevation={0} sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          <Grid size={12}><TextField label="Task Title" fullWidth required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Grid>
          <Grid size={12}><TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select label="Priority" value={form.priority} onChange={(e: SelectChangeEvent) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Due Date" type="date" fullWidth value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={form.category} onChange={(e: SelectChangeEvent) => setForm({ ...form, category: e.target.value as TaskCategory })}>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="administrative">Administrative</MenuItem>
                <MenuItem value="facilities">Facilities</MenuItem>
                <MenuItem value="supplies">Supplies</MenuItem>
                <MenuItem value="events">Events</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Estimated Hours" type="number" fullWidth value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })} /></Grid>
          <Grid size={12}><TextField label="Instructions for Staff" fullWidth multiline minRows={3} value={form.staffInstructions} onChange={(e) => setForm({ ...form, staffInstructions: e.target.value })} /></Grid>
        </Grid>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
          <Button variant="contained" onClick={handleSubmit}>Create Task</Button>
          <Button variant="outlined" onClick={() => setForm(emptyForm)}>Cancel</Button>
        </Stack>
      </Paper>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>New tasks are created unassigned — assign them from the Assign Task page.</Typography>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/staff/CreateTask.tsx
git commit -m "Add Create Task page"
```

---

### Task 13: Assign Task page

**Files:**
- Create: `app/src/pages/staff/AssignTask.tsx`

**Interfaces:**
- Consumes: `getTasks()`, `quickAssign()` (Task 6); `getTeamMembers()` (Task 3).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, MenuItem, Select, FormControl, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import EmptyState from "@/components/EmptyState";
import { getTasks, quickAssign } from "@/api/staffTasks";
import { getTeamMembers } from "@/api/staffTeamMembers";
import type { OpsTask, OpsTeamMember } from "@/types";

export default function AssignTask() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [members, setMembers] = useState<OpsTeamMember[]>([]);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getTasks().then(setTasks);
  useEffect(() => { load(); getTeamMembers().then(setMembers); }, []);

  const unassigned = tasks.filter((t) => t.assigneeId === null);

  const handleAssign = (taskId: string) => {
    const memberId = selection[taskId];
    const member = members.find((m) => m.id === memberId);
    if (!member) { setSnackbar("Select a team member first"); return; }
    quickAssign(taskId, member.id, member.name).then(() => { load(); setSnackbar(`Assigned to ${member.name}`); });
  };

  if (unassigned.length === 0 && tasks.length > 0) {
    return (
      <>
        <PageHeader eyebrow="Task Management" title="Assign Task" />
        <EmptyState title="No unassigned tasks" description="All current tasks already have an assignee." action={<Button variant="contained" onClick={() => navigate("/staff/create-task")}>Create Task</Button>} />
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Task Management" title="Assign Task" />
      <DataTable<OpsTask>
        columns={[
          { key: "title", label: "Task" },
          { key: "priority", label: "Priority" },
          { key: "category", label: "Category" },
          { key: "dueDate", label: "Due Date" },
          {
            key: "assignee", label: "Assign To",
            render: (row) => (
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select value={selection[row.id] ?? ""} displayEmpty onChange={(e: SelectChangeEvent) => setSelection({ ...selection, [row.id]: e.target.value })}>
                  <MenuItem value="" disabled>Select member</MenuItem>
                  {members.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>
            ),
          },
          { key: "action", label: "Action", render: (row) => <Button size="small" variant="contained" onClick={() => handleAssign(row.id)}>Assign</Button> },
        ]}
        rows={unassigned}
        emptyTitle="No unassigned tasks"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/staff/AssignTask.tsx
git commit -m "Add Assign Task page"
```

---

### Task 14: Task Overview page

**Files:**
- Create: `app/src/pages/staff/TaskOverview.tsx`

**Interfaces:**
- Consumes: `getTasks()`, `assignTask()` (Task 6); `getTeamMembers()` (Task 3); `<AssignTaskDialog>` (Task 9). Reads `status` and `assignee` from URL search params (set by Task 11's KPI cards and Task 17's Team View "View Tasks") on mount — this is the fix for the source's `viewMemberTasks` filter-reset race.

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, MenuItem, Select, InputLabel, FormControl, Stack, Chip } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { AssignTaskDialog } from "@/components/staff/AssignTaskDialog";
import { getTasks, assignTask } from "@/api/staffTasks";
import { getTeamMembers } from "@/api/staffTeamMembers";
import type { OpsTask, OpsTeamMember } from "@/types";

function isOverdue(task: OpsTask): boolean {
  return task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "completed";
}

export default function TaskOverview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [members, setMembers] = useState<OpsTeamMember[]>([]);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState(searchParams.get("assignee") ?? "all");
  const [assignDialogTask, setAssignDialogTask] = useState<OpsTask | null>(null);

  const load = () => getTasks().then(setTasks);
  useEffect(() => { load(); getTeamMembers().then(setMembers); }, []);

  const filtered = useMemo(() => tasks.filter((t) => {
    if (statusFilter === "overdue" && !isOverdue(t)) return false;
    if (statusFilter !== "all" && statusFilter !== "overdue" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (assigneeFilter !== "all" && t.assigneeId !== assigneeFilter) return false;
    return true;
  }), [tasks, statusFilter, priorityFilter, assigneeFilter]);

  const handleConfirmAssign = (assigneeId: string, assigneeName: string, notes: string) => {
    if (!assignDialogTask) return;
    assignTask(assignDialogTask.id, assigneeId, assigneeName, notes || undefined).then(() => { load(); setAssignDialogTask(null); });
  };

  return (
    <>
      <PageHeader
        eyebrow="Task Management"
        title="Task Overview"
        action={<Button variant="contained" onClick={() => navigate("/staff/create-task")}>+ New Task</Button>}
      />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cannot_complete">Cannot Complete</MenuItem>
            <MenuItem value="overdue">Overdue</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Priority</InputLabel>
          <Select label="Priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <MenuItem value="all">All Priorities</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Assignee</InputLabel>
          <Select label="Assignee" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
            <MenuItem value="all">All Assignees</MenuItem>
            {members.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <DataTable<OpsTask>
        pagination
        columns={[
          { key: "id", label: "ID" },
          {
            key: "title", label: "Task",
            render: (row) => (
              <Stack direction="row" spacing={1} alignItems="center">
                <span>{row.title}</span>
                {row.needsHelp && <Chip size="small" label="⚠️ Help" color="warning" variant="outlined" />}
                {row.status === "cannot_complete" && <Chip size="small" label="🛑 Cannot Complete" color="error" variant="outlined" />}
              </Stack>
            ),
          },
          { key: "assigneeId", label: "Assigned To", render: (row) => members.find((m) => m.id === row.assigneeId)?.name ?? "Unassigned" },
          { key: "priority", label: "Priority", render: (row) => <StatusChip status={row.priority} /> },
          { key: "status", label: "Status", render: (row) => <StatusChip status={isOverdue(row) ? "overdue" : row.status} /> },
          { key: "dueDate", label: "Due Date" },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => navigate(`/staff/tasks/${row.id}`)}>View</Button>
                {row.assigneeId === null && <Button size="small" onClick={() => setAssignDialogTask(row)}>Assign</Button>}
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No tasks match these filters"
      />
      <AssignTaskDialog
        open={!!assignDialogTask}
        taskTitle={assignDialogTask?.title ?? ""}
        onClose={() => setAssignDialogTask(null)}
        onConfirm={handleConfirmAssign}
      />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/staff/TaskOverview.tsx
git commit -m "Add Task Overview page"
```

---

### Task 15: Task Detail page

**Files:**
- Create: `app/src/pages/staff/TaskDetail.tsx`

**Interfaces:**
- Consumes: `getTaskById`, `approveTask`, `rejectTask`, `deleteTask`, `resolveHelpRequest`, `startTask`, `completeTask`, `submitRequestHelp`, `submitCannotComplete`, `assignTask` (Task 6); `getTeamMembers` (Task 3); `useStaffRole` (Task 2); `<AssignTaskDialog>` (Task 9).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Chip, Paper, Stack, TextField, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import StatusChip from "@/components/StatusChip";
import EmptyState from "@/components/EmptyState";
import { AssignTaskDialog } from "@/components/staff/AssignTaskDialog";
import { useStaffRole } from "@/context/StaffRoleContext";
import {
  getTaskById, approveTask, rejectTask, deleteTask, resolveHelpRequest,
  startTask, completeTask, submitRequestHelp, submitCannotComplete, assignTask,
} from "@/api/staffTasks";
import { getTeamMembers } from "@/api/staffTeamMembers";
import type { OpsTask, OpsTeamMember } from "@/types";

function isOverdue(task: OpsTask): boolean {
  return task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "completed";
}

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useStaffRole();
  const [task, setTask] = useState<OpsTask | null | undefined>(undefined);
  const [members, setMembers] = useState<OpsTeamMember[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpReason, setHelpReason] = useState("");
  const [cannotOpen, setCannotOpen] = useState(false);
  const [cannotReason, setCannotReason] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => { if (id) getTaskById(id).then((t) => setTask(t ?? null)); };
  useEffect(() => { load(); getTeamMembers().then(setMembers); }, [id]);

  if (task === undefined) return null;
  if (task === null) return <EmptyState title="Task not found" description="This task may have been deleted." />;

  const assignee = members.find((m) => m.id === task.assigneeId);

  const doDelete = () => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    deleteTask(task.id).then(() => navigate("/staff/tasks"));
  };

  const doAssign = (assigneeId: string, assigneeName: string, notes: string) => {
    assignTask(task.id, assigneeId, assigneeName, notes || undefined).then(() => { load(); setAssignOpen(false); setSnackbar(`Assigned to ${assigneeName}`); });
  };

  return (
    <>
      <PageHeader
        eyebrow="Task Management"
        title={task.title}
        summary={<StatusChip status={isOverdue(task) ? "overdue" : task.status} />}
        action={
          role === "assigner" ? (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => setAssignOpen(true)}>{task.assigneeId ? "Reassign" : "Assign Task"}</Button>
              {task.status === "completed" && task.approvalStatus === "pending" && (
                <>
                  <Button variant="contained" onClick={() => approveTask(task.id).then(() => { load(); setSnackbar("Task approved"); })}>Approve</Button>
                  <Button variant="outlined" color="error" onClick={() => rejectTask(task.id).then(() => { load(); setSnackbar("Task rejected"); })}>Reject</Button>
                </>
              )}
              <Button variant="outlined" color="error" onClick={doDelete}>Delete</Button>
            </Stack>
          ) : undefined
        }
      />

      {task.needsHelp && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderLeft: 3, borderColor: "warning.main", bgcolor: "action.hover" }}>
          <Typography variant="subtitle2" fontWeight={600}>⚠️ Help Requested</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>{task.helpNeededReason}</Typography>
          {role === "assigner" && (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <Button size="small" variant="contained" onClick={() => resolveHelpRequest(task.id).then(() => { load(); setSnackbar("Help request resolved"); })}>Mark as Resolved</Button>
              <Button size="small" variant="outlined" onClick={() => setAssignOpen(true)}>Reassign</Button>
            </Stack>
          )}
        </Paper>
      )}
      {task.status === "cannot_complete" && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderLeft: 3, borderColor: "error.main", bgcolor: "action.hover" }}>
          <Typography variant="subtitle2" fontWeight={600}>🛑 Cannot Complete</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>{task.cannotCompleteReason}</Typography>
          {role === "assigner" && (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <Button size="small" variant="outlined" onClick={() => setAssignOpen(true)}>Reassign</Button>
              <Button size="small" variant="outlined" color="error" onClick={doDelete}>Cancel Task</Button>
            </Stack>
          )}
        </Paper>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 2.5 }}>
        <Paper elevation={0} sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Description</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{task.description}</Typography>

          {role === "executor" && (
            <>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>What You Need To Do</Typography>
              <Box component="ol" sx={{ pl: 2.5, mb: 2 }}>
                {task.staffInstructions.split("\n").map((line, i) => <li key={i}><Typography variant="body2">{line.replace(/^\d+\.\s*/, "")}</Typography></li>)}
              </Box>
            </>
          )}

          {task.notes && (
            <>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Notes</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{task.notes}</Typography>
            </>
          )}

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Activity Timeline</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {task.timeline.map((entry, i) => (
              <Box key={i} sx={{ display: "flex", gap: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90 }}>{entry.time}</Typography>
                <Typography variant="body2">{entry.action}</Typography>
              </Box>
            ))}
          </Box>

          {role === "executor" && task.status !== "completed" && task.status !== "cannot_complete" && (
            <Stack spacing={1.5} sx={{ mt: 3 }}>
              <Stack direction="row" spacing={1.5}>
                {task.status === "pending" && <Button variant="contained" onClick={() => startTask(task.id).then(() => { load(); setSnackbar("Task started"); })}>Start Working</Button>}
                {task.status === "in_progress" && <Button variant="contained" onClick={() => completeTask(task.id).then(() => { load(); setSnackbar("Task marked as done"); })}>Mark as Done</Button>}
                <Button variant="outlined" color="warning" onClick={() => setHelpOpen(!helpOpen)}>Request Help</Button>
                <Button variant="outlined" color="error" onClick={() => setCannotOpen(!cannotOpen)}>Cannot Complete</Button>
              </Stack>
              {helpOpen && (
                <Stack spacing={1}>
                  <TextField label="Why do you need help?" fullWidth multiline minRows={2} value={helpReason} onChange={(e) => setHelpReason(e.target.value)} />
                  <Button variant="contained" onClick={() => {
                    if (!helpReason) { setSnackbar("Please describe why you need help"); return; }
                    submitRequestHelp(task.id, helpReason).then(() => { load(); setHelpOpen(false); setHelpReason(""); setSnackbar("Help request sent"); });
                  }}>Send Help Request</Button>
                </Stack>
              )}
              {cannotOpen && (
                <Stack spacing={1}>
                  <TextField label="Why can't this be completed?" fullWidth multiline minRows={2} value={cannotReason} onChange={(e) => setCannotReason(e.target.value)} />
                  <Button variant="contained" color="error" onClick={() => {
                    if (!cannotReason) { setSnackbar("Please describe the issue"); return; }
                    submitCannotComplete(task.id, cannotReason).then(() => { load(); setCannotOpen(false); setCannotReason(""); setSnackbar("Issue submitted"); });
                  }}>Submit Issue</Button>
                </Stack>
              )}
            </Stack>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 3, height: "fit-content" }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Task Info</Typography>
          <Stack spacing={1.5}>
            <Box><Typography variant="caption" color="text.secondary">ID</Typography><Typography variant="body2">{task.id}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Assigned To</Typography><Typography variant="body2">{assignee?.name ?? "Unassigned"}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Category</Typography><Typography variant="body2" sx={{ textTransform: "capitalize" }}>{task.category}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Priority</Typography><Chip size="small" label={task.priority} /></Box>
            <Box><Typography variant="caption" color="text.secondary">Due Date</Typography><Typography variant="body2">{task.dueDate}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Created</Typography><Typography variant="body2">{task.createdAt}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Est. Hours</Typography><Typography variant="body2">{task.estimatedHours}</Typography></Box>
            {task.approvalStatus && <Box><Typography variant="caption" color="text.secondary">Approval</Typography><StatusChip status={task.approvalStatus} /></Box>}
          </Stack>
        </Paper>
      </Box>

      <AssignTaskDialog open={assignOpen} taskTitle={task.title} onClose={() => setAssignOpen(false)} onConfirm={doAssign} />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/staff/TaskDetail.tsx
git commit -m "Add Task Detail page"
```

---

### Task 16: Team View page

**Files:**
- Create: `app/src/pages/staff/TeamView.tsx`

**Interfaces:**
- Consumes: `getTeamMembers()` (Task 3), `getTasks()` (Task 6). Navigates to `/staff/tasks?assignee={id}` — this is the fix for the source's `viewMemberTasks` bug (a URL param read on Task Overview's mount, not a DOM select value read after a re-render).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Box, Button, Grid, Paper, Typography } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { getTeamMembers } from "@/api/staffTeamMembers";
import { getTasks } from "@/api/staffTasks";
import type { OpsTask, OpsTeamMember } from "@/types";

export default function TeamView() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<OpsTeamMember[]>([]);
  const [tasks, setTasks] = useState<OpsTask[]>([]);

  useEffect(() => {
    getTeamMembers().then(setMembers);
    getTasks().then(setTasks);
  }, []);

  return (
    <>
      <PageHeader eyebrow="Team" title="Team View" />
      <Grid container spacing={2.5}>
        {members.map((m) => {
          const assigned = tasks.filter((t) => t.assigneeId === m.id);
          const active = assigned.filter((t) => t.status === "pending" || t.status === "in_progress").length;
          const done = assigned.filter((t) => t.status === "completed").length;
          return (
            <Grid key={m.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper elevation={0} sx={{ p: 2.5, textAlign: "center", height: "100%" }}>
                <Avatar sx={{ width: 56, height: 56, mx: "auto", mb: 1.5, fontWeight: 700 }}>{m.avatar}</Avatar>
                <Typography variant="subtitle1" fontWeight={600}>{m.name}</Typography>
                <Typography variant="body2" color="text.secondary">{m.role}</Typography>
                <Typography variant="caption" color="text.secondary">{m.department}</Typography>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 3, my: 1.5 }}>
                  <Box><Typography variant="h6" fontWeight={700}>{active}</Typography><Typography variant="caption" color="text.secondary">Active</Typography></Box>
                  <Box><Typography variant="h6" fontWeight={700}>{done}</Typography><Typography variant="caption" color="text.secondary">Done</Typography></Box>
                </Box>
                <Button variant="outlined" size="small" onClick={() => navigate(`/staff/tasks?assignee=${m.id}`)}>View Tasks</Button>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/staff/TeamView.tsx
git commit -m "Add Team View page"
```

---

### Task 17: Reports page

**Files:**
- Create: `app/src/pages/staff/Reports.tsx`

**Interfaces:**
- Consumes: `getTasks()` (Task 6), `getTeamMembers()` (Task 3).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle, getIconAccent } from "@/theme/chartPalette";
import { getTasks } from "@/api/staffTasks";
import { getTeamMembers } from "@/api/staffTeamMembers";
import type { OpsTask, OpsTeamMember } from "@/types";

function isOverdue(task: OpsTask): boolean {
  return task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "completed";
}

export default function Reports() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [members, setMembers] = useState<OpsTeamMember[]>([]);

  useEffect(() => {
    getTasks().then(setTasks);
    getTeamMembers().then(setMembers);
  }, []);

  const completed = tasks.filter((t) => t.status === "completed").length;
  const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);

  const statusData = [
    { label: "Pending", count: tasks.filter((t) => t.status === "pending").length },
    { label: "In Progress", count: tasks.filter((t) => t.status === "in_progress").length },
    { label: "Completed", count: completed },
    { label: "Cannot Complete", count: tasks.filter((t) => t.status === "cannot_complete").length },
  ];
  const categoryData = ["maintenance", "administrative", "facilities", "supplies", "events", "other"].map((cat) => ({
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    count: tasks.filter((t) => t.category === cat).length,
  }));

  const productivity = members.map((m) => {
    const assigned = tasks.filter((t) => t.assigneeId === m.id);
    const done = assigned.filter((t) => t.status === "completed").length;
    const inProgress = assigned.filter((t) => t.status === "in_progress").length;
    const overdue = assigned.filter(isOverdue).length;
    return { ...m, assigned: assigned.length, done, inProgress, overdue, rate: assigned.length > 0 ? Math.round((done / assigned.length) * 100) : 0 };
  });

  return (
    <>
      <PageHeader eyebrow="Analytics" title="Reports" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Tasks Created" icon={<AssignmentIcon />} color={getIconAccent(mode, "tasks")} numericValue={tasks.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Tasks Completed" icon={<AssignmentTurnedInIcon />} color={getIconAccent(mode, "completed")} numericValue={completed} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Completion Rate" icon={<TrendingUpIcon />} color={getIconAccent(mode, "rate")} value={`${completionRate}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Hours Estimated" icon={<ScheduleIcon />} color={getIconAccent(mode, "hours")} numericValue={totalHours} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Breakdown" title="Tasks by Status">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="count" fill={palette.categorical[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Breakdown" title="Tasks by Category">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="count" fill={palette.categorical[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <DataTable
        title="Team Productivity"
        columns={[
          { key: "name", label: "Team Member" },
          { key: "assigned", label: "Assigned" },
          { key: "done", label: "Completed" },
          { key: "inProgress", label: "In Progress" },
          { key: "overdue", label: "Overdue" },
          { key: "rate", label: "Completion Rate", render: (row) => `${row.rate}%` },
        ]}
        rows={productivity}
        emptyTitle="No team data found"
      />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/staff/Reports.tsx
git commit -m "Add Reports page with real recharts"
```

---

### Task 18: Executor Dashboard page

**Files:**
- Create: `app/src/pages/staff/ExecutorDashboard.tsx`

**Interfaces:**
- Consumes: `getTasks()` (Task 6); `currentExecutorId` (Task 3).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import StatusChip from "@/components/StatusChip";
import EmptyState from "@/components/EmptyState";
import { getTasks } from "@/api/staffTasks";
import { currentExecutorId } from "@/demo-data/staff/teamMembers";
import type { OpsTask } from "@/types";

function isOverdue(task: OpsTask): boolean {
  return task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "completed";
}

export default function ExecutorDashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [filter, setFilter] = useState<"today" | "all">("all");

  useEffect(() => { getTasks().then(setTasks); }, []);

  const myTasks = tasks.filter((t) => t.assigneeId === currentExecutorId && t.status !== "completed" && t.status !== "cannot_complete");
  const today = new Date().toISOString().slice(0, 10);
  const visible = filter === "today" ? myTasks.filter((t) => t.dueDate === today) : myTasks;

  return (
    <>
      <PageHeader eyebrow="My Work" title="My Tasks" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
        <Button variant={filter === "today" ? "contained" : "outlined"} onClick={() => setFilter("today")}>Today</Button>
        <Button variant={filter === "all" ? "contained" : "outlined"} onClick={() => setFilter("all")}>All Tasks</Button>
      </Stack>

      {visible.length === 0 ? (
        <EmptyState title={filter === "today" ? "No tasks due today" : "No pending tasks"} description="You're all caught up." />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {visible.map((task) => (
            <Paper key={task.id} elevation={0} sx={{ p: 3, cursor: "pointer" }} onClick={() => navigate(`/staff/tasks/${task.id}`)}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h6" fontWeight={700}>{task.title}</Typography>
                  <Typography variant="body2" color={isOverdue(task) ? "error" : "text.secondary"}>
                    Due {task.dueDate}{isOverdue(task) ? " — Overdue" : ""}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <StatusChip status={task.priority} />
                  <StatusChip status={isOverdue(task) ? "overdue" : task.status} />
                </Stack>
              </Stack>
              <Button size="small" sx={{ mt: 2 }} variant="outlined">View Task</Button>
            </Paper>
          ))}
        </Box>
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/staff/ExecutorDashboard.tsx
git commit -m "Add Executor Dashboard page"
```

---

### Task 19: Update Status page

**Files:**
- Create: `app/src/pages/staff/UpdateStatus.tsx`

**Interfaces:**
- Consumes: `getTasks()`, `startTask()`, `completeTask()` (Task 6); `currentExecutorId` (Task 3). Newly wired into the Executor sidebar (was orphaned in the source).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Stack, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getTasks, startTask, completeTask } from "@/api/staffTasks";
import { currentExecutorId } from "@/demo-data/staff/teamMembers";
import type { OpsTask } from "@/types";

export default function UpdateStatus() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<OpsTask[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getTasks().then(setTasks);
  useEffect(() => { load(); }, []);

  const myActive = tasks.filter((t) => t.assigneeId === currentExecutorId && (t.status === "pending" || t.status === "in_progress"));

  return (
    <>
      <PageHeader eyebrow="My Work" title="Update Status" />
      <DataTable<OpsTask>
        columns={[
          { key: "title", label: "Task" },
          { key: "priority", label: "Priority", render: (row) => <StatusChip status={row.priority} /> },
          { key: "status", label: "Current Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "dueDate", label: "Due Date" },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={1}>
                {row.status === "pending" && <Button size="small" variant="contained" onClick={() => startTask(row.id).then(() => { load(); setSnackbar("Task started"); })}>Start</Button>}
                {row.status === "in_progress" && <Button size="small" variant="contained" onClick={() => completeTask(row.id).then(() => { load(); setSnackbar("Task marked as done"); })}>Complete</Button>}
                <Button size="small" onClick={() => navigate(`/staff/tasks/${row.id}`)}>Details</Button>
              </Stack>
            ),
          },
        ]}
        rows={myActive}
        emptyTitle="No active tasks"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/staff/UpdateStatus.tsx
git commit -m "Add Update Status page"
```

---

### Task 20: Completed Tasks page

**Files:**
- Create: `app/src/pages/staff/CompletedTasks.tsx`

**Interfaces:**
- Consumes: `getTasks()` (Task 6); `currentExecutorId` (Task 3). Newly wired into the Executor sidebar (was orphaned in the source).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getTasks } from "@/api/staffTasks";
import { currentExecutorId } from "@/demo-data/staff/teamMembers";
import type { OpsTask } from "@/types";

export default function CompletedTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<OpsTask[]>([]);

  useEffect(() => { getTasks().then(setTasks); }, []);

  const myCompleted = tasks.filter((t) => t.assigneeId === currentExecutorId && t.status === "completed");

  return (
    <>
      <PageHeader eyebrow="My Work" title="Completed Tasks" />
      <DataTable<OpsTask>
        columns={[
          { key: "title", label: "Task" },
          { key: "category", label: "Category" },
          { key: "completedAt", label: "Completed On" },
          { key: "approvalStatus", label: "Approval Status", render: (row) => row.approvalStatus ? <StatusChip status={row.approvalStatus} /> : "—" },
          { key: "actions", label: "Action", render: (row) => <Button size="small" onClick={() => navigate(`/staff/tasks/${row.id}`)}>View</Button> },
        ]}
        rows={myCompleted}
        emptyTitle="No completed tasks yet"
      />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/staff/CompletedTasks.tsx
git commit -m "Add Completed Tasks page"
```

---

### Task 21: Profile page

**Files:**
- Create: `app/src/pages/staff/Profile.tsx`

**Interfaces:**
- Consumes: `getCurrentStaffProfile`, `updateCurrentStaffProfile` (Task 4); `useStaffRole` (Task 2).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Avatar, Button, Grid, Paper, Stack, TextField, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { useStaffRole } from "@/context/StaffRoleContext";
import { getCurrentStaffProfile, updateCurrentStaffProfile } from "@/api/staffProfile";
import type { StaffProfile } from "@/types";

export default function Profile() {
  const { role } = useStaffRole();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getCurrentStaffProfile(role).then(setProfile); }, [role]);

  const handleSave = () => {
    if (!profile) return;
    updateCurrentStaffProfile(role, profile).then((p) => { setProfile(p); setSnackbar("Profile updated successfully"); });
  };

  if (!profile) return null;

  return (
    <>
      <PageHeader eyebrow={role === "assigner" ? "Assigner" : "Executor"} title="My Profile" />
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
            <Avatar sx={{ width: 72, height: 72, mx: "auto", mb: 2, fontSize: 28, fontWeight: 700 }}>{profile.name.charAt(0)}</Avatar>
            <Typography variant="subtitle1" fontWeight={600}>{profile.name}</Typography>
            <Typography variant="body2" color="text.secondary">{role === "assigner" ? "Assigner / Operations" : "Executor"}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Full Name" fullWidth value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Email" fullWidth value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Department" fullWidth value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Phone" fullWidth value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Grid>
            </Grid>
            <Stack direction="row" sx={{ mt: 2.5 }}>
              <Button variant="contained" onClick={handleSave}>Save Changes</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/staff/Profile.tsx
git commit -m "Add Profile page"
```

---

### Task 22: Notifications page

**Files:**
- Create: `app/src/pages/staff/Notifications.tsx`

**Interfaces:**
- Consumes: `getOpsNotifications`, `markNotificationRead`, `markAllNotificationsRead` (Task 7).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getOpsNotifications, markNotificationRead, markAllNotificationsRead } from "@/api/staffNotifications";
import type { OpsNotification } from "@/types";

export default function Notifications() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<OpsNotification[]>([]);

  const load = () => getOpsNotifications().then(setRows);
  useEffect(() => { load(); }, []);

  const handleClick = (row: OpsNotification) => {
    markNotificationRead(row.id).then(load);
    if (row.taskId) navigate(`/staff/tasks/${row.taskId}`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Notifications"
        action={<Button variant="outlined" onClick={() => markAllNotificationsRead().then(load)}>Mark all read</Button>}
      />
      <DataTable<OpsNotification>
        pagination
        onRowClick={handleClick}
        columns={[
          { key: "message", label: "Message" },
          { key: "time", label: "Date" },
          { key: "read", label: "Status", render: (row) => <StatusChip status={row.read ? "read" : "unread"} /> },
        ]}
        rows={rows}
        emptyTitle="No notifications"
      />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/staff/Notifications.tsx
git commit -m "Add staff Notifications page"
```

---

### Task 23: Navigation + router wiring (role-aware `getNavItems` for staff)

**Files:**
- Modify: `app/src/components/navigation.tsx`
- Modify: `app/src/router.tsx`

**Interfaces:**
- Produces: final `getNavItems(role, teacherRole, staffRole)` signature; 11 new routes under `/staff/*`.

- [ ] **Step 1: Add imports**

In `app/src/components/navigation.tsx`, change:

```ts
import type { Role, TeacherRole } from "@/types";
```

to:

```ts
import type { Role, TeacherRole, StaffRole } from "@/types";
```

Add new icon imports (all others used below are already imported elsewhere in this file, add only the missing ones):

```ts
import AddTaskIcon from "@mui/icons-material/AddTask";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import BarChartIcon from "@mui/icons-material/BarChart";
import UpdateIcon from "@mui/icons-material/Update";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
```

- [ ] **Step 2: Replace the function signature and the `"staff"` case**

Replace:

```ts
export function getNavItems(role: Role, teacherRole: TeacherRole = "professor", _staffRole?: import("@/types").StaffRole): NavItem[] {
```

with:

```ts
export function getNavItems(role: Role, teacherRole: TeacherRole = "professor", staffRole: StaffRole = "assigner"): NavItem[] {
```

Replace the entire `case "staff":` block with:

```ts
    case "staff": {
      const items: NavItem[] = [
        { label: "Dashboard", path: "/staff", icon: <DashboardIcon /> },
        { label: "Create Task", path: "/staff/create-task", icon: <AddTaskIcon />, group: "Task Management" },
        { label: "Assign Task", path: "/staff/assign-task", icon: <AssignmentIndIcon />, group: "Task Management" },
        { label: "Task Overview", path: "/staff/tasks", icon: <AssignmentIcon />, group: "Task Management" },
        { label: "Team View", path: "/staff/team", icon: <GroupsIcon />, group: "Team" },
        { label: "Reports", path: "/staff/reports", icon: <BarChartIcon />, group: "Analytics" },
        { label: "Update Status", path: "/staff/update-status", icon: <UpdateIcon />, group: "My Work" },
        { label: "Completed Tasks", path: "/staff/completed-tasks", icon: <FactCheckIcon />, group: "My Work" },
        { label: "My Profile", path: "/staff/profile", icon: <AccountCircleIcon />, group: "_bottom" },
      ];
      return items.filter((item) => {
        if (item.group === "Task Management" || item.group === "Team" || item.group === "Analytics") return staffRole === "assigner";
        if (item.group === "My Work") return staffRole === "executor";
        return true;
      });
    }
```

`TaskAltIcon` is imported for potential future use but not needed by this nav list — remove it from the import list added in Step 1 if unused (keep only the 5 actually referenced: `AddTaskIcon`, `AssignmentIndIcon`, `FactCheckIcon`, `BarChartIcon`, `UpdateIcon`).

- [ ] **Step 3: Add lazy imports and routes to `router.tsx`**

Replace:

```ts
const StaffDashboard = lazy(() => import("@/pages/staff/Dashboard"));
```

with:

```ts
const StaffDashboard = lazy(() => import("@/pages/staff/Dashboard"));
const StaffCreateTask = lazy(() => import("@/pages/staff/CreateTask"));
const StaffAssignTask = lazy(() => import("@/pages/staff/AssignTask"));
const StaffTaskOverview = lazy(() => import("@/pages/staff/TaskOverview"));
const StaffTaskDetail = lazy(() => import("@/pages/staff/TaskDetail"));
const StaffTeamView = lazy(() => import("@/pages/staff/TeamView"));
const StaffReports = lazy(() => import("@/pages/staff/Reports"));
const StaffExecutorDashboard = lazy(() => import("@/pages/staff/ExecutorDashboard"));
const StaffUpdateStatus = lazy(() => import("@/pages/staff/UpdateStatus"));
const StaffCompletedTasks = lazy(() => import("@/pages/staff/CompletedTasks"));
const StaffProfilePage = lazy(() => import("@/pages/staff/Profile"));
const StaffNotifications = lazy(() => import("@/pages/staff/Notifications"));
```

Replace:

```ts
      { path: "staff", element: <StaffDashboard /> },
```

with:

```ts
      { path: "staff", element: <StaffDashboardOrExecutor /> },
      { path: "staff/create-task", element: <StaffCreateTask /> },
      { path: "staff/assign-task", element: <StaffAssignTask /> },
      { path: "staff/tasks", element: <StaffTaskOverview /> },
      { path: "staff/tasks/:id", element: <StaffTaskDetail /> },
      { path: "staff/team", element: <StaffTeamView /> },
      { path: "staff/reports", element: <StaffReports /> },
      { path: "staff/update-status", element: <StaffUpdateStatus /> },
      { path: "staff/completed-tasks", element: <StaffCompletedTasks /> },
      { path: "staff/profile", element: <StaffProfilePage /> },
      { path: "staff/notifications", element: <StaffNotifications /> },
```

`StaffDashboardOrExecutor` doesn't exist yet — add it directly in `router.tsx`, right before `export const router`, as a small role-branching wrapper (the spec's decision to keep `/staff` as one route branching on `useStaffRole()` rather than two separate routes):

```tsx
import { useStaffRole } from "@/context/StaffRoleContext";

function StaffDashboardOrExecutor() {
  const { role } = useStaffRole();
  return role === "executor" ? <StaffExecutorDashboard /> : <StaffDashboard />;
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/navigation.tsx app/src/router.tsx
git commit -m "Wire staff navigation and routes"
```

---

### Task 24: End-to-end manual verification, lint, and `ops.html` deletion

**Files:**
- None created — verification only, plus final deletion of the legacy file.

- [ ] **Step 1: Lint check**

Run (from `app/`): `npm run lint`
Expected: 0 errors (the pre-existing `AuthContext.tsx` warning is acceptable).

- [ ] **Step 2: Start dev server and verify via browser-driver**

Use the `browser-driver` skill. In a single script invocation (fresh browser, full flow each time):
1. Navigate to `/login`, select role "Staff" (or whatever label the Role `<select>` uses for this portal) via the combobox, sign in.
2. On the Assigner Dashboard, confirm the topbar role-switcher shows "Assigner" and the 5 KPI cards render with real counts.
3. Click the "Overdue" KPI card — confirm it navigates to Task Overview pre-filtered to overdue tasks (at least `OT-001` should appear).
4. Create a task via Create Task (fill Title, Category, Due Date, Estimated Hours, Staff Instructions) — confirm it lands on Assign Task and appears there unassigned.
5. Assign that new task to a team member via Assign Task's inline row action — confirm it disappears from the unassigned list.
6. On Task Overview, use the Assignee filter to select "Mike Davis" — confirm only his tasks show. Then go to Team View and click "Mike Davis"'s "View Tasks" — confirm Task Overview opens pre-filtered to his tasks (this is the source's `viewMemberTasks` bug fix — must not show the unfiltered list).
7. Open a completed task with `approvalStatus: "pending"` (`OT-003`) — click Approve — confirm it flips to "Approved".
8. Switch the role-switcher to "Executor" — confirm the topbar sidebar header identity changes to "John Smith" and the "My Work" nav group (Update Status, Completed Tasks) appears while "Task Management"/"Team"/"Analytics" disappear.
9. On My Tasks (Executor Dashboard), open a task, click "Request Help" and submit a reason — confirm it flips to a help-requested state; switch back to Assigner and confirm that task's detail page shows the Help Requested banner with the exact reason text.
10. Visit Update Status and Completed Tasks (previously-orphaned pages) — confirm both render real per-record data for John Smith specifically.
11. Visit Reports — confirm both charts render as real `recharts` bar charts.
12. Visit My Profile in both Assigner and Executor mode — confirm the two show different identities, and that editing+saving the Executor's profile updates the sidebar header name after navigating away and back.
13. Toggle dark mode — confirm all new pages render correctly in both themes.
14. Reload the page and confirm the role-switcher's last-selected role persists (localStorage).

If any step fails, stop and fix before proceeding — do not delete `ops.html` until every step above passes.

- [ ] **Step 3: Delete the fully-ported legacy file**

```bash
git rm ops.html
git commit -m "Delete legacy ops.html — fully ported to app/ (Staff/Operations portal Phase 3 complete)"
```

- [ ] **Step 4: Update local todo tracking**

Mark Phase 3 complete; Phase 4 (Student portal, from `student.html`) is next.
