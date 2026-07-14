# College ERP Rewrite — Phase 1b: Admin / Academic Operations

Status: Approved
Date: 2026-07-14

## Context

Second content sub-phase of Phase 1 (Admin portal), covering
**Attendance, Timetable, Exams, Results** — 4 of the Admin portal's 26
original sections. Conventions from
`2026-07-13-foundation-scaffold-design.md` and
`2026-07-13-admin-academics-core-design.md` (stack, folder layout,
fake-async-API pattern, functional filters, real per-record Add/Edit,
demo-data generation approach) apply unchanged and aren't repeated here.

## Source content (from `index.html`, verified against the live file)

- **Attendance** (`getAttendanceScreen`, nav label "Attendance
  Overview"): no table — a descriptive blurb (kept verbatim) + 4 KPI
  cards (Today's Attendance, Weekly Average, Low Attendance Alerts,
  Leave Requests) + a "Mark Attendance" modal (Course/Date/Session)
  whose "Continue" button is a stub (shows a notification, doesn't open
  a real marking sheet — that sheet was never built in the original).
- **Timetable** (`getTimetableScreen`): a class filter
  ("CSE - 3rd Year - Section A", etc.) and a term filter, rendering a
  custom (non-`<table>`) weekly grid: Monday–Saturday × 7 time rows
  (5 teaching slots + a 15-min break + a lunch break), each teaching
  cell showing subject + faculty name. An "Add Schedule" modal
  (Class/Semester/Day/Time Slot/Subject/Faculty/Room/Type) is a stub in
  the original (closes + shows a notification, doesn't touch the grid).
- **Exams** (`getExamsScreen`): a blurb + 4 KPI cards (Total Exams,
  Scheduled, Conflicts, Venues Used) + a Department filter + a real
  `<table>` "Exam Schedule (Draft)" (Code/Course Name/Date/Time
  Slot/Type/Venue/Actions), 5 sample rows, 2 of them visually flagged
  (red = time-slot conflict, orange = capacity warning, via inline
  styles + a literal ⚠️). Each row's "Edit" button opens a modal that
  **always shows the same hardcoded CS101 values** regardless of which
  row was clicked — the same class of bug already fixed in Phase 1a's
  Students/Courses/Faculty "View".
- **Results** (`getResultsScreen`; nav label says "Results Analysis",
  the screen-title map says "Results Management" — an inconsistency in
  the source, not reproduced here, "Results" is canonical): Department/
  Year/Term filters + a search box (none of the 4 controls are wired to
  anything in the source) + a **card-based** per-student results view
  (not a table) — 3 sample cards, each with student header (name, ID,
  program/year/semester, CGPA, rank) and a per-subject marks/grade
  table. All 3 sample students share an identical program/subject list
  (a copy-pasted template) — confirms subjects should be modeled as a
  per-student list, not a fixed 5-subject shape.

All 4 screens also have an "Export" button (Export Report / Export /
Export Results) — a pure stub in the original (two sequential toast
notifications, no real file).

## Decisions

- **Export buttons**: added to all 4 new screens as stub buttons
  (matching original content). Not retrofitted onto Phase 1a's pages
  (already shipped; a decorative stub isn't worth reopening that work).
- **Timetable "class" = Department + Year, not Department + Year +
  Section.** The data model has no Section concept anywhere else (a
  Phase 1a Student has `departmentId` + `year`, nothing more granular).
  20 classes (5 departments × 4 years) replace the original's
  Department + Year + Section combinations. Each class's weekly grid is
  generated from that department+year's real courses (course level
  100/200/300/400 maps to year 1/2/3/4) and their real
  `instructorFacultyId`, cycled across the same grid shape (Mon–Sat,
  same 7 time-rows including the 2 breaks) as the original.
- **Term filters dropped** (Timetable's Fall/Spring/Summer selector,
  Results' Fall/Spring/Summer selector). The data model has no
  multi-term concept; per Phase 1a's "filters must actually filter, no
  decorative no-op controls" rule, a term selector with nothing behind
  it doesn't get built. Department/Year/Search filters on Results, and
  the Class filter on Timetable, are real and functional.
- **Exams "Edit" fixed to show the clicked row's real data** — same
  fix already applied in Phase 1a (Students/Courses/Faculty). The
  "conflict"/"capacity warning" flags are explicit boolean fields set on
  2 seeded rows (not a live conflict-detection engine — that's more
  machinery than the original ever had, and isn't needed to reproduce
  the visual behavior).
- **Attendance KPIs reuse Phase 1a data where possible**: "Weekly
  Average" and "Low Attendance Alerts" are computed directly from the
  existing `Student.attendancePct` field (zero new data). Only "Today's
  Attendance" needs new data (a one-row-per-student present/absent
  snapshot) and "Leave Requests" needs a new small domain (~20 rows).
  "Mark Attendance" modal stays a stub (Course/Date/Session, notification
  on Continue) — the original never built a real per-student marking
  sheet, and building one now would be new content, not a rebuild of
  existing content.
- **Results backed by real per-student marks.** A `Mark` record per
  (student × enrolled course) pair (~2,500 rows, reusing each student's
  existing `courseIds` from Phase 1a) replaces the 3 hardcoded sample
  cards. Grade is derived from `marksObtained` via fixed thresholds.
  CGPA shown on each card reuses the student's existing `cgpa` field;
  rank is computed by sorting students within their own
  department+year cohort. Grade thresholds (on a 0-100 `marksObtained`
  scale): ≥90 "A+", ≥80 "A", ≥70 "B", ≥60 "C", below 60 "D". The card grid is paginated (same
  `TablePagination` pattern `DataTable` already uses) since there are
  now 500 students instead of 3.
- **Exams table scaled to all 50 real courses** (one exam per course),
  paginated, instead of 5 hand-picked samples — gives the Department
  filter real substance.
- **Overview Dashboard gets 2 of its remaining static KPIs wired to
  real data**, per Phase 1a's explicit plan for this: "Avg Attendance"
  → average of `students[].attendancePct` (same computation as the
  Attendance screen's "Weekly Average"); "Upcoming Exams" → real count
  of generated exam rows. A small, targeted edit to the existing
  `Dashboard.tsx`, not a rebuild.
- **Sidebar grouping introduced now.** Phase 1a's spec deferred this
  ("groups are introduced once sub-phases 1b–1e add enough items to
  warrant them") — at 11 admin nav items it's warranted. `navigation.tsx`
  restructures the flat admin list into: Dashboard (ungrouped, top),
  an **Academics** group (Students, Faculty, Courses, Departments,
  Registration, Attendance, Timetable, Exams, Results), and an
  **Administration** group (Users — a single item for now; more will
  land here in Phase 1e).

## Data model (additions to `src/types/index.ts`)

```ts
export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // ISO date - always "today" for this seed
  status: "present" | "absent";
}

export type LeaveStatus = "pending" | "approved" | "rejected";
export interface LeaveRequest {
  id: string;
  studentId: string;
  fromDate: string; // ISO date
  toDate: string; // ISO date
  reason: string;
  status: LeaveStatus;
}

export type TimetableSlotType = "class" | "break" | "lunch";
export interface TimetableEntry {
  day: string; // "Monday".."Saturday"
  time: string; // "09:00 - 10:00"
  type: TimetableSlotType;
  courseId?: string; // set when type === "class"
  facultyId?: string; // set when type === "class"
}
export interface TimetableClass {
  id: string; // `${departmentId}-Y${year}`, e.g. "CSE-Y3"
  departmentId: string;
  year: 1 | 2 | 3 | 4;
  entries: TimetableEntry[];
}

export type ExamType = "written" | "lab" | "online" | "practical";
export interface Exam {
  id: string;
  courseId: string;
  date: string; // ISO date
  startTime: string; // "09:00"
  endTime: string; // "12:00"
  type: ExamType;
  venue: string;
  capacity: number;
  enrolledCount: number;
  conflict: boolean;
  capacityWarning: boolean;
}

export interface Mark {
  id: string;
  studentId: string;
  courseId: string;
  marksObtained: number;
  maxMarks: number;
  grade: string; // "A+" | "A" | "B" | "C" | "D" derived from marksObtained
}
```

## Folder additions

```
src/
  demo-data/
    attendance/
      todayAttendance.ts
      leaveRequests.ts
    academics/
      timetable.ts
      exams.ts
      marks.ts
  api/
    attendance.ts
    leaveRequests.ts
    timetable.ts
    exams.ts
    marks.ts
  pages/admin/
    Attendance.tsx
    Timetable.tsx
    Exams.tsx
    Results.tsx
```

## Routing additions (`router.tsx`)

```
/admin/attendance -> Attendance
/admin/timetable  -> Timetable
/admin/exams      -> Exams
/admin/results    -> Results
```

No per-record detail routes — none of these 4 screens have a
per-record "View" page in the original (Exams' "Edit" and Attendance's
"Mark" are modals, not pages).

## Navigation changes (`navigation.tsx`, `"admin"` case)

Restructure the existing flat 7-item list (from Phase 1a) into groups,
and add the 4 new items:

```
Dashboard                          (ungrouped)
Academics group:
  Students, Faculty, Courses, Departments, Registration,
  Attendance, Timetable, Exams, Results
Administration group:
  Users
```

## Component reuse

Same as Phase 1a: `PageHeader`, `StatCard`, `ChartCard`, `DataTable`,
`StatusChip`, `EmptyState`, plus MUI `Dialog`/`TextField`/`Select` for
modals. Results' card grid reuses MUI `Paper`/`Grid` (like
`StudentProfile`'s cards) plus MUI `TablePagination` directly (not
wrapped in `DataTable`, since the content is cards, not a `<table>`).
No new shared components.

## Error handling

Same as Phase 1a — in-memory array operations only, no simulated
failure. Add Schedule/Mark Attendance/Edit Exam resolve through the
existing `simulateRequest`-based API pattern.

## Testing / verification

Same as Phase 0/1a: `tsc -b` via `npm run build`, `eslint .`, and a
browser-driven pass confirming: Attendance's 4 KPIs are real and
non-degenerate; Timetable's class filter actually changes the grid and
shows correct real course/instructor names; Exams' Department filter
filters, and Edit shows the clicked row's own data (verified against
at least 2 different rows); Results' filters/search actually filter,
pagination works, and cards show real per-student data; Overview's
"Avg Attendance" and "Upcoming Exams" KPIs now reflect real computed
values; both light/dark modes render correctly.

## Out of scope for Phase 1b

Fee Structure/Ledger/Payments (1c); Assets/Tickets/Hostel/Facility/
Library (1d); Notices/Document Signatures/Audit Logs/System Health/
Configurations/Profile/Settings (1e).
