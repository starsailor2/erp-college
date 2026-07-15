# College ERP Rewrite — Phase 2b: Teacher / HOD, Dean, Profile, Role-Switcher

Status: Approved
Date: 2026-07-15

## Context

Second (final) sub-phase of Phase 2 (Teacher portal), completing
`faculty.html`'s remaining 5 sections plus the role-switcher UI:
Department Overview, Attendance Approval, Marks Approval, Faculty
Workload, Student Issues (HOD Functions), Academic Overview, Policy &
Deadlines, Inter-Department Reports, Approvals Dashboard (Dean
Functions), and My Profile. Once shipped, `faculty.html` is fully
ported and can be deleted. Conventions from all prior specs apply
unchanged.

## Source findings (from the Phase 2a full-file audit, reused here)

- Role model: real in-portal `<select>` (Professor/HOD/Dean) toggles
  sidebar sections and gates pages via `authority_level` guards.
- **Attendance Approval / Marks Approval**: Approve/Reject have no
  `onclick` at all (Attendance) or partially work as a bare alert with
  no state change (Marks' Approve) — both fixed to functional
  mutations against their own dedicated pending-approvals list.
- **Approvals Dashboard**: its 3 escalation tables (Leave/Grade-Change/
  Resource) are literally the Dean-side view of the same request types
  already built in Phase 2a — not a separate concept. "Approve" is a
  bare alert in the source; "Reject" has no `onclick`. Both become
  functional mutations on the real Phase 2a request records.
- **Student Issues' "View"** calls `openConcernDetail()` with **zero
  arguments** — the clearest instance of the ID-ignoring bug in the
  whole file (every row's button is identical, can't distinguish which
  student). Fixed to a real per-issue detail view.
- **Department Overview, Faculty Workload**: fully static/read-only in
  the source — no actions exist on either screen at all.
- **Policy & Deadlines' "Edit"** and **Inter-Department Reports'**
  "Generate Report"/"View Details" have no `onclick` and no real form
  exists anywhere in the source — stay stub `Snackbar`s, matching the
  established "no real form to adapt" rule.
- **Inter-Department Reports has 2 more chart-placeholder text
  strings** — become real `recharts` charts, continuing Phase 2a's
  precedent.
- **My Profile**: Edit Profile calls the same undefined
  `showNotification` bug as everywhere else (fixed to real Snackbar);
  Current Courses table already pulls from real course data in the
  source (`appState.courses`) — Phase 2b reuses Phase 2a's real
  `teacherCourses` for this, not new data.

## Decisions

- **Role-switcher UI ships now**: `TeacherRoleContext.Provider`
  (wrapping `useTeacherRoleState()`) is added to `Layout.tsx`, gated to
  the teacher portal, with a real `<Select>` in the topbar
  (Professor/HOD/Dean). This makes Phase 2a's Department Students and
  Academic Cohort reachable for the first time.
- **Approvals Dashboard reuses Phase 2a's real `LeaveRequest`/
  `GradeChangeRequest`/`ResourceRequest` data** — new
  `approveDeanRequest(type, id)` / `rejectDeanRequest(type, id)` API
  functions mutate `deanStatus` on those same records. This is the one
  case in Phase 2b where reusing an already-shipped Phase 2a type is
  correct (it's the same workflow's next stage, not a parallel
  concept) — unlike Attendance/Marks Approval, whose "pending
  approvals queue" is a distinct concept from a teacher's own
  submission history and gets its own dedicated demo data.
- **Academic Overview's Department Comparison table reuses Phase 2a's
  `DepartmentSummary`**, with one new optional field
  (`completionPct`) added to the type — justified because this screen
  is literally the institute-wide rollup of the same 4 departments
  Academic Cohort already renders, not a new concept.
- **Attendance Approval, Marks Approval, Faculty Workload, Student
  Issues, Department Overview's Faculty List/Course Coverage** all get
  their own small dedicated demo-data files (not reused from Phase
  2a's per-teacher submission records), since the source's "approvals
  queue" and "department roster" concepts are distinct from what one
  teacher submitted.
- **My Profile's Save Changes is functional** (persists a
  `TeacherProfile` singleton's editable fields); Change Photo and the
  3 Account Settings buttons stay stubs (no real feature to hook into).

## Data model (additions to `src/types/index.ts`)

```ts
export interface FacultyRosterEntry {
  id: string;
  name: string;
  designation: string;
  courseCount: number;
  studentCount: number;
  avgLoad: string; // "6.5 hrs/wk"
  status: "active" | "on_leave";
}

export interface CourseCoverageEntry {
  course: string;
  facultyName: string;
  section: string;
  students: number;
  semester: string;
  status: "covered" | "gap";
}

export type ApprovalStatus = "pending" | "approved" | "rejected";
export interface AttendanceApprovalEntry {
  id: string;
  course: string;
  facultyName: string;
  date: string;
  section: string;
  students: number;
  submitted: string;
  status: ApprovalStatus;
}

export interface MarksApprovalEntry {
  id: string;
  course: string;
  facultyName: string;
  assessment: string;
  maxMarks: number;
  submittedOn: string;
  status: ApprovalStatus;
}

export interface WorkloadEntry {
  facultyName: string;
  designation: string;
  courses: number;
  students: number;
  hrsPerWeek: number;
  loadPct: number;
  status: "normal" | "overloaded";
}

export interface StudentIssue {
  id: string;
  rollNo: string;
  name: string;
  issue: string;
  detail: string;
  raisedBy: string;
  date: string;
  priority: "normal" | "high" | "urgent";
  status: "open" | "resolved";
}

export interface CalendarEvent {
  id: string;
  event: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "closed";
}

export interface AcademicPolicy {
  name: string;
  description: string;
}

export interface ReportRow {
  department: string;
  avgAttendancePct: number;
  avgMarksPct: number;
  passRatePct: number;
  atRiskPct: number;
  facultyUtilizationPct: number;
}

export interface TeacherProfile {
  name: string;
  facultyId: string;
  email: string;
  phone: string;
  office: string;
  dateOfJoining: string;
  qualifications: string[];
  specializations: string[];
  yearsExperience: number;
}
```

Additions to existing types:

```ts
// DepartmentSummary (Phase 2a) gains one optional field:
completionPct?: number;
```

## Folder additions

```
src/
  demo-data/
    teacher/
      facultyRoster.ts       (FacultyRosterEntry + CourseCoverageEntry)
      approvals.ts            (AttendanceApprovalEntry + MarksApprovalEntry)
      workload.ts
      studentIssues.ts
      calendar.ts              (CalendarEvent + AcademicPolicy)
      reports.ts               (ReportRow)
      profile.ts               (TeacherProfile)
  api/
    teacherFacultyRoster.ts
    teacherApprovals.ts
    teacherWorkload.ts
    teacherStudentIssues.ts
    teacherCalendar.ts
    teacherReports.ts
    teacherProfile.ts
  pages/teacher/
    DepartmentOverview.tsx
    AttendanceApproval.tsx
    MarksApproval.tsx
    FacultyWorkload.tsx
    StudentIssues.tsx
    AcademicOverview.tsx
    PolicyDeadlines.tsx
    InterDeptReports.tsx
    ApprovalsDashboard.tsx
    Profile.tsx
```

`api/teacherRequests.ts` (Phase 2a) gains `approveDeanRequest`/
`rejectDeanRequest` functions; `api/teacherDepartments.ts` (Phase 2a)
gains `completionPct` in its generator.

## Routing additions (`router.tsx`)

```
/teacher/department-overview  -> DepartmentOverview
/teacher/attendance-approval  -> AttendanceApproval
/teacher/marks-approval       -> MarksApproval
/teacher/workload             -> FacultyWorkload
/teacher/student-issues       -> StudentIssues
/teacher/academic-overview    -> AcademicOverview
/teacher/policy-deadlines     -> PolicyDeadlines
/teacher/inter-dept-reports   -> InterDeptReports
/teacher/approvals            -> ApprovalsDashboard
/teacher/profile              -> Profile
```

No per-record detail routes — Student Issues' fixed "View" is an
in-page expansion/modal, matching every prior phase's pattern for
records with a real form but no dedicated page in the source.

## Navigation changes (`components/navigation.tsx`, `"teacher"` case)

Add **HOD Functions** and **Dean Functions** groups after
Communication, plus **My Profile** as a final ungrouped item (matching
the source's own sidebar placement):

```
Dashboard / Academics / Students / Requests / Communication  (Phase 2a, unchanged)
HOD Functions group:
  Department Overview, Attendance Approval, Marks Approval,
  Faculty Workload, Student Issues
Dean Functions group:
  Academic Overview, Policy & Deadlines, Inter-Department Reports,
  Approvals Dashboard
My Profile                                                    (ungrouped)
```

`getNavItems` for `"teacher"` needs to become role-aware: HOD-group
items render only when `role !== "professor"`; Dean-group items only
when `role === "dean"` — matching the source's sidebar-section
show/hide behavior exactly.

## Component reuse

Same as Phase 2a. `StatusChip` needs `covered`/`gap` (Course Coverage),
`normal`/`overloaded` (Workload) — new; `pending`/`approved`/
`rejected`/`open`/`resolved`/`upcoming`/`active`/`closed` already
exist or fall back cleanly to the generic gray default where a
semantic color isn't warranted.

## Error handling

Same as every prior phase — in-memory mutations only, resolved through
`simulateRequest`.

## Testing / verification

Same as every prior phase, plus: the role-switcher actually changes
which nav groups are visible and unlocks Department Students/Academic
Cohort; Attendance/Marks Approval and Approvals Dashboard's Approve/
Reject actually mutate status and move rows between pending/resolved
tables; Student Issues' View shows the correct clicked student's own
detail (not a fixed sample); Inter-Department Reports' 2 charts render
as real `recharts`; both light/dark modes render correctly.

## Out of scope for Phase 2b

Nothing remains in the Teacher portal after this phase — `faculty.html`
can be deleted once it ships. Staff/Operations portal (Phase 3) and
Student portal (Phase 4) are separate, later phases.
