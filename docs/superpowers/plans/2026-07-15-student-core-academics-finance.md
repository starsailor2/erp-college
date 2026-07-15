# Student / Core, Academics, Finance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite 12 of `student.html`'s ~20 pages (Dashboard, Identity, My Courses, Registration, Attendance, Internal Marks, Exams & Results, Academic Requests, Fee Summary, Payments, Fee Ledger, My Profile) into `app/` as Phase 4a of the Student portal.

**Architecture:** Same fake-async-API layer (`simulateRequest`) over in-memory demo-data modules as every prior phase. No role-switcher — single student identity. One canonical `StudentProfile` demo-data singleton is read by every page, fixing the source's cross-page data-inconsistency bug.

**Tech Stack:** React 19, TypeScript 5.8, MUI v7, react-router-dom v7, recharts v2, `motion` v12, Vite 6.

## Global Constraints

- All identity data (name, roll number, DOB, emails, program, CGPA, etc.) is read from the single `studentProfile` singleton — never re-literal a duplicate copy on any page.
- `downloadFile`-equivalent actions stay stub `Snackbar`s everywhere (no real files exist to download in the source, matching the established "no real backing = stays a stub" rule).
- Every new demo-data module owns its own independent `createRng(seed)` instance where randomization is used (most of this phase uses small hand-authored arrays instead, matching the style of Teacher's `requests.ts`/`calendar.ts`).
- All reads/writes go through `simulateRequest`.
- Verify with `npm run build` (run from `app/`) after every task; commit every task individually.
- `student.html` is **not** deleted at the end of this plan — Phase 4b still depends on it existing until it also ships.

---

### Task 1: Type definitions

**Files:**
- Modify: `app/src/types/index.ts` (append at the end of the file)

**Interfaces:**
- Produces: `StudentProfile`, `CourseGrade`, `StudentCourse`, `CourseCategory`, `RegistrationCourse`, `AttendanceSubject`, `MarksSubject`, `SemesterResultStatus`, `SemesterResult`, `AcademicRequestType`, `StudentRequestStatus`, `StudentAcademicRequest`, `FeeStatus`, `FeeSemesterRow`, `PaymentTransaction`, `FeeLedgerEntry` — consumed by every later task.

- [ ] **Step 1: Append new types**

```ts
// --- Student / Core, Academics, Finance (Phase 4a) ---

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

- [ ] **Step 2: Verify build** — `npm run build` (from `app/`), expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/types/index.ts
git commit -m "Add Phase 4a (Student Core/Academics/Finance) type definitions"
```

---

### Task 2: Student profile demo data + API

**Files:**
- Create: `app/src/demo-data/student/profile.ts`
- Create: `app/src/api/studentProfile.ts`

**Interfaces:**
- Produces: `studentProfile: StudentProfile`, `getStudentProfile()`, `updateStudentProfile(updates)` — consumed by every page that shows identity, and by Task 21 (Profile page).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/student/profile.ts
import type { StudentProfile } from "@/types";

export const studentProfile: StudentProfile = {
  name: "Rahul Sharma",
  rollNo: "2023CS001",
  collegeEmail: "2023cs001@kalnet.edu",
  personalEmail: "rahul.sharma04@gmail.com",
  mobile: "9876543210",
  dob: "2005-03-15",
  bloodGroup: "B+",
  fatherName: "Suresh Sharma",
  address: "24 MG Road, Bengaluru, Karnataka 560001",
  program: "B.Tech",
  branch: "Computer Science",
  batch: "2023-2027",
  currentSemester: 6,
  cgpa: 8.75,
  creditsEarned: 124,
  admissionDate: "2023-08-01",
  status: "active",
};
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/studentProfile.ts
import { simulateRequest } from "@/api/http";
import { studentProfile } from "@/demo-data/student/profile";
import type { StudentProfile } from "@/types";

export function getStudentProfile(): Promise<StudentProfile> {
  return simulateRequest(studentProfile);
}

export function updateStudentProfile(updates: Partial<StudentProfile>): Promise<StudentProfile> {
  Object.assign(studentProfile, updates);
  return simulateRequest(studentProfile);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/student/profile.ts app/src/api/studentProfile.ts
git commit -m "Add student profile demo data and API"
```

---

### Task 3: Courses + Registration demo data + API

**Files:**
- Create: `app/src/demo-data/student/courses.ts`
- Create: `app/src/api/studentCourses.ts`

**Interfaces:**
- Produces: `studentCourses: StudentCourse[]` (real data for all 6 semesters — fixes the source's `changeSemester` bug), `registrationCatalog: RegistrationCourse[]`, `registeredCourseCodes: string[]`; `getStudentCourses()`, `getStudentCoursesBySemester(semester)`, `getRegistrationCatalog()`, `getRegisteredCourseCodes()`, `registerCourse(code)`, `dropCourse(code)` — consumed by Tasks 11 (My Courses) and 12 (Registration).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/student/courses.ts
import type { StudentCourse, RegistrationCourse } from "@/types";

export const studentCourses: StudentCourse[] = [
  { code: "CS601", name: "Advanced Algorithms", instructor: "Dr. Priya Menon", section: "A", credits: 4, semester: 6, grade: "-", attendancePct: 88 },
  { code: "CS602", name: "Machine Learning", instructor: "Dr. Arjun Rao", section: "A", credits: 4, semester: 6, grade: "-", attendancePct: 82 },
  { code: "CS603", name: "Distributed Systems", instructor: "Dr. Kavita Iyer", section: "B", credits: 3, semester: 6, grade: "-", attendancePct: 90 },
  { code: "CS604", name: "Cloud Computing", instructor: "Prof. Sanjay Gupta", section: "A", credits: 3, semester: 6, grade: "-", attendancePct: 79 },
  { code: "HS601", name: "Engineering Ethics", instructor: "Dr. Meera Nair", section: "A", credits: 2, semester: 6, grade: "-", attendancePct: 95 },
  { code: "EC601", name: "Digital Signal Processing", instructor: "Dr. Vikram Shah", section: "C", credits: 3, semester: 6, grade: "-", attendancePct: 85 },
  { code: "CS501", name: "Operating Systems", instructor: "Dr. Priya Menon", section: "A", credits: 4, semester: 5, grade: "A", attendancePct: 91 },
  { code: "CS502", name: "Computer Networks", instructor: "Dr. Arjun Rao", section: "A", credits: 4, semester: 5, grade: "A+", attendancePct: 89 },
  { code: "CS503", name: "Database Systems", instructor: "Dr. Kavita Iyer", section: "B", credits: 4, semester: 5, grade: "B+", attendancePct: 86 },
  { code: "CS504", name: "Theory of Computation", instructor: "Prof. Sanjay Gupta", section: "A", credits: 3, semester: 5, grade: "A", attendancePct: 88 },
  { code: "CS401", name: "Data Structures", instructor: "Dr. Priya Menon", section: "A", credits: 4, semester: 4, grade: "A+", attendancePct: 93 },
  { code: "CS402", name: "Object Oriented Programming", instructor: "Dr. Arjun Rao", section: "A", credits: 4, semester: 4, grade: "A", attendancePct: 90 },
  { code: "MA401", name: "Discrete Mathematics", instructor: "Dr. Ramesh Kumar", section: "A", credits: 3, semester: 4, grade: "B+", attendancePct: 84 },
  { code: "CS301", name: "Digital Logic Design", instructor: "Dr. Kavita Iyer", section: "A", credits: 3, semester: 3, grade: "A", attendancePct: 87 },
  { code: "CS302", name: "Computer Organization", instructor: "Prof. Sanjay Gupta", section: "A", credits: 4, semester: 3, grade: "A", attendancePct: 89 },
  { code: "MA301", name: "Probability & Statistics", instructor: "Dr. Ramesh Kumar", section: "A", credits: 3, semester: 3, grade: "B", attendancePct: 82 },
  { code: "CS201", name: "Programming Fundamentals", instructor: "Dr. Priya Menon", section: "A", credits: 4, semester: 2, grade: "A+", attendancePct: 94 },
  { code: "PH201", name: "Engineering Physics", instructor: "Dr. Anjali Desai", section: "A", credits: 3, semester: 2, grade: "A", attendancePct: 88 },
  { code: "CS101", name: "Introduction to Computing", instructor: "Dr. Priya Menon", section: "A", credits: 3, semester: 1, grade: "A+", attendancePct: 96 },
  { code: "MA101", name: "Calculus", instructor: "Dr. Ramesh Kumar", section: "A", credits: 4, semester: 1, grade: "A", attendancePct: 90 },
];

export const registrationCatalog: RegistrationCourse[] = [
  { code: "CS701", name: "Deep Learning", credits: 4, category: "core", instructor: "Dr. Arjun Rao", seatsAvailable: 12 },
  { code: "CS702", name: "Blockchain Technology", credits: 3, category: "core", instructor: "Dr. Kavita Iyer", seatsAvailable: 18 },
  { code: "CS703", name: "Natural Language Processing", credits: 3, category: "core", instructor: "Prof. Sanjay Gupta", seatsAvailable: 10 },
  { code: "CS704", name: "Computer Vision", credits: 3, category: "core", instructor: "Dr. Priya Menon", seatsAvailable: 15 },
  { code: "CS711", name: "Quantum Computing", credits: 3, category: "elective", instructor: "Dr. Vikram Shah", seatsAvailable: 20 },
  { code: "CS712", name: "Game Development", credits: 3, category: "elective", instructor: "Dr. Meera Nair", seatsAvailable: 25 },
  { code: "EC701", name: "IoT Systems", credits: 3, category: "interdisciplinary", instructor: "Dr. Vikram Shah", seatsAvailable: 22 },
  { code: "ME701", name: "Robotics Fundamentals", credits: 3, category: "interdisciplinary", instructor: "Dr. Anjali Desai", seatsAvailable: 16 },
  { code: "BM701", name: "Biomedical Instrumentation", credits: 3, category: "interdisciplinary", instructor: "Dr. Ramesh Kumar", seatsAvailable: 14 },
  { code: "MA701", name: "Applied Optimization", credits: 3, category: "interdisciplinary", instructor: "Dr. Ramesh Kumar", seatsAvailable: 20 },
  { code: "DS801", name: "Data Science Minor - Foundations", credits: 4, category: "minor", instructor: "Dr. Arjun Rao", seatsAvailable: 30 },
  { code: "DS802", name: "Data Science Minor - Applied Analytics", credits: 4, category: "minor", instructor: "Dr. Kavita Iyer", seatsAvailable: 28 },
];

export const registeredCourseCodes: string[] = ["CS701", "CS702"];
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/studentCourses.ts
import { simulateRequest } from "@/api/http";
import { studentCourses, registrationCatalog, registeredCourseCodes } from "@/demo-data/student/courses";
import type { StudentCourse, RegistrationCourse } from "@/types";

export function getStudentCourses(): Promise<StudentCourse[]> {
  return simulateRequest(studentCourses);
}

export function getStudentCoursesBySemester(semester: number): Promise<StudentCourse[]> {
  return simulateRequest(studentCourses.filter((c) => c.semester === semester));
}

export function getRegistrationCatalog(): Promise<RegistrationCourse[]> {
  return simulateRequest(registrationCatalog);
}

export function getRegisteredCourseCodes(): Promise<string[]> {
  return simulateRequest(registeredCourseCodes);
}

export function registerCourse(code: string): Promise<void> {
  if (!registeredCourseCodes.includes(code)) registeredCourseCodes.push(code);
  return simulateRequest(undefined);
}

export function dropCourse(code: string): Promise<void> {
  const idx = registeredCourseCodes.indexOf(code);
  if (idx !== -1) registeredCourseCodes.splice(idx, 1);
  return simulateRequest(undefined);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/student/courses.ts app/src/api/studentCourses.ts
git commit -m "Add student courses and registration demo data and API"
```

---

### Task 4: Attendance demo data + API

**Files:**
- Create: `app/src/demo-data/student/attendance.ts`
- Create: `app/src/api/studentAttendance.ts`

**Interfaces:**
- Produces: `getAttendanceSubjects()`, `getMonthlyAttendanceTrend()` — consumed by Task 13 (Attendance page).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/student/attendance.ts
import type { AttendanceSubject } from "@/types";

export const attendanceSubjects: AttendanceSubject[] = [
  { code: "CS601", name: "Advanced Algorithms", attended: 50, total: 56 },
  { code: "CS602", name: "Machine Learning", attended: 46, total: 56 },
  { code: "CS603", name: "Distributed Systems", attended: 47, total: 52 },
  { code: "CS604", name: "Cloud Computing", attended: 38, total: 48 },
  { code: "HS601", name: "Engineering Ethics", attended: 38, total: 40 },
];

export const monthlyAttendanceTrend = [
  { month: "Nov", pct: 88 },
  { month: "Dec", pct: 84 },
  { month: "Jan", pct: 86 },
  { month: "Feb", pct: 87 },
];
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/studentAttendance.ts
import { simulateRequest } from "@/api/http";
import { attendanceSubjects, monthlyAttendanceTrend } from "@/demo-data/student/attendance";
import type { AttendanceSubject } from "@/types";

export function getAttendanceSubjects(): Promise<AttendanceSubject[]> {
  return simulateRequest(attendanceSubjects);
}

export function getMonthlyAttendanceTrend(): Promise<typeof monthlyAttendanceTrend> {
  return simulateRequest(monthlyAttendanceTrend);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/student/attendance.ts app/src/api/studentAttendance.ts
git commit -m "Add student attendance demo data and API"
```

---

### Task 5: Marks demo data + API

**Files:**
- Create: `app/src/demo-data/student/marks.ts`
- Create: `app/src/api/studentMarks.ts`

**Interfaces:**
- Produces: `getMarksForSemester(semester)`, `getSemesterGpaHistory()` — consumed by Task 15 (Internal Marks page). Fixes the source's undefined `changeMarksSemester` bug: every semester is now a real, working selection (semesters with no seeded marks legitimately return an empty array, rendered as a real `EmptyState`, not a crash).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/student/marks.ts
import type { MarksSubject } from "@/types";

export const marksBySemester: Record<number, MarksSubject[]> = {
  6: [
    { code: "CS601", name: "Advanced Algorithms", test1: 18, test2: 19, assignment: 9, total: 46, maxTotal: 50 },
    { code: "CS602", name: "Machine Learning", test1: 16, test2: 17, assignment: 8, total: 41, maxTotal: 50 },
    { code: "CS603", name: "Distributed Systems", test1: 19, test2: 18, assignment: 10, total: 47, maxTotal: 50 },
  ],
  5: [
    { code: "CS501", name: "Operating Systems", test1: 17, test2: 18, assignment: 9, total: 44, maxTotal: 50 },
    { code: "CS502", name: "Computer Networks", test1: 19, test2: 19, assignment: 10, total: 48, maxTotal: 50 },
  ],
  4: [
    { code: "CS401", name: "Data Structures", test1: 19, test2: 20, assignment: 10, total: 49, maxTotal: 50 },
  ],
};

export const semesterGpaHistory = [
  { semester: 3, gpa: 8.2 },
  { semester: 4, gpa: 8.5 },
  { semester: 5, gpa: 8.8 },
  { semester: 6, gpa: 8.75 },
];
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/studentMarks.ts
import { simulateRequest } from "@/api/http";
import { marksBySemester, semesterGpaHistory } from "@/demo-data/student/marks";
import type { MarksSubject } from "@/types";

export function getMarksForSemester(semester: number): Promise<MarksSubject[]> {
  return simulateRequest(marksBySemester[semester] ?? []);
}

export function getSemesterGpaHistory(): Promise<typeof semesterGpaHistory> {
  return simulateRequest(semesterGpaHistory);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/student/marks.ts app/src/api/studentMarks.ts
git commit -m "Add student internal marks demo data and API"
```

---

### Task 6: Semester results demo data + API

**Files:**
- Create: `app/src/demo-data/student/results.ts`
- Create: `app/src/api/studentResults.ts`

**Interfaces:**
- Produces: `getSemesterResults()` — consumed by Task 16 (Exams & Results page).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/student/results.ts
import type { SemesterResult } from "@/types";

export const semesterResults: SemesterResult[] = [
  { semester: 1, year: "2023", sgpa: 8.1, credits: 20, result: "pass" },
  { semester: 2, year: "2024", sgpa: 8.4, credits: 21, result: "pass" },
  { semester: 3, year: "2024", sgpa: 8.2, credits: 20, result: "pass" },
  { semester: 4, year: "2025", sgpa: 8.5, credits: 22, result: "pass" },
  { semester: 5, year: "2025", sgpa: 8.8, credits: 21, result: "pass" },
  { semester: 6, year: "2026", sgpa: 0, credits: 20, result: "pending" },
];
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/studentResults.ts
import { simulateRequest } from "@/api/http";
import { semesterResults } from "@/demo-data/student/results";
import type { SemesterResult } from "@/types";

export function getSemesterResults(): Promise<SemesterResult[]> {
  return simulateRequest(semesterResults);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/student/results.ts app/src/api/studentResults.ts
git commit -m "Add student semester results demo data and API"
```

---

### Task 7: Academic requests demo data + API

**Files:**
- Create: `app/src/demo-data/student/requests.ts`
- Create: `app/src/api/studentRequests.ts`

**Interfaces:**
- Produces: `getAcademicRequests()`, `submitAcademicRequest(type, details)` — consumed by Task 17 (Academic Requests page).

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/student/requests.ts
import type { StudentAcademicRequest } from "@/types";

export const academicRequests: StudentAcademicRequest[] = [
  { id: "AR-001", type: "section_change", details: "Request to move CS603 from Section B to Section A", submittedOn: "2026-06-10", status: "rejected" },
  { id: "AR-002", type: "leave_application", details: "Medical leave for 3 days due to fever", submittedOn: "2026-07-01", status: "pending" },
  { id: "AR-003", type: "re_evaluation", details: "Re-evaluation request for CS602 Mid Exam", submittedOn: "2026-06-20", status: "approved" },
];

export function nextRequestId(): string {
  const max = academicRequests.reduce((m, r) => Math.max(m, Number(r.id.split("-")[1])), 0);
  return `AR-${String(max + 1).padStart(3, "0")}`;
}
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/studentRequests.ts
import { simulateRequest } from "@/api/http";
import { academicRequests, nextRequestId } from "@/demo-data/student/requests";
import type { AcademicRequestType, StudentAcademicRequest } from "@/types";

export function getAcademicRequests(): Promise<StudentAcademicRequest[]> {
  return simulateRequest(academicRequests);
}

export function submitAcademicRequest(type: AcademicRequestType, details: string): Promise<StudentAcademicRequest> {
  const request: StudentAcademicRequest = {
    id: nextRequestId(),
    type,
    details,
    submittedOn: new Date().toISOString().slice(0, 10),
    status: "pending",
  };
  academicRequests.unshift(request);
  return simulateRequest(request);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/student/requests.ts app/src/api/studentRequests.ts
git commit -m "Add student academic requests demo data and API"
```

---

### Task 8: Fees demo data + API

**Files:**
- Create: `app/src/demo-data/student/fees.ts`
- Create: `app/src/api/studentFees.ts`

**Interfaces:**
- Produces: `getFeeSummary()`, `getPaymentTransactions()`, `getFeeLedger()`, `makePayment(semester, amount, description)` — consumed by Tasks 18-20 (Fee Summary, Payments, Fee Ledger). `makePayment` is the fix for the source's `processPayment()` no-op — it reduces the target semester's pending balance and appends a real transaction + ledger entry, linking all three pages.

- [ ] **Step 1: Create demo data**

```ts
// app/src/demo-data/student/fees.ts
import type { FeeSemesterRow, PaymentTransaction, FeeLedgerEntry } from "@/types";

export const feeSemesterRows: FeeSemesterRow[] = [
  { semester: 4, year: "2025", totalFee: 125000, paid: 125000, dueDate: "2025-01-15", status: "paid" },
  { semester: 5, year: "2025", totalFee: 125000, paid: 125000, dueDate: "2025-07-15", status: "paid" },
  { semester: 6, year: "2026", totalFee: 130000, paid: 130000, dueDate: "2026-01-15", status: "paid" },
  { semester: 7, year: "2026", totalFee: 130000, paid: 0, dueDate: "2026-08-15", status: "pending" },
];

export const paymentTransactions: PaymentTransaction[] = [
  { id: "TXN20260110", description: "Semester 6 Fee", amount: 130000, date: "2026-01-10", mode: "Net Banking", status: "success" },
  { id: "TXN20250705", description: "Semester 5 Fee", amount: 125000, date: "2025-07-05", mode: "UPI", status: "success" },
  { id: "TXN20250110", description: "Semester 4 Fee", amount: 125000, date: "2025-01-10", mode: "Credit Card", status: "success" },
];

export const feeLedgerEntries: FeeLedgerEntry[] = [
  { date: "2025-01-10", particulars: "Semester 4 Fee Due", debit: 125000, credit: 0, balance: 125000 },
  { date: "2025-01-10", particulars: "Payment Received", debit: 0, credit: 125000, balance: 0 },
  { date: "2025-07-05", particulars: "Semester 5 Fee Due", debit: 125000, credit: 0, balance: 125000 },
  { date: "2025-07-05", particulars: "Payment Received", debit: 0, credit: 125000, balance: 0 },
  { date: "2026-01-10", particulars: "Semester 6 Fee Due", debit: 130000, credit: 0, balance: 130000 },
  { date: "2026-01-10", particulars: "Payment Received", debit: 0, credit: 130000, balance: 0 },
  { date: "2026-07-01", particulars: "Semester 7 Fee Due", debit: 130000, credit: 0, balance: 130000 },
];
```

- [ ] **Step 2: Create API wrapper**

```ts
// app/src/api/studentFees.ts
import { simulateRequest } from "@/api/http";
import { feeSemesterRows, paymentTransactions, feeLedgerEntries } from "@/demo-data/student/fees";
import type { FeeSemesterRow, PaymentTransaction, FeeLedgerEntry } from "@/types";

export function getFeeSummary(): Promise<FeeSemesterRow[]> {
  return simulateRequest(feeSemesterRows);
}

export function getPaymentTransactions(): Promise<PaymentTransaction[]> {
  return simulateRequest(paymentTransactions);
}

export function getFeeLedger(): Promise<FeeLedgerEntry[]> {
  return simulateRequest(feeLedgerEntries);
}

export function makePayment(semester: number, amount: number, description: string): Promise<void> {
  const row = feeSemesterRows.find((r) => r.semester === semester);
  if (row) {
    row.paid += amount;
    row.status = row.paid >= row.totalFee ? "paid" : "pending";
  }
  const now = new Date().toISOString().slice(0, 10);
  paymentTransactions.unshift({
    id: `TXN${now.replace(/-/g, "")}${Math.floor(Math.random() * 900 + 100)}`,
    description,
    amount,
    date: now,
    mode: "Net Banking",
    status: "success",
  });
  const lastBalance = feeLedgerEntries[feeLedgerEntries.length - 1]?.balance ?? 0;
  feeLedgerEntries.push({ date: now, particulars: "Payment Received", debit: 0, credit: amount, balance: Math.max(0, lastBalance - amount) });
  return simulateRequest(undefined);
}
```

- [ ] **Step 3: Verify build** — `npm run build`, expect success.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/student/fees.ts app/src/api/studentFees.ts
git commit -m "Add student fees demo data and API"
```

---

### Task 9: StatusChip additions

**Files:**
- Modify: `app/src/components/StatusChip.tsx`

**Interfaces:**
- Produces: `STATUS_MAP.pass`, `STATUS_MAP.fail` — consumed by Task 16 (Exams & Results). (`pending`/`overdue`/`paid`/`success`/`failed`/`approved`/`rejected` already exist from earlier phases and are reused as-is.)

- [ ] **Step 1: Add the entries**

In `app/src/components/StatusChip.tsx`, add to `STATUS_MAP` (after the `cannot_complete` entry):

```ts
  // Semester results
  pass: { label: "Pass", color: statusTokens.good, icon: CheckCircleIcon },
  fail: { label: "Fail", color: statusTokens.critical, icon: CancelIcon },
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/StatusChip.tsx
git commit -m "Add pass/fail StatusChip entries"
```

---

### Task 10: Dashboard page (rewrite of Phase 0 placeholder)

**Files:**
- Modify: `app/src/pages/student/Dashboard.tsx` (full rewrite)

**Interfaces:**
- Consumes: `getStudentProfile()` (Task 2), `getStudentCoursesBySemester()` (Task 3), `getAttendanceSubjects()` (Task 4), `getFeeSummary()` (Task 8).

- [ ] **Step 1: Rewrite the page**

```tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Checkbox, Grid, Paper, Typography } from "@mui/material";
import ClassIcon from "@mui/icons-material/Class";
import EventNoteIcon from "@mui/icons-material/EventNote";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PaymentIcon from "@mui/icons-material/Payment";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getStudentProfile } from "@/api/studentProfile";
import { getStudentCoursesBySemester } from "@/api/studentCourses";
import { getAttendanceSubjects } from "@/api/studentAttendance";
import { getFeeSummary } from "@/api/studentFees";
import type { StudentProfile, StudentCourse, AttendanceSubject, FeeSemesterRow } from "@/types";

const schedule = [
  { title: "Advanced Algorithms", time: "09:00 - 10:30", room: "Lab A", code: "CS601" },
  { title: "Machine Learning", time: "11:00 - 12:30", room: "Hall C", code: "CS602" },
  { title: "Distributed Systems", time: "14:00 - 15:30", room: "Room 204", code: "CS603" },
];

const initialTasks = [
  { id: "T1", title: "Submit ML assignment 3", done: false },
  { id: "T2", title: "Register for elective courses", done: false },
  { id: "T3", title: "Pay Semester 7 fee", done: false },
];

export default function Dashboard() {
  const { mode } = useColorMode();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSubject[]>([]);
  const [fees, setFees] = useState<FeeSemesterRow[]>([]);
  const [tasks, setTasks] = useState(initialTasks);

  useEffect(() => {
    getStudentProfile().then(setProfile);
    getAttendanceSubjects().then(setAttendance);
    getFeeSummary().then(setFees);
  }, []);

  useEffect(() => {
    if (profile) getStudentCoursesBySemester(profile.currentSemester).then(setCourses);
  }, [profile]);

  const avgAttendance = useMemo(() => {
    if (attendance.length === 0) return 0;
    const totalAttended = attendance.reduce((s, a) => s + a.attended, 0);
    const total = attendance.reduce((s, a) => s + a.total, 0);
    return total > 0 ? Math.round((totalAttended / total) * 100) : 0;
  }, [attendance]);

  const pendingDues = fees.reduce((s, f) => s + (f.totalFee - f.paid), 0);

  const toggleTask = (id: string) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <>
      <PageHeader eyebrow="Overview" title="Student Dashboard" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Credits" icon={<ClassIcon />} color={getIconAccent(mode, "credits")} numericValue={profile?.creditsEarned ?? 0} onClick={() => navigate("/student/courses")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} value={`${avgAttendance}%`} onClick={() => navigate("/student/attendance")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Current CGPA" icon={<TrendingUpIcon />} color={getIconAccent(mode, "cgpa")} value={profile?.cgpa.toFixed(2) ?? "-"} onClick={() => navigate("/student/marks")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Pending Dues" icon={<PaymentIcon />} color={getIconAccent(mode, "dues")} formatValue={(n) => `₹${n.toLocaleString("en-IN")}`} numericValue={pendingDues} onClick={() => navigate("/student/fees/summary")} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Today's Schedule</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {schedule.map((s) => (
                <Box key={s.code} sx={{ p: 1.5, borderLeft: 3, borderColor: "primary.main", bgcolor: "action.hover", borderRadius: 1, cursor: "pointer" }} onClick={() => navigate("/student/courses")}>
                  <Typography variant="body2" fontWeight={600}>{s.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.time} · {s.room}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Pending Tasks</Typography>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {tasks.map((t) => (
                <Box key={t.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Checkbox checked={t.done} onChange={() => toggleTask(t.id)} size="small" />
                  <Typography variant="body2" sx={{ textDecoration: t.done ? "line-through" : "none", color: t.done ? "text.disabled" : "text.primary" }}>{t.title}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid size={12}>
          <DataTable<StudentCourse>
            title="Current Courses"
            onRowClick={() => navigate("/student/courses")}
            columns={[
              { key: "code", label: "Code" },
              { key: "name", label: "Course" },
              { key: "instructor", label: "Instructor" },
              { key: "attendancePct", label: "Attendance %", render: (row) => `${row.attendancePct}%` },
            ]}
            rows={courses}
            emptyTitle="No courses found"
          />
        </Grid>
      </Grid>
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/student/Dashboard.tsx
git commit -m "Rewrite Student Dashboard page with real profile/course/fee data"
```

---

### Task 11: Identity & Records page

**Files:**
- Create: `app/src/pages/student/Identity.tsx`

**Interfaces:**
- Consumes: `getStudentProfile()` (Task 2).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Grid, Paper, Stack, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { getStudentProfile } from "@/api/studentProfile";
import type { StudentProfile } from "@/types";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.75, borderBottom: 1, borderColor: "divider" }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{value}</Typography>
    </Stack>
  );
}

export default function Identity() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getStudentProfile().then(setProfile); }, []);

  if (!profile) return null;

  const stub = (label: string) => setSnackbar(`${label} is not available in this demo`);

  return (
    <>
      <PageHeader eyebrow="Identity" title="Identity & Records" />
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3, mb: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Contact Information</Typography>
            <InfoRow label="Personal Email" value={profile.personalEmail} />
            <InfoRow label="College Email" value={profile.collegeEmail} />
            <InfoRow label="Mobile" value={profile.mobile} />
            <InfoRow label="Date of Birth" value={profile.dob} />
            <InfoRow label="Blood Group" value={profile.bloodGroup} />
            <InfoRow label="Father's Name" value={profile.fatherName} />
          </Paper>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Address Information</Typography>
            <InfoRow label="Current Address" value={profile.address} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, mb: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Quick Downloads</Typography>
            <Stack spacing={1}>
              <Button variant="outlined" onClick={() => stub("ID Card download")}>ID Card</Button>
              <Button variant="outlined" onClick={() => stub("Transcript download")}>Transcript</Button>
              <Button variant="outlined" onClick={() => stub("Enrollment Certificate download")}>Enrollment Certificate</Button>
            </Stack>
          </Paper>
          <Paper elevation={0} sx={{ p: 3, mb: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Document Requests</Typography>
            <Stack spacing={1}>
              <Button variant="outlined" onClick={() => stub("Bonafide Certificate request")}>Bonafide Certificate</Button>
              <Button variant="outlined" onClick={() => stub("Character Certificate request")}>Character Certificate</Button>
              <Button variant="outlined" onClick={() => stub("No-Dues Certificate request")}>No-Dues Certificate</Button>
            </Stack>
          </Paper>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Account Security</Typography>
            <Stack spacing={1}>
              <Button variant="outlined" onClick={() => stub("Change Password")}>Change Password</Button>
              <Button variant="outlined" onClick={() => stub("Update Security Questions")}>Update Security Questions</Button>
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
git add app/src/pages/student/Identity.tsx
git commit -m "Add Identity & Records page"
```

---

### Task 12: My Courses page

**Files:**
- Create: `app/src/pages/student/MyCourses.tsx`

**Interfaces:**
- Consumes: `getStudentCoursesBySemester()` (Task 3). Fixes the source's `changeSemester` bug — all 6 semesters show real data.

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Grid, MenuItem, Select, FormControl, InputLabel, Paper, Typography, Stack, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getStudentCoursesBySemester } from "@/api/studentCourses";
import type { StudentCourse } from "@/types";

export default function MyCourses() {
  const [semester, setSemester] = useState(6);
  const [courses, setCourses] = useState<StudentCourse[]>([]);

  useEffect(() => { getStudentCoursesBySemester(semester).then(setCourses); }, [semester]);

  const totalCredits = courses.reduce((s, c) => s + c.credits, 0);

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="My Courses"
        action={
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Semester</InputLabel>
            <Select label="Semester" value={semester} onChange={(e: SelectChangeEvent<number>) => setSemester(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((s) => <MenuItem key={s} value={s}>Semester {s}</MenuItem>)}
            </Select>
          </FormControl>
        }
      />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <DataTable<StudentCourse>
            columns={[
              { key: "code", label: "Code" },
              { key: "name", label: "Course" },
              { key: "instructor", label: "Instructor" },
              { key: "section", label: "Section" },
              { key: "credits", label: "Credits" },
              { key: "grade", label: "Grade" },
              { key: "attendancePct", label: "Attendance %", render: (row) => `${row.attendancePct}%` },
            ]}
            rows={courses}
            emptyTitle="No courses found for this semester"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Semester Summary</Typography>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Total Credits</Typography><Typography variant="body2" fontWeight={700}>{totalCredits}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Courses</Typography><Typography variant="body2" fontWeight={700}>{courses.length}</Typography></Stack>
            </Stack>
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
git add app/src/pages/student/MyCourses.tsx
git commit -m "Add My Courses page"
```

---

### Task 13: Registration page

**Files:**
- Create: `app/src/pages/student/Registration.tsx`

**Interfaces:**
- Consumes: `getRegistrationCatalog()`, `getRegisteredCourseCodes()`, `registerCourse()`, `dropCourse()` (Task 3). Fixes the source's non-functional `registerCourse`/`dropCourse` — both now really mutate the registered list.

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Grid, Paper, Stack, Tab, Tabs, TextField, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { getRegistrationCatalog, getRegisteredCourseCodes, registerCourse, dropCourse } from "@/api/studentCourses";
import type { CourseCategory, RegistrationCourse } from "@/types";

const tabs: { label: string; value: CourseCategory }[] = [
  { label: "Core", value: "core" },
  { label: "Electives", value: "elective" },
  { label: "Interdisciplinary", value: "interdisciplinary" },
  { label: "Minors", value: "minor" },
];

export default function Registration() {
  const [catalog, setCatalog] = useState<RegistrationCourse[]>([]);
  const [registered, setRegistered] = useState<string[]>([]);
  const [tab, setTab] = useState<CourseCategory>("core");
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => {
    getRegistrationCatalog().then(setCatalog);
    getRegisteredCourseCodes().then(setRegistered);
  };
  useEffect(() => { load(); }, []);

  const visible = useMemo(() => catalog.filter((c) => c.category === tab && (c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()))), [catalog, tab, search]);
  const registeredCourses = catalog.filter((c) => registered.includes(c.code));
  const totalCredits = registeredCourses.reduce((s, c) => s + c.credits, 0);

  const handleRegister = (code: string) => registerCourse(code).then(() => { load(); setSnackbar(`Registered for ${code}`); });
  const handleDrop = (code: string) => dropCourse(code).then(() => { load(); setSnackbar(`Dropped ${code}`); });

  return (
    <>
      <PageHeader eyebrow="Academics" title="Course Registration" />
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField fullWidth size="small" placeholder="Search courses by code or name" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 2 }} />
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            {tabs.map((t) => <Tab key={t.value} label={t.label} value={t.value} />)}
          </Tabs>
          <Grid container spacing={2}>
            {visible.map((c) => {
              const isRegistered = registered.includes(c.code);
              return (
                <Grid key={c.code} size={{ xs: 12, sm: 6 }}>
                  <Paper elevation={0} sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>{c.code} — {c.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.instructor} · {c.credits} credits · {c.seatsAvailable} seats</Typography>
                      </Box>
                      <Chip size="small" label={c.category} />
                    </Stack>
                    <Button
                      size="small"
                      sx={{ mt: 1.5 }}
                      variant={isRegistered ? "outlined" : "contained"}
                      color={isRegistered ? "error" : "primary"}
                      onClick={() => (isRegistered ? handleDrop(c.code) : handleRegister(c.code))}
                    >
                      {isRegistered ? "Drop" : "Register"}
                    </Button>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, mb: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Registration Summary</Typography>
            <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Registered Credits</Typography><Typography variant="body2" fontWeight={700}>{totalCredits}</Typography></Stack>
          </Paper>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Currently Registered</Typography>
            <Stack spacing={1.5}>
              {registeredCourses.length === 0 && <Typography variant="body2" color="text.secondary">No courses registered yet.</Typography>}
              {registeredCourses.map((c) => (
                <Stack key={c.code} direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">{c.code} — {c.name}</Typography>
                  <Button size="small" color="error" onClick={() => handleDrop(c.code)}>Drop</Button>
                </Stack>
              ))}
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
git add app/src/pages/student/Registration.tsx
git commit -m "Add Course Registration page with functional register/drop"
```

---

### Task 14: Attendance page

**Files:**
- Create: `app/src/pages/student/Attendance.tsx`

**Interfaces:**
- Consumes: `getAttendanceSubjects()`, `getMonthlyAttendanceTrend()` (Task 4).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventNoteIcon from "@mui/icons-material/EventNote";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle, getIconAccent } from "@/theme/chartPalette";
import { getAttendanceSubjects, getMonthlyAttendanceTrend } from "@/api/studentAttendance";
import type { AttendanceSubject } from "@/types";

export default function Attendance() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const [subjects, setSubjects] = useState<AttendanceSubject[]>([]);
  const [trend, setTrend] = useState<{ month: string; pct: number }[]>([]);

  useEffect(() => {
    getAttendanceSubjects().then(setSubjects);
    getMonthlyAttendanceTrend().then(setTrend);
  }, []);

  const totalAttended = subjects.reduce((s, a) => s + a.attended, 0);
  const totalClasses = subjects.reduce((s, a) => s + a.total, 0);
  const overallPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

  const chartData = subjects.map((s) => ({ name: s.code, pct: Math.round((s.attended / s.total) * 100) }));

  return (
    <>
      <PageHeader eyebrow="Academics" title="Attendance" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Overall Attendance" icon={<CheckCircleIcon />} color={getIconAccent(mode, "attendance")} value={`${overallPct}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Classes Attended" icon={<EventNoteIcon />} color={getIconAccent(mode, "attended")} numericValue={totalAttended} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Classes Missed" icon={<EventBusyIcon />} color={getIconAccent(mode, "missed")} numericValue={totalClasses - totalAttended} />
        </Grid>
      </Grid>
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Breakdown" title="Subject-wise Attendance">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="name" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} domain={[0, 100]} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="pct" fill={palette.categorical[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Trend" title="Monthly Attendance Trend">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="month" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} domain={[0, 100]} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Line type="monotone" dataKey="pct" stroke={palette.categorical[1]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>
      <DataTable<AttendanceSubject>
        title="Subject-wise Attendance"
        columns={[
          { key: "code", label: "Code" },
          { key: "name", label: "Subject" },
          { key: "attended", label: "Attended" },
          { key: "total", label: "Total" },
          { key: "pct", label: "Percentage", render: (row) => `${Math.round((row.attended / row.total) * 100)}%` },
        ]}
        rows={subjects}
        emptyTitle="No attendance data found"
      />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/student/Attendance.tsx
git commit -m "Add Attendance page with real recharts"
```

---

### Task 15: Internal Marks page

**Files:**
- Create: `app/src/pages/student/Marks.tsx`

**Interfaces:**
- Consumes: `getMarksForSemester()`, `getSemesterGpaHistory()` (Task 5). Fixes the source's undefined `changeMarksSemester` bug.

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Grid, MenuItem, Select, FormControl, InputLabel, type SelectChangeEvent } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import EmptyState from "@/components/EmptyState";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle } from "@/theme/chartPalette";
import { getMarksForSemester, getSemesterGpaHistory } from "@/api/studentMarks";
import type { MarksSubject } from "@/types";

export default function Marks() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const [semester, setSemester] = useState(6);
  const [subjects, setSubjects] = useState<MarksSubject[]>([]);
  const [gpaHistory, setGpaHistory] = useState<{ semester: number; gpa: number }[]>([]);

  useEffect(() => { getMarksForSemester(semester).then(setSubjects); }, [semester]);
  useEffect(() => { getSemesterGpaHistory().then(setGpaHistory); }, []);

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Internal Marks"
        action={
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Semester</InputLabel>
            <Select label="Semester" value={semester} onChange={(e: SelectChangeEvent<number>) => setSemester(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((s) => <MenuItem key={s} value={s}>Semester {s}</MenuItem>)}
            </Select>
          </FormControl>
        }
      />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={12}>
          <ChartCard eyebrow="Trend" title="Academic Progress (Semester GPA)">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gpaHistory}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="semester" stroke={palette.axis} fontSize={12} tickFormatter={(v) => `Sem ${v}`} />
                <YAxis stroke={palette.axis} fontSize={12} domain={[0, 10]} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Line type="monotone" dataKey="gpa" stroke={palette.categorical[0]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>
      {subjects.length === 0 ? (
        <EmptyState title="No marks recorded" description={`No internal marks have been recorded for Semester ${semester} yet.`} />
      ) : (
        <DataTable<MarksSubject>
          title="Subject-wise Performance"
          columns={[
            { key: "code", label: "Code" },
            { key: "name", label: "Subject" },
            { key: "test1", label: "Test 1" },
            { key: "test2", label: "Test 2" },
            { key: "assignment", label: "Assignment" },
            { key: "total", label: "Total", render: (row) => `${row.total}/${row.maxTotal}` },
          ]}
          rows={subjects}
          emptyTitle="No marks recorded"
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/student/Marks.tsx
git commit -m "Add Internal Marks page"
```

---

### Task 16: Exams & Results page

**Files:**
- Create: `app/src/pages/student/Exams.tsx`

**Interfaces:**
- Consumes: `getSemesterResults()` (Task 6).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Snackbar, Stack, Typography } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getSemesterResults } from "@/api/studentResults";
import type { SemesterResult } from "@/types";

const upcomingExams = [
  { subject: "Advanced Algorithms", date: "2026-11-20", time: "09:00 - 12:00", venue: "Exam Hall 1", status: "scheduled" },
  { subject: "Machine Learning", date: "2026-11-23", time: "09:00 - 12:00", venue: "Exam Hall 2", status: "scheduled" },
  { subject: "Distributed Systems", date: "2026-11-26", time: "14:00 - 17:00", venue: "Exam Hall 1", status: "scheduled" },
];

export default function Exams() {
  const [results, setResults] = useState<SemesterResult[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getSemesterResults().then(setResults); }, []);

  const stub = (label: string) => setSnackbar(`${label} is not available in this demo`);

  return (
    <>
      <PageHeader eyebrow="Academics" title="Exams & Results" />
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Upcoming Exams</Typography>
      <DataTable
        columns={[
          { key: "subject", label: "Subject" },
          { key: "date", label: "Date" },
          { key: "time", label: "Time" },
          { key: "venue", label: "Venue" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={upcomingExams}
        emptyTitle="No upcoming exams"
      />
      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>Previous Semester Results</Typography>
      <DataTable<SemesterResult>
        columns={[
          { key: "semester", label: "Semester", render: (row) => `Semester ${row.semester}` },
          { key: "year", label: "Year" },
          { key: "sgpa", label: "SGPA", render: (row) => (row.sgpa > 0 ? row.sgpa.toFixed(2) : "—") },
          { key: "credits", label: "Credits" },
          { key: "result", label: "Result", render: (row) => <StatusChip status={row.result} /> },
          { key: "actions", label: "Action", render: (row) => <Button size="small" onClick={() => stub(`Semester ${row.semester} results download`)}>Download</Button> },
        ]}
        rows={results}
        emptyTitle="No results found"
      />
      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={() => stub("Admit Card download")}>Download Admit Card</Button>
        <Button variant="contained" onClick={() => setSnackbar("Examination form submitted")}>Submit Exam Form</Button>
        <Button variant="outlined" onClick={() => stub("Complete Transcript download")}>Download Transcript</Button>
      </Stack>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/student/Exams.tsx
git commit -m "Add Exams & Results page"
```

---

### Task 17: Academic Requests page

**Files:**
- Create: `app/src/pages/student/AcademicRequests.tsx`

**Interfaces:**
- Consumes: `getAcademicRequests()`, `submitAcademicRequest()` (Task 7). Submitting any of the 5 request types now produces a real, visible pending record.

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Paper, Stack, TextField, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getAcademicRequests, submitAcademicRequest } from "@/api/studentRequests";
import type { AcademicRequestType, StudentAcademicRequest } from "@/types";

const requestTypes: { type: AcademicRequestType; label: string }[] = [
  { type: "course_drop", label: "Course Drop" },
  { type: "section_change", label: "Section Change" },
  { type: "re_evaluation", label: "Re-evaluation" },
  { type: "grade_improvement", label: "Grade Improvement" },
  { type: "leave_application", label: "Leave Application" },
];

export default function AcademicRequests() {
  const [rows, setRows] = useState<StudentAcademicRequest[]>([]);
  const [open, setOpen] = useState<AcademicRequestType | null>(null);
  const [details, setDetails] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getAcademicRequests().then(setRows);
  useEffect(() => { load(); }, []);

  const handleSubmit = () => {
    if (!open || !details) { setSnackbar("Please describe your request"); return; }
    submitAcademicRequest(open, details).then(() => { load(); setOpen(null); setDetails(""); setSnackbar("Request submitted"); });
  };

  return (
    <>
      <PageHeader eyebrow="Academics" title="Academic Requests" />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>New Request</Typography>
        <Grid container spacing={1.5}>
          {requestTypes.map((r) => (
            <Grid key={r.type} size={{ xs: 12, sm: 6, md: "auto" }}>
              <Button variant="outlined" fullWidth onClick={() => setOpen(r.type)}>{r.label}</Button>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Request Status</Typography>
      <DataTable<StudentAcademicRequest>
        pagination
        columns={[
          { key: "type", label: "Type", render: (row) => requestTypes.find((r) => r.type === row.type)?.label ?? row.type },
          { key: "details", label: "Details" },
          { key: "submittedOn", label: "Submitted On" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={rows}
        emptyTitle="No requests submitted yet"
      />

      <Dialog open={!!open} onClose={() => setOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{requestTypes.find((r) => r.type === open)?.label}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Details" fullWidth multiline minRows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(null)}>Cancel</Button>
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
git add app/src/pages/student/AcademicRequests.tsx
git commit -m "Add Academic Requests page with functional submission"
```

---

### Task 18: Fee Summary page

**Files:**
- Create: `app/src/pages/student/FeeSummary.tsx`

**Interfaces:**
- Consumes: `getFeeSummary()` (Task 8).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Snackbar, Stack, TextField } from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getFeeSummary } from "@/api/studentFees";
import type { FeeSemesterRow } from "@/types";

export default function FeeSummary() {
  const { mode } = useColorMode();
  const navigate = useNavigate();
  const [rows, setRows] = useState<FeeSemesterRow[]>([]);
  const [clearanceOpen, setClearanceOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getFeeSummary().then(setRows); }, []);

  const totalPaid = rows.reduce((s, r) => s + r.paid, 0);
  const pending = rows.reduce((s, r) => s + (r.totalFee - r.paid), 0);
  const current = rows[rows.length - 1];

  const handleClearanceSubmit = () => {
    setClearanceOpen(false);
    setReason("");
    setSnackbar("Fee Clearance Certificate request submitted");
  };

  return (
    <>
      <PageHeader eyebrow="Finance" title="Fee Summary" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Current Semester" icon={<PaymentIcon />} color={getIconAccent(mode, "current-fee")} value={current ? (current.status === "paid" ? "PAID" : "PENDING") : "-"} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Paid" icon={<AccountBalanceWalletIcon />} color={getIconAccent(mode, "total-paid")} formatValue={(n) => `₹${n.toLocaleString("en-IN")}`} numericValue={totalPaid} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Pending Dues" icon={<ReceiptIcon />} color={getIconAccent(mode, "pending-dues")} formatValue={(n) => `₹${n.toLocaleString("en-IN")}`} numericValue={pending} />
        </Grid>
      </Grid>
      <DataTable<FeeSemesterRow>
        columns={[
          { key: "semester", label: "Semester", render: (row) => `Semester ${row.semester}` },
          { key: "year", label: "Year" },
          { key: "totalFee", label: "Total Fee", render: (row) => `₹${row.totalFee.toLocaleString("en-IN")}` },
          { key: "paid", label: "Paid", render: (row) => `₹${row.paid.toLocaleString("en-IN")}` },
          { key: "dueDate", label: "Due Date" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "actions", label: "Action", render: () => <Button size="small" onClick={() => setSnackbar("Receipt download is not available in this demo")}>Receipt</Button> },
        ]}
        rows={rows}
        emptyTitle="No fee records found"
      />
      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
        <Button variant="contained" onClick={() => navigate("/student/fees/payments")}>Make a Payment</Button>
        <Button variant="outlined" onClick={() => setSnackbar("Statement download is not available in this demo")}>Download Statement</Button>
        <Button variant="outlined" onClick={() => setClearanceOpen(true)}>Request Fee Clearance Certificate</Button>
      </Stack>

      <Dialog open={clearanceOpen} onClose={() => setClearanceOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Fee Clearance Certificate</DialogTitle>
        <DialogContent>
          <TextField label="Purpose" fullWidth multiline minRows={2} sx={{ mt: 1 }} value={reason} onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearanceOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleClearanceSubmit}>Submit</Button>
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
git add app/src/pages/student/FeeSummary.tsx
git commit -m "Add Fee Summary page"
```

---

### Task 19: Payments page

**Files:**
- Create: `app/src/pages/student/Payments.tsx`

**Interfaces:**
- Consumes: `getFeeSummary()`, `getPaymentTransactions()`, `makePayment()` (Task 8). Fixes the source's `processPayment()` no-op — paying now reduces the pending balance and appends a real transaction.

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Grid, Paper, Stack, Typography, Snackbar } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getFeeSummary, getPaymentTransactions, makePayment } from "@/api/studentFees";
import type { FeeSemesterRow, PaymentTransaction } from "@/types";

export default function Payments() {
  const { mode } = useColorMode();
  const [fees, setFees] = useState<FeeSemesterRow[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => {
    getFeeSummary().then(setFees);
    getPaymentTransactions().then(setTransactions);
  };
  useEffect(() => { load(); }, []);

  const upcoming = fees.filter((f) => f.status !== "paid");
  const totalPaid = transactions.reduce((s, t) => s + t.amount, 0);
  const pending = fees.reduce((s, f) => s + (f.totalFee - f.paid), 0);

  const handlePay = (row: FeeSemesterRow) => {
    const amount = row.totalFee - row.paid;
    makePayment(row.semester, amount, `Semester ${row.semester} Fee`).then(() => { load(); setSnackbar(`Payment of ₹${amount.toLocaleString("en-IN")} successful`); });
  };

  return (
    <>
      <PageHeader eyebrow="Finance" title="Payments" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Paid" icon={<AccountBalanceWalletIcon />} color={getIconAccent(mode, "total-paid")} formatValue={(n) => `₹${n.toLocaleString("en-IN")}`} numericValue={totalPaid} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Pending Dues" icon={<ReceiptIcon />} color={getIconAccent(mode, "pending-dues")} formatValue={(n) => `₹${n.toLocaleString("en-IN")}`} numericValue={pending} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Transactions" icon={<ReceiptLongIcon />} color={getIconAccent(mode, "transactions")} numericValue={transactions.length} />
        </Grid>
      </Grid>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Payment History</Typography>
          <DataTable<PaymentTransaction>
            pagination
            columns={[
              { key: "description", label: "Description" },
              { key: "id", label: "Transaction ID" },
              { key: "amount", label: "Amount", render: (row) => `₹${row.amount.toLocaleString("en-IN")}` },
              { key: "date", label: "Date" },
              { key: "mode", label: "Mode" },
              { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
            ]}
            rows={transactions}
            emptyTitle="No transactions yet"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Upcoming Payments</Typography>
          <Stack spacing={2}>
            {upcoming.length === 0 && <Typography variant="body2" color="text.secondary">No pending payments.</Typography>}
            {upcoming.map((row) => (
              <Paper key={row.semester} elevation={0} sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600}>Semester {row.semester} Fee</Typography>
                <Typography variant="body2" color="text.secondary">Due {row.dueDate}</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>₹{(row.totalFee - row.paid).toLocaleString("en-IN")}</Typography>
                <Button variant="contained" sx={{ mt: 1.5 }} onClick={() => handlePay(row)}>Pay Now</Button>
              </Paper>
            ))}
          </Stack>
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
git add app/src/pages/student/Payments.tsx
git commit -m "Add Payments page with functional makePayment"
```

---

### Task 20: Fee Ledger page

**Files:**
- Create: `app/src/pages/student/FeeLedger.tsx`

**Interfaces:**
- Consumes: `getFeeLedger()` (Task 8), `getStudentProfile()` (Task 2).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Button, Paper, Stack, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getFeeLedger } from "@/api/studentFees";
import { getStudentProfile } from "@/api/studentProfile";
import type { FeeLedgerEntry, StudentProfile } from "@/types";

export default function FeeLedger() {
  const [entries, setEntries] = useState<FeeLedgerEntry[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    getFeeLedger().then(setEntries);
    getStudentProfile().then(setProfile);
  }, []);

  return (
    <>
      <PageHeader eyebrow="Finance" title="Fee Ledger" />
      {profile && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 2.5 }}>
          <Stack direction="row" spacing={4}>
            <Typography variant="body2"><strong>{profile.name}</strong> · {profile.rollNo}</Typography>
            <Typography variant="body2" color="text.secondary">{profile.program} · {profile.batch}</Typography>
          </Stack>
        </Paper>
      )}
      <DataTable<FeeLedgerEntry>
        columns={[
          { key: "date", label: "Date" },
          { key: "particulars", label: "Particulars" },
          { key: "debit", label: "Debit", render: (row) => (row.debit > 0 ? `₹${row.debit.toLocaleString("en-IN")}` : "—") },
          { key: "credit", label: "Credit", render: (row) => (row.credit > 0 ? `₹${row.credit.toLocaleString("en-IN")}` : "—") },
          { key: "balance", label: "Balance", render: (row) => `₹${row.balance.toLocaleString("en-IN")}` },
        ]}
        rows={entries}
        emptyTitle="No ledger entries found"
      />
      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={() => setSnackbar("Ledger download is not available in this demo")}>Download Ledger</Button>
        <Button variant="outlined" onClick={() => setSnackbar("Fee Clearance Certificate request submitted")}>Request Fee Clearance Certificate</Button>
      </Stack>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify build** — `npm run build`, expect success.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/student/FeeLedger.tsx
git commit -m "Add Fee Ledger page"
```

---

### Task 21: My Profile page

**Files:**
- Create: `app/src/pages/student/Profile.tsx`

**Interfaces:**
- Consumes: `getStudentProfile()`, `updateStudentProfile()` (Task 2).

- [ ] **Step 1: Create the page**

```tsx
import { useEffect, useState } from "react";
import { Avatar, Button, Grid, Paper, Stack, TextField, Typography, Snackbar } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ClassIcon from "@mui/icons-material/Class";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getStudentProfile, updateStudentProfile } from "@/api/studentProfile";
import type { StudentProfile } from "@/types";

export default function Profile() {
  const { mode } = useColorMode();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [form, setForm] = useState({ mobile: "", personalEmail: "", address: "" });
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    getStudentProfile().then((p) => { setProfile(p); setForm({ mobile: p.mobile, personalEmail: p.personalEmail, address: p.address }); });
  }, []);

  const handleSave = () => {
    updateStudentProfile(form).then((p) => { setProfile(p); setSnackbar("Profile updated successfully"); });
  };

  if (!profile) return null;

  return (
    <>
      <PageHeader eyebrow="My Profile" title={profile.name} />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="CGPA" icon={<TrendingUpIcon />} color={getIconAccent(mode, "cgpa")} value={profile.cgpa.toFixed(2)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Current Semester" icon={<EventNoteIcon />} color={getIconAccent(mode, "semester")} numericValue={profile.currentSemester} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Credits Earned" icon={<ClassIcon />} color={getIconAccent(mode, "credits")} numericValue={profile.creditsEarned} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Status" icon={<CheckCircleIcon />} color={getIconAccent(mode, "status")} value={profile.status === "active" ? "Active" : "Inactive"} />
        </Grid>
      </Grid>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
            <Avatar sx={{ width: 72, height: 72, mx: "auto", mb: 2, fontSize: 28, fontWeight: 700 }}>{profile.name.charAt(0)}</Avatar>
            <Typography variant="subtitle1" fontWeight={600}>{profile.name}</Typography>
            <Typography variant="body2" color="text.secondary">{profile.rollNo}</Typography>
            <Button size="small" sx={{ mt: 1.5 }} onClick={() => setSnackbar("Profile PDF download is not available in this demo")}>Download Profile</Button>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Personal Information</Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="College Email" fullWidth value={profile.collegeEmail} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Date of Birth" fullWidth value={profile.dob} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Personal Email" fullWidth value={form.personalEmail} onChange={(e) => setForm({ ...form, personalEmail: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Mobile" fullWidth value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Grid>
              <Grid size={12}><TextField label="Address" fullWidth multiline minRows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Grid>
            </Grid>

            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, mt: 3 }}>Academic Information</Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Program" fullWidth value={profile.program} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Branch" fullWidth value={profile.branch} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Batch" fullWidth value={profile.batch} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Admission Date" fullWidth value={profile.admissionDate} disabled /></Grid>
            </Grid>

            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
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
git add app/src/pages/student/Profile.tsx
git commit -m "Add My Profile page"
```

---

### Task 22: Navigation + router wiring

**Files:**
- Modify: `app/src/components/navigation.tsx`
- Modify: `app/src/router.tsx`

**Interfaces:**
- Produces: the full `"student"` case of `getNavItems`; 11 new routes under `/student/*`.

- [ ] **Step 1: Add new icon imports**

In `app/src/components/navigation.tsx`, add (all others used below are already imported elsewhere in this file):

```ts
import BadgeIcon from "@mui/icons-material/Badge";
import HowToRegIcon from "@mui/icons-material/HowToReg";
```

- [ ] **Step 2: Replace the `"student"` case**

Replace:

```ts
    case "student":
      return [{ label: "Dashboard", path: "/student", icon: <DashboardIcon /> }];
```

with:

```ts
    case "student":
      return [
        { label: "Dashboard", path: "/student", icon: <DashboardIcon /> },
        { label: "Identity & Records", path: "/student/identity", icon: <BadgeIcon /> },
        { label: "My Courses", path: "/student/courses", icon: <MenuBookIcon />, group: "Academics" },
        { label: "Registration", path: "/student/registration", icon: <HowToRegIcon />, group: "Academics" },
        { label: "Attendance", path: "/student/attendance", icon: <EventNoteIcon />, group: "Academics" },
        { label: "Internal Marks", path: "/student/marks", icon: <GradingIcon />, group: "Academics" },
        { label: "Exams & Results", path: "/student/exams", icon: <AssessmentIcon />, group: "Academics" },
        { label: "Academic Requests", path: "/student/requests", icon: <AssignmentIcon />, group: "Academics" },
        { label: "Fee Summary", path: "/student/fees/summary", icon: <PaymentIcon />, group: "Finance" },
        { label: "Payments", path: "/student/fees/payments", icon: <ReceiptIcon />, group: "Finance" },
        { label: "Fee Ledger", path: "/student/fees/ledger", icon: <AccountBalanceWalletIcon />, group: "Finance" },
        { label: "My Profile", path: "/student/profile", icon: <AccountCircleIcon />, group: "_bottom" },
      ];
```

- [ ] **Step 3: Add lazy imports and routes to `router.tsx`**

Replace:

```ts
const StudentDashboard = lazy(() => import("@/pages/student/Dashboard"));
```

with:

```ts
const StudentDashboard = lazy(() => import("@/pages/student/Dashboard"));
const StudentIdentity = lazy(() => import("@/pages/student/Identity"));
const StudentMyCourses = lazy(() => import("@/pages/student/MyCourses"));
const StudentRegistration = lazy(() => import("@/pages/student/Registration"));
const StudentAttendance = lazy(() => import("@/pages/student/Attendance"));
const StudentMarks = lazy(() => import("@/pages/student/Marks"));
const StudentExams = lazy(() => import("@/pages/student/Exams"));
const StudentAcademicRequests = lazy(() => import("@/pages/student/AcademicRequests"));
const StudentFeeSummary = lazy(() => import("@/pages/student/FeeSummary"));
const StudentPayments = lazy(() => import("@/pages/student/Payments"));
const StudentFeeLedger = lazy(() => import("@/pages/student/FeeLedger"));
const StudentProfilePage = lazy(() => import("@/pages/student/Profile"));
```

Replace:

```ts
      { path: "student", element: <StudentDashboard /> },
```

with:

```ts
      { path: "student", element: <StudentDashboard /> },
      { path: "student/identity", element: <StudentIdentity /> },
      { path: "student/courses", element: <StudentMyCourses /> },
      { path: "student/registration", element: <StudentRegistration /> },
      { path: "student/attendance", element: <StudentAttendance /> },
      { path: "student/marks", element: <StudentMarks /> },
      { path: "student/exams", element: <StudentExams /> },
      { path: "student/requests", element: <StudentAcademicRequests /> },
      { path: "student/fees/summary", element: <StudentFeeSummary /> },
      { path: "student/fees/payments", element: <StudentPayments /> },
      { path: "student/fees/ledger", element: <StudentFeeLedger /> },
      { path: "student/profile", element: <StudentProfilePage /> },
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/navigation.tsx app/src/router.tsx
git commit -m "Wire Student Core/Academics/Finance navigation and routes"
```

---

### Task 23: End-to-end manual verification and lint

**Files:**
- None created — verification only. `student.html` is **not** deleted (Phase 4b still pending).

- [ ] **Step 1: Lint check**

Run (from `app/`): `npm run lint`
Expected: 0 errors (pre-existing advisory warnings acceptable, matching every prior phase's bar).

- [ ] **Step 2: Start dev server and verify via browser-driver**

Use the `browser-driver` skill. In a single script invocation (fresh browser, full flow each time):
1. Navigate to `/login`, select the Student role, sign in.
2. On the Dashboard, confirm KPIs render (Total Credits, Avg Attendance, Current CGPA, Pending Dues) and clicking "Pending Dues" navigates to Fee Summary (not a blank page — the source's broken `fees` link bug fix). Toggle a Pending Task checkbox and confirm it visually strikes through.
3. Visit My Courses, switch the semester dropdown through several values 1-6 — confirm each shows real courses, not an empty grid.
4. Visit Registration, register an unregistered course from a non-Core tab — confirm it appears in "Currently Registered" with credits updated; drop it — confirm it's removed.
5. Visit Attendance — confirm the subject-wise bar chart and monthly trend line chart both render as real `recharts`.
6. Visit Internal Marks, switch semesters — confirm real data for semesters with marks and a real `EmptyState` (not a crash) for one without.
7. Visit Academic Requests, submit one of the 5 request types with real details — confirm it appears in Request Status with "Pending" status.
8. Visit Payments, pay an upcoming due — confirm the transaction appears in Payment History, then visit Fee Summary and Fee Ledger and confirm the balance/ledger reflect the same payment.
9. Visit My Profile, edit the mobile number, save, soft-navigate away and back — confirm it persisted.
10. Toggle dark mode — confirm all new pages render correctly in both themes.

If any step fails, stop and fix before proceeding.

- [ ] **Step 3: Update local todo tracking**

Mark Phase 4a complete; Phase 4b (Convocation, Fellowship, Placements, Hostel & Mess, Facility Booking, Reports, Notices, Messages) is next, followed by deleting `student.html` once 4b ships.
