# College ERP Rewrite — Phase 1a: Admin / Academics Core

Status: Approved
Date: 2026-07-13

## Context

This is the first content sub-phase of Phase 1 (Admin portal). Phase 1
was split into 5 sub-phases (Academics core → Academic operations →
Finance → Campus operations → Communication & system), each its own
spec → plan → build cycle. This spec covers **Academics core** only:
Overview/Dashboard, Users, Faculty, Departments, Students, Courses,
Registration — 7 of the Admin portal's 26 original sections.

Conventions from `2026-07-13-foundation-scaffold-design.md` (stack,
folder layout, monochrome theme, fake-async-API pattern, page
consumption idiom) apply unchanged and aren't repeated here.

## Source content (from `index.html`, verified against the live file)

- **Overview**: 8 KPI cards (Total Students, Faculty Members, Open
  Tickets, Fee Collection, Avg Attendance, Total Assets, Hostel
  Occupancy, Upcoming Exams), each click-through to its section, plus a
  filterable "Recent Activity" table (Timestamp/User/Activity/
  Department/Status).
- **Users**: table (User ID, Name, Role, Department, Email, Status,
  Last Login), filters (Role/Department/Status/search), Add/Edit
  modals, a "View" page (permissions list + recent activity).
- **Faculty**: 4 KPI cards (Total/Professors/Associate/Assistant),
  table (Faculty ID, Name, Department, Designation, Contact, Joining
  Date, Status), filters (Designation/Department/Status/search),
  Add/Edit modals, a "View" modal (qualification, specialization,
  courses teaching).
- **Departments**: table (Dept Code, Name, HOD, Faculty Count, Student
  Count, Budget, Status), search only, Add/Edit modals, a "View" page
  (stats: active courses, avg class size, pass rate, research papers).
- **Students**: table (Roll No, Name, Program, Year, Attendance %,
  CGPA, Fee Status, Academic Status), filters (Program/Year/search),
  Add/Edit modals, a "View" page (personal info, enrolled courses,
  academic performance KPIs).
- **Courses**: table (Code, Name, Credits, Department, Type, Status),
  filters (Department/Level/search), Add/Edit modals, a "View" page
  (description, learning outcomes, schedule, avg attendance/pass rate).
- **Registration**: not a table — two settings cards (registration
  window: academic year/term/start/end/max credits/grace period; rules
  & policies: 3 toggles for add/drop, advisor approval, late
  registration).

Full field-level detail (exact sample values, status vocabularies) was
captured during brainstorming and is reflected in the type definitions
below.

## Decisions

- **Filters/search made functional.** The legacy screens render
  filter `<select>`s and search boxes with no logic wired at all. The
  rebuild filters the in-memory demo-data array client-side for all of
  them — same fields/options, now working.
- **"View" navigates to the real record.** The legacy "View" always
  renders one hardcoded sample regardless of which row was clicked.
  The rebuild uses real per-record detail routes (`/admin/students/:id`,
  `/admin/courses/:id`) driven by the clicked row's actual id.
- **Department detail: one clean view, not two.** The source file has
  a duplicate, later-hoisted `viewDepartmentDetails` (an unrelated,
  richer analytics implementation shadowing the list's own view). The
  rebuild ships one `DepartmentProfile` using the richer field set
  (HOD, faculty/student counts, avg attendance, avg marks, pass rate,
  at-risk count) rather than replicating the shadowing bug or building
  two versions.
- **Edit modals match their Add modal's fields.** The legacy Edit
  modals are missing fields their own Add modals collect (e.g. Add
  Course has Department/Type/Description; Edit Course has none of
  those). The rebuild's Edit forms collect the same fields as Add.
- **Demo data scale**: ~500 students, ~60 faculty, 5 departments
  (Computer Science, Mathematics, Physics, Electronics, Mechanical —
  matching the source's department set), ~50 courses. Generated via
  the seeded `namePools`/`random` utilities from Phase 0, cross-linked
  (a student's `departmentId`/`courseIds` reference real generated
  department/course records, not free-text).
- **Overview KPIs**: only "Total Students" and "Faculty Members" wire
  to real generated data in this sub-phase (the only two domains this
  sub-phase builds). The other 6 (Tickets, Fee Collection, Attendance,
  Assets, Hostel, Exams) stay as static illustrative numbers — matching
  Phase 0's placeholder-dashboard convention — until sub-phases 1b–1d
  land those domains, at which point each does a small targeted edit to
  `Dashboard.tsx` to wire its own card.
- **No new shared "form dialog" component.** Add/Edit modals use MUI's
  `Dialog` directly per page. If the same modal shape visibly repeats
  across later sub-phases, extracting a shared wrapper is a candidate
  then — not speculatively built now.

## Data model (additions to `src/types/index.ts`)

```ts
export type UserRole = "admin" | "faculty" | "student" | "staff";
export type AccountStatus = "active" | "inactive" | "on_leave";
export type FacultyDesignation = "professor" | "associate_professor" | "assistant_professor" | "lecturer";
export type AcademicStatus = "regular" | "backlog";
export type FeeStatus = "paid" | "pending";
export type CourseType = "core" | "elective" | "lab";

export interface AdminUser {
  id: string; // "USR-001"
  name: string;
  role: UserRole;
  departmentId: string;
  email: string;
  phone: string;
  employeeId: string;
  status: AccountStatus;
  lastLogin: string; // ISO datetime
}

export interface Faculty {
  id: string; // "FAC001"
  name: string;
  departmentId: string;
  designation: FacultyDesignation;
  email: string;
  phone: string;
  joiningDate: string; // ISO date
  qualification: string;
  specialization: string;
  experienceYears: number;
  status: AccountStatus;
  coursesTeaching: string[]; // course ids
}

export interface Department {
  id: string; // "CSE"
  name: string;
  hodFacultyId: string;
  building: string;
  budgetLakh: number; // e.g. 250 = "₹2.5 Cr"
  status: "active";
  // Detail-view stats
  avgClassSize: number;
  passRatePct: number;
  researchPapers: number;
  avgAttendancePct: number;
  avgMarksPct: number;
  atRiskStudentCount: number;
}

export interface Student {
  id: string; // "STU-0001"
  rollNo: string; // "2023-CSE-001"
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  program: string; // "B.Tech CSE"
  year: 1 | 2 | 3 | 4;
  semester: number;
  batch: string; // "2022-2026"
  enrollmentDate: string; // ISO date
  status: AcademicStatus;
  attendancePct: number;
  cgpa: number;
  feeStatus: FeeStatus;
  address: string;
  guardianName: string;
  guardianContact: string;
  courseIds: string[];
}

export interface Course {
  id: string; // "CS101"
  name: string;
  credits: number;
  departmentId: string;
  type: CourseType;
  status: "active";
  instructorFacultyId: string;
  description: string;
  learningOutcomes: string[];
  schedule: { day: string; time: string; room: string }[];
  avgAttendancePct: number;
  passRatePct: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO datetime
  actorName: string;
  activity: string;
  departmentId: string;
  status: "completed" | "pending_approval" | "scheduled";
}
```

## Folder additions

```
src/
  demo-data/
    people/
      users.ts
      faculty.ts
      students.ts
    academics/
      departments.ts
      courses.ts
    administration/
      activityLog.ts
  api/
    users.ts
    faculty.ts
    departments.ts
    students.ts
    courses.ts
  pages/admin/
    Dashboard.tsx        (replaces Phase 0 placeholder)
    Users.tsx
    Faculty.tsx
    Departments.tsx
    Students.tsx
    StudentProfile.tsx
    Courses.tsx
    CourseProfile.tsx
    Registration.tsx
```

## Routing additions (`router.tsx`)

```
/admin                    -> Dashboard (replaces placeholder)
/admin/users               -> Users
/admin/faculty             -> Faculty
/admin/departments         -> Departments
/admin/students             -> Students
/admin/students/:id          -> StudentProfile
/admin/courses              -> Courses
/admin/courses/:id            -> CourseProfile
/admin/registration          -> Registration
```

## Navigation additions (`navigation.tsx`, `"admin"` case)

Dashboard, Users, Faculty, Departments, Students, Courses, Registration
— flat list, no groups yet (groups are introduced once sub-phases
1b–1e add enough items to warrant them, per the design system's "don't
introduce structure before it's needed" spirit — a 7-item flat sidebar
list doesn't need grouping).

## Component reuse

All UI is built from Phase 0's existing components (`PageHeader`,
`StatCard`, `ChartCard`, `DataTable`, `StatusChip`, `CategoryTag`,
`EmptyState`) plus MUI `Dialog`/`TextField`/`Select`/`Switch` for
Add/Edit forms and toggles. No new shared components.

## Error handling

Filtering/search operate on already-loaded in-memory arrays — no new
failure modes. Add/Edit submit handlers call the async `addX`/`updateX`
API functions (Promise-wrapped, no simulated failure per Phase 0's
`http.ts` convention) and close the dialog on resolution.

## Testing / verification

Same as Phase 0: `tsc -b` via `npm run build`, `eslint .`, and a
browser-driven pass confirming: Overview's 2 real KPIs match generated
data counts exactly, every table's filters actually filter, every "Add"
flow appends a row, every "View" row navigates to that row's own
detail page (not a fixed sample), and both light/dark modes render
correctly.

## Out of scope for Phase 1a

Attendance, Timetable, Exams, Results (1b); Fee Structure/Ledger/
Payments (1c); Assets/Tickets/Hostel/Facility/Library (1d); Notices/
Document Signatures/Audit Logs/System Health/Configurations/Profile/
Settings (1e).
