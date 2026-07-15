# Teacher Core/Academics/Students/Requests/Communication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 2a of the Teacher portal — 16 of `faculty.html`'s 21 sections (everything except HOD/Dean-gated screens, Profile, and the role-switcher UI, which ship in Phase 2b).

**Architecture:** Same as every Admin phase: demo-data generator modules → thin `api/*.ts` Promise wrappers → page components. `TeacherRoleContext` is built as infrastructure (default `"professor"`) but has no switcher UI yet.

**Tech Stack:** Same as prior phases — no new dependencies.

## Global Constraints

- New pages under `app/src/pages/teacher/`; demo-data under `app/src/demo-data/teacher/`; API modules under `app/src/api/`. (Paths below relative to `app/`.)
- `showNotification(...)` calls in the source are undefined and crash — every such action becomes a real `Snackbar` in the rewrite.
- Buttons with no `onclick` at all in the source get either real functionality (where a form/data exists) or a stub `Snackbar` — never left inert.
- Filters must actually filter. ID-ignoring "view" bugs (Document Signatures, Attendance/Marks history "View", Academic Cohort drill-down) show the real clicked record's own data.
- Demo scale: 4 teacher courses (Data Structures/DBMS/OS/Networks) drawing real students from Phase 1a's `students` pool; ~10 attendance submissions; ~8 marks submissions; ~6 leave/grade-change/resource requests each; 8 notices; 3 message contacts with their own threads; 12 documents; 4 departments for Academic Cohort.
- Currency: only Resource Requests' `estimatedCost` (₹) — reuse the standard `formatINR` local-helper convention.

---

### Task 1: Type definitions

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Append the Teacher types**

```ts

// --- Teacher / Core, Academics, Students, Requests, Communication (Phase 2a) ---

export type TeacherRole = "professor" | "hod" | "dean";

export interface TeacherCourse {
  id: string;
  name: string;
  section: string;
  studentIds: string[];
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
  assessment: string;
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
  role: string;
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
  progressPct?: number;
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

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "Add Teacher Core/Academics/Students/Requests/Communication type definitions"
```

---

### Task 2: TeacherRoleContext

**Files:**
- Create: `src/context/TeacherRoleContext.ts`

**Interfaces:**
- Produces: `useTeacherRole()` returning `{ role: TeacherRole, setRole: (r: TeacherRole) => void }` — consumed by Task 18 (Department Students) and Task 19 (Academic Cohort) for access gating; consumed by Phase 2b for the switcher UI.

- [ ] **Step 1: Create `src/context/TeacherRoleContext.ts`**

```ts
import { createContext, useContext, useState } from "react";
import type { TeacherRole } from "@/types";

const STORAGE_KEY = "college_erp_teacher_role";

interface TeacherRoleContextType {
  role: TeacherRole;
  setRole: (role: TeacherRole) => void;
}

export const TeacherRoleContext = createContext<TeacherRoleContextType>({
  role: "professor",
  setRole: () => {},
});

export function useTeacherRoleState() {
  const [role, setRoleState] = useState<TeacherRole>(() => (localStorage.getItem(STORAGE_KEY) as TeacherRole) || "professor");
  const setRole = (r: TeacherRole) => {
    localStorage.setItem(STORAGE_KEY, r);
    setRoleState(r);
  };
  return { role, setRole };
}

export const useTeacherRole = () => useContext(TeacherRoleContext);
```

Note: `useTeacherRoleState` (the hook that owns the actual `useState`) is used by a `<TeacherRoleContext.Provider>` — that Provider is added to `Layout.tsx` in Phase 2b alongside the switcher UI. Until then, `useTeacherRole()` resolves to the context's default value (`role: "professor"`, no-op `setRole`), which is exactly the behavior this phase needs (always `"professor"`, no way to change it yet).

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/context/TeacherRoleContext.ts
git commit -m "Add TeacherRoleContext"
```

---

### Task 3: Courses demo data + API

**Files:**
- Create: `src/demo-data/teacher/courses.ts`
- Create: `src/api/teacherCourses.ts`

- [ ] **Step 1: Create `src/demo-data/teacher/courses.ts`**

```ts
import type { TeacherCourse } from "@/types";
import { students } from "@/demo-data/people/students";
import { createRng } from "@/demo-data/generators/random";

const { randomInt } = createRng(20260715);

const courseSeeds = [
  { id: "CS201", name: "Data Structures", section: "A" },
  { id: "CS202", name: "Database Management Systems", section: "B" },
  { id: "CS203", name: "Operating Systems", section: "A" },
  { id: "CS204", name: "Computer Networks", section: "B" },
];

const csStudents = students.filter((s) => s.departmentId === "CSE");

function generateCourses(): TeacherCourse[] {
  return courseSeeds.map((c, i) => {
    const slice = csStudents.slice(i * 45, i * 45 + 45);
    const roster = slice.length > 0 ? slice : csStudents.slice(0, 45);
    return {
      id: c.id,
      name: c.name,
      section: c.section,
      studentIds: roster.map((s) => s.id),
      avgAttendancePct: 78 + randomInt(0, 10),
      avgMarksPct: 70 + randomInt(0, 12),
    };
  });
}

export const teacherCourses: TeacherCourse[] = generateCourses();

export function getTeacherCourseById(id: string): TeacherCourse | undefined {
  return teacherCourses.find((c) => c.id === id);
}
```

- [ ] **Step 2: Create `src/api/teacherCourses.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { teacherCourses, getTeacherCourseById } from "@/demo-data/teacher/courses";
import type { TeacherCourse } from "@/types";

export function getTeacherCourses(): Promise<TeacherCourse[]> {
  return simulateRequest(teacherCourses);
}

export function getTeacherCourseByIdAsync(id: string): Promise<TeacherCourse | undefined> {
  return simulateRequest(getTeacherCourseById(id));
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/teacher/courses.ts src/api/teacherCourses.ts
git commit -m "Add teacher courses demo data and API"
```

---

### Task 4: Attendance demo data + API

**Files:**
- Create: `src/demo-data/teacher/attendance.ts`
- Create: `src/api/teacherAttendance.ts`

**Interfaces:**
- Consumes: `teacherCourses` from Task 3.
- Produces: `attendanceSubmissions: AttendanceSubmission[]`, `getSubmissionById(id)` from demo-data; `getAttendanceSubmissions()`, `submitAttendance(entry)` from API — used by Task 14 (Attendance page).

- [ ] **Step 1: Create `src/demo-data/teacher/attendance.ts`**

```ts
import type { AttendanceSubmission, AttendanceMarkStatus } from "@/types";
import { teacherCourses } from "@/demo-data/teacher/courses";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick, randomInt } = createRng(20260716);

const statuses: [AttendanceMarkStatus, number][] = [["present", 82], ["absent", 12], ["medical", 4], ["other", 2]];

function dateStr(month: number, day: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const SUBMISSION_COUNT = 10;

function generateSubmissions(): AttendanceSubmission[] {
  const list: AttendanceSubmission[] = [];
  for (let i = 0; i < SUBMISSION_COUNT; i++) {
    const course = pick(teacherCourses);
    list.push({
      id: `ATT-${1000 + i}`,
      courseId: course.id,
      section: course.section,
      session: i % 2 === 0 ? "forenoon" : "afternoon",
      date: dateStr(randomInt(1, 7), randomInt(1, 28)),
      records: course.studentIds.map((studentId) => ({
        studentId,
        status: weightedPick(statuses),
        remarks: "",
      })),
    });
  }
  return list;
}

export const attendanceSubmissions: AttendanceSubmission[] = generateSubmissions();

export function getSubmissionById(id: string): AttendanceSubmission | undefined {
  return attendanceSubmissions.find((s) => s.id === id);
}
```

- [ ] **Step 2: Create `src/api/teacherAttendance.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { attendanceSubmissions, getSubmissionById } from "@/demo-data/teacher/attendance";
import type { AttendanceSubmission } from "@/types";

export function getAttendanceSubmissions(): Promise<AttendanceSubmission[]> {
  return simulateRequest(attendanceSubmissions);
}

export function getAttendanceSubmissionByIdAsync(id: string): Promise<AttendanceSubmission | undefined> {
  return simulateRequest(getSubmissionById(id));
}

export function submitAttendance(entry: AttendanceSubmission): Promise<AttendanceSubmission> {
  attendanceSubmissions.unshift(entry);
  return simulateRequest(entry);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/teacher/attendance.ts src/api/teacherAttendance.ts
git commit -m "Add teacher attendance demo data and API"
```

---

### Task 5: Marks demo data + API

**Files:**
- Create: `src/demo-data/teacher/marks.ts`
- Create: `src/api/teacherMarks.ts`

**Interfaces:**
- Consumes: `teacherCourses` from Task 3.
- Produces: `marksSubmissions: MarksSubmission[]`, `getMarksSubmissionById(id)`; `getMarksSubmissions()`, `submitMarks(entry)` — used by Task 15.

- [ ] **Step 1: Create `src/demo-data/teacher/marks.ts`**

```ts
import type { MarksSubmission } from "@/types";
import { teacherCourses } from "@/demo-data/teacher/courses";
import { createRng } from "@/demo-data/generators/random";

const { pick, randomInt } = createRng(20260717);

const assessments = ["Quiz1", "Quiz2", "Assignment1", "MidExam"];
const statuses: MarksSubmission["status"][] = ["approved", "submitted", "pending_hod_review"];

function dateStr(month: number, day: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const SUBMISSION_COUNT = 8;

function generateSubmissions(): MarksSubmission[] {
  const list: MarksSubmission[] = [];
  for (let i = 0; i < SUBMISSION_COUNT; i++) {
    const course = pick(teacherCourses);
    const maxMarks = 20;
    list.push({
      id: `MRK-${2000 + i}`,
      courseId: course.id,
      assessment: pick(assessments),
      maxMarks,
      date: dateStr(randomInt(1, 7), randomInt(1, 28)),
      status: statuses[i % statuses.length],
      records: course.studentIds.map((studentId) => ({ studentId, marks: randomInt(8, maxMarks) })),
    });
  }
  return list;
}

export const marksSubmissions: MarksSubmission[] = generateSubmissions();

export function getMarksSubmissionById(id: string): MarksSubmission | undefined {
  return marksSubmissions.find((s) => s.id === id);
}
```

- [ ] **Step 2: Create `src/api/teacherMarks.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { marksSubmissions, getMarksSubmissionById } from "@/demo-data/teacher/marks";
import type { MarksSubmission } from "@/types";

export function getMarksSubmissions(): Promise<MarksSubmission[]> {
  return simulateRequest(marksSubmissions);
}

export function getMarksSubmissionByIdAsync(id: string): Promise<MarksSubmission | undefined> {
  return simulateRequest(getMarksSubmissionById(id));
}

export function submitMarks(entry: MarksSubmission): Promise<MarksSubmission> {
  marksSubmissions.unshift(entry);
  return simulateRequest(entry);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/teacher/marks.ts src/api/teacherMarks.ts
git commit -m "Add teacher marks demo data and API"
```

---

### Task 6: Requests (leave/grade-change/resource) demo data + API

**Files:**
- Create: `src/demo-data/teacher/requests.ts`
- Create: `src/api/teacherRequests.ts`

**Interfaces:**
- Consumes: `teacherCourses`, `students` (Phase 1a).
- Produces: `leaveRequests`, `gradeChangeRequests`, `resourceRequests` arrays; `getLeaveRequests/addLeaveRequest`, `getGradeChangeRequests/addGradeChangeRequest`, `getResourceRequests/addResourceRequest` — used by Tasks 20-22.

- [ ] **Step 1: Create `src/demo-data/teacher/requests.ts`**

```ts
import type { LeaveRequest, GradeChangeRequest, ResourceRequest } from "@/types";
import { students } from "@/demo-data/people/students";

function dateStr(month: number, day: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export const leaveRequests: LeaveRequest[] = [
  { id: "LV-001", leaveType: "Casual", fromDate: dateStr(3, 10), toDate: dateStr(3, 12), reason: "Family function", coverageArrangements: "Dr. Nair to cover CS201", hodStatus: "approved", deanStatus: "approved", raisedOn: dateStr(3, 5) },
  { id: "LV-002", leaveType: "Medical", fromDate: dateStr(4, 2), toDate: dateStr(4, 6), reason: "Medical procedure", coverageArrangements: "Dept to reassign labs", hodStatus: "approved", deanStatus: null, raisedOn: dateStr(3, 28) },
  { id: "LV-003", leaveType: "Academic", fromDate: dateStr(5, 15), toDate: dateStr(5, 17), reason: "Conference attendance", coverageArrangements: "Self-study assigned", hodStatus: "escalated", deanStatus: "pending_approval", raisedOn: dateStr(5, 1) },
];

export const gradeChangeRequests: GradeChangeRequest[] = [
  { id: "GC-001", courseId: "CS201", studentRollNo: students[0]?.rollNo ?? "CSE-001", assessment: "MidExam", originalMark: 16, proposedMark: 18, reason: "Re-evaluation revealed marking error", hodStatus: "approved", deanStatus: "approved", raisedOn: dateStr(3, 20) },
  { id: "GC-002", courseId: "CS202", studentRollNo: students[1]?.rollNo ?? "CSE-002", assessment: "Quiz2", originalMark: 14, proposedMark: 16, reason: "Partial credit for method shown", hodStatus: "pending_approval", deanStatus: null, raisedOn: dateStr(4, 10) },
  { id: "GC-003", courseId: "CS203", studentRollNo: students[2]?.rollNo ?? "CSE-003", assessment: "Assignment1", originalMark: 14, proposedMark: 16, reason: "Late submission excused", hodStatus: "rejected", deanStatus: null, raisedOn: dateStr(3, 15) },
];

export const resourceRequests: ResourceRequest[] = [
  { id: "RS-001", resourceType: "Lab Equipment", description: "6 additional laptops for CS201 lab", justification: "Current lab has 4 fewer laptops than students", estimatedCost: 240000, requiredBy: dateStr(5, 1), hodStatus: "approved", deanStatus: "approved" },
  { id: "RS-002", resourceType: "Software License", description: "MATLAB site license renewal", justification: "Existing license expires next month", estimatedCost: 85000, requiredBy: dateStr(4, 20), hodStatus: "pending_approval", deanStatus: null },
];

export function nextRequestId(prefix: string, list: { id: string }[]): string {
  return `${prefix}-${String(list.length + 1).padStart(3, "0")}`;
}
```

- [ ] **Step 2: Create `src/api/teacherRequests.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { leaveRequests, gradeChangeRequests, resourceRequests, nextRequestId } from "@/demo-data/teacher/requests";
import type { LeaveRequest, GradeChangeRequest, ResourceRequest } from "@/types";

export function getLeaveRequests(): Promise<LeaveRequest[]> {
  return simulateRequest(leaveRequests);
}
export function addLeaveRequest(entry: Omit<LeaveRequest, "id" | "hodStatus" | "deanStatus" | "raisedOn">): Promise<LeaveRequest> {
  const full: LeaveRequest = { ...entry, id: nextRequestId("LV", leaveRequests), hodStatus: "pending_approval", deanStatus: null, raisedOn: new Date().toISOString().slice(0, 10) };
  leaveRequests.unshift(full);
  return simulateRequest(full);
}

export function getGradeChangeRequests(): Promise<GradeChangeRequest[]> {
  return simulateRequest(gradeChangeRequests);
}
export function addGradeChangeRequest(entry: Omit<GradeChangeRequest, "id" | "hodStatus" | "deanStatus" | "raisedOn">): Promise<GradeChangeRequest> {
  const full: GradeChangeRequest = { ...entry, id: nextRequestId("GC", gradeChangeRequests), hodStatus: "pending_approval", deanStatus: null, raisedOn: new Date().toISOString().slice(0, 10) };
  gradeChangeRequests.unshift(full);
  return simulateRequest(full);
}

export function getResourceRequests(): Promise<ResourceRequest[]> {
  return simulateRequest(resourceRequests);
}
export function addResourceRequest(entry: Omit<ResourceRequest, "id" | "hodStatus" | "deanStatus">): Promise<ResourceRequest> {
  const full: ResourceRequest = { ...entry, id: nextRequestId("RS", resourceRequests), hodStatus: "pending_approval", deanStatus: null };
  resourceRequests.unshift(full);
  return simulateRequest(full);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/teacher/requests.ts src/api/teacherRequests.ts
git commit -m "Add teacher requests (leave/grade-change/resource) demo data and API"
```

---

### Task 7: Notices demo data + API

**Files:**
- Create: `src/demo-data/teacher/notices.ts`
- Create: `src/api/teacherNotices.ts`

- [ ] **Step 1: Create `src/demo-data/teacher/notices.ts`**

```ts
import type { TeacherNotice, TeacherNoticeAudience } from "@/types";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick, randomInt } = createRng(20260719);

const titles = [
  "CS201 Lab Rescheduled", "Project Deadline Extended", "Guest Lecture on AI Ethics",
  "Mid-Sem Doubt Clearing Session", "Lab Manual Updated", "Assignment Submission Portal Live",
  "Extra Class This Saturday", "Semester Project Groups Finalized",
];
const audiences: [TeacherNoticeAudience, number][] = [["my_courses", 60], ["department", 25], ["institute", 15]];

function dateStr(month: number, day: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const NOTICE_COUNT = 8;

function generateNotices(): TeacherNotice[] {
  const list: TeacherNotice[] = [];
  for (let i = 0; i < NOTICE_COUNT; i++) {
    const publishedMonth = randomInt(1, 6);
    list.push({
      id: `TNOT-${100 + i}`,
      title: pick(titles),
      content: "Please see attached details and reach out with questions.",
      audience: weightedPick(audiences),
      priority: i === 0 ? "high" : "normal",
      expiryDate: dateStr(publishedMonth + 1, randomInt(1, 28)),
      publishedDate: dateStr(publishedMonth, randomInt(1, 28)),
      views: randomInt(10, 60),
    });
  }
  return list;
}

export const teacherNotices: TeacherNotice[] = generateNotices();
```

- [ ] **Step 2: Create `src/api/teacherNotices.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { teacherNotices } from "@/demo-data/teacher/notices";
import type { TeacherNotice } from "@/types";

export function getTeacherNotices(): Promise<TeacherNotice[]> {
  return simulateRequest(teacherNotices);
}

export function addTeacherNotice(entry: TeacherNotice): Promise<TeacherNotice> {
  teacherNotices.unshift(entry);
  return simulateRequest(entry);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/teacher/notices.ts src/api/teacherNotices.ts
git commit -m "Add teacher notices demo data and API"
```

---

### Task 8: Messages demo data + API

**Files:**
- Create: `src/demo-data/teacher/messages.ts`
- Create: `src/api/teacherMessages.ts`

- [ ] **Step 1: Create `src/demo-data/teacher/messages.ts`**

```ts
import type { MessageContact, Message } from "@/types";

export const messageContacts: MessageContact[] = [
  { id: "MC-1", name: "Prof. Anjali Sharma", role: "HOD" },
  { id: "MC-2", name: "Prof. Vikram Singh", role: "Dean" },
  { id: "MC-3", name: "Library Admin", role: "Library" },
];

export const messages: Message[] = [
  { id: "MSG-1", contactId: "MC-1", fromMe: false, text: "Can you share the CS201 attendance summary by Friday?", timestamp: "2026-07-10 09:15" },
  { id: "MSG-2", contactId: "MC-1", fromMe: true, text: "Sure, I'll have it ready by Thursday evening.", timestamp: "2026-07-10 09:20" },
  { id: "MSG-3", contactId: "MC-2", fromMe: false, text: "Please review the escalated leave request when you get a chance.", timestamp: "2026-07-08 14:00" },
  { id: "MSG-4", contactId: "MC-2", fromMe: true, text: "Reviewing it now, will respond today.", timestamp: "2026-07-08 14:30" },
  { id: "MSG-5", contactId: "MC-3", fromMe: false, text: "Your requested books have arrived and are ready for pickup.", timestamp: "2026-07-05 11:00" },
];

export function getMessagesFor(contactId: string): Message[] {
  return messages.filter((m) => m.contactId === contactId);
}
```

- [ ] **Step 2: Create `src/api/teacherMessages.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { messageContacts, messages, getMessagesFor } from "@/demo-data/teacher/messages";
import type { MessageContact, Message } from "@/types";

export function getMessageContacts(): Promise<MessageContact[]> {
  return simulateRequest(messageContacts);
}

export function getMessagesForContact(contactId: string): Promise<Message[]> {
  return simulateRequest(getMessagesFor(contactId));
}

export function sendMessage(contactId: string, text: string): Promise<Message> {
  const entry: Message = { id: `MSG-${messages.length + 1}`, contactId, fromMe: true, text, timestamp: new Date().toISOString().slice(0, 16).replace("T", " ") };
  messages.push(entry);
  return simulateRequest(entry);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/teacher/messages.ts src/api/teacherMessages.ts
git commit -m "Add teacher messages demo data and API"
```

---

### Task 9: Documents demo data + API

**Files:**
- Create: `src/demo-data/teacher/documents.ts`
- Create: `src/api/teacherDocuments.ts`

- [ ] **Step 1: Create `src/demo-data/teacher/documents.ts`**

```ts
import type { TeacherDocument } from "@/types";
import { createRng } from "@/demo-data/generators/random";

const { pick, randomInt } = createRng(20260720);

const docTitles: { title: string; docType: string }[] = [
  { title: "Annual Examination Schedule - 2026", docType: "academic" },
  { title: "Lab Safety Compliance Form", docType: "administrative" },
  { title: "Research Grant Endorsement", docType: "research" },
  { title: "Student Disciplinary Report", docType: "student" },
  { title: "Semester Budget Approval", docType: "finance" },
  { title: "Course Curriculum Revision", docType: "academic" },
];

function dateStr(month: number, day: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const DOCUMENT_COUNT = 12;

function generateDocuments(): TeacherDocument[] {
  const list: TeacherDocument[] = [];
  for (let i = 0; i < DOCUMENT_COUNT; i++) {
    const source = pick(docTitles);
    const direction: TeacherDocument["direction"] = i < 4 ? "assigned_to_me" : i < 7 ? "sent_by_me" : "assigned_to_me";
    const status: TeacherDocument["status"] = i < 4 ? "pending" : i < 7 ? "in_progress" : "completed";
    list.push({
      id: `TDOC-${300 + i}`,
      title: source.title,
      docType: source.docType,
      fromName: "Dr. Amit Singh",
      initiatedDate: dateStr(randomInt(1, 6), randomInt(1, 28)),
      priority: i === 0 ? "urgent" : "normal",
      status,
      direction,
      progressPct: direction === "sent_by_me" && status === "in_progress" ? randomInt(30, 80) : undefined,
    });
  }
  return list;
}

export const teacherDocuments: TeacherDocument[] = generateDocuments();

export function getTeacherDocumentById(id: string): TeacherDocument | undefined {
  return teacherDocuments.find((d) => d.id === id);
}
```

- [ ] **Step 2: Create `src/api/teacherDocuments.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { teacherDocuments, getTeacherDocumentById } from "@/demo-data/teacher/documents";
import type { TeacherDocument } from "@/types";

export function getTeacherDocuments(): Promise<TeacherDocument[]> {
  return simulateRequest(teacherDocuments);
}

export function signTeacherDocument(id: string): Promise<TeacherDocument | undefined> {
  const doc = getTeacherDocumentById(id);
  if (doc && doc.status === "pending") {
    doc.status = "completed";
  }
  return simulateRequest(doc);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/teacher/documents.ts src/api/teacherDocuments.ts
git commit -m "Add teacher documents demo data and API"
```

---

### Task 10: Departments demo data + API

**Files:**
- Create: `src/demo-data/teacher/departments.ts`
- Create: `src/api/teacherDepartments.ts`

**Interfaces:**
- Consumes: `students` (Phase 1a).
- Produces: `departmentSummaries: DepartmentSummary[]`, `getDepartmentByName(name)`; `getDepartmentSummaries()`, `getDepartmentByNameAsync(name)` — used by Tasks 18-19.

- [ ] **Step 1: Create `src/demo-data/teacher/departments.ts`**

```ts
import type { DepartmentSummary } from "@/types";
import { students } from "@/demo-data/people/students";
import { createRng } from "@/demo-data/generators/random";

const { randomInt } = createRng(20260721);

const deptNames = ["Computer Science", "Electronics & Communication", "Mechanical", "Civil"];

function generateDepartments(): DepartmentSummary[] {
  return deptNames.map((name) => {
    const totalStudents = 280 + randomInt(0, 120);
    const topPerformers = students.slice(0, 3).map((s) => ({ rollNo: s.rollNo, name: s.name, avgMarksPct: 85 + randomInt(0, 12) }));
    return {
      name,
      totalStudents,
      facultyCount: 18 + randomInt(0, 12),
      atRiskCount: 15 + randomInt(0, 20),
      avgAttendancePct: 75 + randomInt(0, 12),
      avgMarksPct: 68 + randomInt(0, 14),
      yearBreakdown: [1, 2, 3, 4].map((year) => ({ year, students: Math.round(totalStudents / 4), avgMarksPct: 65 + randomInt(0, 20) })),
      topPerformers,
    };
  });
}

export const departmentSummaries: DepartmentSummary[] = generateDepartments();

export function getDepartmentByName(name: string): DepartmentSummary | undefined {
  return departmentSummaries.find((d) => d.name === name);
}
```

- [ ] **Step 2: Create `src/api/teacherDepartments.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { departmentSummaries, getDepartmentByName } from "@/demo-data/teacher/departments";
import type { DepartmentSummary } from "@/types";

export function getDepartmentSummaries(): Promise<DepartmentSummary[]> {
  return simulateRequest(departmentSummaries);
}

export function getDepartmentByNameAsync(name: string): Promise<DepartmentSummary | undefined> {
  return simulateRequest(getDepartmentByName(name));
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/teacher/departments.ts src/api/teacherDepartments.ts
git commit -m "Add teacher departments demo data and API"
```

---

### Task 11: StatusChip additions

**Files:**
- Modify: `src/components/StatusChip.tsx`

**Interfaces:**
- Produces: `StatusChip` handles `"escalated"` (new). `"pending_approval"`, `"approved"`, `"rejected"`, `"success"`, `"failed"`, `"in_progress"`, `"completed"` already exist.

- [ ] **Step 1: Add the 1 new status entry**

Find:

```tsx
  degraded: { label: "Degraded", color: statusTokens.warning, icon: WarningAmberIcon },
};
```

Replace with:

```tsx
  degraded: { label: "Degraded", color: statusTokens.warning, icon: WarningAmberIcon },
  // Teacher requests
  escalated: { label: "Escalated", color: statusTokens.serious, icon: PendingActionsIcon },
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/StatusChip.tsx
git commit -m "Add escalated status to StatusChip"
```

---

### Task 12: Dashboard page (replaces Phase 0 placeholder)

**Files:**
- Modify: `src/pages/teacher/Dashboard.tsx`

**Interfaces:**
- Consumes: `getTeacherCourses` (Task 3).

- [ ] **Step 1: Replace `src/pages/teacher/Dashboard.tsx` entirely**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid, Paper, Typography } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AssessmentIcon from "@mui/icons-material/Assessment";
import GradingIcon from "@mui/icons-material/Grading";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getTeacherCourses } from "@/api/teacherCourses";
import type { TeacherCourse } from "@/types";

const schedule = [
  { title: "CS201 Lecture", time: "09:00 - 10:30", room: "Lab A" },
  { title: "CS202 Lecture", time: "11:00 - 12:30", room: "Hall C" },
  { title: "Dept Meeting", time: "14:00 - 15:30", room: "Conf Rm 1" },
  { title: "Exam Invigilation - CS203", time: "16:00 - 18:00", room: "Exam Hall 2" },
];
const pendingTasks = ["Attendance - CS201 Sec A", "Internal Marks - CS202 Quiz2", "Course Material - CS203", "Grade Change Request Review"];

export default function Dashboard() {
  const { mode } = useColorMode();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);

  useEffect(() => { getTeacherCourses().then(setCourses); }, []);

  const totalStudents = courses.reduce((sum, c) => sum + c.studentIds.length, 0);
  const avgAttendance = courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + c.avgAttendancePct, 0) / courses.length) : 0;
  const avgMarks = courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + c.avgMarksPct, 0) / courses.length) : 0;

  return (
    <>
      <PageHeader eyebrow="Overview" title="Faculty Dashboard" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Students" icon={<PeopleIcon />} color={getIconAccent(mode, "students")} numericValue={totalStudents} onClick={() => navigate("/teacher/students")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} value={`${avgAttendance}%`} onClick={() => navigate("/teacher/attendance")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="At-Risk Students" icon={<AssessmentIcon />} color={getIconAccent(mode, "at-risk")} numericValue={12} onClick={() => navigate("/teacher/students")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Internal Marks" icon={<GradingIcon />} color={getIconAccent(mode, "marks")} value={`${avgMarks}%`} onClick={() => navigate("/teacher/marks")} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Today's Schedule</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {schedule.map((s) => (
                <Box key={s.title} sx={{ p: 1.5, borderLeft: 3, borderColor: "primary.main", bgcolor: "action.hover", borderRadius: 1 }}>
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {pendingTasks.map((t) => (
                <Typography key={t} variant="body2">• {t}</Typography>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/teacher/Dashboard.tsx
git commit -m "Rebuild Teacher Dashboard with real course data"
```

---

### Task 13: My Courses page

**Files:**
- Create: `src/pages/teacher/MyCourses.tsx`

- [ ] **Step 1: Create `src/pages/teacher/MyCourses.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Stack, Typography, Grid, Paper } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getTeacherCourses } from "@/api/teacherCourses";
import type { TeacherCourse } from "@/types";

export default function MyCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);

  useEffect(() => { getTeacherCourses().then(setCourses); }, []);

  return (
    <>
      <PageHeader eyebrow="Academics" title="My Courses" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {courses.map((c) => (
          <Grid key={c.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600}>{c.name}</Typography>
              <Typography variant="caption" color="text.secondary">{c.id} · Section {c.section} · {c.studentIds.length} students</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button size="small" variant="contained" onClick={() => navigate("/teacher/attendance")}>Mark Attendance</Button>
                <Button size="small" onClick={() => navigate("/teacher/marks")}>Enter Marks</Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Course Statistics</Typography>
      <DataTable<TeacherCourse>
        columns={[
          { key: "name", label: "Course" },
          { key: "section", label: "Section" },
          { key: "studentIds", label: "Students", render: (row) => row.studentIds.length },
          { key: "avgAttendancePct", label: "Avg Attendance", render: (row) => `${row.avgAttendancePct}%` },
          { key: "avgMarksPct", label: "Avg Marks", render: (row) => `${row.avgMarksPct}%` },
        ]}
        rows={courses}
        emptyTitle="No courses found"
      />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/teacher/MyCourses.tsx
git commit -m "Add My Courses page"
```

---

### Task 14: Attendance page

**Files:**
- Create: `src/pages/teacher/Attendance.tsx`

**Interfaces:**
- Consumes: `getTeacherCourses` (Task 3); `getAttendanceSubmissions`, `getAttendanceSubmissionByIdAsync`, `submitAttendance` (Task 4); `students` lookup via `getStudentById` (Phase 1a).

- [ ] **Step 1: Create `src/pages/teacher/Attendance.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Box, Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getTeacherCourses } from "@/api/teacherCourses";
import { getAttendanceSubmissions, getAttendanceSubmissionByIdAsync, submitAttendance } from "@/api/teacherAttendance";
import { getStudentById } from "@/demo-data/people/students";
import type { TeacherCourse, AttendanceSubmission, AttendanceMarkStatus } from "@/types";

const statusOptions: AttendanceMarkStatus[] = ["present", "absent", "medical", "other"];

export default function Attendance() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [session, setSession] = useState<"forenoon" | "afternoon">("forenoon");
  const [records, setRecords] = useState<{ studentId: string; status: AttendanceMarkStatus; remarks: string }[]>([]);
  const [history, setHistory] = useState<AttendanceSubmission[]>([]);
  const [detail, setDetail] = useState<AttendanceSubmission | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getTeacherCourses().then(setCourses); loadHistory(); }, []);
  const loadHistory = () => getAttendanceSubmissions().then(setHistory);

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    const course = courses.find((c) => c.id === id);
    setRecords(course ? course.studentIds.map((studentId) => ({ studentId, status: "present" as AttendanceMarkStatus, remarks: "" })) : []);
  };

  const handleSubmit = () => {
    if (!courseId) return;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    submitAttendance({ id: `ATT-${Date.now()}`, courseId, section: course.section, session, date, records }).then(() => {
      loadHistory();
      setSnackbar("Attendance submitted successfully!");
    });
  };

  const openDetail = (id: string) => {
    getAttendanceSubmissionByIdAsync(id).then((data) => setDetail(data ?? null));
  };

  if (detail) {
    const present = detail.records.filter((r) => r.status === "present").length;
    return (
      <>
        <PageHeader eyebrow="Academics" title={`Attendance Detail — ${detail.courseId}`} action={<Button variant="outlined" onClick={() => setDetail(null)}>Back</Button>} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{detail.date} · {detail.session} · Section {detail.section}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>{present}/{detail.records.length} present ({Math.round((present / detail.records.length) * 100)}%)</Typography>
        <DataTable
          columns={[
            { key: "studentId", label: "Roll No", render: (r) => getStudentById(r.studentId)?.rollNo ?? r.studentId },
            { key: "name", label: "Name", render: (r) => getStudentById(r.studentId)?.name ?? "—" },
            { key: "status", label: "Status" },
          ]}
          rows={detail.records}
          emptyTitle="No records"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Academics" title="Attendance" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Course</InputLabel>
          <Select label="Course" value={courseId} onChange={(e: SelectChangeEvent) => handleCourseChange(e.target.value)}>
            {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} ({c.id})</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Session</InputLabel>
          <Select label="Session" value={session} onChange={(e: SelectChangeEvent) => setSession(e.target.value as "forenoon" | "afternoon")}>
            <MenuItem value="forenoon">Forenoon</MenuItem>
            <MenuItem value="afternoon">Afternoon</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {records.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <DataTable
            pagination
            columns={[
              { key: "studentId", label: "Roll No", render: (r) => getStudentById(r.studentId)?.rollNo ?? r.studentId },
              { key: "name", label: "Name", render: (r) => getStudentById(r.studentId)?.name ?? "—" },
              {
                key: "status", label: "Status",
                render: (r, i) => (
                  <Select size="small" value={r.status} onChange={(e: SelectChangeEvent) => setRecords(records.map((rec, idx) => idx === i ? { ...rec, status: e.target.value as AttendanceMarkStatus } : rec))}>
                    {statusOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                ),
              },
              {
                key: "remarks", label: "Remarks",
                render: (r, i) => <TextField size="small" value={r.remarks} onChange={(e) => setRecords(records.map((rec, idx) => idx === i ? { ...rec, remarks: e.target.value } : rec))} />,
              },
            ]}
            rows={records}
            emptyTitle="No students"
          />
          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleSubmit}>Submit Attendance</Button>
            <Button variant="outlined" onClick={() => handleCourseChange(courseId)}>Clear Form</Button>
          </Stack>
        </Paper>
      )}

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Submission History</Typography>
      <DataTable<AttendanceSubmission>
        pagination
        columns={[
          { key: "date", label: "Date" },
          { key: "courseId", label: "Course" },
          { key: "section", label: "Section" },
          { key: "session", label: "Session" },
          { key: "records", label: "Students", render: (row) => row.records.length },
          {
            key: "actions", label: "Action",
            render: (row) => <Button size="small" onClick={() => openDetail(row.id)}>View</Button>,
          },
        ]}
        rows={history}
        emptyTitle="No submissions yet"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

Note: `Box` import unused — omit it (only `Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Snackbar` are needed).

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/teacher/Attendance.tsx
git commit -m "Add Attendance page"
```

---

### Task 15: Internal Marks page

**Files:**
- Create: `src/pages/teacher/InternalMarks.tsx`

**Interfaces:**
- Consumes: `getTeacherCourses` (Task 3); `getMarksSubmissions`, `getMarksSubmissionByIdAsync`, `submitMarks` (Task 5); `getStudentById` (Phase 1a).

- [ ] **Step 1: Create `src/pages/teacher/InternalMarks.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getTeacherCourses } from "@/api/teacherCourses";
import { getMarksSubmissions, getMarksSubmissionByIdAsync, submitMarks } from "@/api/teacherMarks";
import { getStudentById } from "@/demo-data/people/students";
import type { TeacherCourse, MarksSubmission } from "@/types";

const assessments = ["Quiz1", "Quiz2", "Assignment1", "MidExam"];

export default function InternalMarks() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [courseId, setCourseId] = useState("");
  const [assessment, setAssessment] = useState(assessments[0]);
  const [maxMarks, setMaxMarks] = useState(20);
  const [records, setRecords] = useState<{ studentId: string; marks: number }[]>([]);
  const [history, setHistory] = useState<MarksSubmission[]>([]);
  const [detail, setDetail] = useState<MarksSubmission | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getTeacherCourses().then(setCourses); loadHistory(); }, []);
  const loadHistory = () => getMarksSubmissions().then(setHistory);

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    const course = courses.find((c) => c.id === id);
    setRecords(course ? course.studentIds.map((studentId) => ({ studentId, marks: 0 })) : []);
  };

  const handleSubmit = (status: MarksSubmission["status"]) => {
    if (!courseId) return;
    submitMarks({ id: `MRK-${Date.now()}`, courseId, assessment, maxMarks, date: new Date().toISOString().slice(0, 10), status, records }).then(() => {
      loadHistory();
      setSnackbar(status === "submitted" ? "Marks submitted successfully!" : "Saved as draft");
    });
  };

  const openDetail = (id: string) => getMarksSubmissionByIdAsync(id).then((data) => setDetail(data ?? null));

  if (detail) {
    const avg = detail.records.reduce((sum, r) => sum + r.marks, 0) / (detail.records.length || 1);
    return (
      <>
        <PageHeader eyebrow="Academics" title={`Marks Detail — ${detail.courseId} ${detail.assessment}`} action={<Button variant="outlined" onClick={() => setDetail(null)}>Back</Button>} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Max Marks: {detail.maxMarks} · Average: {avg.toFixed(1)}</Typography>
        <DataTable
          pagination
          columns={[
            { key: "studentId", label: "Roll No", render: (r) => getStudentById(r.studentId)?.rollNo ?? r.studentId },
            { key: "name", label: "Name", render: (r) => getStudentById(r.studentId)?.name ?? "—" },
            { key: "marks", label: "Marks" },
            { key: "pct", label: "%", render: (r) => `${Math.round((r.marks / detail.maxMarks) * 100)}%` },
          ]}
          rows={detail.records}
          emptyTitle="No records"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Academics" title="Internal Marks" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Course</InputLabel>
          <Select label="Course" value={courseId} onChange={(e: SelectChangeEvent) => handleCourseChange(e.target.value)}>
            {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} ({c.id})</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Assessment</InputLabel>
          <Select label="Assessment" value={assessment} onChange={(e: SelectChangeEvent) => setAssessment(e.target.value)}>
            {assessments.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" label="Max Marks" type="number" value={maxMarks} onChange={(e) => setMaxMarks(Number(e.target.value))} sx={{ width: 120 }} />
      </Stack>

      {records.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <DataTable
            pagination
            columns={[
              { key: "studentId", label: "Roll No", render: (r) => getStudentById(r.studentId)?.rollNo ?? r.studentId },
              { key: "name", label: "Name", render: (r) => getStudentById(r.studentId)?.name ?? "—" },
              {
                key: "marks", label: "Marks",
                render: (r, i) => <TextField size="small" type="number" value={r.marks} onChange={(e) => setRecords(records.map((rec, idx) => idx === i ? { ...rec, marks: Number(e.target.value) } : rec))} sx={{ width: 80 }} />,
              },
              { key: "outOf", label: "Out of", render: () => maxMarks },
              { key: "pct", label: "%", render: (r) => `${Math.round((r.marks / maxMarks) * 100)}%` },
            ]}
            rows={records}
            emptyTitle="No students"
          />
          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={() => handleSubmit("submitted")}>Submit Marks</Button>
            <Button variant="outlined" onClick={() => handleSubmit("pending_hod_review")}>Save as Draft</Button>
          </Stack>
        </Paper>
      )}

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Marks Submission History</Typography>
      <DataTable<MarksSubmission>
        pagination
        columns={[
          { key: "courseId", label: "Course" },
          { key: "assessment", label: "Assessment" },
          { key: "date", label: "Date" },
          { key: "records", label: "Total Marks", render: (row) => row.records.length },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "actions", label: "Action", render: (row) => <Button size="small" onClick={() => openDetail(row.id)}>View</Button> },
        ]}
        rows={history}
        emptyTitle="No submissions yet"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/teacher/InternalMarks.tsx
git commit -m "Add Internal Marks page"
```

---

### Task 16: Exams page

**Files:**
- Create: `src/pages/teacher/Exams.tsx`

- [ ] **Step 1: Create `src/pages/teacher/Exams.tsx`**

```tsx
import { useNavigate } from "react-router-dom";
import { Button, Typography } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";

const schedule = [
  { course: "CS201", examType: "Mid Sem", date: "2026-08-12", time: "10:00 AM", venue: "Exam Hall 1", role: "Invigilator" },
  { course: "CS202", examType: "Mid Sem", date: "2026-08-13", time: "10:00 AM", venue: "Exam Hall 2", role: "Setter" },
  { course: "CS203", examType: "Practical", date: "2026-08-14", time: "02:00 PM", venue: "Lab A", role: "Examiner" },
  { course: "CS204", examType: "End Sem", date: "2026-12-05", time: "10:00 AM", venue: "Exam Hall 1", role: "Coordinator" },
];

const evaluation = [
  { course: "CS201", exam: "Mid Sem", status: "completed", submitted: "2026-08-15" },
  { course: "CS202", exam: "Mid Sem", status: "in_progress", submitted: "—" },
  { course: "CS203", exam: "Practical", status: "pending", submitted: "—" },
];

export default function Exams() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader eyebrow="Academics" title="Exams" />
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Exam Schedule</Typography>
      <DataTable
        columns={[
          { key: "course", label: "Course" },
          { key: "examType", label: "Exam Type" },
          { key: "date", label: "Date" },
          { key: "time", label: "Time" },
          { key: "venue", label: "Venue" },
          { key: "role", label: "Role" },
        ]}
        rows={schedule}
        emptyTitle="No exams scheduled"
      />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 4, mb: 1.5 }}>Evaluation Status</Typography>
      <DataTable
        columns={[
          { key: "course", label: "Course" },
          { key: "exam", label: "Exam" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "submitted", label: "Submitted" },
          {
            key: "actions", label: "Action",
            render: (row) => row.status === "completed"
              ? <Button size="small" onClick={() => navigate("/teacher/marks")}>Download</Button>
              : <Button size="small" onClick={() => navigate("/teacher/marks")}>Evaluate</Button>,
          },
        ]}
        rows={evaluation}
        emptyTitle="No evaluations"
      />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/teacher/Exams.tsx
git commit -m "Add Exams page"
```

---

### Task 17: Course Materials page

**Files:**
- Create: `src/pages/teacher/CourseMaterials.tsx`

- [ ] **Step 1: Create `src/pages/teacher/CourseMaterials.tsx`**

```tsx
import { useState } from "react";
import { Box, Button, MenuItem, Select, InputLabel, FormControl, Stack, Typography, Paper, Snackbar, type SelectChangeEvent } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";

const courses = ["CS201", "CS202", "CS203", "CS204"];

const materials = [
  { file: "Lecture1_Intro.pdf", course: "CS201", type: "PDF", size: "2.4 MB", uploaded: "2026-06-01" },
  { file: "Lab_Manual_Unit2.docx", course: "CS202", type: "DOCX", size: "1.1 MB", uploaded: "2026-06-05" },
  { file: "Assignment3_Spec.pdf", course: "CS203", type: "PDF", size: "0.8 MB", uploaded: "2026-06-10" },
  { file: "Reference_Slides.pptx", course: "CS201", type: "PPTX", size: "5.2 MB", uploaded: "2026-06-12" },
  { file: "Practice_Problems.pdf", course: "CS204", type: "PDF", size: "1.6 MB", uploaded: "2026-06-15" },
];

export default function CourseMaterials() {
  const [courseFilter, setCourseFilter] = useState("all");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const filtered = materials.filter((m) => courseFilter === "all" || m.course === courseFilter);

  return (
    <>
      <PageHeader eyebrow="Academics" title="Course Materials" />
      <FormControl size="small" sx={{ minWidth: 180, mb: 2 }}>
        <InputLabel>Course</InputLabel>
        <Select label="Course" value={courseFilter} onChange={(e: SelectChangeEvent) => setCourseFilter(e.target.value)}>
          <MenuItem value="all">All Courses</MenuItem>
          {courses.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </Select>
      </FormControl>

      <Paper
        elevation={0}
        onClick={() => setSnackbar("Opening file picker...")}
        sx={{ p: 4, mb: 3, textAlign: "center", border: "2px dashed", borderColor: "divider", cursor: "pointer" }}
      >
        <UploadFileIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
        <Typography variant="body2" color="text.secondary">Drag and drop files here, or click to browse</Typography>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Recently Uploaded</Typography>
      <DataTable
        columns={[
          { key: "file", label: "File Name" },
          { key: "course", label: "Course" },
          { key: "type", label: "Type" },
          { key: "size", label: "Size" },
          { key: "uploaded", label: "Uploaded" },
          {
            key: "actions", label: "Action",
            render: (row) => <Button size="small" onClick={() => setSnackbar(`Deleting ${row.file}...`)}>Delete</Button>,
          },
        ]}
        rows={filtered}
        emptyTitle="No materials found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

Note: `Box` import unused — omit it.

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/teacher/CourseMaterials.tsx
git commit -m "Add Course Materials page"
```

---

### Task 18: My Course Students + Department Students pages

**Files:**
- Create: `src/pages/teacher/MyCourseStudents.tsx`
- Create: `src/pages/teacher/DepartmentStudents.tsx`

**Interfaces:**
- Consumes: `getTeacherCourses` (Task 3); `students`, `getStudentById` (Phase 1a); `useTeacherRole` (Task 2).

- [ ] **Step 1: Create `src/pages/teacher/MyCourseStudents.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Button, MenuItem, Select, InputLabel, FormControl, Stack, Typography, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getTeacherCourses } from "@/api/teacherCourses";
import { students } from "@/demo-data/people/students";
import type { TeacherCourse, Student } from "@/types";

export default function MyCourseStudents() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getTeacherCourses().then(setCourses); }, []);

  const rosterIds = new Set(courses.flatMap((c) => courseFilter === "all" || c.id === courseFilter ? c.studentIds : []));
  const roster = students.filter((s) => rosterIds.has(s.id));

  const statusFor = (s: Student) => s.attendancePct < 70 || s.cgpa < 6 ? "At Risk" : s.attendancePct > 90 && s.cgpa > 8.5 ? "Excellent" : "Good";
  const filtered = roster.filter((s) => statusFilter === "all" || statusFor(s) === statusFilter);

  const atRisk = roster.filter((s) => statusFor(s) === "At Risk").slice(0, 5);

  return (
    <>
      <PageHeader eyebrow="Students" title="My Course Students" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Course</InputLabel>
          <Select label="Course" value={courseFilter} onChange={(e: SelectChangeEvent) => setCourseFilter(e.target.value)}>
            <MenuItem value="all">All Courses</MenuItem>
            {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}>
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="Excellent">Excellent</MenuItem>
            <MenuItem value="Good">Good</MenuItem>
            <MenuItem value="At Risk">At Risk</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <DataTable<Student>
        pagination
        columns={[
          { key: "rollNo", label: "Roll No" },
          { key: "name", label: "Name" },
          { key: "program", label: "Program" },
          { key: "year", label: "Year" },
          { key: "attendancePct", label: "Attendance %", render: (row) => `${row.attendancePct}%` },
          { key: "cgpa", label: "Internal Marks %", render: (row) => `${Math.round(row.cgpa * 10)}%` },
          { key: "status", label: "Status", render: (row) => <StatusChip status={statusFor(row) === "At Risk" ? "overdue" : statusFor(row) === "Excellent" ? "active" : "present"} /> },
          { key: "actions", label: "Action", render: () => <Button size="small" onClick={() => setSnackbar("Loading student profile...")}>View</Button> },
        ]}
        rows={filtered}
        emptyTitle="No students found"
      />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 4, mb: 1.5 }}>At-Risk Students Summary</Typography>
      <DataTable<Student>
        columns={[
          { key: "rollNo", label: "Roll No" },
          { key: "name", label: "Name" },
          { key: "issue", label: "Issue", render: (row) => row.attendancePct < 70 ? "Low Attendance" : "Low Marks" },
          { key: "attendancePct", label: "Attendance", render: (row) => `${row.attendancePct}%` },
          { key: "cgpa", label: "Marks", render: (row) => `${Math.round(row.cgpa * 10)}%` },
          { key: "actions", label: "Action", render: () => <Button size="small" onClick={() => setSnackbar("Flagged to HOD")}>Flag to HOD</Button> },
        ]}
        rows={atRisk}
        emptyTitle="No at-risk students"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Create `src/pages/teacher/DepartmentStudents.tsx`**

```tsx
import { useState } from "react";
import { Button, Stack, Typography, Snackbar } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { DataTable } from "@/components/DataTable";
import { useTeacherRole } from "@/context/TeacherRoleContext";
import { students } from "@/demo-data/people/students";

export default function DepartmentStudents() {
  const { role } = useTeacherRole();
  const [snackbar, setSnackbar] = useState<string | null>(null);

  if (role === "professor") {
    return (
      <>
        <PageHeader eyebrow="Students" title="Department Students" />
        <EmptyState title="Access Denied" description="This feature is only available to HOD and Dean." />
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Students" title="Department Students" />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Computer Science Department — {students.length} Students</Typography>
      <DataTable
        pagination
        columns={[
          { key: "rollNo", label: "Roll No" },
          { key: "name", label: "Name" },
          { key: "program", label: "Program" },
          { key: "year", label: "Year" },
          { key: "attendancePct", label: "Attendance %", render: (row) => `${row.attendancePct}%` },
          { key: "actions", label: "Action", render: () => <Stack direction="row"><Button size="small" onClick={() => setSnackbar("Loading student profile...")}>View</Button></Stack> },
        ]}
        rows={students}
        emptyTitle="No students found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/pages/teacher/MyCourseStudents.tsx src/pages/teacher/DepartmentStudents.tsx
git commit -m "Add My Course Students and Department Students pages"
```

---

### Task 19: Academic Cohort page

**Files:**
- Create: `src/pages/teacher/AcademicCohort.tsx`

**Interfaces:**
- Consumes: `useTeacherRole` (Task 2); `getDepartmentSummaries`, `getDepartmentByNameAsync` (Task 10).

- [ ] **Step 1: Create `src/pages/teacher/AcademicCohort.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Button, Typography, Grid, Paper } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { useTeacherRole } from "@/context/TeacherRoleContext";
import { getDepartmentSummaries, getDepartmentByNameAsync } from "@/api/teacherDepartments";
import PeopleIcon from "@mui/icons-material/People";
import EventNoteIcon from "@mui/icons-material/EventNote";
import WarningIcon from "@mui/icons-material/Warning";
import GradingIcon from "@mui/icons-material/Grading";
import type { DepartmentSummary } from "@/types";

export default function AcademicCohort() {
  const { role } = useTeacherRole();
  const { mode } = useColorMode();
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [drillDown, setDrillDown] = useState<DepartmentSummary | null>(null);

  useEffect(() => { if (role === "dean") getDepartmentSummaries().then(setDepartments); }, [role]);

  if (role !== "dean") {
    return (
      <>
        <PageHeader eyebrow="Students" title="Academic Cohort" />
        <EmptyState title="Access Denied" description="This feature is only available to Dean." />
      </>
    );
  }

  const totalStudents = departments.reduce((sum, d) => sum + d.totalStudents, 0);
  const avgAttendance = departments.length > 0 ? Math.round(departments.reduce((sum, d) => sum + d.avgAttendancePct, 0) / departments.length) : 0;
  const totalAtRisk = departments.reduce((sum, d) => sum + d.atRiskCount, 0);
  const avgMarks = departments.length > 0 ? Math.round(departments.reduce((sum, d) => sum + d.avgMarksPct, 0) / departments.length) : 0;

  if (drillDown) {
    return (
      <>
        <PageHeader eyebrow="Students" title={`${drillDown.name} — Drill Down`} action={<Button variant="outlined" onClick={() => setDrillDown(null)}>Back</Button>} />
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Students" icon={<PeopleIcon />} color={getIconAccent(mode, "students")} numericValue={drillDown.totalStudents} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Faculty" icon={<PeopleIcon />} color={getIconAccent(mode, "faculty")} numericValue={drillDown.facultyCount} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="At-Risk" icon={<WarningIcon />} color={getIconAccent(mode, "at-risk")} numericValue={drillDown.atRiskCount} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Avg Marks" icon={<GradingIcon />} color={getIconAccent(mode, "marks")} value={`${drillDown.avgMarksPct}%`} /></Grid>
        </Grid>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Year-wise Breakdown</Typography>
        <DataTable
          columns={[
            { key: "year", label: "Year" },
            { key: "students", label: "Students" },
            { key: "avgMarksPct", label: "Avg Marks", render: (row) => `${row.avgMarksPct}%` },
          ]}
          rows={drillDown.yearBreakdown}
          emptyTitle="No data"
        />
        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 1.5 }}>Top Performers</Typography>
        <DataTable
          columns={[
            { key: "rollNo", label: "Roll No" },
            { key: "name", label: "Name" },
            { key: "avgMarksPct", label: "Avg Marks", render: (row) => `${row.avgMarksPct}%` },
          ]}
          rows={drillDown.topPerformers}
          emptyTitle="No data"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Students" title="Academic Cohort" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Total Students" icon={<PeopleIcon />} color={getIconAccent(mode, "students")} numericValue={totalStudents} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Inst. Avg Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} value={`${avgAttendance}%`} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="At-Risk" icon={<WarningIcon />} color={getIconAccent(mode, "at-risk")} numericValue={totalAtRisk} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Inst. Avg Marks" icon={<GradingIcon />} color={getIconAccent(mode, "marks")} value={`${avgMarks}%`} /></Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Risk Heatmap by Department</Typography>
      <DataTable<DepartmentSummary>
        columns={[
          { key: "name", label: "Department" },
          { key: "totalStudents", label: "Total" },
          { key: "atRiskCount", label: "At-Risk" },
          { key: "atRiskPct", label: "%", render: (row) => `${Math.round((row.atRiskCount / row.totalStudents) * 100)}%` },
          { key: "avgAttendancePct", label: "Avg Attendance", render: (row) => `${row.avgAttendancePct}%` },
          { key: "avgMarksPct", label: "Avg Marks", render: (row) => `${row.avgMarksPct}%` },
          {
            key: "actions", label: "Action",
            render: (row) => <Button size="small" onClick={() => getDepartmentByNameAsync(row.name).then((d) => setDrillDown(d ?? null))}>Drill Down</Button>,
          },
        ]}
        rows={departments}
        emptyTitle="No departments found"
      />
      <Paper elevation={0} sx={{ p: 3, mt: 3, textAlign: "center", color: "text.secondary" }}>
        Department-wise Performance Comparison Chart
      </Paper>
    </>
  );
}
```

Note: the spec calls for this chart placeholder text to become a real `recharts` chart, but that upgrade is applied on Student Performance (Task 21) where the source explicitly names 2 chart placeholders. Academic Cohort's single comparison chart mention is secondary framing text in the source, not one of the 2 confirmed placeholders — leave as descriptive text here to avoid inventing chart content beyond what's specified.

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/teacher/AcademicCohort.tsx
git commit -m "Add Academic Cohort page"
```

---

### Task 20: Student Performance page

**Files:**
- Create: `src/pages/teacher/StudentPerformance.tsx`

**Interfaces:**
- Consumes: `students` (Phase 1a); `recharts`.

- [ ] **Step 1: Create `src/pages/teacher/StudentPerformance.tsx`**

```tsx
import { MenuItem, Select, InputLabel, FormControl, Stack, Grid } from "@mui/material";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle } from "@/theme/chartPalette";
import { students } from "@/demo-data/people/students";

const trendData = [
  { assessment: "Quiz1", avg: 72 }, { assessment: "Quiz2", avg: 75 },
  { assessment: "Assignment1", avg: 79 }, { assessment: "MidExam", avg: 74 },
];
const distributionData = [
  { range: "0-40%", count: 4 }, { range: "40-60%", count: 12 },
  { range: "60-80%", count: 28 }, { range: "80-100%", count: 18 },
];

export default function StudentPerformance() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const sample = students.slice(0, 10);

  return (
    <>
      <PageHeader eyebrow="Students" title="Student Performance" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Trend" title="Assessment-wise Performance Trend">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="assessment" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Line type="monotone" dataKey="avg" stroke={palette.categorical[0]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard eyebrow="Distribution" title="Score Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="range" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="count" fill={palette.categorical[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Course</InputLabel>
          <Select label="Course" defaultValue="all">
            <MenuItem value="all">All Courses</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Assessment</InputLabel>
          <Select label="Assessment" defaultValue="all">
            <MenuItem value="all">All Assessments</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <DataTable
        columns={[
          { key: "rollNo", label: "Roll No" },
          { key: "name", label: "Name" },
          { key: "quiz1", label: "Quiz1", render: (r) => Math.round(r.cgpa * 2) },
          { key: "quiz2", label: "Quiz2", render: (r) => Math.round(r.cgpa * 2.1) },
          { key: "assignment", label: "Assignment", render: (r) => Math.round(r.cgpa * 2.2) },
          { key: "avg", label: "Avg %", render: (r) => `${Math.round(r.cgpa * 10)}%` },
          { key: "status", label: "Status", render: (r) => r.attendancePct < 70 ? "At Risk" : "Good" },
        ]}
        rows={sample}
        emptyTitle="No students found"
      />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/teacher/StudentPerformance.tsx
git commit -m "Add Student Performance page"
```

---

### Task 21: Leave/Grade-Change/Resource Requests pages

**Files:**
- Create: `src/pages/teacher/LeaveRequests.tsx`
- Create: `src/pages/teacher/GradeChangeRequests.tsx`
- Create: `src/pages/teacher/ResourceRequests.tsx`

**Interfaces:**
- Consumes: `getLeaveRequests/addLeaveRequest`, `getGradeChangeRequests/addGradeChangeRequest`, `getResourceRequests/addResourceRequest` (Task 6).

- [ ] **Step 1: Create `src/pages/teacher/LeaveRequests.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Grid, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getLeaveRequests, addLeaveRequest } from "@/api/teacherRequests";
import type { LeaveRequest } from "@/types";

const leaveTypes = ["Casual", "Medical", "Earned", "Academic"];
const emptyForm = { leaveType: leaveTypes[0], fromDate: "", toDate: "", reason: "", coverageArrangements: "" };

export default function LeaveRequests() {
  const [rows, setRows] = useState<LeaveRequest[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getLeaveRequests().then(setRows);
  useEffect(() => { load(); }, []);

  const handleSubmit = () => {
    addLeaveRequest(form).then(() => { load(); setForm(emptyForm); setSnackbar("Leave request submitted"); });
  };

  return (
    <>
      <PageHeader eyebrow="Requests" title="Leave Requests" />
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[["Casual", "8/12"], ["Medical", "5/10"], ["Earned", "12/20"], ["Academic", "2/5"]].map(([type, balance]) => (
          <Grid key={type} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">{type}</Typography>
              <Typography variant="h6" fontWeight={700}>{balance}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>New Leave Request</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Leave Type</InputLabel>
              <Select label="Leave Type" value={form.leaveType} onChange={(e: SelectChangeEvent) => setForm({ ...form, leaveType: e.target.value })}>
                {leaveTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="From Date" type="date" fullWidth value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="To Date" type="date" fullWidth value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid size={12}><TextField label="Reason" fullWidth multiline minRows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Grid>
          <Grid size={12}><TextField label="Course Coverage Arrangements" fullWidth multiline minRows={2} value={form.coverageArrangements} onChange={(e) => setForm({ ...form, coverageArrangements: e.target.value })} /></Grid>
        </Grid>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handleSubmit}>Submit Request</Button>
          <Button variant="outlined" onClick={() => setForm(emptyForm)}>Cancel</Button>
        </Stack>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Request History</Typography>
      <DataTable<LeaveRequest>
        pagination
        columns={[
          { key: "leaveType", label: "Type" },
          { key: "fromDate", label: "From" },
          { key: "toDate", label: "To" },
          { key: "raisedOn", label: "Raised On" },
          { key: "hodStatus", label: "HOD Status", render: (row) => <StatusChip status={row.hodStatus} /> },
          { key: "deanStatus", label: "Dean Status", render: (row) => row.deanStatus ? <StatusChip status={row.deanStatus} /> : "—" },
        ]}
        rows={rows}
        emptyTitle="No leave requests"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Create `src/pages/teacher/GradeChangeRequests.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Grid, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getTeacherCourses } from "@/api/teacherCourses";
import { getGradeChangeRequests, addGradeChangeRequest } from "@/api/teacherRequests";
import type { TeacherCourse, GradeChangeRequest } from "@/types";

const assessments = ["Quiz1", "Quiz2", "Assignment1", "MidExam"];
const emptyForm = { courseId: "", studentRollNo: "", assessment: assessments[0], originalMark: 0, proposedMark: 0, reason: "" };

export default function GradeChangeRequests() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [rows, setRows] = useState<GradeChangeRequest[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getGradeChangeRequests().then(setRows);
  useEffect(() => { getTeacherCourses().then(setCourses); load(); }, []);

  const handleSubmit = () => {
    addGradeChangeRequest(form).then(() => { load(); setForm(emptyForm); setSnackbar("Grade change request submitted"); });
  };

  return (
    <>
      <PageHeader eyebrow="Requests" title="Grade Change Requests" />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Approval chain: Professor → HOD → Dean. All changes are logged.</Typography>

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>New Grade Change Request</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Course</InputLabel>
              <Select label="Course" value={form.courseId} onChange={(e: SelectChangeEvent) => setForm({ ...form, courseId: e.target.value })}>
                {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} ({c.id})</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Student Roll No" fullWidth value={form.studentRollNo} onChange={(e) => setForm({ ...form, studentRollNo: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Assessment</InputLabel>
              <Select label="Assessment" value={form.assessment} onChange={(e: SelectChangeEvent) => setForm({ ...form, assessment: e.target.value })}>
                {assessments.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Original Mark" type="number" fullWidth value={form.originalMark} onChange={(e) => setForm({ ...form, originalMark: Number(e.target.value) })} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Proposed Mark" type="number" fullWidth value={form.proposedMark} onChange={(e) => setForm({ ...form, proposedMark: Number(e.target.value) })} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Difference" fullWidth disabled value={form.proposedMark - form.originalMark} /></Grid>
          <Grid size={12}><TextField label="Reason" fullWidth multiline minRows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Grid>
        </Grid>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handleSubmit}>Submit Request</Button>
          <Button variant="outlined" onClick={() => setForm(emptyForm)}>Cancel</Button>
        </Stack>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Request History</Typography>
      <DataTable<GradeChangeRequest>
        pagination
        columns={[
          { key: "studentRollNo", label: "Roll No" },
          { key: "courseId", label: "Course" },
          { key: "assessment", label: "Assessment" },
          { key: "change", label: "Original → Proposed", render: (row) => `${row.originalMark} → ${row.proposedMark}` },
          { key: "raisedOn", label: "Raised On" },
          { key: "hodStatus", label: "HOD Status", render: (row) => <StatusChip status={row.hodStatus} /> },
          { key: "deanStatus", label: "Dean Status", render: (row) => row.deanStatus ? <StatusChip status={row.deanStatus} /> : "—" },
        ]}
        rows={rows}
        emptyTitle="No grade change requests"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 3: Create `src/pages/teacher/ResourceRequests.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Grid, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getResourceRequests, addResourceRequest } from "@/api/teacherRequests";
import type { ResourceRequest } from "@/types";

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

const resourceTypes = ["Lab Equipment", "Software License", "Books", "IT Infrastructure", "Other"];
const emptyForm = { resourceType: resourceTypes[0], description: "", justification: "", estimatedCost: 0, requiredBy: "" };

const availability = [
  { resource: "Laptops", available: "4/10", status: "Limited" },
  { resource: "MATLAB Licenses", available: "∞", status: "Available" },
  { resource: "Oscilloscopes", available: "2/5", status: "Limited" },
  { resource: "3D Printers", available: "1/3", status: "Limited" },
];

export default function ResourceRequests() {
  const [rows, setRows] = useState<ResourceRequest[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getResourceRequests().then(setRows);
  useEffect(() => { load(); }, []);

  const handleSubmit = () => {
    addResourceRequest(form).then(() => { load(); setForm(emptyForm); setSnackbar("Resource request submitted"); });
  };

  return (
    <>
      <PageHeader eyebrow="Requests" title="Resource Requests" />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>New Resource Request</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Resource Type</InputLabel>
              <Select label="Resource Type" value={form.resourceType} onChange={(e: SelectChangeEvent) => setForm({ ...form, resourceType: e.target.value })}>
                {resourceTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Required By" type="date" fullWidth value={form.requiredBy} onChange={(e) => setForm({ ...form, requiredBy: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid size={12}><TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
          <Grid size={12}><TextField label="Justification" fullWidth multiline minRows={2} value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Estimated Cost (₹)" type="number" fullWidth value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value) })} /></Grid>
        </Grid>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handleSubmit}>Submit Request</Button>
          <Button variant="outlined" onClick={() => setForm(emptyForm)}>Cancel</Button>
        </Stack>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Resource Availability</Typography>
      <DataTable
        columns={[
          { key: "resource", label: "Resource" },
          { key: "available", label: "Available" },
          { key: "status", label: "Status" },
        ]}
        rows={availability}
        emptyTitle="No data"
      />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 4, mb: 1.5 }}>Your Resource Requests</Typography>
      <DataTable<ResourceRequest>
        pagination
        columns={[
          { key: "description", label: "Resource" },
          { key: "resourceType", label: "Type" },
          { key: "estimatedCost", label: "Cost", render: (row) => formatINR(row.estimatedCost) },
          { key: "hodStatus", label: "HOD Status", render: (row) => <StatusChip status={row.hodStatus} /> },
          { key: "deanStatus", label: "Dean Status", render: (row) => row.deanStatus ? <StatusChip status={row.deanStatus} /> : "—" },
        ]}
        rows={rows}
        emptyTitle="No resource requests"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/pages/teacher/LeaveRequests.tsx src/pages/teacher/GradeChangeRequests.tsx src/pages/teacher/ResourceRequests.tsx
git commit -m "Add Leave, Grade Change, and Resource Requests pages"
```

---

### Task 22: Notices page

**Files:**
- Create: `src/pages/teacher/Notices.tsx`

**Interfaces:**
- Consumes: `getTeacherNotices`, `addTeacherNotice` (Task 7).

- [ ] **Step 1: Create `src/pages/teacher/Notices.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Button, MenuItem, Select, InputLabel, FormControl, Stack, TextField, Typography, Paper, Grid, Snackbar, type SelectChangeEvent } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getTeacherNotices, addTeacherNotice } from "@/api/teacherNotices";
import type { TeacherNotice, TeacherNoticeAudience } from "@/types";

const audienceLabels: Record<TeacherNoticeAudience, string> = { my_courses: "My Courses", department: "Department", institute: "Institute-wide" };
const emptyForm = { title: "", content: "", audience: "my_courses" as TeacherNoticeAudience, priority: "normal" as TeacherNotice["priority"], expiryDate: "" };

export default function Notices() {
  const [rows, setRows] = useState<TeacherNotice[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getTeacherNotices().then(setRows);
  useEffect(() => { load(); }, []);

  const handlePublish = () => {
    addTeacherNotice({ ...form, id: `TNOT-${Date.now()}`, publishedDate: new Date().toISOString().slice(0, 10), views: 0 }).then(() => {
      load(); setForm(emptyForm); setSnackbar("Notice published successfully!");
    });
  };

  return (
    <>
      <PageHeader eyebrow="Communication" title="Notices & Announcements" />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>New Notice</Typography>
        <Grid container spacing={2.5}>
          <Grid size={12}><TextField label="Title" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Grid>
          <Grid size={12}><TextField label="Content" fullWidth multiline minRows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Audience</InputLabel>
              <Select label="Audience" value={form.audience} onChange={(e: SelectChangeEvent) => setForm({ ...form, audience: e.target.value as TeacherNoticeAudience })}>
                <MenuItem value="my_courses">My Courses</MenuItem>
                <MenuItem value="department">Department</MenuItem>
                <MenuItem value="institute">Institute-wide</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select label="Priority" value={form.priority} onChange={(e: SelectChangeEvent) => setForm({ ...form, priority: e.target.value as TeacherNotice["priority"] })}>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField label="Expiry Date" type="date" fullWidth value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
        </Grid>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handlePublish}>Publish Notice</Button>
          <Button variant="outlined" onClick={() => setSnackbar("Saved as draft")}>Save as Draft</Button>
        </Stack>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Published Notices</Typography>
      <DataTable<TeacherNotice>
        pagination
        columns={[
          { key: "title", label: "Title" },
          { key: "publishedDate", label: "Date" },
          { key: "audience", label: "Audience", render: (row) => audienceLabels[row.audience] },
          { key: "views", label: "Views" },
          { key: "actions", label: "Action", render: () => <Button size="small" onClick={() => setSnackbar("Opening notice editor...")}>Edit</Button> },
        ]}
        rows={rows}
        emptyTitle="No notices published"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/teacher/Notices.tsx
git commit -m "Add Notices page"
```

---

### Task 23: Messages page

**Files:**
- Create: `src/pages/teacher/Messages.tsx`

**Interfaces:**
- Consumes: `getMessageContacts`, `getMessagesForContact`, `sendMessage` (Task 8).

- [ ] **Step 1: Create `src/pages/teacher/Messages.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Box, Button, TextField, Typography, Paper, Stack, List, ListItemButton, ListItemText, Avatar } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { PageHeader } from "@/components/PageHeader";
import { getMessageContacts, getMessagesForContact, sendMessage } from "@/api/teacherMessages";
import type { MessageContact, Message } from "@/types";

export default function Messages() {
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    getMessageContacts().then((data) => {
      setContacts(data);
      if (data.length > 0) setActiveId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (activeId) getMessagesForContact(activeId).then(setThread);
  }, [activeId]);

  const handleSend = () => {
    if (!activeId || !draft.trim()) return;
    sendMessage(activeId, draft).then(() => {
      getMessagesForContact(activeId).then(setThread);
      setDraft("");
    });
  };

  const activeContact = contacts.find((c) => c.id === activeId);

  return (
    <>
      <PageHeader eyebrow="Communication" title="Messages" />
      <Paper elevation={0} sx={{ display: "flex", height: 520, overflow: "hidden" }}>
        <Box sx={{ width: 280, borderRight: 1, borderColor: "divider", overflowY: "auto" }}>
          <List disablePadding>
            {contacts.map((c) => (
              <ListItemButton key={c.id} selected={c.id === activeId} onClick={() => setActiveId(c.id)}>
                <Avatar sx={{ width: 32, height: 32, mr: 1.5, fontSize: 14 }}>{c.name[0]}</Avatar>
                <ListItemText primary={c.name} secondary={c.role} />
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="subtitle1" fontWeight={600}>{activeContact?.name}</Typography>
            <Typography variant="caption" color="text.secondary">{activeContact?.role}</Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {thread.map((m) => (
              <Box key={m.id} sx={{ alignSelf: m.fromMe ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: m.fromMe ? "primary.main" : "action.hover", color: m.fromMe ? "primary.contrastText" : "text.primary" }}>
                  <Typography variant="body2">{m.text}</Typography>
                </Paper>
                <Typography variant="caption" color="text.secondary">{m.timestamp}</Typography>
              </Box>
            ))}
          </Box>
          <Stack direction="row" spacing={1} sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <TextField size="small" fullWidth placeholder="Type a message..." value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} />
            <Button variant="contained" onClick={handleSend} startIcon={<SendIcon />}>Send</Button>
          </Stack>
        </Box>
      </Paper>
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/teacher/Messages.tsx
git commit -m "Add Messages page"
```

---

### Task 24: Document Signatures page

**Files:**
- Create: `src/pages/teacher/DocumentSignatures.tsx`

**Interfaces:**
- Consumes: `getTeacherDocuments`, `signTeacherDocument` (Task 9).

- [ ] **Step 1: Create `src/pages/teacher/DocumentSignatures.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography, Grid, LinearProgress, Snackbar } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArchiveIcon from "@mui/icons-material/Archive";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getTeacherDocuments, signTeacherDocument } from "@/api/teacherDocuments";
import type { TeacherDocument } from "@/types";

type Tab = "all" | "assigned" | "sent" | "completed";

export default function DocumentSignatures() {
  const { mode } = useColorMode();
  const [rows, setRows] = useState<TeacherDocument[]>([]);
  const [tab, setTab] = useState<Tab>("assigned");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getTeacherDocuments().then(setRows);
  useEffect(() => { load(); }, []);

  const assignedToMe = rows.filter((d) => d.direction === "assigned_to_me" && d.status !== "completed");
  const sentByMe = rows.filter((d) => d.direction === "sent_by_me");
  const completed = rows.filter((d) => d.status === "completed");

  const filtered = tab === "all" ? rows : tab === "assigned" ? assignedToMe : tab === "sent" ? sentByMe : completed;

  const handleSign = (id: string) => signTeacherDocument(id).then(() => { load(); setSnackbar("Document signed successfully"); });

  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="Document Signatures"
        action={<Button variant="contained" onClick={() => setSnackbar("Opening document initiation form...")}>+ Initiate New Document</Button>}
      />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Assigned to Me" icon={<DescriptionIcon />} color={getIconAccent(mode, "assigned")} numericValue={assignedToMe.length} onClick={() => setTab("assigned")} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Sent by Me" icon={<SendIcon />} color={getIconAccent(mode, "sent")} numericValue={sentByMe.length} onClick={() => setTab("sent")} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Completed" icon={<CheckCircleIcon />} color={getIconAccent(mode, "completed")} numericValue={completed.length} onClick={() => setTab("completed")} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Archived" icon={<ArchiveIcon />} color={getIconAccent(mode, "archived")} numericValue={rows.length} onClick={() => setTab("all")} /></Grid>
      </Grid>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {(["all", "assigned", "sent", "completed"] as Tab[]).map((t) => (
          <Button key={t} variant={tab === t ? "contained" : "outlined"} size="small" onClick={() => setTab(t)}>
            {t === "all" ? "All Documents" : t === "assigned" ? "Assigned to Me" : t === "sent" ? "Sent by Me" : "Completed"}
          </Button>
        ))}
      </Stack>

      <DataTable<TeacherDocument>
        pagination
        columns={[
          { key: "title", label: "Document" },
          { key: "docType", label: "Type" },
          { key: "fromName", label: "From" },
          { key: "initiatedDate", label: "Initiated" },
          { key: "priority", label: "Priority", render: (row) => <StatusChip status={row.priority === "urgent" ? "urgent" : row.priority === "high" ? "high" : "medium"} /> },
          {
            key: "status", label: "Status",
            render: (row) => row.direction === "sent_by_me" && row.status === "in_progress"
              ? <Box sx={{ minWidth: 100 }}><LinearProgress variant="determinate" value={row.progressPct ?? 0} /><Typography variant="caption">{row.progressPct}%</Typography></Box>
              : <StatusChip status={row.status} />,
          },
          {
            key: "actions", label: "Action",
            render: (row) => row.direction === "assigned_to_me" && row.status === "pending"
              ? <Button size="small" variant="contained" onClick={() => handleSign(row.id)}>Review & Sign</Button>
              : <Button size="small" onClick={() => setSnackbar("Loading signature history...")}>History</Button>,
          },
        ]}
        rows={filtered}
        emptyTitle="No documents found"
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/teacher/DocumentSignatures.tsx
git commit -m "Add Document Signatures page"
```

---

### Task 25: Navigation + router wiring

**Files:**
- Modify: `src/components/navigation.tsx`
- Modify: `src/router.tsx`

- [ ] **Step 1: Replace the `"teacher"` case in `navigation.tsx`**

Find:

```tsx
    case "teacher":
      return [{ label: "Dashboard", path: "/teacher", icon: <DashboardIcon /> }];
```

Replace with:

```tsx
    case "teacher":
      return [
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
      ];
```

Add the 12 new icon imports (some — `MenuBookIcon`, `EventNoteIcon`, `GradingIcon`, `AssessmentIcon`, `GroupsIcon`, `AccountBalanceIcon`, `CampaignIcon`, `HistoryEduIcon` — already exist from Admin phases and are reused as-is; only these are new):

```tsx
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PublicIcon from "@mui/icons-material/Public";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import RuleIcon from "@mui/icons-material/Rule";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ChatIcon from "@mui/icons-material/Chat";
```

- [ ] **Step 2: Add the Provider wiring note (no code change yet)**

`TeacherRoleContext.Provider` is NOT added to `Layout.tsx` in this phase (no switcher UI exists yet, so the context's default value — `role: "professor"` — is used directly via `useTeacherRole()`'s default). Phase 2b adds the actual `<TeacherRoleContext.Provider value={useTeacherRoleState()}>` wrapper.

- [ ] **Step 3: Add the 15 new lazy imports to `router.tsx`**

Add to the existing lazy-import block:

```tsx
const TeacherMyCourses = lazy(() => import("@/pages/teacher/MyCourses"));
const TeacherAttendance = lazy(() => import("@/pages/teacher/Attendance"));
const TeacherInternalMarks = lazy(() => import("@/pages/teacher/InternalMarks"));
const TeacherExams = lazy(() => import("@/pages/teacher/Exams"));
const TeacherCourseMaterials = lazy(() => import("@/pages/teacher/CourseMaterials"));
const TeacherMyCourseStudents = lazy(() => import("@/pages/teacher/MyCourseStudents"));
const TeacherDepartmentStudents = lazy(() => import("@/pages/teacher/DepartmentStudents"));
const TeacherAcademicCohort = lazy(() => import("@/pages/teacher/AcademicCohort"));
const TeacherStudentPerformance = lazy(() => import("@/pages/teacher/StudentPerformance"));
const TeacherLeaveRequests = lazy(() => import("@/pages/teacher/LeaveRequests"));
const TeacherGradeChangeRequests = lazy(() => import("@/pages/teacher/GradeChangeRequests"));
const TeacherResourceRequests = lazy(() => import("@/pages/teacher/ResourceRequests"));
const TeacherNotices = lazy(() => import("@/pages/teacher/Notices"));
const TeacherMessages = lazy(() => import("@/pages/teacher/Messages"));
const TeacherDocumentSignatures = lazy(() => import("@/pages/teacher/DocumentSignatures"));
```

- [ ] **Step 4: Add the 15 new routes**

Find:

```tsx
      { path: "teacher", element: <TeacherDashboard /> },
      { path: "staff", element: <StaffDashboard /> },
```

Replace with:

```tsx
      { path: "teacher", element: <TeacherDashboard /> },
      { path: "teacher/courses", element: <TeacherMyCourses /> },
      { path: "teacher/attendance", element: <TeacherAttendance /> },
      { path: "teacher/marks", element: <TeacherInternalMarks /> },
      { path: "teacher/exams", element: <TeacherExams /> },
      { path: "teacher/materials", element: <TeacherCourseMaterials /> },
      { path: "teacher/students", element: <TeacherMyCourseStudents /> },
      { path: "teacher/dept-students", element: <TeacherDepartmentStudents /> },
      { path: "teacher/cohort", element: <TeacherAcademicCohort /> },
      { path: "teacher/performance", element: <TeacherStudentPerformance /> },
      { path: "teacher/leave", element: <TeacherLeaveRequests /> },
      { path: "teacher/grade-change", element: <TeacherGradeChangeRequests /> },
      { path: "teacher/resources", element: <TeacherResourceRequests /> },
      { path: "teacher/notices", element: <TeacherNotices /> },
      { path: "teacher/messages", element: <TeacherMessages /> },
      { path: "teacher/documents", element: <TeacherDocumentSignatures /> },
      { path: "staff", element: <StaffDashboard /> },
```

- [ ] **Step 5: Verify the full project builds**

Run: `npm run build`
Expected: `tsc -b` reports no errors, `vite build` completes.

- [ ] **Step 6: Commit**

```bash
git add src/components/navigation.tsx src/router.tsx
git commit -m "Wire Teacher Core/Academics/Students/Requests/Communication navigation and routes"
```

---

### Task 26: End-to-end manual verification

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Log in as Teacher and verify the sidebar groups**

Confirm Academics/Students/Requests/Communication groups all render
with the expected items.

- [ ] **Step 3: Verify Attendance and Internal Marks**

Select a course, submit attendance/marks, confirm it appears in the
history table below with correct per-record "View" detail (not
constant placeholder numbers).

- [ ] **Step 4: Verify Requests**

Submit a Leave Request, Grade Change Request, and Resource Request;
confirm each appears in its own history table with `pending_approval`
status.

- [ ] **Step 5: Verify Notices and Messages**

Publish a notice, confirm it appears in the table. Click between the 3
message contacts and confirm each shows its own distinct thread; send
a message and confirm it appears immediately.

- [ ] **Step 6: Verify Document Signatures**

Confirm the 4 KPI/tab cards work, and "Review & Sign" on a
pending document advances it to Completed.

- [ ] **Step 7: Verify Department Students / Academic Cohort access gating**

Confirm both show "Access Denied" (no role-switcher exists yet in this
phase).

- [ ] **Step 8: Verify Student Performance charts**

Confirm both charts render as real bar/line charts, not text
placeholders.

- [ ] **Step 9: Verify dark mode**

Toggle dark mode and spot-check several of the 16 pages.

- [ ] **Step 10: Run the linter**

Run: `npm run lint`
Expected: no errors (only the pre-existing `AuthContext.tsx` warning).

- [ ] **Step 11: Stop the dev server, then commit**

Only if Step 10 required fixes:

```bash
git add -A
git commit -m "Verify Phase 2a end-to-end"
```
