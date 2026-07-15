# College ERP Rewrite — Phase 3: Staff / Operations Portal

Status: Approved
Date: 2026-07-15

## Context

Rewrite of `ops.html` (4,491 lines: ~1,823 CSS, ~270 static HTML, ~1,935 JS),
the legacy Operations/Staff portal, into `app/`. Unlike Admin (5 sub-phases)
and Teacher (2 sub-phases), this portal is modest enough (~11 pages) to ship
as a single phase. Once shipped, `ops.html` is deleted. Conventions from all
prior phases apply unchanged (fake-async API layer, per-module independent
`createRng` seeds, monochrome design system, `StatusChip`, sidebar grouping).

## Source findings

- This portal is a **task assignment/execution system**, not an inventory
  ledger: an **Assigner** role (supervisor — creates/assigns/tracks/approves
  tasks) and an **Executor** role (a single staff member's simplified,
  task-first UI), toggled client-side via `switchRole()` — structurally the
  same pattern as the Teacher portal's role-switcher, but 2-way instead of
  3-way.
- **`viewMemberTasks(memberId)`** (Team View's "View Tasks" button) sets the
  Task Overview page's assignee `<select>` value, then navigates — but
  `renderTaskOverview()` immediately rebuilds that `<select>`'s options
  (resetting it to "All Assignees") before the filter is read. Net effect:
  clicking "View Tasks" for any specific staff member always lands on the
  *unfiltered* Task Overview — a render-order race, not a literal
  ID-ignoring handler, but the same user-facing symptom. Fixed to filter
  correctly by that member.
- **Profile form** submit only shows a success toast — never writes back to
  the displayed user identity anywhere. Fixed to a real, persisted update
  (matching every other portal's Profile page).
- **Executor identity is hardcoded**: `executorId = 1` (John Smith) is
  duplicated across three renderer functions, and the topbar header always
  shows the static "Admin User"/"AD" even while in Executor mode. Fixed:
  the header reflects whichever identity is active for the current role.
- **`statusModal`/`openStatusModal`/`confirmStatusUpdate`** are fully wired
  to each other but `openStatusModal` is never called from anywhere in the
  source — the modal can never appear in the running app; all real status
  changes go through direct `startTask`/`completeTask`/executor actions
  instead. Not ported — those direct actions already cover the same
  functionality without a redundant modal.
- **Two orphaned-but-fully-built pages** — `page-update-status` and
  `page-completed-tasks` — have real renderers and per-row actions but no
  sidebar link or `navigateTo()` call anywhere targets them. Both are wired
  into the Executor sidebar in the rewrite, since they're already complete
  and their titles/subtitles clearly signal that was the intent.
- **`saveNotes(taskId)`** references a `#executorNotes` element that does
  not exist in the HTML and is never called from any `onclick` — dead code,
  not ported.
- **A second, entirely separate notification-dropdown implementation**
  (`renderNotificationsDropdown()` / `#notificationsDropdown`) exists
  alongside the working slide-in panel (`toggleNotifications()` /
  `renderNotifications()` / `#notificationPanel`) but is never triggered by
  anything — dead code, not ported. The working slide-in panel pattern
  (already built in Admin/Teacher via `getUnreadNotificationCount`) is
  reused instead.
- **Reports' "Tasks by Status" / "Tasks by Category"** are real computed
  breakdowns (currently rendered as CSS progress bars, not placeholder
  text) — upgraded to real `recharts` bar charts, continuing the same
  "upgrade real computation to a real chart" precedent as Teacher's
  Inter-Department Reports.
- No `alert()`/undefined-`showNotification()` crash bugs exist in this
  source file at all — the only toast mechanism (`showToast`) is always
  paired with a real mutation except the Profile stub noted above.
- `window.history.back` is globally overridden for custom in-app back
  navigation — not applicable to the rewrite; React Router's own history
  handles this.
- Task status `'cannot-complete'` has no styled badge color in the source
  (falls back to an unstyled/raw string) and `'overdue'` is a computed,
  never-stored virtual state (`dueDate < now && status !== 'completed'`) —
  both handled properly in `StatusChip` and as a derived value in the
  rewrite, not a stored enum member.

## Decisions

- **Role-switcher UI**: `StaffRoleContext` (mirrors `TeacherRoleContext`
  exactly — `createContext` + `useStaffRoleState()` hook with
  localStorage persistence key `college_erp_staff_role`) wired into
  `Layout.tsx`, gated to `role === "staff"`, with a real `<Select>`
  (Assigner/Executor) in the topbar. Assigner is the default.
- **Executor identity**: a single seeded `TeamMember` (from the 5-person
  roster) is designated "the current executor" in demo data; Layout's
  topbar avatar/name reflect this identity when in Executor mode and the
  Assigner's static identity otherwise.
- **Update Status / Completed Tasks ship as real pages**, added to the
  Executor sidebar group, reusing the same `Task` records as Executor
  Dashboard/Task Detail (not separate demo data).
- **`viewMemberTasks` bug fix**: Task Overview accepts an optional
  assignee filter via navigation state (not a DOM `<select>` value read
  after a re-render), so "View Tasks" from Team View reliably pre-filters.
- **Profile save is functional**, persisting the current role's editable
  identity fields (name, email, department, phone) back to the same demo
  data the topbar reads from.
- **Reports charts become real `recharts` bar charts** for both the
  status breakdown and category breakdown; the Team Productivity table
  stays a real `DataTable`.
- **Assign Task modal and Create Task form are fully functional**,
  matching the source's genuinely fillable fields.
- **`statusModal`, `saveNotes`, and the dead notification-dropdown are not
  ported** — direct start/complete actions and the existing slide-in
  notification panel already cover that functionality.

## Data model (additions to `src/types/index.ts`)

```ts
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
```

## Folder additions

```
src/
  context/
    StaffRoleContext.ts
  demo-data/
    staff/
      tasks.ts             (OpsTask[])
      teamMembers.ts        (OpsTeamMember[])
      notifications.ts      (OpsNotification[])
  api/
    staffTasks.ts
    staffTeamMembers.ts
    staffNotifications.ts
    staffProfile.ts
  pages/staff/
    Dashboard.tsx           (Assigner dashboard — replaces Phase 0 placeholder)
    CreateTask.tsx
    AssignTask.tsx
    TaskOverview.tsx
    TaskDetail.tsx          (shared assigner/executor rendering, role-branched)
    TeamView.tsx
    Reports.tsx
    ExecutorDashboard.tsx
    UpdateStatus.tsx
    CompletedTasks.tsx
    Profile.tsx
    Notifications.tsx
```

## Routing additions (`router.tsx`)

```
/staff                     -> Dashboard (Assigner) or ExecutorDashboard (Executor), role-branched
/staff/create-task         -> CreateTask
/staff/assign-task         -> AssignTask
/staff/tasks               -> TaskOverview
/staff/tasks/:id           -> TaskDetail
/staff/team                -> TeamView
/staff/reports             -> Reports
/staff/update-status       -> UpdateStatus
/staff/completed-tasks     -> CompletedTasks
/staff/profile             -> Profile
/staff/notifications        -> Notifications
```

`/staff`'s dashboard content branches on `useStaffRole()` inside a single
`Dashboard.tsx`, rather than two separate routes, since the source treats
both as "the home page for this role" and React Router doesn't need a
route split to express that.

## Navigation changes (`components/navigation.tsx`, `"staff"` case)

```
Dashboard                                                     (ungrouped)
Task Management group (Assigner only):
  Create Task, Assign Task, Task Overview
Team group (Assigner only):
  Team View
Analytics group (Assigner only):
  Reports
My Work group (Executor only):
  Update Status, Completed Tasks
My Profile                                                    (final ungrouped item, "_bottom")
```

`getNavItems("staff", staffRole)` filters groups by role, mirroring
Phase 2b's teacher-role filtering exactly (`Assigner`-only groups hidden
in Executor mode and vice versa). `Notifications` is reachable via the
topbar bell, not the sidebar (matching every other portal).

## Component reuse

Same as every prior phase: `PageHeader`, `StatCard`, `ChartCard`,
`DataTable`, `EmptyState`, `StatusChip`. `StatusChip` needs new entries:
`in_progress` already exists (reused from Teacher/Admin); `cannot_complete`
is new (critical/red); `pending`/`completed`/`approved`/`rejected` already
exist. Priority `low`/`medium`/`high` already exist from Teacher Phase 2b.

## Error handling

Same as every prior phase — in-memory mutations only, resolved through
`simulateRequest`.

## Testing / verification

Role-switcher actually changes visible nav groups and topbar identity;
Create Task form submission produces a real unassigned task visible on
Assign Task; quick-assign and the Assign Task modal both correctly mutate
`assigneeId`; Task Overview status/priority/assignee filters work, and the
`viewMemberTasks` fix is verified by confirming Team View's "View Tasks"
actually pre-filters Task Overview to that member (not the source's
unfiltered-result bug); Task Detail's Approve/Reject/Delete mutate real
state; Executor Dashboard/Task Detail's Start/Complete/Request
Help/Cannot Complete all mutate real state; Update Status and Completed
Tasks pages render real per-record data; Reports' 2 charts render as real
`recharts`; Profile save persists and is reflected in the topbar identity;
both light/dark modes render correctly.

## Out of scope for Phase 3

Student portal (Phase 4, from `student.html`) is a separate, later phase.
