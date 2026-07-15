# Teacher / HOD, Dean, Profile, Role-Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Teacher portal by porting `faculty.html`'s remaining HOD/Dean/Profile sections and shipping the Professor/HOD/Dean role-switcher, so `faculty.html` can be deleted.

**Architecture:** Same fake-async-API layer (`simulateRequest`) over in-memory demo-data modules, consumed by plain `useState`/`useEffect` in MUI v7 pages, following every prior phase's pattern exactly. New: `TeacherRoleContext.Provider` wired into `Layout.tsx`, with `getNavItems` becoming role-aware for the `"teacher"` case.

**Tech Stack:** React 19, TypeScript 5.8, MUI v7, react-router-dom v7, recharts v2, `motion` v12, Vite 6.

## Global Constraints

- Reuse Phase 2a's real `TeacherLeaveRequest`/`GradeChangeRequest`/`ResourceRequest`/`DepartmentSummary`/`TeacherCourse` data where the spec says to — do not create parallel duplicate types for the same concept.
- Every new demo-data module owns its own independent `createRng(seed)` instance (never share one global RNG).
- All reads/writes go through `simulateRequest`.
- Bare `alert()`/no-`onclick` actions in the source become either a functional mutation (if a dedicated pending list exists) or a stub `Snackbar` (if no real form exists anywhere in the source) — never left as a literal `alert`.
- `StatusChip` reuses `statusTokens` colors and existing icon imports; only add new `STATUS_MAP` entries where none of the existing keys fit.
- Verify with `npm run build` (run from `app/`) after every task; commit every task individually.

---

### Task 1: Type definitions

**Files:**
- Modify: `app/src/types/index.ts` (append after the existing `DepartmentSummary` interface, ~line 507)

**Interfaces:**
- Produces: `FacultyRosterEntry`, `CourseCoverageEntry`, `ApprovalStatus`, `AttendanceApprovalEntry`, `MarksApprovalEntry`, `WorkloadEntry`, `StudentIssue`, `CalendarEvent`, `AcademicPolicy`, `ReportRow`, `TeacherProfile` — consumed by every later task in this plan.

- [ ] **Step 1: Append new interfaces and extend `DepartmentSummary`**

Add at the end of `app/src/types/index.ts`:

```ts
export interface FacultyRosterEntry {
  id: string;
  name: string;
  designation: string;
  courseCount: number;
  studentCount: number;
  avgLoad: string;
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

Then find the existing `DepartmentSummary` interface and add one optional field to it:

```ts
export interface DepartmentSummary {
  name: string;
  totalStudents: number;
  facultyCount: number;
  atRiskCount: number;
  avgAttendancePct: number;
  avgMarksPct: number;
  yearBreakdown: { year: number; students: number; avgMarksPct: number }[];
  topPerformers: { rollNo: string; name: string; avgMarksPct: number }[];
  completionPct?: number;
}
```

- [ ] **Step 2: Verify build**

Run (from `app/`): `npm run build`
Expected: succeeds (new types are unused so far, no errors).

- [ ] **Step 3: Commit**

```bash
git add app/src/types/index.ts
git commit -m "Add Phase 2b type definitions (HOD/Dean/Profile)"
```

---

### Task 2: Faculty Roster + Course Coverage demo data + API

**Files:**
- Create: `app/src/demo-data/teacher/facultyRoster.ts`
- Create: `app/src/api/teacherFacultyRoster.ts`

**Interfaces:**
- Consumes: `Faculty` from `@/demo-data/people/faculty` (existing `faculty` array, `FacultyDesignation` field).
- Produces: `getFacultyRoster(): Promise<FacultyRosterEntry[]>`, `getCourseCoverage(): Promise<CourseCoverageEntry[]>` — consumed by Task 12 (Department Overview page).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/teacher/facultyRoster.ts
import type { FacultyRosterEntry, CourseCoverageEntry } from "@/types";
import { faculty } from "@/demo-data/people/faculty";
import { createRng } from "@/demo-data/generators/random";

const { randomInt, weightedPick } = createRng(20260722);

function designationLabel(d: string): string {
  return d.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const roster: FacultyRosterEntry[] = faculty.slice(0, 12).map((f) => {
  const courseCount = 2 + randomInt(0, 2);
  return {
    id: f.id,
    name: f.name,
    designation: designationLabel(f.designation),
    courseCount,
    studentCount: courseCount * (35 + randomInt(0, 20)),
    avgLoad: `${(4 + randomInt(0, 6)).toFixed(1)} hrs/wk`,
    status: weightedPick([["active", 9], ["on_leave", 1]]),
  };
});

const courseNames = ["CS201", "CS202", "CS203", "CS301", "CS302", "CS401"];

const coverage: CourseCoverageEntry[] = courseNames.map((course, i) => {
  const covered = i < courseNames.length - 1;
  return {
    course,
    facultyName: covered ? roster[i % roster.length].name : "—",
    section: weightedPick([["A", 1], ["B", 1]]),
    students: 35 + randomInt(0, 25),
    semester: `Semester ${3 + (i % 4)}`,
    status: covered ? "covered" : "gap",
  };
});

export const facultyRoster: FacultyRosterEntry[] = roster;
export const courseCoverage: CourseCoverageEntry[] = coverage;
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/teacherFacultyRoster.ts
import { simulateRequest } from "@/api/http";
import { facultyRoster, courseCoverage } from "@/demo-data/teacher/facultyRoster";
import type { FacultyRosterEntry, CourseCoverageEntry } from "@/types";

export function getFacultyRoster(): Promise<FacultyRosterEntry[]> {
  return simulateRequest(facultyRoster);
}

export function getCourseCoverage(): Promise<CourseCoverageEntry[]> {
  return simulateRequest(courseCoverage);
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build` — expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/teacher/facultyRoster.ts app/src/api/teacherFacultyRoster.ts
git commit -m "Add faculty roster and course coverage demo data and API"
```

---

### Task 3: Attendance/Marks Approval demo data + API

**Files:**
- Create: `app/src/demo-data/teacher/approvals.ts`
- Create: `app/src/api/teacherApprovals.ts`

**Interfaces:**
- Produces: `getAttendanceApprovals()`, `approveAttendanceApproval(id)`, `rejectAttendanceApproval(id)`, `getMarksApprovals()`, `approveMarksApproval(id)`, `rejectMarksApproval(id)` — consumed by Tasks 13 and 14.

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/teacher/approvals.ts
import type { AttendanceApprovalEntry, MarksApprovalEntry } from "@/types";
import { faculty } from "@/demo-data/people/faculty";
import { createRng } from "@/demo-data/generators/random";

const { randomInt, weightedPick, pick } = createRng(20260723);

const courses = ["CS201", "CS202", "CS203", "CS301", "CS302"];
const sections = ["A", "B"];

function dateStr(month: number, day: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function generateAttendanceApprovals(): AttendanceApprovalEntry[] {
  return courses.map((course, i) => ({
    id: `AA-${String(i + 1).padStart(3, "0")}`,
    course,
    facultyName: pick(faculty).name,
    date: dateStr(3, 10 + i),
    section: pick(sections),
    students: 35 + randomInt(0, 20),
    submitted: dateStr(3, 10 + i),
    status: weightedPick([["pending", 3], ["approved", 4], ["rejected", 1]]),
  }));
}

function generateMarksApprovals(): MarksApprovalEntry[] {
  const assessments = ["Quiz1", "Quiz2", "MidExam", "Assignment1"];
  const maxMarksByAssessment: Record<string, number> = { Quiz1: 10, Quiz2: 10, MidExam: 30, Assignment1: 20 };
  return courses.map((course, i) => {
    const assessment = assessments[i % assessments.length];
    return {
      id: `MA-${String(i + 1).padStart(3, "0")}`,
      course,
      facultyName: pick(faculty).name,
      assessment,
      maxMarks: maxMarksByAssessment[assessment],
      submittedOn: dateStr(4, 5 + i),
      status: weightedPick([["pending", 3], ["approved", 4], ["rejected", 1]]),
    };
  });
}

export const attendanceApprovals: AttendanceApprovalEntry[] = generateAttendanceApprovals();
export const marksApprovals: MarksApprovalEntry[] = generateMarksApprovals();
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/teacherApprovals.ts
import { simulateRequest } from "@/api/http";
import { attendanceApprovals, marksApprovals } from "@/demo-data/teacher/approvals";
import type { AttendanceApprovalEntry, MarksApprovalEntry } from "@/types";

export function getAttendanceApprovals(): Promise<AttendanceApprovalEntry[]> {
  return simulateRequest(attendanceApprovals);
}
export function approveAttendanceApproval(id: string): Promise<void> {
  const row = attendanceApprovals.find((r) => r.id === id);
  if (row) row.status = "approved";
  return simulateRequest(undefined);
}
export function rejectAttendanceApproval(id: string): Promise<void> {
  const row = attendanceApprovals.find((r) => r.id === id);
  if (row) row.status = "rejected";
  return simulateRequest(undefined);
}

export function getMarksApprovals(): Promise<MarksApprovalEntry[]> {
  return simulateRequest(marksApprovals);
}
export function approveMarksApproval(id: string): Promise<void> {
  const row = marksApprovals.find((r) => r.id === id);
  if (row) row.status = "approved";
  return simulateRequest(undefined);
}
export function rejectMarksApproval(id: string): Promise<void> {
  const row = marksApprovals.find((r) => r.id === id);
  if (row) row.status = "rejected";
  return simulateRequest(undefined);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/teacher/approvals.ts app/src/api/teacherApprovals.ts
git commit -m "Add attendance and marks approval demo data and API"
```

---

### Task 4: Faculty Workload demo data + API

**Files:**
- Create: `app/src/demo-data/teacher/workload.ts`
- Create: `app/src/api/teacherWorkload.ts`

**Interfaces:**
- Produces: `getWorkloadEntries(): Promise<WorkloadEntry[]>` — consumed by Task 15.

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/teacher/workload.ts
import type { WorkloadEntry } from "@/types";
import { faculty } from "@/demo-data/people/faculty";
import { createRng } from "@/demo-data/generators/random";

const { randomInt } = createRng(20260724);

function designationLabel(d: string): string {
  return d.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function generateWorkload(): WorkloadEntry[] {
  return faculty.slice(0, 12).map((f) => {
    const courses = 2 + randomInt(0, 3);
    const hrsPerWeek = 8 + randomInt(0, 12);
    const loadPct = Math.round((hrsPerWeek / 18) * 100);
    return {
      facultyName: f.name,
      designation: designationLabel(f.designation),
      courses,
      students: courses * (30 + randomInt(0, 25)),
      hrsPerWeek,
      loadPct,
      status: loadPct > 100 ? "overloaded" : "normal",
    };
  });
}

export const workloadEntries: WorkloadEntry[] = generateWorkload();
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/teacherWorkload.ts
import { simulateRequest } from "@/api/http";
import { workloadEntries } from "@/demo-data/teacher/workload";
import type { WorkloadEntry } from "@/types";

export function getWorkloadEntries(): Promise<WorkloadEntry[]> {
  return simulateRequest(workloadEntries);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/teacher/workload.ts app/src/api/teacherWorkload.ts
git commit -m "Add faculty workload demo data and API"
```

---

### Task 5: Student Issues demo data + API

**Files:**
- Create: `app/src/demo-data/teacher/studentIssues.ts`
- Create: `app/src/api/teacherStudentIssues.ts`

**Interfaces:**
- Produces: `getStudentIssues(): Promise<StudentIssue[]>`, `resolveStudentIssue(id: string): Promise<void>` — consumed by Task 16. This directly fixes the source's `openConcernDetail()`-with-zero-arguments bug (every row will carry its own real `detail`).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/teacher/studentIssues.ts
import type { StudentIssue } from "@/types";
import { students } from "@/demo-data/people/students";
import { createRng } from "@/demo-data/generators/random";

const { pick, randomInt, weightedPick } = createRng(20260725);

const issueTypes = [
  { issue: "Fee Payment Discrepancy", detail: "Fee ledger shows an unresolved discrepancy of ₹4,500 flagged by the student for the current semester." },
  { issue: "Hostel Room Conflict", detail: "Room allocation dispute with roommate over shared amenities, requesting mediation." },
  { issue: "Attendance Shortage Appeal", detail: "Student disputes an absence marked during a medical emergency and has supporting documents." },
  { issue: "Exam Re-evaluation Request", detail: "Requesting re-evaluation of Mid Exam answer script citing a marking inconsistency." },
  { issue: "Scholarship Delay", detail: "Merit scholarship disbursement is pending beyond the expected date, causing a fee payment delay." },
];
const raisers = ["Class Representative", "Warden", "Self", "Parent", "Counselor"];

function generateIssues(): StudentIssue[] {
  return students.slice(0, 8).map((s, i) => {
    const t = issueTypes[i % issueTypes.length];
    return {
      id: `SI-${String(i + 1).padStart(3, "0")}`,
      rollNo: s.rollNo,
      name: s.name,
      issue: t.issue,
      detail: t.detail,
      raisedBy: pick(raisers),
      date: `2026-0${2 + (i % 4)}-${String(10 + randomInt(0, 15)).padStart(2, "0")}`,
      priority: weightedPick([["normal", 5], ["high", 3], ["urgent", 1]]),
      status: i < 5 ? "open" : "resolved",
    };
  });
}

export const studentIssues: StudentIssue[] = generateIssues();
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/teacherStudentIssues.ts
import { simulateRequest } from "@/api/http";
import { studentIssues } from "@/demo-data/teacher/studentIssues";
import type { StudentIssue } from "@/types";

export function getStudentIssues(): Promise<StudentIssue[]> {
  return simulateRequest(studentIssues);
}

export function resolveStudentIssue(id: string): Promise<void> {
  const row = studentIssues.find((r) => r.id === id);
  if (row) row.status = "resolved";
  return simulateRequest(undefined);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/teacher/studentIssues.ts app/src/api/teacherStudentIssues.ts
git commit -m "Add student issues demo data and API"
```

---

### Task 6: Calendar + Academic Policies demo data + API

**Files:**
- Create: `app/src/demo-data/teacher/calendar.ts`
- Create: `app/src/api/teacherCalendar.ts`

**Interfaces:**
- Produces: `getCalendarEvents(): Promise<CalendarEvent[]>`, `getAcademicPolicies(): Promise<AcademicPolicy[]>` — consumed by Task 17.

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/teacher/calendar.ts
import type { CalendarEvent, AcademicPolicy } from "@/types";

export const calendarEvents: CalendarEvent[] = [
  { id: "CE-001", event: "Mid-Semester Exams", startDate: "2026-08-10", endDate: "2026-08-17", status: "upcoming" },
  { id: "CE-002", event: "Internal Marks Submission Deadline", startDate: "2026-07-20", endDate: "2026-07-20", status: "active" },
  { id: "CE-003", event: "Summer Break", startDate: "2026-06-01", endDate: "2026-06-30", status: "closed" },
  { id: "CE-004", event: "End-Semester Exams", startDate: "2026-11-20", endDate: "2026-12-05", status: "upcoming" },
];

export const academicPolicies: AcademicPolicy[] = [
  { name: "Minimum Attendance Policy", description: "Students must maintain at least 75% attendance per course to be eligible for end-semester exams." },
  { name: "Grade Change Window", description: "Grade change requests must be raised within 10 days of result publication." },
  { name: "Leave Approval Escalation", description: "Faculty leave requests exceeding 5 days require Dean approval in addition to HOD sign-off." },
  { name: "Re-evaluation Policy", description: "Students may request re-evaluation of a single assessment per course, per semester." },
];
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/teacherCalendar.ts
import { simulateRequest } from "@/api/http";
import { calendarEvents, academicPolicies } from "@/demo-data/teacher/calendar";
import type { CalendarEvent, AcademicPolicy } from "@/types";

export function getCalendarEvents(): Promise<CalendarEvent[]> {
  return simulateRequest(calendarEvents);
}
export function getAcademicPolicies(): Promise<AcademicPolicy[]> {
  return simulateRequest(academicPolicies);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/teacher/calendar.ts app/src/api/teacherCalendar.ts
git commit -m "Add academic calendar and policies demo data and API"
```

---

### Task 7: Inter-Department Reports demo data + API

**Files:**
- Create: `app/src/demo-data/teacher/reports.ts`
- Create: `app/src/api/teacherReports.ts`

**Interfaces:**
- Produces: `getReportRows(): Promise<ReportRow[]>` — consumed by Task 19.

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/teacher/reports.ts
import type { ReportRow } from "@/types";
import { createRng } from "@/demo-data/generators/random";

const { randomInt } = createRng(20260727);

const deptNames = ["Computer Science", "Electronics & Communication", "Mechanical", "Civil"];

export const reportRows: ReportRow[] = deptNames.map((department) => ({
  department,
  avgAttendancePct: 75 + randomInt(0, 12),
  avgMarksPct: 68 + randomInt(0, 14),
  passRatePct: 80 + randomInt(0, 15),
  atRiskPct: 5 + randomInt(0, 15),
  facultyUtilizationPct: 70 + randomInt(0, 25),
}));
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/teacherReports.ts
import { simulateRequest } from "@/api/http";
import { reportRows } from "@/demo-data/teacher/reports";
import type { ReportRow } from "@/types";

export function getReportRows(): Promise<ReportRow[]> {
  return simulateRequest(reportRows);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/teacher/reports.ts app/src/api/teacherReports.ts
git commit -m "Add inter-department report rows demo data and API"
```

---

### Task 8: Teacher Profile demo data + API

**Files:**
- Create: `app/src/demo-data/teacher/profile.ts`
- Create: `app/src/api/teacherProfile.ts`

**Interfaces:**
- Produces: `getTeacherProfile(): Promise<TeacherProfile>`, `updateTeacherProfile(updates: Partial<TeacherProfile>): Promise<TeacherProfile>` — consumed by Task 21.

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/teacher/profile.ts
import type { TeacherProfile } from "@/types";

export const teacherProfile: TeacherProfile = {
  name: "Dr. Ananya Rao",
  facultyId: "FAC001",
  email: "faculty1@kalnet.edu",
  phone: "9876543210",
  office: "CS Block, Room 214",
  dateOfJoining: "2012-07-01",
  qualifications: ["Ph.D. Computer Science", "M.Tech"],
  specializations: ["Artificial Intelligence", "Algorithms"],
  yearsExperience: 14,
};
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/teacherProfile.ts
import { simulateRequest } from "@/api/http";
import { teacherProfile } from "@/demo-data/teacher/profile";
import type { TeacherProfile } from "@/types";

export function getTeacherProfile(): Promise<TeacherProfile> {
  return simulateRequest(teacherProfile);
}

export function updateTeacherProfile(updates: Partial<TeacherProfile>): Promise<TeacherProfile> {
  Object.assign(teacherProfile, updates);
  return simulateRequest(teacherProfile);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/teacher/profile.ts app/src/api/teacherProfile.ts
git commit -m "Add teacher profile demo data and API"
```

---

### Task 9: Extend `teacherRequests.ts` (dean approve/reject) and `departments.ts` (`completionPct`)

**Files:**
- Modify: `app/src/api/teacherRequests.ts`
- Modify: `app/src/demo-data/teacher/departments.ts`

**Interfaces:**
- Consumes: `leaveRequests`, `gradeChangeRequests`, `resourceRequests` arrays already exported from `@/demo-data/teacher/requests`.
- Produces: `approveDeanRequest(type: "leave" | "grade-change" | "resource", id: string): Promise<void>`, `rejectDeanRequest(...): Promise<void>` — consumed by Task 20. `DepartmentSummary.completionPct` populated — consumed by Task 17.

- [ ] **Step 1: Add dean approve/reject to `teacherRequests.ts`**

Append to the end of `app/src/api/teacherRequests.ts`:

```ts
export type DeanRequestType = "leave" | "grade-change" | "resource";

function listForType(type: DeanRequestType) {
  if (type === "leave") return leaveRequests;
  if (type === "grade-change") return gradeChangeRequests;
  return resourceRequests;
}

export function approveDeanRequest(type: DeanRequestType, id: string): Promise<void> {
  const row = listForType(type).find((r) => r.id === id);
  if (row) row.deanStatus = "approved";
  return simulateRequest(undefined);
}

export function rejectDeanRequest(type: DeanRequestType, id: string): Promise<void> {
  const row = listForType(type).find((r) => r.id === id);
  if (row) row.deanStatus = "rejected";
  return simulateRequest(undefined);
}
```

- [ ] **Step 2: Add `completionPct` to the departments generator**

In `app/src/demo-data/teacher/departments.ts`, inside `generateDepartments()`'s returned object, add one field (after `topPerformers`):

```ts
      topPerformers,
      completionPct: 60 + randomInt(0, 35),
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/api/teacherRequests.ts app/src/demo-data/teacher/departments.ts
git commit -m "Add dean approve/reject actions and department completionPct"
```

---

### Task 10: StatusChip additions

**Files:**
- Modify: `app/src/components/StatusChip.tsx`

**Interfaces:**
- Produces: `STATUS_MAP` entries for `covered`, `gap`, `normal`, `overloaded` — consumed by Tasks 12 and 15. No new icon imports needed (reuses `CheckCircleIcon`, `ErrorIcon`, `WarningAmberIcon`, already imported).

- [ ] **Step 1: Add entries**

In `app/src/components/StatusChip.tsx`, add to `STATUS_MAP` (after the `escalated` entry):

```ts
  // Course coverage
  covered: { label: "Covered", color: statusTokens.good, icon: CheckCircleIcon },
  gap: { label: "Gap", color: statusTokens.critical, icon: ErrorIcon },
  // Workload
  normal: { label: "Normal", color: statusTokens.good, icon: CheckCircleIcon },
  overloaded: { label: "Overloaded", color: statusTokens.critical, icon: WarningAmberIcon },
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/StatusChip.tsx
git commit -m "Add covered/gap and normal/overloaded StatusChip entries"
```

---

### Task 11: TeacherRoleContext wiring + role-switcher UI in Layout

**Files:**
- Modify: `app/src/components/Layout.tsx`

**Interfaces:**
- Consumes: `TeacherRoleContext`, `useTeacherRoleState` from `@/context/TeacherRoleContext` (Phase 2a, not yet wired anywhere); `TeacherRole` type.
- Produces: `TeacherRoleContext.Provider` ancestor for all `/teacher/*` routes (so `useTeacherRole()` in Task 12–21 pages and Phase 2a's `DepartmentStudents.tsx`/`AcademicCohort.tsx` resolves to the real, user-controlled role instead of the default `"professor"`). Also produces a `"_bottom"` group-ordering convention in the sidebar (consumed by Task 22's `"My Profile"` nav entry).

- [ ] **Step 1: Add imports**

In `app/src/components/Layout.tsx`, extend the existing MUI import line to add `FormControl`, `MenuItem`, `Select`:

```ts
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Box, Avatar, Tooltip, Badge, useMediaQuery, useTheme,
  FormControl, MenuItem, Select,
} from "@mui/material";
```

Add two new imports after the `useColorMode` import:

```ts
import { TeacherRoleContext, useTeacherRoleState } from "@/context/TeacherRoleContext";
import type { TeacherRole } from "@/types";
```

- [ ] **Step 2: Own the teacher-role state and make `navItems` role-aware**

Replace:

```ts
  const { role, user, logout } = useAuth();
  const { toggleColorMode, mode } = useColorMode();
```

with:

```ts
  const { role, user, logout } = useAuth();
  const { toggleColorMode, mode } = useColorMode();
  const { role: teacherRole, setRole: setTeacherRole } = useTeacherRoleState();
```

Replace:

```ts
  const navItems = useMemo(() => getNavItems(role), [role]);
```

with:

```ts
  const navItems = useMemo(() => getNavItems(role, teacherRole), [role, teacherRole]);
```

- [ ] **Step 3: Move the `"_bottom"` group to the end when grouping nav items**

Replace the `groups` `useMemo` body's `return` line:

```ts
    return order.map((g) => ({ group: g, items: map.get(g)! }));
```

with:

```ts
    const sortedOrder = [...order.filter((g) => g !== "_bottom"), ...order.filter((g) => g === "_bottom")];
    return sortedOrder.map((g) => ({ group: g, items: map.get(g)! }));
```

- [ ] **Step 4: Suppress the group header for the `"_bottom"` sentinel**

In `sidebarContent`, replace:

```tsx
            {group && (
```

with:

```tsx
            {group && group !== "_bottom" && (
```

- [ ] **Step 5: Add the role-switcher `<Select>` to the Toolbar**

In the `Toolbar`, replace:

```tsx
          <Box sx={{ flex: 1 }} />

          <Tooltip title="Sign Out">
```

with:

```tsx
          <Box sx={{ flex: 1 }} />

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

          <Tooltip title="Sign Out">
```

- [ ] **Step 6: Wrap the component's return in the Provider**

Replace the top of the `return` statement:

```tsx
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
```

with:

```tsx
  return (
    <TeacherRoleContext.Provider value={{ role: teacherRole, setRole: setTeacherRole }}>
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
```

And replace the closing of the return statement:

```tsx
    </Box>
  );
}
```

with:

```tsx
    </Box>
    </TeacherRoleContext.Provider>
  );
}
```

- [ ] **Step 7: Update `getNavItems` call signature in `navigation.tsx` (temporary no-op param)**

This step just prevents a build break before Task 22 makes `getNavItems` actually use the second parameter — add an optional second parameter now:

In `app/src/components/navigation.tsx`, change the function signature:

```ts
export function getNavItems(role: Role): NavItem[] {
```

to:

```ts
export function getNavItems(role: Role, _teacherRole?: import("@/types").TeacherRole): NavItem[] {
```

(Task 22 replaces this signature properly and implements the filtering — this is a minimal placeholder purely so Task 11 compiles standalone.)

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 9: Commit**

```bash
git add app/src/components/Layout.tsx app/src/components/navigation.tsx
git commit -m "Wire TeacherRoleContext and role-switcher UI into Layout"
```

---

### Task 12: Department Overview page

**Files:**
- Create: `app/src/pages/teacher/DepartmentOverview.tsx`

**Interfaces:**
- Consumes: `getFacultyRoster`, `getCourseCoverage` (Task 2).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getFacultyRoster, getCourseCoverage } from "@/api/teacherFacultyRoster";
import type { FacultyRosterEntry, CourseCoverageEntry } from "@/types";

export default function DepartmentOverview() {
  const { mode } = useColorMode();
  const [roster, setRoster] = useState<FacultyRosterEntry[]>([]);
  const [coverage, setCoverage] = useState<CourseCoverageEntry[]>([]);

  useEffect(() => {
    getFacultyRoster().then(setRoster);
    getCourseCoverage().then(setCoverage);
  }, []);

  const totalStudents = roster.reduce((sum, r) => sum + r.studentCount, 0);

  return (
    <>
      <PageHeader eyebrow="HOD Functions" title="Department Overview" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Faculty Count" icon={<GroupsIcon />} color={getIconAccent(mode, "students")} numericValue={roster.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Total Students" icon={<SchoolIcon />} color={getIconAccent(mode, "attendance")} numericValue={totalStudents} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Course Gaps" icon={<ScheduleIcon />} color={getIconAccent(mode, "at-risk")} numericValue={coverage.filter((c) => c.status === "gap").length} />
        </Grid>
      </Grid>

      <DataTable<FacultyRosterEntry>
        title="Faculty List"
        pagination
        columns={[
          { key: "name", label: "Name" },
          { key: "designation", label: "Designation" },
          { key: "courseCount", label: "Courses" },
          { key: "studentCount", label: "Students" },
          { key: "avgLoad", label: "Avg Load" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={roster}
        emptyTitle="No faculty found"
      />
      <div style={{ height: 24 }} />
      <DataTable<CourseCoverageEntry>
        title="Course Coverage"
        pagination
        columns={[
          { key: "course", label: "Course" },
          { key: "facultyName", label: "Faculty" },
          { key: "section", label: "Section" },
          { key: "students", label: "Students" },
          { key: "semester", label: "Semester" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={coverage}
        emptyTitle="No courses found"
      />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success (route not wired yet — this is only a type/syntax check; the page isn't imported anywhere until Task 22).

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/teacher/DepartmentOverview.tsx
git commit -m "Add Department Overview page"
```

---

### Task 13: Attendance Approval page

**Files:**
- Create: `app/src/pages/teacher/AttendanceApproval.tsx`

**Interfaces:**
- Consumes: `getAttendanceApprovals`, `approveAttendanceApproval`, `rejectAttendanceApproval` (Task 3).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Stack, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getAttendanceApprovals, approveAttendanceApproval, rejectAttendanceApproval } from "@/api/teacherApprovals";
import type { AttendanceApprovalEntry } from "@/types";

export default function AttendanceApproval() {
  const [rows, setRows] = useState<AttendanceApprovalEntry[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getAttendanceApprovals().then(setRows);
  useEffect(() => { load(); }, []);

  const handleApprove = (id: string) => approveAttendanceApproval(id).then(() => { load(); setSnackbar("Attendance approved"); });
  const handleReject = (id: string) => rejectAttendanceApproval(id).then(() => { load(); setSnackbar("Attendance rejected"); });

  return (
    <>
      <PageHeader eyebrow="HOD Functions" title="Attendance Approval" />
      <DataTable<AttendanceApprovalEntry>
        pagination
        columns={[
          { key: "course", label: "Course" },
          { key: "facultyName", label: "Faculty" },
          { key: "section", label: "Section" },
          { key: "date", label: "Date" },
          { key: "students", label: "Students" },
          { key: "submitted", label: "Submitted" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          {
            key: "actions", label: "Action",
            render: (row) => row.status === "pending" ? (
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" onClick={() => handleApprove(row.id)}>Approve</Button>
                <Button size="small" variant="outlined" color="error" onClick={() => handleReject(row.id)}>Reject</Button>
              </Stack>
            ) : "—",
          },
        ]}
        rows={rows}
        emptyTitle="No attendance submissions pending review"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/teacher/AttendanceApproval.tsx
git commit -m "Add Attendance Approval page"
```

---

### Task 14: Marks Approval page

**Files:**
- Create: `app/src/pages/teacher/MarksApproval.tsx`

**Interfaces:**
- Consumes: `getMarksApprovals`, `approveMarksApproval`, `rejectMarksApproval` (Task 3).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Stack, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getMarksApprovals, approveMarksApproval, rejectMarksApproval } from "@/api/teacherApprovals";
import type { MarksApprovalEntry } from "@/types";

export default function MarksApproval() {
  const [rows, setRows] = useState<MarksApprovalEntry[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getMarksApprovals().then(setRows);
  useEffect(() => { load(); }, []);

  const handleApprove = (id: string) => approveMarksApproval(id).then(() => { load(); setSnackbar("Marks approved"); });
  const handleReject = (id: string) => rejectMarksApproval(id).then(() => { load(); setSnackbar("Marks rejected"); });

  return (
    <>
      <PageHeader eyebrow="HOD Functions" title="Marks Approval" />
      <DataTable<MarksApprovalEntry>
        pagination
        columns={[
          { key: "course", label: "Course" },
          { key: "facultyName", label: "Faculty" },
          { key: "assessment", label: "Assessment" },
          { key: "maxMarks", label: "Max Marks" },
          { key: "submittedOn", label: "Submitted On" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          {
            key: "actions", label: "Action",
            render: (row) => row.status === "pending" ? (
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" onClick={() => handleApprove(row.id)}>Approve</Button>
                <Button size="small" variant="outlined" color="error" onClick={() => handleReject(row.id)}>Reject</Button>
              </Stack>
            ) : "—",
          },
        ]}
        rows={rows}
        emptyTitle="No marks submissions pending review"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/teacher/MarksApproval.tsx
git commit -m "Add Marks Approval page"
```

---

### Task 15: Faculty Workload page

**Files:**
- Create: `app/src/pages/teacher/FacultyWorkload.tsx`

**Interfaces:**
- Consumes: `getWorkloadEntries` (Task 4).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getWorkloadEntries } from "@/api/teacherWorkload";
import type { WorkloadEntry } from "@/types";

export default function FacultyWorkload() {
  const { mode } = useColorMode();
  const [rows, setRows] = useState<WorkloadEntry[]>([]);

  useEffect(() => { getWorkloadEntries().then(setRows); }, []);

  const overloaded = rows.filter((r) => r.status === "overloaded").length;
  const avgLoad = rows.length > 0 ? Math.round(rows.reduce((sum, r) => sum + r.loadPct, 0) / rows.length) : 0;

  return (
    <>
      <PageHeader eyebrow="HOD Functions" title="Faculty Workload" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Faculty Tracked" icon={<GroupsIcon />} color={getIconAccent(mode, "students")} numericValue={rows.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Avg Load %" icon={<GroupsIcon />} color={getIconAccent(mode, "attendance")} value={`${avgLoad}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Overloaded" icon={<WarningAmberIcon />} color={getIconAccent(mode, "at-risk")} numericValue={overloaded} />
        </Grid>
      </Grid>
      <DataTable<WorkloadEntry>
        pagination
        columns={[
          { key: "facultyName", label: "Faculty" },
          { key: "designation", label: "Designation" },
          { key: "courses", label: "Courses" },
          { key: "students", label: "Students" },
          { key: "hrsPerWeek", label: "Hrs/Week" },
          { key: "loadPct", label: "Load %", render: (row) => `${row.loadPct}%` },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={rows}
        emptyTitle="No workload data found"
      />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/teacher/FacultyWorkload.tsx
git commit -m "Add Faculty Workload page"
```

---

### Task 16: Student Issues page

**Files:**
- Create: `app/src/pages/teacher/StudentIssues.tsx`

**Interfaces:**
- Consumes: `getStudentIssues`, `resolveStudentIssue` (Task 5).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getStudentIssues, resolveStudentIssue } from "@/api/teacherStudentIssues";
import type { StudentIssue } from "@/types";

export default function StudentIssues() {
  const [rows, setRows] = useState<StudentIssue[]>([]);
  const [selected, setSelected] = useState<StudentIssue | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getStudentIssues().then(setRows);
  useEffect(() => { load(); }, []);

  const handleResolve = (id: string) => resolveStudentIssue(id).then(() => { load(); setSnackbar("Issue marked resolved"); setSelected(null); });

  return (
    <>
      <PageHeader eyebrow="HOD Functions" title="Student Issues" />
      <DataTable<StudentIssue>
        pagination
        columns={[
          { key: "rollNo", label: "Roll No" },
          { key: "name", label: "Name" },
          { key: "issue", label: "Issue" },
          { key: "raisedBy", label: "Raised By" },
          { key: "date", label: "Date" },
          { key: "priority", label: "Priority", render: (row) => <StatusChip status={row.priority} /> },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "actions", label: "Action", render: (row) => <Button size="small" onClick={() => setSelected(row)}>View</Button> },
        ]}
        rows={rows}
        emptyTitle="No student issues found"
      />
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.issue}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{selected?.rollNo} · {selected?.name}</Typography>
          <Typography variant="body2">{selected?.detail}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
            Raised by {selected?.raisedBy} on {selected?.date}
          </Typography>
        </DialogContent>
        <DialogActions>
          {selected?.status === "open" && (
            <Button onClick={() => selected && handleResolve(selected.id)} variant="contained">Mark Resolved</Button>
          )}
          <Button onClick={() => setSelected(null)}>Close</Button>
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
git add app/src/pages/teacher/StudentIssues.tsx
git commit -m "Add Student Issues page"
```

---

### Task 17: Academic Overview page

**Files:**
- Create: `app/src/pages/teacher/AcademicOverview.tsx`

**Interfaces:**
- Consumes: `getDepartmentSummaries` (Phase 2a's `@/api/teacherDepartments`, now returning `completionPct` per Task 9).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import SchoolIcon from "@mui/icons-material/School";
import GroupsIcon from "@mui/icons-material/Groups";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getDepartmentSummaries } from "@/api/teacherDepartments";
import type { DepartmentSummary } from "@/types";

export default function AcademicOverview() {
  const { mode } = useColorMode();
  const [rows, setRows] = useState<DepartmentSummary[]>([]);

  useEffect(() => { getDepartmentSummaries().then(setRows); }, []);

  const totalStudents = rows.reduce((sum, d) => sum + d.totalStudents, 0);
  const totalFaculty = rows.reduce((sum, d) => sum + d.facultyCount, 0);
  const avgCompletion = rows.length > 0 ? Math.round(rows.reduce((sum, d) => sum + (d.completionPct ?? 0), 0) / rows.length) : 0;

  return (
    <>
      <PageHeader eyebrow="Dean Functions" title="Academic Overview" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Departments" icon={<PublicIcon />} color={getIconAccent(mode, "students")} numericValue={rows.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Students" icon={<SchoolIcon />} color={getIconAccent(mode, "attendance")} numericValue={totalStudents} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Faculty" icon={<GroupsIcon />} color={getIconAccent(mode, "marks")} numericValue={totalFaculty} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Curriculum Completion" icon={<TrendingUpIcon />} color={getIconAccent(mode, "at-risk")} value={`${avgCompletion}%`} />
        </Grid>
      </Grid>
      <DataTable<DepartmentSummary>
        title="Department Comparison"
        columns={[
          { key: "name", label: "Department" },
          { key: "totalStudents", label: "Students" },
          { key: "facultyCount", label: "Faculty" },
          { key: "avgAttendancePct", label: "Avg Attendance %", render: (row) => `${row.avgAttendancePct}%` },
          { key: "avgMarksPct", label: "Avg Marks %", render: (row) => `${row.avgMarksPct}%` },
          { key: "completionPct", label: "Curriculum Completion %", render: (row) => `${row.completionPct ?? 0}%` },
        ]}
        rows={rows}
        emptyTitle="No department data found"
      />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/teacher/AcademicOverview.tsx
git commit -m "Add Academic Overview page"
```

---

### Task 18: Policy & Deadlines page

**Files:**
- Create: `app/src/pages/teacher/PolicyDeadlines.tsx`

**Interfaces:**
- Consumes: `getCalendarEvents`, `getAcademicPolicies` (Task 6).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Paper, Typography, Stack, Snackbar, Grid } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getCalendarEvents, getAcademicPolicies } from "@/api/teacherCalendar";
import type { CalendarEvent, AcademicPolicy } from "@/types";

export default function PolicyDeadlines() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [policies, setPolicies] = useState<AcademicPolicy[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    getCalendarEvents().then(setEvents);
    getAcademicPolicies().then(setPolicies);
  }, []);

  return (
    <>
      <PageHeader eyebrow="Dean Functions" title="Policy & Deadlines" />
      <DataTable<CalendarEvent>
        title="Academic Calendar"
        columns={[
          { key: "event", label: "Event" },
          { key: "startDate", label: "Start Date" },
          { key: "endDate", label: "End Date" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={events}
        emptyTitle="No calendar events found"
      />
      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>Academic Policies</Typography>
      <Grid container spacing={2.5}>
        {policies.map((p) => (
          <Grid key={p.name} size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 2.5, height: "100%" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Typography variant="subtitle2" fontWeight={600}>{p.name}</Typography>
                <Button size="small" onClick={() => setSnackbar("Policy editing is managed by the Registrar's office")}>Edit</Button>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{p.description}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/teacher/PolicyDeadlines.tsx
git commit -m "Add Policy & Deadlines page"
```

---

### Task 19: Inter-Department Reports page

**Files:**
- Create: `app/src/pages/teacher/InterDeptReports.tsx`

**Interfaces:**
- Consumes: `getReportRows` (Task 7).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Stack, Snackbar, Grid } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle } from "@/theme/chartPalette";
import { getReportRows } from "@/api/teacherReports";
import type { ReportRow } from "@/types";

export default function InterDeptReports() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getReportRows().then(setRows); }, []);

  return (
    <>
      <PageHeader eyebrow="Dean Functions" title="Inter-Department Reports" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Attendance & Marks" title="Attendance vs Marks by Department">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="department" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="avgAttendancePct" name="Avg Attendance %" fill={palette.categorical[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgMarksPct" name="Avg Marks %" fill={palette.categorical[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Risk & Utilization" title="At-Risk % vs Faculty Utilization %">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="department" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="atRiskPct" name="At-Risk %" fill={palette.categorical[5]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="facultyUtilizationPct" name="Faculty Utilization %" fill={palette.categorical[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={() => setSnackbar("Generating report...")}>Generate Report</Button>
      </Stack>

      <DataTable<ReportRow>
        columns={[
          { key: "department", label: "Department" },
          { key: "avgAttendancePct", label: "Avg Attendance %", render: (row) => `${row.avgAttendancePct}%` },
          { key: "avgMarksPct", label: "Avg Marks %", render: (row) => `${row.avgMarksPct}%` },
          { key: "passRatePct", label: "Pass Rate %", render: (row) => `${row.passRatePct}%` },
          { key: "atRiskPct", label: "At-Risk %", render: (row) => `${row.atRiskPct}%` },
          { key: "facultyUtilizationPct", label: "Faculty Utilization %", render: (row) => `${row.facultyUtilizationPct}%` },
          { key: "actions", label: "Action", render: () => <Button size="small" onClick={() => setSnackbar("Loading report details...")}>View Details</Button> },
        ]}
        rows={rows}
        emptyTitle="No report data found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/teacher/InterDeptReports.tsx
git commit -m "Add Inter-Department Reports page"
```

---

### Task 20: Approvals Dashboard page

**Files:**
- Create: `app/src/pages/teacher/ApprovalsDashboard.tsx`

**Interfaces:**
- Consumes: `getLeaveRequests`, `getGradeChangeRequests`, `getResourceRequests` (Phase 2a), `approveDeanRequest`, `rejectDeanRequest` (Task 9), all from `@/api/teacherRequests`.

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Stack, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import {
  getLeaveRequests, getGradeChangeRequests, getResourceRequests,
  approveDeanRequest, rejectDeanRequest, type DeanRequestType,
} from "@/api/teacherRequests";
import type { TeacherLeaveRequest, GradeChangeRequest, ResourceRequest } from "@/types";

export default function ApprovalsDashboard() {
  const [leave, setLeave] = useState<TeacherLeaveRequest[]>([]);
  const [gradeChange, setGradeChange] = useState<GradeChangeRequest[]>([]);
  const [resource, setResource] = useState<ResourceRequest[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => {
    getLeaveRequests().then(setLeave);
    getGradeChangeRequests().then(setGradeChange);
    getResourceRequests().then(setResource);
  };
  useEffect(() => { load(); }, []);

  const handleApprove = (type: DeanRequestType, id: string) =>
    approveDeanRequest(type, id).then(() => { load(); setSnackbar("Request approved"); });
  const handleReject = (type: DeanRequestType, id: string) =>
    rejectDeanRequest(type, id).then(() => { load(); setSnackbar("Request rejected"); });

  const actionCell = (type: DeanRequestType, id: string, deanStatus: string | null) =>
    deanStatus === "pending_approval" ? (
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="contained" onClick={() => handleApprove(type, id)}>Approve</Button>
        <Button size="small" variant="outlined" color="error" onClick={() => handleReject(type, id)}>Reject</Button>
      </Stack>
    ) : "—";

  return (
    <>
      <PageHeader eyebrow="Dean Functions" title="Approvals Dashboard" />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Leave Requests (Escalated)</Typography>
      <DataTable<TeacherLeaveRequest>
        columns={[
          { key: "leaveType", label: "Type" },
          { key: "fromDate", label: "From" },
          { key: "toDate", label: "To" },
          { key: "hodStatus", label: "HOD Status", render: (row) => <StatusChip status={row.hodStatus} /> },
          { key: "deanStatus", label: "Dean Status", render: (row) => row.deanStatus ? <StatusChip status={row.deanStatus} /> : "—" },
          { key: "actions", label: "Action", render: (row) => actionCell("leave", row.id, row.deanStatus) },
        ]}
        rows={leave.filter((r) => r.deanStatus !== null)}
        emptyTitle="No leave requests escalated to Dean"
      />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>Grade Change Requests (Escalated)</Typography>
      <DataTable<GradeChangeRequest>
        columns={[
          { key: "courseId", label: "Course" },
          { key: "studentRollNo", label: "Roll No" },
          { key: "originalMark", label: "Original" },
          { key: "proposedMark", label: "Proposed" },
          { key: "hodStatus", label: "HOD Status", render: (row) => <StatusChip status={row.hodStatus} /> },
          { key: "deanStatus", label: "Dean Status", render: (row) => row.deanStatus ? <StatusChip status={row.deanStatus} /> : "—" },
          { key: "actions", label: "Action", render: (row) => actionCell("grade-change", row.id, row.deanStatus) },
        ]}
        rows={gradeChange.filter((r) => r.deanStatus !== null)}
        emptyTitle="No grade change requests escalated to Dean"
      />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>Resource Requests (Escalated)</Typography>
      <DataTable<ResourceRequest>
        columns={[
          { key: "resourceType", label: "Resource" },
          { key: "description", label: "Description" },
          { key: "estimatedCost", label: "Cost", render: (row) => `₹${row.estimatedCost.toLocaleString("en-IN")}` },
          { key: "hodStatus", label: "HOD Status", render: (row) => <StatusChip status={row.hodStatus} /> },
          { key: "deanStatus", label: "Dean Status", render: (row) => row.deanStatus ? <StatusChip status={row.deanStatus} /> : "—" },
          { key: "actions", label: "Action", render: (row) => actionCell("resource", row.id, row.deanStatus) },
        ]}
        rows={resource.filter((r) => r.deanStatus !== null)}
        emptyTitle="No resource requests escalated to Dean"
      />

      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/teacher/ApprovalsDashboard.tsx
git commit -m "Add Approvals Dashboard page"
```

---

### Task 21: My Profile page

**Files:**
- Create: `app/src/pages/teacher/Profile.tsx`

**Interfaces:**
- Consumes: `getTeacherProfile`, `updateTeacherProfile` (Task 8), `getTeacherCourses` (Phase 2a's `@/api/teacherCourses`).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Grid, Paper, Stack, TextField, Typography, Snackbar, Avatar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getTeacherProfile, updateTeacherProfile } from "@/api/teacherProfile";
import { getTeacherCourses } from "@/api/teacherCourses";
import type { TeacherProfile, TeacherCourse } from "@/types";

export default function Profile() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [form, setForm] = useState({ phone: "", office: "" });
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    getTeacherProfile().then((p) => { setProfile(p); setForm({ phone: p.phone, office: p.office }); });
    getTeacherCourses().then(setCourses);
  }, []);

  const handleSave = () => {
    updateTeacherProfile(form).then((p) => { setProfile(p); setSnackbar("Profile updated successfully"); });
  };

  if (!profile) return null;

  return (
    <>
      <PageHeader eyebrow="My Profile" title={profile.name} />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
            <Avatar sx={{ width: 72, height: 72, mx: "auto", mb: 2, fontSize: 28, fontWeight: 700 }}>{profile.name.charAt(0)}</Avatar>
            <Typography variant="subtitle1" fontWeight={600}>{profile.name}</Typography>
            <Typography variant="body2" color="text.secondary">{profile.facultyId}</Typography>
            <Button size="small" sx={{ mt: 1.5 }} onClick={() => setSnackbar("Photo upload is not available in this demo")}>Change Photo</Button>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Profile Details</Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Email" fullWidth value={profile.email} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Date of Joining" fullWidth value={profile.dateOfJoining} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Phone" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Office" fullWidth value={form.office} onChange={(e) => setForm({ ...form, office: e.target.value })} /></Grid>
              <Grid size={12}><TextField label="Qualifications" fullWidth value={profile.qualifications.join(", ")} disabled /></Grid>
              <Grid size={12}><TextField label="Specializations" fullWidth value={profile.specializations.join(", ")} disabled /></Grid>
            </Grid>
            <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
              <Button variant="contained" onClick={handleSave}>Save Changes</Button>
              {["Change Password", "Notification Preferences", "Privacy Settings"].map((label) => (
                <Button key={label} variant="outlined" onClick={() => setSnackbar(`${label} is not available in this demo`)}>{label}</Button>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Current Courses</Typography>
      <DataTable<TeacherCourse>
        columns={[
          { key: "name", label: "Course" },
          { key: "section", label: "Section" },
          { key: "studentIds", label: "Students", render: (row) => row.studentIds.length },
          { key: "avgAttendancePct", label: "Avg Attendance %", render: (row) => `${row.avgAttendancePct}%` },
          { key: "avgMarksPct", label: "Avg Marks %", render: (row) => `${row.avgMarksPct}%` },
        ]}
        rows={courses}
        emptyTitle="No courses assigned"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/teacher/Profile.tsx
git commit -m "Add My Profile page"
```

---

### Task 22: Navigation + router wiring (role-aware `getNavItems`)

**Files:**
- Modify: `app/src/components/navigation.tsx`
- Modify: `app/src/router.tsx`

**Interfaces:**
- Produces: final `getNavItems(role: Role, teacherRole: TeacherRole = "professor"): NavItem[]` signature; 10 new routes under `/teacher/*`.

- [ ] **Step 1: Add new icon import and `TeacherRole` type import**

In `app/src/components/navigation.tsx`, change:

```ts
import type { Role } from "@/types";
```

to:

```ts
import type { Role, TeacherRole } from "@/types";
```

Add one new icon import (all others used below are already imported in this file):

```ts
import PendingActionsIcon from "@mui/icons-material/PendingActions";
```

- [ ] **Step 2: Replace the function signature and the `"teacher"` case**

Replace:

```ts
export function getNavItems(role: Role, _teacherRole?: import("@/types").TeacherRole): NavItem[] {
```

with:

```ts
export function getNavItems(role: Role, teacherRole: TeacherRole = "professor"): NavItem[] {
```

Replace the entire `case "teacher":` block with:

```ts
    case "teacher": {
      const items: NavItem[] = [
        { label: "Dashboard", path: "/teacher", icon: <DashboardIcon /> },
        { label: "My Courses", path: "/teacher/courses", icon: <MenuBookIcon />, group: "Academics" },
        { label: "Attendance", path: "/teacher/attendance", icon: <EventNoteIcon />, group: "Academics" },
        { label: "Internal Marks", path: "/teacher/marks", icon: <GradingIcon />, group: "Academics" },
        { label: "Exams", path: "/teacher/exams", icon: <AssessmentIcon />, group: "Academics" },
        { label: "Course Materials", path: "/teacher/materials", icon: <UploadFileIcon />, group: "Academics" },
        { label: "My Course Students", path: "/teacher/students", icon: <GroupsIcon />, group: "Students" },
        { label: "Department Students", path: "/teacher/dept-students", icon: <AccountBalanceIcon />, group: "Students" },
        { label: "Academic Cohort", path: "/teacher/cohort", icon: <PublicIcon />, group: "Students" },
        { label: "Student Performance", path: "/teacher/performance", icon: <TrendingUpIcon />, group: "Students" },
        { label: "Leave Requests", path: "/teacher/leave", icon: <EventBusyIcon />, group: "Requests" },
        { label: "Grade Change Requests", path: "/teacher/grade-change", icon: <RuleIcon />, group: "Requests" },
        { label: "Resource Requests", path: "/teacher/resources", icon: <Inventory2Icon />, group: "Requests" },
        { label: "Notices", path: "/teacher/notices", icon: <CampaignIcon />, group: "Communication" },
        { label: "Messages", path: "/teacher/messages", icon: <ChatIcon />, group: "Communication" },
        { label: "Document Signatures", path: "/teacher/documents", icon: <HistoryEduIcon />, group: "Communication" },
        { label: "Department Overview", path: "/teacher/department-overview", icon: <AccountBalanceIcon />, group: "HOD Functions" },
        { label: "Attendance Approval", path: "/teacher/attendance-approval", icon: <EventNoteIcon />, group: "HOD Functions" },
        { label: "Marks Approval", path: "/teacher/marks-approval", icon: <GradingIcon />, group: "HOD Functions" },
        { label: "Faculty Workload", path: "/teacher/workload", icon: <AssessmentIcon />, group: "HOD Functions" },
        { label: "Student Issues", path: "/teacher/student-issues", icon: <RuleIcon />, group: "HOD Functions" },
        { label: "Academic Overview", path: "/teacher/academic-overview", icon: <PublicIcon />, group: "Dean Functions" },
        { label: "Policy & Deadlines", path: "/teacher/policy-deadlines", icon: <EventIcon />, group: "Dean Functions" },
        { label: "Inter-Department Reports", path: "/teacher/inter-dept-reports", icon: <AssessmentIcon />, group: "Dean Functions" },
        { label: "Approvals Dashboard", path: "/teacher/approvals", icon: <PendingActionsIcon />, group: "Dean Functions" },
        { label: "My Profile", path: "/teacher/profile", icon: <AccountCircleIcon />, group: "_bottom" },
      ];
      return items.filter((item) => {
        if (item.group === "HOD Functions") return teacherRole !== "professor";
        if (item.group === "Dean Functions") return teacherRole === "dean";
        return true;
      });
    }
```

- [ ] **Step 3: Add lazy imports and routes to `router.tsx`**

In `app/src/router.tsx`, add after the existing `TeacherDocumentSignatures` lazy import:

```ts
const TeacherDepartmentOverview = lazy(() => import("@/pages/teacher/DepartmentOverview"));
const TeacherAttendanceApproval = lazy(() => import("@/pages/teacher/AttendanceApproval"));
const TeacherMarksApproval = lazy(() => import("@/pages/teacher/MarksApproval"));
const TeacherFacultyWorkload = lazy(() => import("@/pages/teacher/FacultyWorkload"));
const TeacherStudentIssues = lazy(() => import("@/pages/teacher/StudentIssues"));
const TeacherAcademicOverview = lazy(() => import("@/pages/teacher/AcademicOverview"));
const TeacherPolicyDeadlines = lazy(() => import("@/pages/teacher/PolicyDeadlines"));
const TeacherInterDeptReports = lazy(() => import("@/pages/teacher/InterDeptReports"));
const TeacherApprovalsDashboard = lazy(() => import("@/pages/teacher/ApprovalsDashboard"));
const TeacherProfilePage = lazy(() => import("@/pages/teacher/Profile"));
```

Add after the existing `{ path: "teacher/documents", element: <TeacherDocumentSignatures /> },` route:

```ts
      { path: "teacher/department-overview", element: <TeacherDepartmentOverview /> },
      { path: "teacher/attendance-approval", element: <TeacherAttendanceApproval /> },
      { path: "teacher/marks-approval", element: <TeacherMarksApproval /> },
      { path: "teacher/workload", element: <TeacherFacultyWorkload /> },
      { path: "teacher/student-issues", element: <TeacherStudentIssues /> },
      { path: "teacher/academic-overview", element: <TeacherAcademicOverview /> },
      { path: "teacher/policy-deadlines", element: <TeacherPolicyDeadlines /> },
      { path: "teacher/inter-dept-reports", element: <TeacherInterDeptReports /> },
      { path: "teacher/approvals", element: <TeacherApprovalsDashboard /> },
      { path: "teacher/profile", element: <TeacherProfilePage /> },
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/navigation.tsx app/src/router.tsx
git commit -m "Wire HOD/Dean/Profile navigation and routes"
```

---

### Task 23: End-to-end manual verification, lint, and `faculty.html` deletion

**Files:**
- None created — verification only, plus final deletion of the legacy file.

- [ ] **Step 1: Lint check**

Run (from `app/`): `npm run lint`
Expected: 0 errors (the pre-existing `AuthContext.tsx` warning from earlier phases is acceptable).

- [ ] **Step 2: Start dev server and verify via browser-driver**

Use the `browser-driver` skill. In a single script invocation (fresh browser, full flow each time):
1. Navigate to `/login`, select role "Faculty" via the `<select>` combobox, sign in.
2. On Faculty Dashboard, confirm the topbar role-switcher `<Select>` is visible and defaults to "Professor". Confirm sidebar shows no "HOD Functions" or "Dean Functions" groups yet, and Department Students/Academic Cohort still show "Access Denied".
3. Change the role-switcher to "HOD". Confirm "HOD Functions" group appears in the sidebar (Department Overview, Attendance Approval, Marks Approval, Faculty Workload, Student Issues) and "Department Students" now shows real data instead of Access Denied.
4. Visit Attendance Approval, click Approve on a "pending" row — confirm its status flips to "approved" and the Approve/Reject buttons disappear for that row.
5. Visit Marks Approval, click Reject on a "pending" row — confirm status flips to "rejected".
6. Visit Student Issues, click "View" on two different rows — confirm each opens a dialog with that row's own `detail`/`raisedBy` text (not a fixed sample). Click "Mark Resolved" on an open issue — confirm status flips to "resolved" and dialog closes.
7. Change the role-switcher to "Dean". Confirm "Dean Functions" group appears (Academic Overview, Policy & Deadlines, Inter-Department Reports, Approvals Dashboard) and "Academic Cohort" now shows real data.
8. Visit Approvals Dashboard — confirm the Leave Requests table shows `LV-003` with Approve/Reject buttons (it's the seed data's only entry with `deanStatus: "pending_approval"`). Click Approve — confirm it flips to "approved" and the buttons disappear.
9. Visit Inter-Department Reports — confirm both charts render as real bar charts (not placeholder text).
10. Visit My Profile — edit the Phone field, click Save Changes, confirm the Snackbar fires; soft-navigate away and back (sidebar click, not `nav`) to confirm the edit persisted. Confirm "Current Courses" shows real course rows.
11. Toggle dark mode via the topbar theme toggle — confirm all newly-added pages render correctly in both themes.
12. Reload the page (full `nav`) and confirm the role-switcher's last-selected role persists (localStorage-backed via `useTeacherRoleState`).

If any step fails, stop and fix before proceeding — do not delete `faculty.html` until every step above passes.

- [ ] **Step 3: Delete the fully-ported legacy file**

```bash
git rm faculty.html
git commit -m "Delete legacy faculty.html — fully ported to app/ (Teacher portal Phases 2a-2b complete)"
```

- [ ] **Step 4: Update local todo tracking**

Mark Phase 2b complete; Phase 3 (Staff/Operations portal, from `ops.html`) is next.
