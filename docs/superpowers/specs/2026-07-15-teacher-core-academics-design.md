# College ERP Rewrite — Phase 2a: Teacher / Core, Academics, Students, Requests, Communication

Status: Approved
Date: 2026-07-15

## Context

First sub-phase of Phase 2 (Teacher/Faculty portal), rebuilt from
`faculty.html` (6827 lines). Covers 16 of faculty.html's 21 sections:
Dashboard, My Courses, Attendance, Internal Marks, Exams, Course
Materials, My Course Students, Department Students, Academic Cohort,
Student Performance, Leave Requests, Grade Change Requests, Resource
Requests, Notices, Messages, Document Signatures. Phase 2b covers the
remaining 5 (HOD/Dean-gated screens + role-switcher UI + Profile).
Conventions from all Admin-phase specs (stack, folder layout,
fake-async-API pattern, functional filters, real per-record Add/Edit,
demo-data generation, sidebar grouping) apply unchanged.

## Source findings (verified via full-file audit)

- **Role model**: `faculty.html` has one login (`Dr. Rajesh Kumar`,
  default role `professor`) with a real in-portal role-switcher
  (`<select>` Professor/HOD/Dean) that toggles sidebar sections and
  gates several pages. This phase builds the role *context*
  (`TeacherRoleContext`, default `"professor"`) since 2 of its 16
  pages need to gate on it, but the switcher *UI* and the HOD/Dean nav
  groups ship in Phase 2b. Until then, Department Students and
  Academic Cohort correctly show "Access Denied" (matching the
  source's real behavior for a `professor`).
- **`showNotification()` is called ~20 times but never defined** —
  every "stub" action in the source actually throws a runtime error.
  Fixed to a real `Snackbar` everywhere, matching every prior phase's
  stub-notification pattern.
- **Many buttons have no `onclick` at all** (Leave/Grade-Change/
  Resource submit, Notices publish, Messages send, Course Materials
  upload/delete, several "View"/"Edit"/"Approve"/"Reject") — dead, not
  even a stub. Fixed per the decisions below: functional where a real
  form/data exists, stub `Snackbar` otherwise.
- **ID-ignoring bugs confirmed**: `viewDocumentToSign(docId)` and
  `viewSignatureHistory(docId)` always render the same fixed document
  regardless of which row was clicked. `viewDepartmentDrillDown` (used
  by Academic Cohort) interpolates the department name into the title
  but every stat/table inside is identical regardless of department.
  Attendance's "View" on submission history shows constant numbers
  regardless of which submission was clicked. All fixed to show real
  per-record data, per the established pattern from every Admin phase.
- **Two orphaned real modal-builders exist** (`createNotice()`,
  `composeMessage()`) with real fields but are never wired to any
  visible button — the on-page Notices/Messages controls that should
  trigger them have no `onclick`. Since real fields already exist,
  Notices and Messages become genuinely functional rather than stubs.
- **Messages' right pane always shows the same HOD conversation**
  regardless of which of the 3 contacts is clicked (a real content
  bug, not just an unwired button) — fixed to show the clicked
  contact's own thread.
- **2 chart placeholders are literal text** ("Assessment-wise
  Performance Trend Chart", "Score Distribution Histogram" on Student
  Performance) — become real `recharts` charts, matching how Admin's
  Dashboard already renders a real bar chart instead of a placeholder.
- **`showStudentProfile(rollNo)` is correctly implemented** in the
  source (real per-student lookup) — this pattern is kept as-is, not
  "fixed," since it isn't broken.

## Decisions

- **Functional (real demo-data mutation)**: Attendance marking (Submit
  Attendance persists real per-student status), Internal Marks entry
  (persists real per-student marks), Leave/Grade-Change/Resource
  requests (Submit adds a real row to that request type's own history
  table with `"pending_approval"` status), Notices (Publish adds a
  real notice; uses the source's own unwired `createNotice()` field
  list: Title, Content, Audience, Priority, Expiry Date), Messages
  (Send appends a real message to the clicked contact's thread),
  Document Signatures' Sign action (advances `pending → in_progress →
  completed`, same status-advance approach as Admin Phase 1e — no
  canvas signature pad, per your standing decision).
- **Stub `Snackbar` (source has no real modal/data to adapt)**:
  Course Materials upload/delete, "Flag to HOD" on at-risk students,
  Student Profile modal's "Add Remark"/"View Performance"/"View
  Attendance" buttons, "Download Report"/"Export Data" actions,
  Academic Cohort's non-drill-down actions.
- **Attendance/Marks "View" detail pages fixed to real per-record
  data** — Attendance's submission-history "View" and Marks'
  submission-history "View" now look up and display that specific
  submission's own data instead of constant placeholder numbers.
- **Academic Cohort's "Drill Down" fixed to real per-department
  data** — the 4-department Risk Heatmap table's Drill Down now shows
  that department's own stats/sub-tables instead of identical content
  for every department.
- **Filters made real** across every page that has them (Attendance's
  Course select was already real in the source; Session select,
  Internal Marks' Assessment/Max Marks, My Course Students' Course/
  Status, Department Students' Program/Year/Status/Search, Academic
  Cohort's Department/Program/Year, Student Performance's Course/
  Assessment) — matching every prior phase's "no decorative no-op
  controls" rule.
- **Duplicate function redeclarations in the source are irrelevant**
  to the rewrite (a React rewrite has no equivalent concept) — noted
  only as a source-fidelity fact, not something to replicate.

## Data model (additions to `src/types/index.ts`)

```ts
export type TeacherRole = "professor" | "hod" | "dean";

export interface TeacherCourse {
  id: string; // "CS201"
  name: string;
  section: string;
  studentCount: number;
  avgAttendancePct: number;
  avgMarksPct: number;
}

export type AttendanceMarkStatus = "present" | "absent" | "medical" | "other";
export interface AttendanceSubmission {
  id: string;
  courseId: string;
  section: string;
  session: "forenoon" | "afternoon";
  date: string;
  records: { studentId: string; status: AttendanceMarkStatus; remarks: string }[];
}

export interface MarksSubmission {
  id: string;
  courseId: string;
  assessment: string; // "Quiz1" | "Quiz2" | "Assignment1" | "MidExam"
  maxMarks: number;
  date: string;
  status: "approved" | "submitted" | "pending_hod_review";
  records: { studentId: string; marks: number }[];
}

export type TeacherRequestStatus = "pending_approval" | "approved" | "rejected" | "escalated";
export interface LeaveRequest {
  id: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  coverageArrangements: string;
  hodStatus: TeacherRequestStatus;
  deanStatus: TeacherRequestStatus | null;
  raisedOn: string;
}

export interface GradeChangeRequest {
  id: string;
  courseId: string;
  studentRollNo: string;
  assessment: string;
  originalMark: number;
  proposedMark: number;
  reason: string;
  hodStatus: TeacherRequestStatus;
  deanStatus: TeacherRequestStatus | null;
  raisedOn: string;
}

export interface ResourceRequest {
  id: string;
  resourceType: string;
  description: string;
  justification: string;
  estimatedCost: number;
  requiredBy: string;
  hodStatus: TeacherRequestStatus;
  deanStatus: TeacherRequestStatus | null;
}

export type TeacherNoticeAudience = "my_courses" | "department" | "institute";
export interface TeacherNotice {
  id: string;
  title: string;
  content: string;
  audience: TeacherNoticeAudience;
  priority: "normal" | "high" | "urgent";
  expiryDate: string;
  publishedDate: string;
  views: number;
}

export interface MessageContact {
  id: string;
  name: string;
  role: string; // "HOD" | "Dean" | "Library Admin"
}
export interface Message {
  id: string;
  contactId: string;
  fromMe: boolean;
  text: string;
  timestamp: string;
}

export type TeacherDocSignStatus = "pending" | "in_progress" | "completed";
export interface TeacherDocument {
  id: string;
  title: string;
  docType: string;
  fromName: string;
  initiatedDate: string;
  priority: "normal" | "high" | "urgent";
  status: TeacherDocSignStatus;
  direction: "assigned_to_me" | "sent_by_me";
  progressPct?: number; // only when sent_by_me and in_progress
}

export interface DepartmentSummary {
  name: string;
  totalStudents: number;
  facultyCount: number;
  atRiskCount: number;
  avgAttendancePct: number;
  avgMarksPct: number;
  yearBreakdown: { year: number; students: number; avgMarksPct: number }[];
  topPerformers: { rollNo: string; name: string; avgMarksPct: number }[];
}
```

Notes: `Student` (Phase 1a) is reused as-is for course rosters
(filtered by the faculty member's own `TeacherCourse` list) — no new
student type. `students`' existing `attendancePct`/`cgpa` fields are
reused for My Course Students / Department Students / Student
Performance tables rather than inventing parallel fields.

## Folder additions

```
src/
  context/
    TeacherRoleContext.ts   (mirrors ColorModeContext.ts's plain-context pattern)
  demo-data/
    teacher/
      courses.ts
      attendance.ts
      marks.ts
      requests.ts        (leave + grade-change + resource, one file — small, related)
      notices.ts
      messages.ts
      documents.ts
      departments.ts      (department-students + academic-cohort + drill-down)
  api/
    teacherCourses.ts
    teacherAttendance.ts
    teacherMarks.ts
    teacherRequests.ts
    teacherNotices.ts
    teacherMessages.ts
    teacherDocuments.ts
    teacherDepartments.ts
  pages/teacher/
    Dashboard.tsx            (already exists as placeholder from Phase 0 — replaced)
    MyCourses.tsx
    Attendance.tsx
    InternalMarks.tsx
    Exams.tsx
    CourseMaterials.tsx
    MyCourseStudents.tsx
    DepartmentStudents.tsx
    AcademicCohort.tsx
    StudentPerformance.tsx
    LeaveRequests.tsx
    GradeChangeRequests.tsx
    ResourceRequests.tsx
    Notices.tsx
    Messages.tsx
    DocumentSignatures.tsx
```

## Routing additions (`router.tsx`)

```
/teacher              -> Dashboard (replaces Phase 0 placeholder)
/teacher/courses      -> MyCourses
/teacher/attendance   -> Attendance
/teacher/marks        -> InternalMarks
/teacher/exams        -> Exams
/teacher/materials    -> CourseMaterials
/teacher/students     -> MyCourseStudents
/teacher/dept-students -> DepartmentStudents
/teacher/cohort       -> AcademicCohort
/teacher/performance  -> StudentPerformance
/teacher/leave        -> LeaveRequests
/teacher/grade-change -> GradeChangeRequests
/teacher/resources    -> ResourceRequests
/teacher/notices      -> Notices
/teacher/messages     -> Messages
/teacher/documents    -> DocumentSignatures
```

No per-record detail routes — every "view" in this phase's scope
(student profile, document detail, department drill-down) is a modal
or in-page expansion in the source, not a separate route, matching how
those same patterns were handled in Admin phases (modals for records
with real forms, in-page state for drill-downs).

## Navigation changes (`components/navigation.tsx`, `"teacher"` case)

Replace the Phase 0 placeholder single Dashboard item with:

```
Dashboard                          (ungrouped)
Academics group:
  My Courses, Attendance, Internal Marks, Exams, Course Materials
Students group:
  My Course Students, Department Students, Academic Cohort, Student Performance
Requests group:
  Leave Requests, Grade Change Requests, Resource Requests
Communication group:
  Notices, Messages, Document Signatures
```

(matches the source's own nav-section groupings exactly; HOD
Functions/Dean Functions groups + My Profile ship in Phase 2b)

## Component reuse

Same shared components as every Admin phase (`PageHeader`, `StatCard`,
`DataTable`, `StatusChip`, `EmptyState`) plus MUI `Dialog`/`TextField`/
`Select`/`Switch`/`Snackbar`/`LinearProgress`, and `recharts` for the 2
new real charts. `StatusChip` needs `pending_approval` (already
exists), `escalated` (new), plus reuse of existing `success`/`failed`-
style entries where applicable. No new shared components — this phase
doesn't introduce any pattern not already established in Admin.

## Error handling

Same as every prior phase — in-memory array/object mutations only, no
simulated failure, resolved through `simulateRequest`.

## Testing / verification

Same as every prior phase: `tsc -b` via `npm run build`, `eslint .`,
and a browser-driven pass confirming: Attendance/Internal Marks
submission actually persists and appears in their history tables with
real per-record "View" detail; Leave/Grade-Change/Resource requests
actually submit and appear in history; Notices actually publishes;
Messages actually shows the correct contact's thread and sends persist;
Document Signatures' Sign actually advances status and its "View"
actions show the correct clicked document; Department Students and
Academic Cohort correctly show "Access Denied" (since no role-switcher
exists yet); Academic Cohort's Drill Down shows real per-department
data; Student Performance's 2 charts render as real `recharts` charts;
every filter across all 16 pages actually filters; both light/dark
modes render correctly.

## Out of scope for Phase 2a

Department Overview, Attendance Approval, Marks Approval, Faculty
Workload, Student Issues, Academic Overview, Policy & Deadlines,
Inter-Department Reports, Approvals Dashboard, My Profile, and the
role-switcher UI itself (Phase 2b). Staff/Operations portal (Phase 3)
and Student portal (Phase 4) are separate, later phases.
