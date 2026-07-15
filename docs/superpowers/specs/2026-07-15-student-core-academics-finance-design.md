# College ERP Rewrite — Phase 4a: Student / Core, Academics, Finance

Status: Approved
Date: 2026-07-15

## Context

First (of two) sub-phases of Phase 4 (Student portal), rewriting `student.html`
(6,020 lines, single hardcoded student identity, no role gating) into `app/`.
Covers 12 of the portal's ~20 pages: Dashboard, Identity & Records, My
Courses, Registration, Attendance, Internal Marks, Exams & Results, Academic
Requests, Fee Summary, Payments, Fee Ledger, and My Profile. Phase 4b
(Convocation, Fellowship, Placements, Hostel & Mess, Facility Booking,
Reports, Notices, Messages) follows once this ships. `student.html` is
deleted only once both sub-phases are complete. Conventions from all prior
phases apply unchanged.

## Source findings

- **No role gating at all** — a single hardcoded student ("Rahul Sharma",
  2023CS001) with no sub-views or toggles, unlike Teacher/Staff. Simplest
  identity model of all four portals.
- **Inconsistent hardcoded student data across pages**: DOB reads "15th
  March 2005" on My Profile but "15-Aug-2004" on Identity & Records; college
  email varies between `rahul.sharma@college.edu`, `rahul.sharma@student.edu`,
  and `2023cs001@college.edu.in` depending on which page renders it — because
  every page re-literals its own copy instead of reading one source of truth.
  Fixed by a single canonical `StudentProfile` fixture every page reads from.
- **Dashboard's "Pending Dues" KPI card** calls `navigateTo('fees')`, but no
  `fees` route/case exists anywhere (only `fee-summary` does) — clicking it
  blanks the content area. Fixed to link to Fee Summary.
- **Dashboard's "Pending Tasks" checkboxes** have no `onchange` at all —
  purely decorative. Fixed to real toggleable completion state.
- **`changeSemester()` (My Courses)** only has real course data for semesters
  5 and 6 out of a 1-6 dropdown — selecting 1-4 renders an empty grid. Fixed:
  every offered semester has real seeded courses.
- **`changeMarksSemester()` (Internal Marks) and `changePaymentYear()`
  (Payments) are referenced by their `<select onchange>` but never defined
  anywhere in the file** — changing either dropdown would throw a
  `ReferenceError` in a real browser. Fixed to real, working semester/year
  switching.
- **`openCourseModal(courseCode)` is an ID-ignored bug**: its detail lookup
  object only has a `'CS601'` key, so every other course (including all of
  Registration's CS701-704 courses via `showCourseInfo`) falls back to
  showing CS601's description/syllabus regardless of which course was
  clicked. Fixed to real per-course detail.
- **Course Registration is entirely non-functional beneath the toast**:
  `registerCourse()`/`dropCourse()` never actually add to or remove from
  "Currently Registered", and total-credits never updates. Fixed to a real
  registered-course list with live credit totals.
- **Academic Requests' 5 forms** (Course Drop, Section Change,
  Re-evaluation, Grade Improvement, Leave Application) are real, fillable
  forms in the source, but submission is a bare toast with no effect on the
  "Request Status" history table below. Fixed: submitting appends a real,
  trackable request record.
- **Payments' `processPayment()` never touches any balance** — "Pending
  Dues" and the payment history are static regardless of how many payments
  are "made". Fixed: making a payment reduces the pending balance and
  appends a real transaction + ledger entry.
- **`requestDocument()`'s internal forms map is missing two keys** used by
  real call sites — `'Fee Clearance Certificate'` (called from Payments,
  Fee Summary, and Fee Ledger) and `'Provisional Certificate'` (Phase 4b's
  Convocation page) both silently fall through to a generic "being
  prepared" placeholder instead of a real form like their siblings. Fixed
  for the Fee Clearance Certificate in this sub-phase (the only one of the
  two in 4a's scope); Provisional Certificate is 4b's concern.
- **Attendance's subject-wise breakdown and Marks' semester-GPA history**
  are real, correctly-computed data rendered as hand-styled CSS
  percentage-width bars (not literal placeholder text) — upgraded to real
  `recharts`, continuing the same precedent as every prior phase's charts.
- **`downloadFile()` (~40+ call sites app-wide) is a pure no-op toast** —
  no real file exists to download anywhere in the source. Stays a stub
  `Snackbar`, matching the established "no real backing = stays a stub"
  rule from every prior phase (same treatment as Payments' "Record
  Payment" in Phase 1c).
- Decorative/informational-only modals with no real fillable fields
  (course info panels beyond the ID-ignored bug fix, the static Feb
  attendance calendar with dead prev/next buttons, admit-card/report
  downloads) stay as simple informational displays or stub `Snackbar`s —
  no real form exists in the source to adapt.
- `logout()`'s hardcoded redirect to `index.html` (the now-deleted Admin
  entry point) is not applicable — the rewrite already has a real
  `useAuth().logout()` + router navigation, used identically to every
  other portal.

## Decisions

- **One canonical `StudentProfile` demo-data singleton** is the single
  source of truth for every page that displays the student's identity
  (name, roll number, DOB, emails, program, CGPA, etc.), resolving the
  source's multi-page data-inconsistency bug.
- **My Profile is a final ungrouped ("_bottom") sidebar item**, matching
  every prior portal's Profile placement — even though the source only
  reached it via a topbar user-menu, not the sidebar.
- **Identity & Records is its own top-level ungrouped item** (directly
  under Dashboard), matching the source's own top-level "Identity"
  sidebar section rather than nesting it under Academics.
- **Course Registration becomes fully functional**: a `registeredCourseCodes`
  list backs "Currently Registered," with `registerCourse`/`dropCourse`
  actually mutating it and total-credits recalculating live.
- **Academic Requests' 5 request types share one demo-data list**
  (`StudentAcademicRequest[]`), each carrying its own `type` — submitting
  any of the 5 forms appends a real, initially-`"pending"` record visible
  in Request Status, mirroring Teacher Phase 2a's request-type pattern.
- **Fee Summary/Payments/Fee Ledger are linked through one shared fee
  demo-data module**: `makePayment(amount, description)` reduces the
  relevant semester's pending balance, appends a `PaymentTransaction`, and
  appends a `FeeLedgerEntry` — a payment made on the Payments page is
  immediately reflected on Fee Summary and Fee Ledger.
- **Attendance and Marks trend charts become real `recharts`** (bar chart
  for subject-wise attendance, line chart for semester GPA history).
- **No role-switcher UI** — this phase has nothing analogous to
  Teacher/Staff's role toggle; the sidebar and every page render for the
  single student identity unconditionally.

## Data model (additions to `src/types/index.ts`)

```ts
export interface StudentProfile {
  name: string;
  rollNo: string;
  collegeEmail: string;
  personalEmail: string;
  mobile: string;
  dob: string;
  bloodGroup: string;
  fatherName: string;
  address: string;
  program: string;
  branch: string;
  batch: string;
  currentSemester: number;
  cgpa: number;
  creditsEarned: number;
  admissionDate: string;
  status: "active" | "inactive";
}

export type CourseGrade = "A+" | "A" | "B+" | "B" | "C+" | "C" | "F" | "-";
export interface StudentCourse {
  code: string;
  name: string;
  instructor: string;
  section: string;
  credits: number;
  semester: number;
  grade: CourseGrade;
  attendancePct: number;
}

export type CourseCategory = "core" | "elective" | "interdisciplinary" | "minor";
export interface RegistrationCourse {
  code: string;
  name: string;
  credits: number;
  category: CourseCategory;
  instructor: string;
  seatsAvailable: number;
}

export interface AttendanceSubject {
  code: string;
  name: string;
  attended: number;
  total: number;
}

export interface MarksSubject {
  code: string;
  name: string;
  test1: number;
  test2: number;
  assignment: number;
  total: number;
  maxTotal: number;
}

export type SemesterResultStatus = "pass" | "fail" | "pending";
export interface SemesterResult {
  semester: number;
  year: string;
  sgpa: number;
  credits: number;
  result: SemesterResultStatus;
}

export type AcademicRequestType = "course_drop" | "section_change" | "re_evaluation" | "grade_improvement" | "leave_application";
export type StudentRequestStatus = "pending" | "approved" | "rejected";
export interface StudentAcademicRequest {
  id: string;
  type: AcademicRequestType;
  details: string;
  submittedOn: string;
  status: StudentRequestStatus;
}

export type FeeStatus = "paid" | "pending" | "overdue";
export interface FeeSemesterRow {
  semester: number;
  year: string;
  totalFee: number;
  paid: number;
  dueDate: string;
  status: FeeStatus;
}

export interface PaymentTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  mode: string;
  status: "success" | "pending" | "failed";
}

export interface FeeLedgerEntry {
  date: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}
```

## Folder additions

```
src/
  demo-data/
    student/
      profile.ts       (StudentProfile singleton)
      courses.ts        (StudentCourse[] across all 6 semesters + RegistrationCourse[] catalog + registeredCourseCodes)
      attendance.ts       (AttendanceSubject[] + monthly trend series)
      marks.ts             (MarksSubject[] per semester + semester GPA history)
      results.ts            (SemesterResult[])
      requests.ts            (StudentAcademicRequest[])
      fees.ts                 (FeeSemesterRow[] + PaymentTransaction[] + FeeLedgerEntry[])
  api/
    studentProfile.ts
    studentCourses.ts
    studentAttendance.ts
    studentMarks.ts
    studentResults.ts
    studentRequests.ts
    studentFees.ts
  pages/student/
    Dashboard.tsx        (rewrite — replaces Phase 0 placeholder)
    Identity.tsx
    MyCourses.tsx
    Registration.tsx
    Attendance.tsx
    Marks.tsx
    Exams.tsx
    AcademicRequests.tsx
    FeeSummary.tsx
    Payments.tsx
    FeeLedger.tsx
    Profile.tsx
```

## Routing additions (`router.tsx`)

```
/student                -> Dashboard (rewrite of existing placeholder route)
/student/identity       -> Identity
/student/courses        -> MyCourses
/student/registration   -> Registration
/student/attendance     -> Attendance
/student/marks          -> Marks
/student/exams          -> Exams
/student/requests       -> AcademicRequests
/student/fees/summary   -> FeeSummary
/student/fees/payments  -> Payments
/student/fees/ledger    -> FeeLedger
/student/profile        -> Profile
```

## Navigation changes (`components/navigation.tsx`, `"student"` case)

```
Dashboard                                                     (ungrouped)
Identity & Records                                            (ungrouped)
Academics group:
  My Courses, Registration, Attendance, Internal Marks,
  Exams & Results, Academic Requests
Finance group:
  Fee Summary, Payments, Fee Ledger
My Profile                                                    (final ungrouped item, "_bottom")
```

No role-awareness needed for `getNavItems("student")` — this replaces the
current one-line placeholder return with the full list above,
unconditionally.

## Component reuse

Same as every prior phase: `PageHeader`, `StatCard`, `ChartCard`,
`DataTable`, `EmptyState`, `StatusChip`, `Snackbar`. `StatusChip` needs new
entries: `pass`/`fail` (results), `success`/`failed` already exist
(payments, reused); `paid`/`pending`/`overdue` already exist (fees, reused
from Fee Structure/Ledger). `pending`/`approved`/`rejected` already exist
(academic requests, reused from Teacher's request pattern).

## Error handling

Same as every prior phase — in-memory mutations only, resolved through
`simulateRequest`.

## Testing / verification

Dashboard's Pending Dues card correctly navigates to Fee Summary (not a
blank page); Pending Tasks checkboxes toggle real completion state; My
Courses' semester dropdown shows real courses for every semester 1-6, not
just 5-6; course detail modals show the correct course's own info
regardless of which card was clicked (ID-ignored bug fix); Registration's
register/drop actually mutates "Currently Registered" and credit totals;
Internal Marks' semester dropdown and Payments' year dropdown both
actually re-render without crashing; submitting any of the 5 Academic
Request forms adds a real, visible pending record; making a payment
reduces Fee Summary's pending balance and appends a real row to both
Payment History and Fee Ledger; Attendance and Marks trend charts render
as real `recharts`; both light/dark modes render correctly.

## Out of scope for Phase 4a

Convocation, Fellowship, Placements, Hostel & Mess, Facility/Resource
Booking, Reports, Notices, and Messages are Phase 4b's scope.
`student.html` is only deleted once Phase 4b also ships.
