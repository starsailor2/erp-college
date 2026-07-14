# Admin Academic Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 1b of the Admin portal — Attendance, Timetable, Exams, and Results — reusing Phase 1a's students/faculty/courses/departments, and regroup the admin sidebar now that it has grown to 11 items.

**Architecture:** Same as Phase 1a: demo-data generator modules (some newly seeded, some pure derivations of existing Phase 1a data) → thin `api/*.ts` Promise wrappers → page components that fetch via the API layer and use synchronous demo-data helpers for cheap inline lookups.

**Tech Stack:** Same as Phase 0/1a — no new dependencies.

## Global Constraints

- All new pages live under `app/src/pages/admin/`; all new demo-data under `app/src/demo-data/{attendance,academics}/`; all new API modules under `app/src/api/`. (Every path below is relative to `app/`.)
- Filters/search must actually filter (client-side, over the in-memory array). Term filters (Timetable's Fall/Spring/Summer, Results' Fall/Spring/Summer) are dropped entirely rather than shipped as no-op controls — there's no term concept in the data model.
- Edit dialogs show the clicked row's own data (Exams) — never a fixed hardcoded sample. Same fix already applied in Phase 1a.
- Mutations (`addTimetableEntry`, `updateExam`) mutate the in-memory array directly and resolve through `simulateRequest`, matching Phase 0/1a.
- Demo data scale: today-attendance = 500 rows (1 per student); leave requests = 20; timetable = 20 classes (5 departments × 4 years); exams = 50 (1 per course); marks ≈ 2,500 (1 per student × enrolled course).
- Grade thresholds (0-100 `marksObtained` scale): ≥90 "A+", ≥80 "A", ≥70 "B", ≥60 "C", below 60 "D".
- Synchronous demo-data helpers (e.g. `getCourseById`, `getFacultyById`, `getMarksByStudent`, `getStudentRank`) may be called directly inside a render for cheap inline lookups/computation — reserved for that; each page's own primary rows still come from the async `api/*` layer.
- Stub actions (Export, Audit Log, Publish Schedule/Results, Mark Attendance's "Continue") show a notification via MUI `Snackbar` — no real file or state change, matching the original's stub behavior.

---

### Task 1: Type definitions

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: `AttendanceRecord`, `LeaveStatus`, `LeaveRequest`, `TimetableSlotType`, `TimetableEntry`, `TimetableClass`, `ExamType`, `Exam`, `Mark` — consumed by every task below.

- [ ] **Step 1: Append the Academic Operations types to `src/types/index.ts`**

Add at the end of the existing file:

```ts

// --- Admin / Academic Operations (Phase 1b) ---

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // ISO date - "today" for this seed
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
  courseId?: string; // set when type === "class" and tied to a real course
  facultyId?: string; // set alongside courseId
  label?: string; // display text for break/lunch rows, or generic (non-course) class slots like "Lab Session" / "Tutorial"
  room?: string; // only set for user-added entries via the Add Schedule modal
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
  grade: string; // "A+" | "A" | "B" | "C" | "D"
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "Add Admin/Academic-Operations type definitions"
```

---

### Task 2: Attendance and leave-request demo data + API

**Files:**
- Create: `src/demo-data/attendance/todayAttendance.ts`
- Create: `src/demo-data/attendance/leaveRequests.ts`
- Create: `src/api/attendance.ts`
- Create: `src/api/leaveRequests.ts`

**Interfaces:**
- Consumes: `AttendanceRecord`, `LeaveRequest`, `LeaveStatus` from `@/types` (Task 1); `students` from `@/demo-data/people/students` (Phase 1a); `createRng` from `@/demo-data/generators/random` (Phase 0, per the RNG-independence fix — each module gets its own seed).
- Produces: `todayAttendance: AttendanceRecord[]`, `getTodayAttendanceStats(): { present: number; total: number; pct: number }` from `todayAttendance.ts`; `leaveRequests: LeaveRequest[]`, `getPendingLeaveRequestCount(): number` from `leaveRequests.ts`; `getTodayAttendance(): Promise<AttendanceRecord[]>`, `getAttendanceStats(): Promise<{ present: number; total: number; pct: number }>` from `api/attendance.ts`; `getLeaveRequests(): Promise<LeaveRequest[]>`, `getPendingLeaveCount(): Promise<number>` from `api/leaveRequests.ts` — used by Task 6's Attendance page.

- [ ] **Step 1: Create `src/demo-data/attendance/todayAttendance.ts`**

```ts
import type { AttendanceRecord } from "@/types";
import { students } from "@/demo-data/people/students";
import { createRng } from "@/demo-data/generators/random";

const { weightedPick } = createRng(90260711);

function generateTodayAttendance(): AttendanceRecord[] {
  const today = new Date().toISOString().slice(0, 10);
  return students.map((s, i) => ({
    id: `att-${i + 1}`,
    studentId: s.id,
    date: today,
    status: weightedPick<"present" | "absent">([["present", 89], ["absent", 11]]),
  }));
}

export const todayAttendance: AttendanceRecord[] = generateTodayAttendance();

export function getTodayAttendanceStats(): { present: number; total: number; pct: number } {
  const present = todayAttendance.filter((a) => a.status === "present").length;
  const total = todayAttendance.length;
  return { present, total, pct: Math.round((present / total) * 1000) / 10 };
}
```

- [ ] **Step 2: Create `src/demo-data/attendance/leaveRequests.ts`**

```ts
import type { LeaveRequest, LeaveStatus } from "@/types";
import { students } from "@/demo-data/people/students";
import { createRng } from "@/demo-data/generators/random";

const { pick, randomInt, weightedPick } = createRng(90260712);

const reasons = ["Medical leave", "Family function", "Personal reasons", "Sick leave", "Travel", "Bereavement"];
const statuses: [LeaveStatus, number][] = [["pending", 4], ["approved", 5], ["rejected", 1]];

const LEAVE_REQUEST_COUNT = 20;

function generateLeaveRequests(): LeaveRequest[] {
  const list: LeaveRequest[] = [];
  for (let i = 0; i < LEAVE_REQUEST_COUNT; i++) {
    const student = pick(students);
    const fromDay = randomInt(1, 20);
    const duration = randomInt(1, 4);
    list.push({
      id: `leave-${i + 1}`,
      studentId: student.id,
      fromDate: `2026-07-${String(fromDay).padStart(2, "0")}`,
      toDate: `2026-07-${String(fromDay + duration).padStart(2, "0")}`,
      reason: pick(reasons),
      status: weightedPick(statuses),
    });
  }
  return list;
}

export const leaveRequests: LeaveRequest[] = generateLeaveRequests();

export function getPendingLeaveRequestCount(): number {
  return leaveRequests.filter((l) => l.status === "pending").length;
}
```

- [ ] **Step 3: Create `src/api/attendance.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { todayAttendance, getTodayAttendanceStats } from "@/demo-data/attendance/todayAttendance";
import type { AttendanceRecord } from "@/types";

export function getTodayAttendance(): Promise<AttendanceRecord[]> {
  return simulateRequest(todayAttendance);
}

export function getAttendanceStats(): Promise<{ present: number; total: number; pct: number }> {
  return simulateRequest(getTodayAttendanceStats());
}
```

- [ ] **Step 4: Create `src/api/leaveRequests.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { leaveRequests, getPendingLeaveRequestCount } from "@/demo-data/attendance/leaveRequests";
import type { LeaveRequest } from "@/types";

export function getLeaveRequests(): Promise<LeaveRequest[]> {
  return simulateRequest(leaveRequests);
}

export function getPendingLeaveCount(): Promise<number> {
  return simulateRequest(getPendingLeaveRequestCount());
}
```

- [ ] **Step 5: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/demo-data/attendance/todayAttendance.ts src/demo-data/attendance/leaveRequests.ts src/api/attendance.ts src/api/leaveRequests.ts
git commit -m "Add attendance and leave-request demo data and API"
```

---

### Task 3: Timetable demo data + API

**Files:**
- Create: `src/demo-data/academics/timetable.ts`
- Create: `src/api/timetable.ts`

**Interfaces:**
- Consumes: `TimetableClass`, `TimetableEntry` from `@/types` (Task 1); `departmentSeeds` from `@/demo-data/academics/departmentSeeds` (Phase 1a); `courses`, `getCourseLevel` from `@/demo-data/academics/courses` (Phase 1a).
- Produces: `timetableClasses: TimetableClass[]`, `getTimetableClassById(id): TimetableClass | undefined` from `timetable.ts`; `getTimetableClasses(): Promise<TimetableClass[]>`, `getTimetableClassByIdAsync(id): Promise<TimetableClass | undefined>`, `addTimetableEntry(classId, entry): Promise<TimetableEntry>` from `api/timetable.ts` — used by Task 7's Timetable page.

- [ ] **Step 1: Create `src/demo-data/academics/timetable.ts`**

```ts
import type { TimetableClass, TimetableEntry } from "@/types";
import { departmentSeeds } from "./departmentSeeds";
import { courses, getCourseLevel } from "./courses";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DAY_SLOT_TEMPLATE: { time: string; type: "class" | "break" | "lunch" }[] = [
  { time: "09:00 - 10:00", type: "class" },
  { time: "10:00 - 11:00", type: "class" },
  { time: "11:00 - 11:15", type: "break" },
  { time: "11:15 - 12:15", type: "class" },
  { time: "12:15 - 13:00", type: "lunch" },
  { time: "13:00 - 14:00", type: "class" },
  { time: "14:00 - 15:00", type: "class" },
];

function buildEntriesForClass(departmentId: string, year: 1 | 2 | 3 | 4): TimetableEntry[] {
  const level = year * 100;
  const yearCourses = courses.filter((c) => c.departmentId === departmentId && getCourseLevel(c) === level);
  const pool = yearCourses.length > 0 ? yearCourses : courses.filter((c) => c.departmentId === departmentId);

  const entries: TimetableEntry[] = [];
  let courseCursor = 0;

  for (const day of DAYS) {
    let classSlotIndex = 0;
    for (const slot of DAY_SLOT_TEMPLATE) {
      if (slot.type === "break") {
        entries.push({ day, time: slot.time, type: "break", label: "Break" });
      } else if (slot.type === "lunch") {
        entries.push({ day, time: slot.time, type: "lunch", label: "Lunch Break" });
      } else if (day === "Saturday") {
        entries.push({ day, time: slot.time, type: "class", label: "Lab Session" });
        classSlotIndex++;
      } else if (day === "Friday" && classSlotIndex >= 3) {
        entries.push({ day, time: slot.time, type: "class", label: "Tutorial" });
        classSlotIndex++;
      } else {
        const course = pool[courseCursor % pool.length];
        courseCursor++;
        entries.push({ day, time: slot.time, type: "class", courseId: course.id, facultyId: course.instructorFacultyId });
        classSlotIndex++;
      }
    }
  }
  return entries;
}

function generateTimetableClasses(): TimetableClass[] {
  const list: TimetableClass[] = [];
  for (const dept of departmentSeeds) {
    for (let year = 1; year <= 4; year++) {
      const y = year as 1 | 2 | 3 | 4;
      list.push({
        id: `${dept.id}-Y${y}`,
        departmentId: dept.id,
        year: y,
        entries: buildEntriesForClass(dept.id, y),
      });
    }
  }
  return list;
}

export const timetableClasses: TimetableClass[] = generateTimetableClasses();

export function getTimetableClassById(id: string): TimetableClass | undefined {
  return timetableClasses.find((t) => t.id === id);
}
```

Note: this generator uses no randomness (deterministic by construction from
existing courses/departments), so it needs no `createRng` seed.

- [ ] **Step 2: Create `src/api/timetable.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { timetableClasses, getTimetableClassById } from "@/demo-data/academics/timetable";
import type { TimetableClass, TimetableEntry } from "@/types";

export function getTimetableClasses(): Promise<TimetableClass[]> {
  return simulateRequest(timetableClasses);
}

export function getTimetableClassByIdAsync(id: string): Promise<TimetableClass | undefined> {
  return simulateRequest(getTimetableClassById(id));
}

export function addTimetableEntry(classId: string, entry: TimetableEntry): Promise<TimetableEntry> {
  const cls = timetableClasses.find((c) => c.id === classId);
  if (cls) cls.entries.push(entry);
  return simulateRequest(entry);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/academics/timetable.ts src/api/timetable.ts
git commit -m "Add timetable demo data and API"
```

---

### Task 4: Exams demo data + API

**Files:**
- Create: `src/demo-data/academics/exams.ts`
- Create: `src/api/exams.ts`

**Interfaces:**
- Consumes: `Exam`, `ExamType` from `@/types` (Task 1); `courses` from `@/demo-data/academics/courses` (Phase 1a); `students` from `@/demo-data/people/students` (Phase 1a); `createRng` from `@/demo-data/generators/random`.
- Produces: `exams: Exam[]`, `getExamById(id): Exam | undefined` from `exams.ts`; `getExams(): Promise<Exam[]>`, `getExamByIdAsync(id): Promise<Exam | undefined>`, `updateExam(id, updates): Promise<Exam | undefined>` from `api/exams.ts` — used by Task 8's Exams page and Task 10's Dashboard update.

- [ ] **Step 1: Create `src/demo-data/academics/exams.ts`**

```ts
import type { Exam, ExamType } from "@/types";
import { courses } from "./courses";
import { students } from "@/demo-data/people/students";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick } = createRng(90260713);

const examTypes: [ExamType, number][] = [["written", 6], ["lab", 2], ["online", 1], ["practical", 1]];
const timeSlots: [string, string][] = [["09:00", "12:00"], ["13:00", "16:00"], ["14:00", "17:00"]];
const venuesWithCapacity: [string, number][] = [
  ["Hall A (Capacity: 200)", 200],
  ["Hall B (Capacity: 150)", 150],
  ["Hall C (Capacity: 50)", 50],
  ["Lab 1 (Capacity: 45)", 45],
  ["Lab 2 (Capacity: 45)", 45],
  ["Lab 3 (Capacity: 45)", 45],
  ["Remote Proctoring", 999],
];

function generateExams(): Exam[] {
  return courses.map((course, i) => {
    const day = 10 + (i % 15); // spreads across Dec 10-24
    const enrolledCount = students.filter((s) => s.courseIds.includes(course.id)).length;
    const [venue, capacity] = venuesWithCapacity[i % venuesWithCapacity.length];
    const [startTime, endTime] = pick(timeSlots);
    return {
      id: `exam-${i + 1}`,
      courseId: course.id,
      date: `2026-12-${String(day).padStart(2, "0")}`,
      startTime,
      endTime,
      type: weightedPick(examTypes),
      venue,
      capacity,
      enrolledCount,
      conflict: i === 1,
      capacityWarning: i === 4,
    };
  });
}

export const exams: Exam[] = generateExams();

export function getExamById(id: string): Exam | undefined {
  return exams.find((e) => e.id === id);
}
```

- [ ] **Step 2: Create `src/api/exams.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { exams, getExamById } from "@/demo-data/academics/exams";
import type { Exam } from "@/types";

export function getExams(): Promise<Exam[]> {
  return simulateRequest(exams);
}

export function getExamByIdAsync(id: string): Promise<Exam | undefined> {
  return simulateRequest(getExamById(id));
}

export function updateExam(id: string, updates: Partial<Exam>): Promise<Exam | undefined> {
  const idx = exams.findIndex((e) => e.id === id);
  if (idx !== -1) exams[idx] = { ...exams[idx], ...updates };
  return simulateRequest(exams[idx]);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/academics/exams.ts src/api/exams.ts
git commit -m "Add exams demo data and API"
```

---

### Task 5: Marks demo data + API

**Files:**
- Create: `src/demo-data/academics/marks.ts`
- Create: `src/api/marks.ts`

**Interfaces:**
- Consumes: `Mark` from `@/types` (Task 1); `students` from `@/demo-data/people/students` (Phase 1a); `createRng` from `@/demo-data/generators/random`.
- Produces: `marks: Mark[]`, `getMarksByStudent(studentId): Mark[]`, `getStudentRank(studentId): { rank: number; cohortSize: number }` from `marks.ts`; `getMarks(): Promise<Mark[]>`, `getMarksByStudentAsync(studentId): Promise<Mark[]>`, `getStudentRankAsync(studentId): Promise<{ rank: number; cohortSize: number }>` from `api/marks.ts` — used by Task 9's Results page (via the sync helpers directly, per the Global Constraints' inline-lookup allowance).

- [ ] **Step 1: Create `src/demo-data/academics/marks.ts`**

```ts
import type { Mark } from "@/types";
import { students } from "@/demo-data/people/students";
import { createRng } from "@/demo-data/generators/random";

const { randomInt } = createRng(90260714);

function gradeForMarks(marksObtained: number): string {
  if (marksObtained >= 90) return "A+";
  if (marksObtained >= 80) return "A";
  if (marksObtained >= 70) return "B";
  if (marksObtained >= 60) return "C";
  return "D";
}

function generateMarks(): Mark[] {
  const list: Mark[] = [];
  let seq = 1;
  for (const student of students) {
    for (const courseId of student.courseIds) {
      const marksObtained = randomInt(55, 98);
      list.push({
        id: `mark-${seq}`,
        studentId: student.id,
        courseId,
        marksObtained,
        maxMarks: 100,
        grade: gradeForMarks(marksObtained),
      });
      seq++;
    }
  }
  return list;
}

export const marks: Mark[] = generateMarks();

export function getMarksByStudent(studentId: string): Mark[] {
  return marks.filter((m) => m.studentId === studentId);
}

export function getStudentRank(studentId: string): { rank: number; cohortSize: number } {
  const student = students.find((s) => s.id === studentId);
  if (!student) return { rank: 0, cohortSize: 0 };
  const cohort = students
    .filter((s) => s.departmentId === student.departmentId && s.year === student.year)
    .sort((a, b) => b.cgpa - a.cgpa);
  const rank = cohort.findIndex((s) => s.id === studentId) + 1;
  return { rank, cohortSize: cohort.length };
}
```

- [ ] **Step 2: Create `src/api/marks.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { marks, getMarksByStudent, getStudentRank } from "@/demo-data/academics/marks";
import type { Mark } from "@/types";

export function getMarks(): Promise<Mark[]> {
  return simulateRequest(marks);
}

export function getMarksByStudentAsync(studentId: string): Promise<Mark[]> {
  return simulateRequest(getMarksByStudent(studentId));
}

export function getStudentRankAsync(studentId: string): Promise<{ rank: number; cohortSize: number }> {
  return simulateRequest(getStudentRank(studentId));
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/academics/marks.ts src/api/marks.ts
git commit -m "Add marks demo data and API"
```

---

### Task 6: Attendance page

**Files:**
- Create: `src/pages/admin/Attendance.tsx`

**Interfaces:**
- Consumes: `getAttendanceStats` from `@/api/attendance` (Task 2); `getPendingLeaveCount` from `@/api/leaveRequests` (Task 2); `students` from `@/demo-data/people/students` (Phase 1a, for the Weekly Average / Low Attendance Alerts computation); `courses` from `@/demo-data/academics/courses` (Phase 1a, for the Mark Attendance modal's Course select); `PageHeader`, `StatCard` from `@/components/*` (Phase 0).
- Produces: default export consumed by `router.tsx` (Task 11) at `/admin/attendance`.

- [ ] **Step 1: Create `src/pages/admin/Attendance.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, Typography, Grid, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getAttendanceStats } from "@/api/attendance";
import { getPendingLeaveCount } from "@/api/leaveRequests";
import { students } from "@/demo-data/people/students";
import { courses } from "@/demo-data/academics/courses";

const emptyForm = { courseId: courses[0]?.id ?? "", date: "2026-07-14", session: "Morning (9:00 AM - 12:00 PM)" };

export default function Attendance() {
  const { mode } = useColorMode();
  const [stats, setStats] = useState({ present: 0, total: 0, pct: 0 });
  const [pendingLeave, setPendingLeave] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getAttendanceStats().then((data) => { if (live) setStats(data); });
    getPendingLeaveCount().then((count) => { if (live) setPendingLeave(count); });
    return () => { live = false; };
  }, []);

  const weeklyAvg = students.length > 0
    ? Math.round((students.reduce((sum, s) => sum + s.attendancePct, 0) / students.length) * 10) / 10
    : 0;
  const lowAttendanceCount = students.filter((s) => s.attendancePct < 75).length;

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Attendance Overview"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Attendance Report... Download will start shortly.")}>Export Report</Button>
            <Button variant="contained" onClick={() => setDialogOpen(true)}>Mark Attendance</Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Attendance tracking system provides real-time attendance marking and tracking,
        student-wise and course-wise reports, low attendance alerts and notifications,
        biometric and manual entry integration, leave management and approvals, and
        automated percentage calculations.
      </Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Today's Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance-today")} value={`${stats.pct}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Weekly Average" icon={<TrendingUpIcon />} color={getIconAccent(mode, "attendance-weekly")} value={`${weeklyAvg}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Low Attendance Alerts" icon={<WarningAmberIcon />} color={getIconAccent(mode, "attendance-alerts")} numericValue={lowAttendanceCount} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Leave Requests" icon={<EventBusyIcon />} color={getIconAccent(mode, "leave-requests")} numericValue={pendingLeave} />
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark Attendance</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Course</InputLabel>
            <Select label="Course" value={form.courseId} onChange={(e: SelectChangeEvent) => setForm({ ...form, courseId: e.target.value })}>
              {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.id} - {c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth>
            <InputLabel>Session</InputLabel>
            <Select label="Session" value={form.session} onChange={(e: SelectChangeEvent) => setForm({ ...form, session: e.target.value })}>
              <MenuItem value="Morning (9:00 AM - 12:00 PM)">Morning (9:00 AM - 12:00 PM)</MenuItem>
              <MenuItem value="Afternoon (2:00 PM - 5:00 PM)">Afternoon (2:00 PM - 5:00 PM)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setDialogOpen(false); setSnackbar("Opening attendance sheet..."); }}>Continue</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors (router.tsx is not touched until Task 11, so this new page has no consumer yet, but tsc still type-checks it).

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Attendance.tsx
git commit -m "Add Attendance page"
```

---

### Task 7: Timetable page

**Files:**
- Create: `src/pages/admin/Timetable.tsx`

**Interfaces:**
- Consumes: `getTimetableClasses`, `addTimetableEntry` from `@/api/timetable` (Task 3); `getCourseById`, `getCoursesByDepartment` from `@/demo-data/academics/courses` (Phase 1a); `getFacultyById`, `getFacultyByDepartment` from `@/demo-data/people/faculty` (Phase 1a); `departmentSeeds` from `@/demo-data/academics/departmentSeeds` (Phase 1a).
- Produces: default export consumed by `router.tsx` (Task 11) at `/admin/timetable`.

- [ ] **Step 1: Create `src/pages/admin/Timetable.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Snackbar, type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { getTimetableClasses, addTimetableEntry } from "@/api/timetable";
import { getCourseById, getCoursesByDepartment } from "@/demo-data/academics/courses";
import { getFacultyById, getFacultyByDepartment } from "@/demo-data/people/faculty";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { TimetableClass, TimetableEntry } from "@/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ROW_TIMES = ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 11:15", "11:15 - 12:15", "12:15 - 13:00", "13:00 - 14:00", "14:00 - 15:00"];
const ADD_SLOT_TIMES = ["09:00 - 10:00", "10:00 - 11:00", "11:15 - 12:15", "13:00 - 14:00", "14:00 - 15:00"];

const emptyForm = { classId: "", day: "Monday", time: ADD_SLOT_TIMES[0], courseId: "", facultyId: "", room: "", type: "Lecture" };

function classLabel(cls: TimetableClass): string {
  return `${departmentSeeds.find((d) => d.id === cls.departmentId)?.name ?? cls.departmentId} - Year ${cls.year}`;
}

export default function Timetable() {
  const [classes, setClasses] = useState<TimetableClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getTimetableClasses().then((data) => {
    setClasses(data);
    setSelectedClassId((prev) => prev || data[0]?.id || "");
  });
  useEffect(() => { load(); }, []);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const cellFor = (day: string, time: string) => selectedClass?.entries.find((e) => e.day === day && e.time === time);

  const openAdd = () => { setForm({ ...emptyForm, classId: selectedClassId }); setDialogOpen(true); };

  const handleSave = () => {
    const entry: TimetableEntry = {
      day: form.day,
      time: form.time,
      type: "class",
      courseId: form.courseId || undefined,
      facultyId: form.facultyId || undefined,
      label: form.courseId ? undefined : form.type,
      room: form.room || undefined,
    };
    addTimetableEntry(form.classId, entry).then(load);
    setDialogOpen(false);
    setSnackbar("Schedule added successfully!");
  };

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Timetable Management"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Timetable... Download will start shortly.")}>Export</Button>
            <Button variant="contained" onClick={openAdd}>Add Schedule</Button>
          </Stack>
        }
      />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel>Class</InputLabel>
          <Select label="Class" value={selectedClassId} onChange={(e: SelectChangeEvent) => setSelectedClassId(e.target.value)}>
            {classes.map((c) => <MenuItem key={c.id} value={c.id}>{classLabel(c)}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              {DAYS.map((d) => <TableCell key={d}>{d}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {ROW_TIMES.map((time) => {
              const firstCell = cellFor("Monday", time);
              if (firstCell?.type === "break" || firstCell?.type === "lunch") {
                return (
                  <TableRow key={time}>
                    <TableCell>{time}</TableCell>
                    <TableCell colSpan={DAYS.length} sx={{ textAlign: "center", fontStyle: "italic", color: "text.secondary" }}>
                      {firstCell.label}
                    </TableCell>
                  </TableRow>
                );
              }
              return (
                <TableRow key={time}>
                  <TableCell>{time}</TableCell>
                  {DAYS.map((day) => {
                    const entry = cellFor(day, time);
                    if (!entry) return <TableCell key={day} />;
                    const course = entry.courseId ? getCourseById(entry.courseId) : undefined;
                    const instructor = entry.facultyId ? getFacultyById(entry.facultyId) : undefined;
                    return (
                      <TableCell key={day}>
                        <Typography variant="body2" fontWeight={600}>{course?.name ?? entry.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{instructor?.name ?? "All Faculty"}</Typography>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Schedule</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Class</InputLabel>
            <Select label="Class" value={form.classId} onChange={(e: SelectChangeEvent) => setForm({ ...form, classId: e.target.value, courseId: "", facultyId: "" })}>
              {classes.map((c) => <MenuItem key={c.id} value={c.id}>{classLabel(c)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Day</InputLabel>
            <Select label="Day" value={form.day} onChange={(e: SelectChangeEvent) => setForm({ ...form, day: e.target.value })}>
              {DAYS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Time Slot</InputLabel>
            <Select label="Time Slot" value={form.time} onChange={(e: SelectChangeEvent) => setForm({ ...form, time: e.target.value })}>
              {ADD_SLOT_TIMES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Subject</InputLabel>
            <Select label="Subject" value={form.courseId} onChange={(e: SelectChangeEvent) => setForm({ ...form, courseId: e.target.value })}>
              {getCoursesByDepartment(classes.find((c) => c.id === form.classId)?.departmentId ?? "").map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Faculty</InputLabel>
            <Select label="Faculty" value={form.facultyId} onChange={(e: SelectChangeEvent) => setForm({ ...form, facultyId: e.target.value })}>
              {getFacultyByDepartment(classes.find((c) => c.id === form.classId)?.departmentId ?? "").map((f) => (
                <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Room" placeholder="Room 301" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={form.type} onChange={(e: SelectChangeEvent) => setForm({ ...form, type: e.target.value })}>
              <MenuItem value="Lecture">Lecture</MenuItem>
              <MenuItem value="Lab">Lab</MenuItem>
              <MenuItem value="Tutorial">Tutorial</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Add Schedule</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors (router.tsx is not touched until Task 11, so this new page has no consumer yet, but tsc still type-checks it).

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Timetable.tsx
git commit -m "Add Timetable page"
```

---

### Task 8: Exams page

**Files:**
- Create: `src/pages/admin/Exams.tsx`

**Interfaces:**
- Consumes: `getExams`, `updateExam` from `@/api/exams` (Task 4); `getCourseById` from `@/demo-data/academics/courses` (Phase 1a); `departmentSeeds` from `@/demo-data/academics/departmentSeeds` (Phase 1a); `PageHeader`, `StatCard`, `DataTable` from `@/components/*` (Phase 0).
- Produces: default export consumed by `router.tsx` (Task 11) at `/admin/exams`.

- [ ] **Step 1: Create `src/pages/admin/Exams.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, Grid, Typography, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import GradingIcon from "@mui/icons-material/Grading";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ApartmentIcon from "@mui/icons-material/Apartment";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getExams, updateExam } from "@/api/exams";
import { getCourseById } from "@/demo-data/academics/courses";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { Exam, ExamType } from "@/types";

const emptyForm = { date: "", startTime: "", endTime: "", type: "written" as ExamType, venue: "", capacity: 0 };

export default function Exams() {
  const { mode } = useColorMode();
  const [rows, setRows] = useState<Exam[]>([]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getExams().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((e) => deptFilter === "all" || getCourseById(e.courseId)?.departmentId === deptFilter);

  const stats = {
    total: rows.length,
    scheduled: rows.filter((e) => !!e.date).length,
    conflicts: rows.filter((e) => e.conflict || e.capacityWarning).length,
    venues: new Set(rows.map((e) => e.venue)).size,
  };

  const openEdit = (exam: Exam) => {
    setEditing(exam);
    setForm({ date: exam.date, startTime: exam.startTime, endTime: exam.endTime, type: exam.type, venue: exam.venue, capacity: exam.capacity });
  };

  const handleSave = () => {
    if (!editing) return;
    updateExam(editing.id, form).then(load);
    setEditing(null);
    setSnackbar("Exam schedule updated successfully!");
  };

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Exams & Results"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Exams... Download will start shortly.")}>Export</Button>
            <Button variant="outlined" onClick={() => setSnackbar("Opening audit log...")}>Audit Log</Button>
            <Button variant="contained" onClick={() => setSnackbar("Exam schedule published successfully!")}>Publish Schedule</Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Examination management system includes creating and managing exam schedules, venue
        allocation and capacity management, conflict detection and resolution, invigilator
        assignment, hall ticket generation, and result processing and grade publication.
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Exams" icon={<GradingIcon />} color={getIconAccent(mode, "exams-total")} numericValue={stats.total} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Scheduled" icon={<EventAvailableIcon />} color={getIconAccent(mode, "exams-scheduled")} numericValue={stats.scheduled} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Conflicts" icon={<WarningAmberIcon />} color={getIconAccent(mode, "exams-conflicts")} numericValue={stats.conflicts} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Venues Used" icon={<ApartmentIcon />} color={getIconAccent(mode, "exams-venues")} numericValue={stats.venues} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Department</InputLabel>
          <Select label="Department" value={deptFilter} onChange={(e: SelectChangeEvent) => setDeptFilter(e.target.value)}>
            <MenuItem value="all">All Departments</MenuItem>
            {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <DataTable<Exam>
        pagination
        title="Exam Schedule (Draft)"
        columns={[
          { key: "courseId", label: "Code" },
          { key: "courseName", label: "Course Name", render: (row) => getCourseById(row.courseId)?.name ?? row.courseId },
          { key: "date", label: "Date" },
          {
            key: "time", label: "Time Slot",
            render: (row) => (
              <Typography component="span" sx={{ color: row.conflict ? "error.main" : "inherit", fontWeight: row.conflict ? 700 : 400 }}>
                {row.startTime} - {row.endTime}{row.conflict ? " ⚠️" : ""}
              </Typography>
            ),
          },
          { key: "type", label: "Type", render: (row) => row.type.charAt(0).toUpperCase() + row.type.slice(1) },
          { key: "venue", label: "Venue", render: (row) => row.capacityWarning ? `${row.venue} ⚠️` : row.venue },
          {
            key: "actions", label: "Actions",
            render: (row) => <Button size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>Edit</Button>,
          },
        ]}
        rows={filtered}
        emptyTitle="No exams found"
      />

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        {editing && (
          <>
            <DialogTitle>Edit Exam Schedule</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField label="Course Code" value={editing.courseId} fullWidth InputProps={{ readOnly: true }} />
              <TextField label="Course Name" value={getCourseById(editing.courseId)?.name ?? ""} fullWidth InputProps={{ readOnly: true }} />
              <TextField label="Exam Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
              <Stack direction="row" spacing={2}>
                <TextField label="Start Time" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="End Time" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
              </Stack>
              <FormControl fullWidth>
                <InputLabel>Exam Type</InputLabel>
                <Select label="Exam Type" value={form.type} onChange={(e: SelectChangeEvent) => setForm({ ...form, type: e.target.value as ExamType })}>
                  <MenuItem value="written">Written</MenuItem>
                  <MenuItem value="lab">Lab</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="practical">Practical</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} fullWidth />
              <TextField label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} fullWidth />
              <TextField label="Enrolled Students" value={editing.enrolledCount} fullWidth InputProps={{ readOnly: true }} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="contained" onClick={handleSave}>Save Changes</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors (router.tsx is not touched until Task 11, so this new page has no consumer yet, but tsc still type-checks it).

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Exams.tsx
git commit -m "Add Exams page"
```

---

### Task 9: Results page

**Files:**
- Create: `src/pages/admin/Results.tsx`

**Interfaces:**
- Consumes: `getStudents` from `@/api/students` (Phase 1a); `getMarksByStudent`, `getStudentRank` from `@/demo-data/academics/marks` (Task 5, called directly as cheap per-card sync lookups per the Global Constraints); `getCourseById` from `@/demo-data/academics/courses` (Phase 1a); `departmentSeeds` from `@/demo-data/academics/departmentSeeds` (Phase 1a).
- Produces: default export consumed by `router.tsx` (Task 11) at `/admin/results`.

- [ ] **Step 1: Create `src/pages/admin/Results.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Box, Button, TextField, MenuItem, Select, InputLabel, FormControl, Stack, Grid,
  Paper, Typography, Chip, TablePagination, Snackbar, type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { getStudents } from "@/api/students";
import { getMarksByStudent, getStudentRank } from "@/demo-data/academics/marks";
import { getCourseById } from "@/demo-data/academics/courses";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { Student } from "@/types";

const PAGE_SIZE = 12;

export default function Results() {
  const [students, setStudents] = useState<Student[]>([]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => { getStudents().then(setStudents); }, []);

  const filtered = students.filter((s) =>
    (deptFilter === "all" || s.departmentId === deptFilter) &&
    (yearFilter === "all" || s.year === yearFilter) &&
    (search === "" || s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase()))
  );

  const visible = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Results Management"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Results... Download will start shortly.")}>Export Results</Button>
            <Button variant="contained" onClick={() => setSnackbar("Results published successfully!")}>Publish Results</Button>
          </Stack>
        }
      />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Department</InputLabel>
          <Select label="Department" value={deptFilter} onChange={(e: SelectChangeEvent) => { setDeptFilter(e.target.value); setPage(0); }}>
            <MenuItem value="all">All Departments</MenuItem>
            {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Year</InputLabel>
          <Select<number | "all"> label="Year" value={yearFilter} onChange={(e: SelectChangeEvent<number | "all">) => { setYearFilter(e.target.value === "all" ? "all" : Number(e.target.value)); setPage(0); }}>
            <MenuItem value="all">All Years</MenuItem>
            <MenuItem value={1}>1st Year</MenuItem>
            <MenuItem value={2}>2nd Year</MenuItem>
            <MenuItem value={3}>3rd Year</MenuItem>
            <MenuItem value={4}>4th Year</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search by student name or ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ minWidth: 260 }} />
      </Stack>

      <Grid container spacing={2.5}>
        {visible.map((student) => {
          const studentMarks = getMarksByStudent(student.id);
          const { rank, cohortSize } = getStudentRank(student.id);
          return (
            <Grid key={student.id} size={12}>
              <Paper elevation={0} sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{student.name} - {student.id}</Typography>
                    <Typography variant="caption" color="text.secondary">{student.program} - Year {student.year} | Semester {student.semester}</Typography>
                  </Box>
                  <Stack direction="row" spacing={3}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">CGPA</Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ color: "success.main" }}>{student.cgpa}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Rank</Typography>
                      <Typography variant="body1" fontWeight={700}>{rank} / {cohortSize}</Typography>
                    </Box>
                  </Stack>
                </Stack>
                <Stack spacing={1}>
                  {studentMarks.map((m) => {
                    const course = getCourseById(m.courseId);
                    return (
                      <Stack key={m.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
                        <Typography variant="body2">{course?.name ?? m.courseId}</Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="body2" color="text.secondary">{m.marksObtained}/{m.maxMarks}</Typography>
                          <Chip size="small" label={m.grade} color={m.grade === "D" ? "error" : m.grade === "C" ? "warning" : "success"} variant="outlined" />
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={PAGE_SIZE}
        rowsPerPageOptions={[PAGE_SIZE]}
      />
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors (router.tsx is not touched until Task 11, so this new page has no consumer yet, but tsc still type-checks it).

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Results.tsx
git commit -m "Add Results page"
```

---

### Task 10: Wire Overview Dashboard's Avg Attendance and Upcoming Exams KPIs

**Files:**
- Modify: `src/pages/admin/Dashboard.tsx`

**Interfaces:**
- Consumes: `getExams` from `@/api/exams` (Task 4); the page's existing `students` state (already fetched via `getStudents()` from Phase 1a) for the attendance average.

- [ ] **Step 1: Add the `getExams` import**

In `src/pages/admin/Dashboard.tsx`, add to the existing import block:

```tsx
import { getExams } from "@/api/exams";
```

- [ ] **Step 2: Add exam-count state and fetch it alongside the existing data**

**Amendment (found during execution):** the Find/Replace blocks originally written here quoted the Phase 0 placeholder dashboard's `unread`/`Notification` state shape by mistake — Phase 1a's real `Dashboard.tsx` uses `students`/`faculty`/`activity`/`category` state instead. The corrected blocks below match the actual file.

Find this existing block:

```tsx
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [category, setCategory] = useState<CategoryFilter>("all");

  useEffect(() => {
    let live = true;
    getStudents().then((data) => { if (live) setStudents(data); });
    getFaculty().then((data) => { if (live) setFaculty(data); });
    getActivityLog().then((data) => { if (live) setActivity(data); });
    return () => { live = false; };
  }, []);

  const filteredActivity = category === "all" ? activity : activity.filter((a) => a.category === category);
```

Replace it with:

```tsx
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [examCount, setExamCount] = useState(0);

  useEffect(() => {
    let live = true;
    getStudents().then((data) => { if (live) setStudents(data); });
    getFaculty().then((data) => { if (live) setFaculty(data); });
    getActivityLog().then((data) => { if (live) setActivity(data); });
    getExams().then((data) => { if (live) setExamCount(data.length); });
    return () => { live = false; };
  }, []);

  const filteredActivity = category === "all" ? activity : activity.filter((a) => a.category === category);
  const avgAttendance = students.length > 0
    ? Math.round((students.reduce((sum, s) => sum + s.attendancePct, 0) / students.length) * 10) / 10
    : 0;
```

- [ ] **Step 3: (folded into Step 2 above — no separate edit needed)**

- [ ] **Step 4: Use both real values in the KPI cards**

Find:

```tsx
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} value="87.3%" />
        </Grid>
```

Replace with:

```tsx
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} value={`${avgAttendance}%`} />
        </Grid>
```

Find:

```tsx
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Upcoming Exams" icon={<GradingIcon />} color={getIconAccent(mode, "exams")} numericValue={24} />
        </Grid>
```

Replace with:

```tsx
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Upcoming Exams" icon={<GradingIcon />} color={getIconAccent(mode, "exams")} numericValue={examCount} />
        </Grid>
```

- [ ] **Step 5: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors — `Dashboard.tsx` is already wired into the router from Phase 1a, and `@/api/exams` already exists from Task 4.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/Dashboard.tsx
git commit -m "Wire Overview's Avg Attendance and Upcoming Exams to real data"
```

---

### Task 11: Navigation regroup + router wiring

**Files:**
- Modify: `src/components/navigation.tsx`
- Modify: `src/router.tsx`

**Interfaces:**
- Consumes: default exports from `Attendance.tsx` (Task 6), `Timetable.tsx` (Task 7), `Exams.tsx` (Task 8), `Results.tsx` (Task 9).
- Produces: updated `getNavItems("admin")` grouped nav list; 4 new routes registered in `router.tsx`.

- [ ] **Step 1: Add the 4 new icon imports to `navigation.tsx`**

Add to the existing icon-import block in `src/components/navigation.tsx`:

```tsx
import EventNoteIcon from "@mui/icons-material/EventNote";
import ScheduleIcon from "@mui/icons-material/Schedule";
import GradingIcon from "@mui/icons-material/Grading";
import AssessmentIcon from "@mui/icons-material/Assessment";
```

- [ ] **Step 2: Replace the `"admin"` case with a grouped list**

Find the existing (Phase 1a) admin case:

```tsx
    case "admin":
      return [
        { label: "Dashboard", path: "/admin", icon: <DashboardIcon /> },
        { label: "Users", path: "/admin/users", icon: <PeopleIcon /> },
        { label: "Faculty", path: "/admin/faculty", icon: <SchoolIcon /> },
        { label: "Departments", path: "/admin/departments", icon: <AccountBalanceIcon /> },
        { label: "Students", path: "/admin/students", icon: <GroupsIcon /> },
        { label: "Courses", path: "/admin/courses", icon: <MenuBookIcon /> },
        { label: "Registration", path: "/admin/registration", icon: <AssignmentIcon /> },
      ];
```

Replace it with:

```tsx
    case "admin":
      return [
        { label: "Dashboard", path: "/admin", icon: <DashboardIcon /> },
        { label: "Students", path: "/admin/students", icon: <GroupsIcon />, group: "Academics" },
        { label: "Faculty", path: "/admin/faculty", icon: <SchoolIcon />, group: "Academics" },
        { label: "Courses", path: "/admin/courses", icon: <MenuBookIcon />, group: "Academics" },
        { label: "Departments", path: "/admin/departments", icon: <AccountBalanceIcon />, group: "Academics" },
        { label: "Registration", path: "/admin/registration", icon: <AssignmentIcon />, group: "Academics" },
        { label: "Attendance", path: "/admin/attendance", icon: <EventNoteIcon />, group: "Academics" },
        { label: "Timetable", path: "/admin/timetable", icon: <ScheduleIcon />, group: "Academics" },
        { label: "Exams", path: "/admin/exams", icon: <GradingIcon />, group: "Academics" },
        { label: "Results", path: "/admin/results", icon: <AssessmentIcon />, group: "Academics" },
        { label: "Users", path: "/admin/users", icon: <PeopleIcon />, group: "Administration" },
      ];
```

- [ ] **Step 3: Add the 4 new lazy imports to `router.tsx`**

Add to the existing admin lazy-import block in `src/router.tsx`:

```tsx
const AdminAttendance = lazy(() => import("@/pages/admin/Attendance"));
const AdminTimetable = lazy(() => import("@/pages/admin/Timetable"));
const AdminExams = lazy(() => import("@/pages/admin/Exams"));
const AdminResults = lazy(() => import("@/pages/admin/Results"));
```

- [ ] **Step 4: Add the 4 new routes**

Find:

```tsx
      { path: "admin/registration", element: <AdminRegistration /> },
      { path: "teacher", element: <TeacherDashboard /> },
```

Replace with:

```tsx
      { path: "admin/registration", element: <AdminRegistration /> },
      { path: "admin/attendance", element: <AdminAttendance /> },
      { path: "admin/timetable", element: <AdminTimetable /> },
      { path: "admin/exams", element: <AdminExams /> },
      { path: "admin/results", element: <AdminResults /> },
      { path: "teacher", element: <TeacherDashboard /> },
```

- [ ] **Step 5: Verify the full project builds**

Run: `npm run build`
Expected: `tsc -b` reports no errors, `vite build` completes with `✓ built in <time>`. No more "Cannot find module" errors — every page referenced by the router now exists.

- [ ] **Step 6: Commit**

```bash
git add src/components/navigation.tsx src/router.tsx
git commit -m "Wire Admin Academic-Operations navigation and routes"
```

---

### Task 12: End-to-end manual verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Vite prints a local URL.

- [ ] **Step 2: Log in as Admin and verify the sidebar regroup**

Navigate to the printed URL, select the Admin portal, sign in with any
credentials. Confirm the sidebar now shows: Dashboard (top, ungrouped),
an "Academics" group header with Students/Faculty/Courses/Departments/
Registration/Attendance/Timetable/Exams/Results underneath, and an
"Administration" group header with Users underneath.

- [ ] **Step 3: Verify Attendance**

Navigate to Attendance. Confirm all 4 KPI cards show non-zero, non-hardcoded-looking
values (Today's Attendance ≈ 89%, Weekly Average close to it, Low
Attendance Alerts some double-digit count, Leave Requests some count
≤ 20). Click "Mark Attendance", confirm the Course dropdown lists real
course codes/names, submit, confirm a "Opening attendance sheet..."
notification appears. Click "Export Report", confirm a notification
appears.

- [ ] **Step 4: Verify Timetable**

Navigate to Timetable. Confirm the Class dropdown has 20 options in
"<Department Name> - Year <N>" form. Switch between at least 2 different
classes and confirm the grid's course/instructor names change and are
real (cross-check one shown course name against the Courses page).
Confirm Saturday's row shows "Lab Session" for every day-cell, and
Friday's last 2 class rows show "Tutorial". Confirm the 2 break rows
render as centered spanning text ("Break", "Lunch Break"). Click "Add
Schedule", fill it out, submit, confirm the notification appears and
(if the same class/day/time slot is visible) the grid reflects the new
entry.

- [ ] **Step 5: Verify Exams**

Navigate to Exams. Confirm the 4 KPI cards show real counts (Total
Exams = 50, Scheduled = 50, Conflicts = 2, Venues Used - some count
≤ 7). Confirm the Department filter actually filters the table (row
count changes). Click "Edit" on two different rows and confirm each
modal shows that row's own course code/name/date/time/venue (not
always the same one). Save one change and confirm the table reflects
it.

- [ ] **Step 6: Verify Results**

Navigate to Results. Confirm cards are paginated (12 per page) and the
total implied by pagination is 500. Use the Department filter, Year
filter, and search box one at a time and confirm the card set actually
narrows each time. Confirm each card's CGPA/Rank/marks table shows
real, varied data (not the same 3 students repeated).

- [ ] **Step 7: Verify Overview's updated KPIs**

Navigate to Dashboard. Confirm "Avg Attendance" and "Upcoming Exams"
now show computed values (Upcoming Exams should read 50) rather than
the previous static 87.3%/24.

- [ ] **Step 8: Verify dark mode**

Toggle dark mode from any of the 4 new pages and confirm the timetable
grid, exam table warning colors, and result cards all remain legible.

- [ ] **Step 9: Run the linter**

Run: `npm run lint`
Expected: no errors (only the pre-existing `AuthContext.tsx` fast-refresh warning from Phase 0).

- [ ] **Step 10: Stop the dev server, then commit**

No files change in this task unless Step 9 required fixes; if it did,
amend those specific files, then:

```bash
git add -A
git commit -m "Verify Phase 1b end-to-end"
```

(Skip this commit entirely if Step 9 required no changes.)
