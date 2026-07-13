# Admin / Academics Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Phase 0 placeholder Admin dashboard and build out the first 7 Admin sections (Overview, Users, Faculty, Departments, Students, Courses, Registration) with real generated demo data, a fake-async-API layer, and working filters/search/detail-views.

**Architecture:** Seeded, cross-linked demo-data generators (departments → faculty → courses → students, in that dependency order to avoid circular imports) feeding a thin `api/*` Promise-wrapped layer, consumed by MUI-based pages using the Phase 0 component set (`PageHeader`, `StatCard`, `ChartCard`, `DataTable`, `StatusChip`, `EmptyState`) plus MUI `Dialog` for Add/Edit forms.

**Tech Stack:** Same as Phase 0 (Vite, React 19, TS, MUI v7, recharts, `motion`) — no new dependencies.

## Global Constraints

- All new pages live under `app/src/pages/admin/`; all new demo-data under `app/src/demo-data/{people,academics,administration}/`; all new API modules under `app/src/api/`. (Every path below is relative to `app/`, per Phase 0's `app/` subfolder convention.)
- Filters and search must actually filter (client-side, over the in-memory array) — no decorative no-op controls.
- "View" always navigates to/opens that specific row's own record — never a fixed hardcoded sample.
- Add/Edit dialogs collect the same field set (Edit is not allowed to be narrower than Add).
- Mutations (`addX`/`updateX`) mutate the in-memory demo-data array directly (no `localStorage` persistence — matches Phase 0's simplified data-flow decision, not school-erp's Store pattern) and resolve through `simulateRequest`.
- Demo data scale: ~500 students, ~60 faculty, 5 departments, 50 courses.
- Simple synchronous foreign-key name lookups inside a table cell's `render` (e.g. showing a department's name for a `departmentId`) may call a demo-data module's sync helper (e.g. `getDepartmentById`) directly instead of going through the async API — reserved for cheap inline display lookups only; the page's own primary rows always come from the async `api/*` layer.
- No new shared "form dialog" wrapper component — MUI `Dialog` used directly per page.

---

### Task 1: Type definitions

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: `UserRole`, `AccountStatus`, `FacultyDesignation`, `AcademicStatus`, `FeeStatus`, `CourseType`, `AdminUser`, `Faculty`, `Department`, `Student`, `Course`, `ActivityLogEntry` — consumed by every task below.

- [ ] **Step 1: Append the Academics-core types to `src/types/index.ts`**

Add at the end of the existing file:

```ts

// --- Admin / Academics core (Phase 1a) ---

export type UserRole = "admin" | "faculty" | "student" | "staff";
export type AccountStatus = "active" | "inactive" | "on_leave";
export type FacultyDesignation = "professor" | "associate_professor" | "assistant_professor" | "lecturer";
export type AcademicStatus = "regular" | "backlog";
export type FeeStatus = "paid" | "pending";
export type CourseType = "core" | "elective" | "lab";
export type ActivityCategory = "academic" | "operations" | "finance";

export interface AdminUser {
  id: string;
  name: string;
  role: UserRole;
  departmentId: string;
  email: string;
  phone: string;
  employeeId: string;
  status: AccountStatus;
  lastLogin: string;
}

export interface Faculty {
  id: string;
  name: string;
  departmentId: string;
  designation: FacultyDesignation;
  email: string;
  phone: string;
  joiningDate: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  status: AccountStatus;
  coursesTeaching: string[];
}

export interface Department {
  id: string;
  name: string;
  hodFacultyId: string;
  building: string;
  budgetLakh: number;
  status: "active";
  avgClassSize: number;
  passRatePct: number;
  researchPapers: number;
  avgAttendancePct: number;
  avgMarksPct: number;
  atRiskStudentCount: number;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  program: string;
  year: 1 | 2 | 3 | 4;
  semester: number;
  batch: string;
  enrollmentDate: string;
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
  id: string;
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
  timestamp: string;
  actorName: string;
  activity: string;
  departmentId: string;
  category: ActivityCategory;
  status: "completed" | "pending_approval" | "scheduled";
}
```

- [ ] **Step 2: Extend `StatusChip`'s status map for the new activity statuses**

Modify `src/components/StatusChip.tsx`: add these two imports next to the existing icon imports —

```ts
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import EventIcon from "@mui/icons-material/Event";
```

— and add these two entries to `STATUS_MAP`, alongside the existing `in_progress`/`completed`/`rejected` block:

```ts
  pending_approval: { label: "Pending Approval", color: statusTokens.warning, icon: PendingActionsIcon },
  scheduled: { label: "Scheduled", color: statusTokens.warning, icon: EventIcon },
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/types/index.ts app/src/components/StatusChip.tsx
git commit -m "Add Admin/Academics-core type definitions"
```

---

### Task 2: Department seeds and generator

**Files:**
- Create: `src/demo-data/academics/departmentSeeds.ts`
- Create: `src/demo-data/academics/departments.ts`
- Create: `src/api/departments.ts`

**Interfaces:**
- Consumes: `pick`, `randomInt` from `@/demo-data/generators/random` (Phase 0); `faculty` from `@/demo-data/people/faculty` (Task 3 — see note below on generation order).
- Produces: `departmentSeeds: DepartmentSeed[]`, `programByDepartment: Record<string,string>` from `departmentSeeds.ts`; `departments: Department[]`, `getDepartmentById(id)` from `departments.ts`; `getDepartments()`, `getDepartmentByIdAsync(id)`, `addDepartment()`, `updateDepartment()` from `api/departments.ts`.

**Note on generation order:** `departments.ts` needs `faculty` (to pick each department's HOD), but `faculty.ts` (Task 3) needs `departmentSeeds` (to assign each faculty member's department) — not the full `departments` array. Splitting the plain `{id,name,building}` seed list into its own file with zero demo-data imports breaks the cycle: `departmentSeeds.ts` → (nothing) ; `faculty.ts` → `departmentSeeds.ts` ; `departments.ts` → `departmentSeeds.ts` + `faculty.ts`. Do Task 2's `departmentSeeds.ts` step now; its `departments.ts` step must come **after** Task 3 (faculty) exists — the step order below reflects that.

- [ ] **Step 1: Create `src/demo-data/academics/departmentSeeds.ts`**

```ts
export interface DepartmentSeed {
  id: string;
  name: string;
  building: string;
}

export const departmentSeeds: DepartmentSeed[] = [
  { id: "CSE", name: "Computer Science & Engineering", building: "Block A" },
  { id: "MATH", name: "Mathematics", building: "Block B" },
  { id: "PHY", name: "Physics", building: "Block B" },
  { id: "ECE", name: "Electronics & Communication Engineering", building: "Block C" },
  { id: "MECH", name: "Mechanical Engineering", building: "Block D" },
];

export const programByDepartment: Record<string, string> = {
  CSE: "B.Tech CSE",
  MATH: "B.Sc Mathematics",
  PHY: "B.Sc Physics",
  ECE: "B.Tech ECE",
  MECH: "B.Tech MECH",
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/demo-data/academics/departmentSeeds.ts
git commit -m "Add department seed data"
```

*(Steps 4+ for this task — `departments.ts` and `api/departments.ts` — are deferred to immediately after Task 3, since they depend on `faculty` existing. They're listed as Task 2b below to keep this plan's step order executable top-to-bottom.)*

---

### Task 3: Faculty generator and API

**Files:**
- Create: `src/demo-data/people/faculty.ts`
- Create: `src/api/faculty.ts`

**Interfaces:**
- Consumes: `Faculty`, `FacultyDesignation`, `AccountStatus` from `@/types` (Task 1); `randomFullName` from `@/demo-data/generators/namePools` (Phase 0); `pick`, `randomInt`, `weightedPick` from `@/demo-data/generators/random` (Phase 0); `departmentSeeds` from `@/demo-data/academics/departmentSeeds` (Task 2).
- Produces: `faculty: Faculty[]`, `getFacultyById(id)`, `getFacultyByDepartment(departmentId)` from `faculty.ts`; `getFaculty()`, `getFacultyByIdAsync(id)`, `addFaculty()`, `updateFaculty()` from `api/faculty.ts` — consumed by Task 2b (`departments.ts`), Task 5 (`courses.ts`), and the Faculty page (Task 10).

- [ ] **Step 1: Create `src/demo-data/people/faculty.ts`**

```ts
import type { Faculty, FacultyDesignation, AccountStatus } from "@/types";
import { randomFullName } from "@/demo-data/generators/namePools";
import { pick, randomInt, weightedPick } from "@/demo-data/generators/random";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";

const designations: [FacultyDesignation, number][] = [
  ["professor", 1],
  ["associate_professor", 2],
  ["assistant_professor", 4],
  ["lecturer", 2],
];

const qualifications = ["Ph.D.", "M.Tech", "M.Sc", "M.E.", "Ph.D. (Postdoc)"];

const specializations = [
  "Artificial Intelligence", "Data Structures", "Signal Processing",
  "Thermodynamics", "Number Theory", "Quantum Mechanics", "Control Systems",
  "Algorithms", "Fluid Dynamics", "Optics",
];

const FACULTY_PER_DEPARTMENT = 12;

function generateFaculty(): Faculty[] {
  const list: Faculty[] = [];
  let seq = 1;
  for (const dept of departmentSeeds) {
    for (let i = 0; i < FACULTY_PER_DEPARTMENT; i++) {
      const status: AccountStatus = weightedPick([["active", 9], ["on_leave", 1]]);
      const joiningYear = randomInt(2000, 2023);
      list.push({
        id: `FAC${String(seq).padStart(3, "0")}`,
        name: randomFullName(),
        departmentId: dept.id,
        designation: weightedPick(designations),
        email: `faculty${seq}@kalnet.edu`,
        phone: `9${randomInt(100000000, 999999999)}`,
        joiningDate: `${joiningYear}-${String(randomInt(1, 12)).padStart(2, "0")}-${String(randomInt(1, 28)).padStart(2, "0")}`,
        qualification: pick(qualifications),
        specialization: pick(specializations),
        experienceYears: 2026 - joiningYear,
        status,
        coursesTeaching: [],
      });
      seq++;
    }
  }
  return list;
}

export const faculty: Faculty[] = generateFaculty();

export function getFacultyById(id: string): Faculty | undefined {
  return faculty.find((f) => f.id === id);
}

export function getFacultyByDepartment(departmentId: string): Faculty[] {
  return faculty.filter((f) => f.departmentId === departmentId);
}
```

- [ ] **Step 2: Create `src/api/faculty.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { faculty, getFacultyById } from "@/demo-data/people/faculty";
import type { Faculty } from "@/types";

export function getFaculty(): Promise<Faculty[]> {
  return simulateRequest(faculty);
}

export function getFacultyByIdAsync(id: string): Promise<Faculty | undefined> {
  return simulateRequest(getFacultyById(id));
}

export function addFaculty(entry: Faculty): Promise<Faculty> {
  faculty.unshift(entry);
  return simulateRequest(entry);
}

export function updateFaculty(id: string, updates: Partial<Faculty>): Promise<Faculty | undefined> {
  const idx = faculty.findIndex((f) => f.id === id);
  if (idx !== -1) faculty[idx] = { ...faculty[idx], ...updates };
  return simulateRequest(faculty[idx]);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/people/faculty.ts app/src/api/faculty.ts
git commit -m "Add faculty demo-data generator and API"
```

---

### Task 2b: Department generator and API (deferred continuation of Task 2)

**Files:**
- Create: `src/demo-data/academics/departments.ts`
- Create: `src/api/departments.ts`

**Interfaces:**
- Consumes: `departmentSeeds` (Task 2); `faculty` from `@/demo-data/people/faculty` (Task 3); `randomInt` from `@/demo-data/generators/random`.
- Produces: `departments: Department[]`, `getDepartmentById(id)` from `departments.ts`; `getDepartments()`, `getDepartmentByIdAsync(id)`, `addDepartment()`, `updateDepartment()` from `api/departments.ts` — consumed by Task 5 (`courses.ts`), Task 6 (`students.ts`), and every Task 8+ page that displays a department name.

- [ ] **Step 1: Create `src/demo-data/academics/departments.ts`**

```ts
import type { Department } from "@/types";
import { departmentSeeds } from "./departmentSeeds";
import { faculty } from "@/demo-data/people/faculty";
import { randomInt } from "@/demo-data/generators/random";

function generateDepartments(): Department[] {
  return departmentSeeds.map((seed) => {
    const deptFaculty = faculty.filter((f) => f.departmentId === seed.id);
    const hod = deptFaculty.find((f) => f.designation === "professor") ?? deptFaculty[0];
    return {
      id: seed.id,
      name: seed.name,
      hodFacultyId: hod?.id ?? "",
      building: seed.building,
      budgetLakh: randomInt(120, 260),
      status: "active",
      avgClassSize: randomInt(24, 36),
      passRatePct: randomInt(82, 98),
      researchPapers: randomInt(15, 45),
      avgAttendancePct: randomInt(78, 94),
      avgMarksPct: randomInt(65, 88),
      atRiskStudentCount: randomInt(3, 25),
    };
  });
}

export const departments: Department[] = generateDepartments();

export function getDepartmentById(id: string): Department | undefined {
  return departments.find((d) => d.id === id);
}
```

- [ ] **Step 2: Create `src/api/departments.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { departments, getDepartmentById } from "@/demo-data/academics/departments";
import type { Department } from "@/types";

export function getDepartments(): Promise<Department[]> {
  return simulateRequest(departments);
}

export function getDepartmentByIdAsync(id: string): Promise<Department | undefined> {
  return simulateRequest(getDepartmentById(id));
}

export function addDepartment(entry: Department): Promise<Department> {
  departments.unshift(entry);
  return simulateRequest(entry);
}

export function updateDepartment(id: string, updates: Partial<Department>): Promise<Department | undefined> {
  const idx = departments.findIndex((d) => d.id === id);
  if (idx !== -1) departments[idx] = { ...departments[idx], ...updates };
  return simulateRequest(departments[idx]);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/academics/departments.ts app/src/api/departments.ts
git commit -m "Add department generator and API"
```

---

### Task 4: Admin user accounts generator and API

**Files:**
- Create: `src/demo-data/people/users.ts`
- Create: `src/api/users.ts`

**Interfaces:**
- Consumes: `AdminUser`, `UserRole`, `AccountStatus` from `@/types`; `randomFullName` from `@/demo-data/generators/namePools`; `pick`, `randomInt`, `weightedPick` from `@/demo-data/generators/random`; `departmentSeeds` from `@/demo-data/academics/departmentSeeds`.
- Produces: `users: AdminUser[]`, `getUserById(id)` from `users.ts`; `getUsers()`, `getUserByIdAsync(id)`, `addUser()`, `updateUser()` from `api/users.ts` — consumed by Task 9 (Users/UserProfile pages).

- [ ] **Step 1: Create `src/demo-data/people/users.ts`**

```ts
import type { AdminUser, UserRole, AccountStatus } from "@/types";
import { randomFullName } from "@/demo-data/generators/namePools";
import { pick, randomInt, weightedPick } from "@/demo-data/generators/random";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";

const roles: [UserRole, number][] = [
  ["faculty", 5],
  ["staff", 3],
  ["admin", 1],
  ["student", 2],
];

const USER_COUNT = 40;

function generateUsers(): AdminUser[] {
  const list: AdminUser[] = [];
  for (let i = 1; i <= USER_COUNT; i++) {
    const status: AccountStatus = weightedPick([["active", 9], ["inactive", 1]]);
    list.push({
      id: `USR-${String(i).padStart(3, "0")}`,
      name: randomFullName(),
      role: weightedPick(roles),
      departmentId: pick(departmentSeeds).id,
      email: `user${i}@kalnet.edu`,
      phone: `9${randomInt(100000000, 999999999)}`,
      employeeId: `EMP-${randomInt(1000, 9999)}`,
      status,
      lastLogin: `2026-07-${String(randomInt(1, 13)).padStart(2, "0")}T${String(randomInt(8, 18)).padStart(2, "0")}:${String(randomInt(0, 59)).padStart(2, "0")}:00Z`,
    });
  }
  return list;
}

export const users: AdminUser[] = generateUsers();

export function getUserById(id: string): AdminUser | undefined {
  return users.find((u) => u.id === id);
}
```

- [ ] **Step 2: Create `src/api/users.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { users, getUserById } from "@/demo-data/people/users";
import type { AdminUser } from "@/types";

export function getUsers(): Promise<AdminUser[]> {
  return simulateRequest(users);
}

export function getUserByIdAsync(id: string): Promise<AdminUser | undefined> {
  return simulateRequest(getUserById(id));
}

export function addUser(entry: AdminUser): Promise<AdminUser> {
  users.unshift(entry);
  return simulateRequest(entry);
}

export function updateUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser | undefined> {
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) users[idx] = { ...users[idx], ...updates };
  return simulateRequest(users[idx]);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/people/users.ts app/src/api/users.ts
git commit -m "Add admin user-account generator and API"
```

---

### Task 5: Course generator and API

**Files:**
- Create: `src/demo-data/academics/courses.ts`
- Create: `src/api/courses.ts`

**Interfaces:**
- Consumes: `Course`, `CourseType` from `@/types`; `departmentSeeds` from `@/demo-data/academics/departmentSeeds`; `faculty` from `@/demo-data/people/faculty`; `pick`, `weightedPick`, `randomInt` from `@/demo-data/generators/random`.
- Produces: `courses: Course[]`, `getCourseById(id)`, `getCoursesByDepartment(departmentId)`, `getCourseLevel(course)` from `courses.ts`; `getCourses()`, `getCourseByIdAsync(id)`, `addCourse()`, `updateCourse()` from `api/courses.ts` — consumed by Task 6 (`students.ts`) and Task 13 (Courses/CourseProfile pages).

- [ ] **Step 1: Create `src/demo-data/academics/courses.ts`**

```ts
import type { Course, CourseType } from "@/types";
import { departmentSeeds } from "./departmentSeeds";
import { faculty } from "@/demo-data/people/faculty";
import { pick, weightedPick, randomInt } from "@/demo-data/generators/random";

const courseNamesByDept: Record<string, string[]> = {
  CSE: ["Introduction to Programming", "Data Structures", "Database Systems", "Operating Systems", "Computer Networks", "Software Engineering", "Algorithms", "Web Development", "Machine Learning", "Artificial Intelligence"],
  MATH: ["Linear Algebra", "Calculus I", "Calculus II", "Differential Equations", "Probability & Statistics", "Discrete Mathematics", "Real Analysis", "Number Theory", "Numerical Methods", "Abstract Algebra"],
  PHY: ["Mechanics", "Electromagnetism", "Quantum Physics", "Thermodynamics", "Optics", "Waves & Oscillations", "Nuclear Physics", "Solid State Physics", "Modern Physics", "Astrophysics"],
  ECE: ["Circuit Theory", "Digital Electronics", "Signal Processing", "Microprocessors", "Communication Systems", "Control Systems", "VLSI Design", "Embedded Systems", "Electromagnetic Theory", "Power Electronics"],
  MECH: ["Engineering Mechanics", "Fluid Mechanics", "Machine Design", "Manufacturing Processes", "Heat Transfer", "Robotics", "Strength of Materials", "Automobile Engineering", "CAD/CAM", "Industrial Engineering"],
};

const courseTypes: [CourseType, number][] = [
  ["core", 6],
  ["elective", 3],
  ["lab", 2],
];

const days = ["Monday", "Wednesday", "Friday"];

function levelForIndex(i: number): number {
  if (i < 2) return 100;
  if (i < 4) return 200;
  if (i < 7) return 300;
  return 400;
}

function generateCourses(): Course[] {
  const list: Course[] = [];
  for (const dept of departmentSeeds) {
    const deptFaculty = faculty.filter((f) => f.departmentId === dept.id);
    const names = courseNamesByDept[dept.id];
    names.forEach((name, i) => {
      const level = levelForIndex(i);
      const instructor = pick(deptFaculty);
      list.push({
        id: `${dept.id}${level + i + 1}`,
        name,
        credits: pick([3, 3.5, 4]),
        departmentId: dept.id,
        type: weightedPick(courseTypes),
        status: "active",
        instructorFacultyId: instructor?.id ?? "",
        description: `Core concepts and applications of ${name.toLowerCase()}, part of the ${dept.name} curriculum.`,
        learningOutcomes: [
          "Understand fundamental concepts and terminology",
          "Apply theoretical knowledge to practical problems",
          "Analyze and evaluate real-world case studies",
        ],
        schedule: [{ day: pick(days), time: "10:00 AM - 11:30 AM", room: `Room ${randomInt(101, 350)}` }],
        avgAttendancePct: randomInt(75, 95),
        passRatePct: randomInt(80, 98),
      });
    });
  }
  return list;
}

export const courses: Course[] = generateCourses();

// Back-fill each instructor's `coursesTeaching` now that courses (and their
// instructor assignments) exist — faculty.ts runs first and has no way to
// know which courses will pick it as instructor, so this is the one place
// that link can be completed.
for (const course of courses) {
  const instructor = faculty.find((f) => f.id === course.instructorFacultyId);
  if (instructor && !instructor.coursesTeaching.includes(course.id)) {
    instructor.coursesTeaching.push(course.id);
  }
}

export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}

export function getCoursesByDepartment(departmentId: string): Course[] {
  return courses.filter((c) => c.departmentId === departmentId);
}

export function getCourseLevel(course: Course): number {
  const match = course.id.match(/\d+/);
  const num = match ? parseInt(match[0], 10) : 100;
  return Math.floor(num / 100) * 100;
}
```

- [ ] **Step 2: Create `src/api/courses.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { courses, getCourseById } from "@/demo-data/academics/courses";
import type { Course } from "@/types";

export function getCourses(): Promise<Course[]> {
  return simulateRequest(courses);
}

export function getCourseByIdAsync(id: string): Promise<Course | undefined> {
  return simulateRequest(getCourseById(id));
}

export function addCourse(entry: Course): Promise<Course> {
  courses.unshift(entry);
  return simulateRequest(entry);
}

export function updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined> {
  const idx = courses.findIndex((c) => c.id === id);
  if (idx !== -1) courses[idx] = { ...courses[idx], ...updates };
  return simulateRequest(courses[idx]);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/academics/courses.ts app/src/api/courses.ts
git commit -m "Add course generator and API"
```

---

### Task 6: Student generator and API

**Files:**
- Create: `src/demo-data/people/students.ts`
- Create: `src/api/students.ts`

**Interfaces:**
- Consumes: `Student`, `AcademicStatus`, `FeeStatus` from `@/types`; `randomFullName` from `@/demo-data/generators/namePools`; `pick`, `randomInt`, `weightedPick` from `@/demo-data/generators/random`; `departmentSeeds`, `programByDepartment` from `@/demo-data/academics/departmentSeeds`; `getCoursesByDepartment` from `@/demo-data/academics/courses` (Task 5).
- Produces: `students: Student[]`, `getStudentById(id)`, `getStudentsByDepartment(departmentId)` from `students.ts`; `getStudents()`, `getStudentByIdAsync(id)`, `addStudent()`, `updateStudent()` from `api/students.ts` — consumed by Task 8 (Dashboard), Task 12 (Students/StudentProfile pages).

- [ ] **Step 1: Create `src/demo-data/people/students.ts`**

```ts
import type { Student, AcademicStatus, FeeStatus } from "@/types";
import { randomFullName } from "@/demo-data/generators/namePools";
import { pick, randomInt, weightedPick } from "@/demo-data/generators/random";
import { departmentSeeds, programByDepartment } from "@/demo-data/academics/departmentSeeds";
import { getCoursesByDepartment } from "@/demo-data/academics/courses";

const CURRENT_YEAR = 2026;
const STUDENTS_PER_DEPT_PER_YEAR = 25; // 5 depts * 4 years * 25 = 500

const streetNames = ["MG Road", "Park Street", "Station Road", "College Avenue", "Lake View"];

function generateStudents(): Student[] {
  const list: Student[] = [];
  let seq = 1;
  for (const dept of departmentSeeds) {
    const deptCourses = getCoursesByDepartment(dept.id);
    for (let year = 1; year <= 4; year++) {
      const admissionYear = CURRENT_YEAR - (year - 1);
      for (let i = 0; i < STUDENTS_PER_DEPT_PER_YEAR; i++) {
        const status: AcademicStatus = weightedPick([["regular", 9], ["backlog", 1]]);
        const feeStatus: FeeStatus = weightedPick([["paid", 8], ["pending", 2]]);
        list.push({
          id: `STU-${String(seq).padStart(4, "0")}`,
          rollNo: `${admissionYear}-${dept.id}-${String(i + 1).padStart(3, "0")}`,
          name: randomFullName(),
          email: `student${seq}@kalnet.edu`,
          phone: `9${randomInt(100000000, 999999999)}`,
          departmentId: dept.id,
          program: programByDepartment[dept.id],
          year: year as 1 | 2 | 3 | 4,
          semester: year * 2 - pick([0, 1]),
          batch: `${admissionYear}-${admissionYear + 4}`,
          enrollmentDate: `${admissionYear}-08-${String(randomInt(1, 28)).padStart(2, "0")}`,
          status,
          attendancePct: randomInt(65, 99),
          cgpa: randomInt(60, 98) / 10,
          feeStatus,
          address: `${randomInt(1, 200)}, ${pick(streetNames)}, City`,
          guardianName: randomFullName(),
          guardianContact: `9${randomInt(100000000, 999999999)}`,
          courseIds: deptCourses.slice(0, 5).map((c) => c.id),
        });
        seq++;
      }
    }
  }
  return list;
}

export const students: Student[] = generateStudents();

export function getStudentById(id: string): Student | undefined {
  return students.find((s) => s.id === id);
}

export function getStudentsByDepartment(departmentId: string): Student[] {
  return students.filter((s) => s.departmentId === departmentId);
}
```

- [ ] **Step 2: Create `src/api/students.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { students, getStudentById } from "@/demo-data/people/students";
import type { Student } from "@/types";

export function getStudents(): Promise<Student[]> {
  return simulateRequest(students);
}

export function getStudentByIdAsync(id: string): Promise<Student | undefined> {
  return simulateRequest(getStudentById(id));
}

export function addStudent(entry: Student): Promise<Student> {
  students.unshift(entry);
  return simulateRequest(entry);
}

export function updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
  const idx = students.findIndex((s) => s.id === id);
  if (idx !== -1) students[idx] = { ...students[idx], ...updates };
  return simulateRequest(students[idx]);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors. (The generated row count — exactly 500 — is confirmed visually in Task 16 via the Overview dashboard's "Total Students" stat card; there's no test runner to check it standalone.)

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/people/students.ts app/src/api/students.ts
git commit -m "Add student generator and API"
```

---

### Task 7: Activity log generator and API

**Files:**
- Create: `src/demo-data/administration/activityLog.ts`
- Create: `src/api/activityLog.ts`

**Interfaces:**
- Consumes: `ActivityLogEntry` from `@/types`; `randomFullName` from `@/demo-data/generators/namePools`; `pick`, `randomInt` from `@/demo-data/generators/random`; `departmentSeeds` from `@/demo-data/academics/departmentSeeds`.
- Produces: `activityLog: ActivityLogEntry[]` from `activityLog.ts`; `getActivityLog()` from `api/activityLog.ts` — consumed by Task 8 (Dashboard).

- [ ] **Step 1: Create `src/demo-data/administration/activityLog.ts`**

```ts
import type { ActivityLogEntry, ActivityCategory } from "@/types";
import { randomFullName } from "@/demo-data/generators/namePools";
import { pick, randomInt } from "@/demo-data/generators/random";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";

const activitiesByCategory: [string, ActivityCategory][] = [
  ["Updated course syllabus", "academic"],
  ["Published exam results", "academic"],
  ["Uploaded lecture notes", "academic"],
  ["Added new course", "academic"],
  ["Submitted attendance report", "operations"],
  ["Approved leave request", "operations"],
  ["Reviewed student grievance", "operations"],
  ["Scheduled department meeting", "operations"],
  ["Updated fee structure", "finance"],
  ["Processed admission request", "finance"],
];

const statuses: ActivityLogEntry["status"][] = ["completed", "pending_approval", "scheduled"];

function generateActivityLog(): ActivityLogEntry[] {
  const list: ActivityLogEntry[] = [];
  for (let i = 0; i < 15; i++) {
    const [activity, category] = pick(activitiesByCategory);
    const day = String(randomInt(1, 13)).padStart(2, "0");
    const hour = String(randomInt(8, 18)).padStart(2, "0");
    const minute = String(randomInt(0, 59)).padStart(2, "0");
    list.push({
      id: `act-${i + 1}`,
      timestamp: `2026-07-${day}T${hour}:${minute}:00Z`,
      actorName: randomFullName(),
      activity,
      departmentId: pick(departmentSeeds).id,
      category,
      status: pick(statuses),
    });
  }
  return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export const activityLog: ActivityLogEntry[] = generateActivityLog();
```

- [ ] **Step 2: Create `src/api/activityLog.ts`**

```ts
import { simulateRequest } from "@/api/http";
import { activityLog } from "@/demo-data/administration/activityLog";
import type { ActivityLogEntry } from "@/types";

export function getActivityLog(): Promise<ActivityLogEntry[]> {
  return simulateRequest(activityLog);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/demo-data/administration/activityLog.ts app/src/api/activityLog.ts
git commit -m "Add activity log generator and API"
```

---

### Task 8: Dashboard (Overview) page

**Files:**
- Modify: `src/pages/admin/Dashboard.tsx` (replaces the Phase 0 placeholder entirely)

**Interfaces:**
- Consumes: `getStudents` (Task 6), `getFaculty` (Task 3), `getActivityLog` (Task 7); `getDepartmentById` from `@/demo-data/academics/departments` (Task 2b, sync inline lookup); `PageHeader`, `StatCard`, `ChartCard`, `DataTable`, default `StatusChip` (Phase 0); `getChartPalette`, `getChartTooltipStyle`, `getIconAccent` (Phase 0).
- Produces: default export `Dashboard` — routed at `/admin` (already wired by Phase 0's `router.tsx`; only the file's content changes).

- [ ] **Step 1: Replace `src/pages/admin/Dashboard.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, Box, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import PaymentIcon from "@mui/icons-material/Payment";
import EventNoteIcon from "@mui/icons-material/EventNote";
import InventoryIcon from "@mui/icons-material/Inventory";
import HotelIcon from "@mui/icons-material/Hotel";
import GradingIcon from "@mui/icons-material/Grading";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle, getIconAccent } from "@/theme/chartPalette";
import { getStudents } from "@/api/students";
import { getFaculty } from "@/api/faculty";
import { getActivityLog } from "@/api/activityLog";
import { getDepartmentById } from "@/demo-data/academics/departments";
import type { ActivityLogEntry, Student, Faculty } from "@/types";

const weeklyActivity = [
  { day: "Mon", count: 34 }, { day: "Tue", count: 41 }, { day: "Wed", count: 28 },
  { day: "Thu", count: 47 }, { day: "Fri", count: 39 },
];

type CategoryFilter = "all" | ActivityLogEntry["category"];

export default function Dashboard() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const navigate = useNavigate();
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

  return (
    <>
      <PageHeader eyebrow="Overview" title="Admin Dashboard" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Students" icon={<PeopleIcon />} color={getIconAccent(mode, "students")} numericValue={students.length} onClick={() => navigate("/admin/students")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Faculty Members" icon={<SchoolIcon />} color={getIconAccent(mode, "faculty")} numericValue={faculty.length} onClick={() => navigate("/admin/faculty")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Open Tickets" icon={<ConfirmationNumberIcon />} color={getIconAccent(mode, "tickets")} numericValue={42} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Fee Collection" icon={<PaymentIcon />} color={getIconAccent(mode, "fees")} value="₹3.2 Cr" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} value="87.3%" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Assets" icon={<InventoryIcon />} color={getIconAccent(mode, "assets")} numericValue={1842} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Hostel Occupancy" icon={<HotelIcon />} color={getIconAccent(mode, "hostel")} numericValue={92} formatValue={(n) => `${n}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Upcoming Exams" icon={<GradingIcon />} color={getIconAccent(mode, "exams")} numericValue={24} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={12}>
          <ChartCard eyebrow="This Week" title="Activity Overview">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="day" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="count" fill={palette.categorical[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Select
          size="small"
          value={category}
          onChange={(e: SelectChangeEvent) => setCategory(e.target.value as CategoryFilter)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">All Activities</MenuItem>
          <MenuItem value="academic">Academic</MenuItem>
          <MenuItem value="operations">Operations</MenuItem>
          <MenuItem value="finance">Finance</MenuItem>
        </Select>
      </Box>
      <DataTable<ActivityLogEntry>
        title="Recent Activity"
        columns={[
          { key: "timestamp", label: "Timestamp", render: (row) => new Date(row.timestamp).toLocaleString() },
          { key: "actorName", label: "User" },
          { key: "activity", label: "Activity" },
          { key: "departmentId", label: "Department", render: (row) => getDepartmentById(row.departmentId)?.name ?? row.departmentId },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
        ]}
        rows={filteredActivity}
        emptyTitle="No activity found"
      />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/admin/Dashboard.tsx
git commit -m "Build real Admin Overview dashboard"
```

---

### Task 9: Users and UserProfile pages

**Files:**
- Create: `src/pages/admin/Users.tsx`
- Create: `src/pages/admin/UserProfile.tsx`

**Interfaces:**
- Consumes: `getUsers`, `addUser`, `updateUser`, `getUserByIdAsync` (Task 4); `getDepartmentById` (Task 2b, sync); `departmentSeeds` (Task 2); `PageHeader`, `DataTable`, default `StatusChip`, default `EmptyState` (Phase 0).
- Produces: default exports `Users`, `UserProfile` — routed at `/admin/users` and `/admin/users/:id` (wired in Task 15).

- [ ] **Step 1: Create `src/pages/admin/Users.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, IconButton, type SelectChangeEvent,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getUsers, addUser, updateUser } from "@/api/users";
import { getDepartmentById } from "@/demo-data/academics/departments";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { AdminUser, UserRole, AccountStatus } from "@/types";

const emptyForm = { name: "", email: "", role: "faculty" as UserRole, departmentId: departmentSeeds[0].id, phone: "", employeeId: "" };

export default function Users() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => getUsers().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((u) =>
    (roleFilter === "all" || u.role === roleFilter) &&
    (deptFilter === "all" || u.departmentId === deptFilter) &&
    (statusFilter === "all" || u.status === statusFilter) &&
    (search === "" || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, role: user.role, departmentId: user.departmentId, phone: user.phone, employeeId: user.employeeId });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateUser(editingId, form).then(load);
    } else {
      addUser({ id: `USR-${String(rows.length + 1).padStart(3, "0")}`, ...form, status: "active", lastLogin: new Date().toISOString() }).then(load);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader eyebrow="Administration" title="Users" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Role</InputLabel>
          <Select label="Role" value={roleFilter} onChange={(e: SelectChangeEvent) => setRoleFilter(e.target.value as UserRole | "all")}>
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="faculty">Faculty</MenuItem>
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="staff">Staff</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Department</InputLabel>
          <Select label="Department" value={deptFilter} onChange={(e: SelectChangeEvent) => setDeptFilter(e.target.value)}>
            <MenuItem value="all">All Departments</MenuItem>
            {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value as AccountStatus | "all")}>
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="on_leave">On Leave</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={openAdd}>Add User</Button>
      </Stack>

      <DataTable<AdminUser>
        pagination
        columns={[
          { key: "id", label: "User ID" },
          { key: "name", label: "Name" },
          { key: "role", label: "Role", render: (row) => row.role.charAt(0).toUpperCase() + row.role.slice(1) },
          { key: "departmentId", label: "Department", render: (row) => getDepartmentById(row.departmentId)?.name ?? row.departmentId },
          { key: "email", label: "Email" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "lastLogin", label: "Last Login", render: (row) => new Date(row.lastLogin).toLocaleString() },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${row.id}`); }}><VisibilityIcon fontSize="small" /></IconButton>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No users found"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit User" : "Add User"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={form.role} onChange={(e: SelectChangeEvent) => setForm({ ...form, role: e.target.value as UserRole })}>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="faculty">Faculty</MenuItem>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select label="Department" value={form.departmentId} onChange={(e: SelectChangeEvent) => setForm({ ...form, departmentId: e.target.value })}>
              {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
          <TextField label="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? "Save Changes" : "Add User"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Create `src/pages/admin/UserProfile.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Paper, Typography, Stack, Chip, Button } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import StatusChip from "@/components/StatusChip";
import EmptyState from "@/components/EmptyState";
import { getUserByIdAsync } from "@/api/users";
import { getDepartmentById } from "@/demo-data/academics/departments";
import type { AdminUser } from "@/types";

const permissions = [
  { label: "View Students", granted: true },
  { label: "Manage Attendance", granted: true },
  { label: "Submit Grades", granted: true },
  { label: "Manage Users", granted: false },
  { label: "System Settings", granted: false },
];

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    if (id) getUserByIdAsync(id).then((data) => { if (live) { setUser(data); setLoaded(true); } });
    return () => { live = false; };
  }, [id]);

  if (loaded && !user) {
    return <EmptyState title="User not found" description={`No user with id "${id}".`} />;
  }
  if (!user) return null;

  return (
    <>
      <PageHeader
        eyebrow="Users"
        title={user.name}
        breadcrumbs={[{ label: "Users", to: "/admin/users" }, { label: user.name }]}
        action={<Button variant="outlined" color="error" onClick={() => navigate("/admin/users")}>Deactivate</Button>}
      />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={4}>
          <Box><Typography variant="caption" color="text.secondary">User ID</Typography><Typography variant="body1">{user.id}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Email</Typography><Typography variant="body1">{user.email}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Role</Typography><Typography variant="body1" sx={{ textTransform: "capitalize" }}>{user.role}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Department</Typography><Typography variant="body1">{getDepartmentById(user.departmentId)?.name ?? user.departmentId}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Status</Typography><Box sx={{ mt: 0.5 }}><StatusChip status={user.status} /></Box></Box>
          <Box><Typography variant="caption" color="text.secondary">Last Login</Typography><Typography variant="body1">{new Date(user.lastLogin).toLocaleString()}</Typography></Box>
        </Stack>
      </Paper>
      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>User Permissions</Typography>
        <Stack spacing={1.5}>
          {permissions.map((p) => (
            <Stack key={p.label} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">{p.label}</Typography>
              <Chip size="small" label={p.granted ? "Granted" : "Denied"} color={p.granted ? "success" : "error"} variant="outlined" />
            </Stack>
          ))}
        </Stack>
      </Paper>
    </>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/pages/admin/Users.tsx app/src/pages/admin/UserProfile.tsx
git commit -m "Add Users and UserProfile pages"
```

---

### Task 10: Faculty page

**Files:**
- Create: `src/pages/admin/Faculty.tsx`

**Interfaces:**
- Consumes: `getFaculty`, `addFaculty`, `updateFaculty` (Task 3); `getDepartmentById` (Task 2b, sync); `departmentSeeds` (Task 2); `PageHeader`, `StatCard`, `DataTable`, default `StatusChip` (Phase 0); `getIconAccent` (Phase 0).
- Produces: default export `FacultyPage` — routed at `/admin/faculty` (Task 15). Faculty's "View" is a `Dialog`, not a route (matches the source, which used a modal here unlike Users/Departments/Students/Courses).

- [ ] **Step 1: Create `src/pages/admin/Faculty.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, IconButton, Grid, Chip, Typography,
  type SelectChangeEvent,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PeopleIcon from "@mui/icons-material/People";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getFaculty, addFaculty, updateFaculty } from "@/api/faculty";
import { getDepartmentById } from "@/demo-data/academics/departments";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { Faculty, FacultyDesignation, AccountStatus } from "@/types";

const designationLabels: Record<FacultyDesignation, string> = {
  professor: "Professor",
  associate_professor: "Associate Professor",
  assistant_professor: "Assistant Professor",
  lecturer: "Lecturer",
};

const emptyForm = {
  id: "", name: "", departmentId: departmentSeeds[0].id, designation: "assistant_professor" as FacultyDesignation,
  email: "", phone: "", joiningDate: "", qualification: "", specialization: "",
};

export default function FacultyPage() {
  const { mode } = useColorMode();
  const [rows, setRows] = useState<Faculty[]>([]);
  const [designationFilter, setDesignationFilter] = useState<FacultyDesignation | "all">("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<Faculty | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => getFaculty().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((f) =>
    (designationFilter === "all" || f.designation === designationFilter) &&
    (deptFilter === "all" || f.departmentId === deptFilter) &&
    (statusFilter === "all" || f.status === statusFilter) &&
    (search === "" || f.name.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = {
    total: rows.length,
    professor: rows.filter((f) => f.designation === "professor").length,
    associate: rows.filter((f) => f.designation === "associate_professor").length,
    assistant: rows.filter((f) => f.designation === "assistant_professor").length,
  };

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (f: Faculty) => {
    setEditingId(f.id);
    setForm({ id: f.id, name: f.name, departmentId: f.departmentId, designation: f.designation, email: f.email, phone: f.phone, joiningDate: f.joiningDate, qualification: f.qualification, specialization: f.specialization });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateFaculty(editingId, form).then(load);
    } else {
      addFaculty({
        ...form,
        id: form.id || `FAC${String(rows.length + 1).padStart(3, "0")}`,
        experienceYears: 2026 - parseInt(form.joiningDate.slice(0, 4) || "2026", 10),
        status: "active",
        coursesTeaching: [],
      }).then(load);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader eyebrow="Administration" title="Faculty" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Faculty" icon={<PeopleIcon />} color={getIconAccent(mode, "faculty")} numericValue={counts.total} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Professors" icon={<WorkspacePremiumIcon />} color={getIconAccent(mode, "professors")} numericValue={counts.professor} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Associate Professors" icon={<WorkspacePremiumIcon />} color={getIconAccent(mode, "associate-professors")} numericValue={counts.associate} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Assistant Professors" icon={<WorkspacePremiumIcon />} color={getIconAccent(mode, "assistant-professors")} numericValue={counts.assistant} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel>Designation</InputLabel>
          <Select label="Designation" value={designationFilter} onChange={(e: SelectChangeEvent) => setDesignationFilter(e.target.value as FacultyDesignation | "all")}>
            <MenuItem value="all">All Designations</MenuItem>
            {Object.entries(designationLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Department</InputLabel>
          <Select label="Department" value={deptFilter} onChange={(e: SelectChangeEvent) => setDeptFilter(e.target.value)}>
            <MenuItem value="all">All Departments</MenuItem>
            {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value as AccountStatus | "all")}>
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="on_leave">On Leave</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search faculty..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={openAdd}>Add Faculty</Button>
      </Stack>

      <DataTable<Faculty>
        pagination
        columns={[
          { key: "id", label: "Faculty ID" },
          { key: "name", label: "Name" },
          { key: "departmentId", label: "Department", render: (row) => getDepartmentById(row.departmentId)?.name ?? row.departmentId },
          { key: "designation", label: "Designation", render: (row) => designationLabels[row.designation] },
          { key: "email", label: "Contact" },
          { key: "joiningDate", label: "Joining Date" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setViewing(row); }}><VisibilityIcon fontSize="small" /></IconButton>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No faculty found"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Faculty" : "Add Faculty"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Faculty ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} fullWidth disabled={!!editingId} />
          <TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select label="Department" value={form.departmentId} onChange={(e: SelectChangeEvent) => setForm({ ...form, departmentId: e.target.value })}>
              {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Designation</InputLabel>
            <Select label="Designation" value={form.designation} onChange={(e: SelectChangeEvent) => setForm({ ...form, designation: e.target.value as FacultyDesignation })}>
              {Object.entries(designationLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
          <TextField label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
          <TextField label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} fullWidth />
          <TextField label="Specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} fullWidth multiline minRows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? "Save Changes" : "Add Faculty"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!viewing} onClose={() => setViewing(null)} maxWidth="sm" fullWidth>
        {viewing && (
          <>
            <DialogTitle>Faculty Details - {viewing.id}</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography variant="body2"><strong>Name:</strong> {viewing.name}</Typography>
              <Typography variant="body2"><strong>Designation:</strong> {designationLabels[viewing.designation]}</Typography>
              <Typography variant="body2"><strong>Department:</strong> {getDepartmentById(viewing.departmentId)?.name}</Typography>
              <Typography variant="body2"><strong>Email:</strong> {viewing.email}</Typography>
              <Typography variant="body2"><strong>Phone:</strong> {viewing.phone}</Typography>
              <Typography variant="body2"><strong>Qualification:</strong> {viewing.qualification}</Typography>
              <Typography variant="body2"><strong>Experience:</strong> {viewing.experienceYears} years</Typography>
              <Box><StatusChip status={viewing.status} /></Box>
              <Typography variant="body2" color="text.secondary">{viewing.specialization}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {viewing.coursesTeaching.map((c) => <Chip key={c} size="small" label={c} />)}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewing(null)}>Close</Button>
              <Button variant="contained" onClick={() => { openEdit(viewing); setViewing(null); }}>Edit Faculty</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/admin/Faculty.tsx
git commit -m "Add Faculty page"
```

---

### Task 11: Departments and DepartmentProfile pages

**Files:**
- Create: `src/pages/admin/Departments.tsx`
- Create: `src/pages/admin/DepartmentProfile.tsx`

**Interfaces:**
- Consumes: `getDepartments`, `addDepartment`, `updateDepartment`, `getDepartmentByIdAsync` (Task 2b); `getFacultyById`, `getFacultyByDepartment` (Task 3, sync); `getStudentsByDepartment` (Task 6, sync); `getCoursesByDepartment` (Task 5, sync); `PageHeader`, `StatCard`, `DataTable`, default `StatusChip`, default `EmptyState` (Phase 0).
- Produces: default exports `Departments`, `DepartmentProfile` — routed at `/admin/departments` and `/admin/departments/:id` (Task 15). This consolidates the source's duplicate/shadowed `viewDepartmentDetails` into one implementation using the richer field set, per the approved spec.

- [ ] **Step 1: Create `src/pages/admin/Departments.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getDepartments, addDepartment, updateDepartment } from "@/api/departments";
import { getFacultyById, getFacultyByDepartment } from "@/demo-data/people/faculty";
import { getStudentsByDepartment } from "@/demo-data/people/students";
import type { Department } from "@/types";

const emptyForm = { name: "", id: "", hodFacultyId: "", building: "" };

export default function Departments() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => getDepartments().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((d) => search === "" || d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (d: Department) => { setEditingId(d.id); setForm({ name: d.name, id: d.id, hodFacultyId: d.hodFacultyId, building: d.building }); setDialogOpen(true); };

  const handleSave = () => {
    if (editingId) {
      updateDepartment(editingId, { name: form.name, hodFacultyId: form.hodFacultyId, building: form.building }).then(load);
    } else {
      addDepartment({
        id: form.id, name: form.name, hodFacultyId: form.hodFacultyId, building: form.building,
        budgetLakh: 150, status: "active", avgClassSize: 30, passRatePct: 90,
        researchPapers: 10, avgAttendancePct: 85, avgMarksPct: 75, atRiskStudentCount: 5,
      }).then(load);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader eyebrow="Administration" title="Departments" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <TextField size="small" placeholder="Search departments..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={openAdd}>Add Department</Button>
      </Stack>

      <DataTable<Department>
        columns={[
          { key: "id", label: "Dept Code" },
          { key: "name", label: "Department Name" },
          { key: "hodFacultyId", label: "HOD", render: (row) => getFacultyById(row.hodFacultyId)?.name ?? "—" },
          { key: "facultyCount", label: "Faculty Count", render: (row) => getFacultyByDepartment(row.id).length },
          { key: "studentCount", label: "Student Count", render: (row) => getStudentsByDepartment(row.id).length },
          { key: "budgetLakh", label: "Budget", render: (row) => `₹${(row.budgetLakh / 100).toFixed(1)} Cr` },
          { key: "status", label: "Status", render: (row) => row.status.charAt(0).toUpperCase() + row.status.slice(1) },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/departments/${row.id}`); }}><VisibilityIcon fontSize="small" /></IconButton>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No departments found"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Department" : "Add Department"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Department Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Department Code" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} fullWidth disabled={!!editingId} />
          <FormControl fullWidth>
            <InputLabel>Head of Department</InputLabel>
            <Select label="Head of Department" value={form.hodFacultyId} onChange={(e) => setForm({ ...form, hodFacultyId: e.target.value })}>
              {getFacultyByDepartment(form.id).map((f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Building" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? "Save Changes" : "Add Department"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Create `src/pages/admin/DepartmentProfile.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Paper, Typography, Stack, Grid } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getDepartmentByIdAsync } from "@/api/departments";
import { getFacultyById, getFacultyByDepartment } from "@/demo-data/people/faculty";
import { getStudentsByDepartment } from "@/demo-data/people/students";
import { getCoursesByDepartment } from "@/demo-data/academics/courses";
import ClassIcon from "@mui/icons-material/Class";
import GroupsIcon from "@mui/icons-material/Groups";
import GradingIcon from "@mui/icons-material/Grading";
import ArticleIcon from "@mui/icons-material/Article";
import type { Department } from "@/types";

export default function DepartmentProfile() {
  const { id } = useParams();
  const { mode } = useColorMode();
  const [dept, setDept] = useState<Department | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    if (id) getDepartmentByIdAsync(id).then((data) => { if (live) { setDept(data); setLoaded(true); } });
    return () => { live = false; };
  }, [id]);

  if (loaded && !dept) {
    return <EmptyState title="Department not found" description={`No department with id "${id}".`} />;
  }
  if (!dept) return null;

  const facultyCount = getFacultyByDepartment(dept.id).length;
  const studentCount = getStudentsByDepartment(dept.id).length;
  const activeCourses = getCoursesByDepartment(dept.id).length;

  return (
    <>
      <PageHeader eyebrow="Departments" title={dept.name} breadcrumbs={[{ label: "Departments", to: "/admin/departments" }, { label: dept.name }]} />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={4}>
          <Box><Typography variant="caption" color="text.secondary">Department Code</Typography><Typography variant="body1">{dept.id}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">HOD</Typography><Typography variant="body1">{getFacultyById(dept.hodFacultyId)?.name ?? "—"}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Building</Typography><Typography variant="body1">{dept.building}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Faculty Count</Typography><Typography variant="body1">{facultyCount}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Student Count</Typography><Typography variant="body1">{studentCount}</Typography></Box>
        </Stack>
      </Paper>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Department Statistics</Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Active Courses" icon={<ClassIcon />} color={getIconAccent(mode, "courses")} numericValue={activeCourses} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg. Class Size" icon={<GroupsIcon />} color={getIconAccent(mode, "class-size")} numericValue={dept.avgClassSize} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Pass Rate" icon={<GradingIcon />} color={getIconAccent(mode, "pass-rate")} numericValue={dept.passRatePct} formatValue={(n) => `${n}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Research Papers" icon={<ArticleIcon />} color={getIconAccent(mode, "research")} numericValue={dept.researchPapers} />
        </Grid>
      </Grid>
    </>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/pages/admin/Departments.tsx app/src/pages/admin/DepartmentProfile.tsx
git commit -m "Add Departments and DepartmentProfile pages"
```

---

### Task 12: Students and StudentProfile pages

**Files:**
- Create: `src/pages/admin/Students.tsx`
- Create: `src/pages/admin/StudentProfile.tsx`

**Interfaces:**
- Consumes: `getStudents`, `addStudent`, `updateStudent`, `getStudentByIdAsync` (Task 6); `getCourseById` (Task 5, sync); `programByDepartment`, `departmentSeeds` (Task 2); `PageHeader`, `StatCard`, `DataTable`, default `StatusChip`, default `EmptyState` (Phase 0).
- Produces: default exports `Students`, `StudentProfile` — routed at `/admin/students` and `/admin/students/:id` (Task 15).

- [ ] **Step 1: Create `src/pages/admin/Students.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, IconButton, type SelectChangeEvent,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getStudents, addStudent, updateStudent } from "@/api/students";
import { programByDepartment, departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { Student } from "@/types";

const programs = Object.values(programByDepartment);
const emptyForm = { name: "", email: "", phone: "", program: programs[0], year: 1 as 1 | 2 | 3 | 4, address: "" };

export default function Students() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Student[]>([]);
  const [programFilter, setProgramFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => getStudents().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((s) =>
    (programFilter === "all" || s.program === programFilter) &&
    (yearFilter === "all" || s.year === yearFilter) &&
    (search === "" || s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: Student) => { setEditingId(s.id); setForm({ name: s.name, email: s.email, phone: s.phone, program: s.program, year: s.year, address: s.address }); setDialogOpen(true); };

  const handleSave = () => {
    if (editingId) {
      updateStudent(editingId, { name: form.name, email: form.email, phone: form.phone, program: form.program, year: form.year, address: form.address }).then(load);
    } else {
      const dept = departmentSeeds.find((d) => programByDepartment[d.id] === form.program) ?? departmentSeeds[0];
      const admissionYear = 2026 - (form.year - 1);
      const seq = rows.length + 1;
      addStudent({
        id: `STU-${String(seq).padStart(4, "0")}`,
        rollNo: `${admissionYear}-${dept.id}-${String(seq).padStart(3, "0")}`,
        name: form.name, email: form.email, phone: form.phone,
        departmentId: dept.id, program: form.program, year: form.year,
        semester: form.year * 2 - 1, batch: `${admissionYear}-${admissionYear + 4}`,
        enrollmentDate: `${admissionYear}-08-01`, status: "regular",
        attendancePct: 100, cgpa: 0, feeStatus: "pending",
        address: form.address, guardianName: "", guardianContact: "", courseIds: [],
      }).then(load);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader eyebrow="Academics" title="Student Master" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel>Program</InputLabel>
          <Select label="Program" value={programFilter} onChange={(e: SelectChangeEvent) => setProgramFilter(e.target.value)}>
            <MenuItem value="all">All Programs</MenuItem>
            {programs.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Year</InputLabel>
          <Select label="Year" value={yearFilter} onChange={(e: SelectChangeEvent) => setYearFilter(e.target.value === "all" ? "all" : Number(e.target.value))}>
            <MenuItem value="all">All Years</MenuItem>
            <MenuItem value={1}>1st Year</MenuItem>
            <MenuItem value={2}>2nd Year</MenuItem>
            <MenuItem value={3}>3rd Year</MenuItem>
            <MenuItem value={4}>4th Year</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={openAdd}>Add Student</Button>
      </Stack>

      <DataTable<Student>
        pagination
        columns={[
          { key: "rollNo", label: "Roll No" },
          { key: "name", label: "Student Name" },
          { key: "program", label: "Program" },
          { key: "year", label: "Year", render: (row) => `${row.year}${row.year === 1 ? "st" : row.year === 2 ? "nd" : row.year === 3 ? "rd" : "th"} Year` },
          { key: "attendancePct", label: "Attendance %", render: (row) => `${row.attendancePct}%` },
          { key: "cgpa", label: "CGPA" },
          { key: "feeStatus", label: "Fee Status", render: (row) => <StatusChip status={row.feeStatus} /> },
          { key: "status", label: "Academic Status", render: (row) => <StatusChip status={row.status} /> },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/students/${row.id}`); }}><VisibilityIcon fontSize="small" /></IconButton>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No students found"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Student" : "Add Student"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Student Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Program</InputLabel>
            <Select label="Program" value={form.program} onChange={(e: SelectChangeEvent) => setForm({ ...form, program: e.target.value })}>
              {programs.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Year</InputLabel>
            <Select label="Year" value={form.year} onChange={(e: SelectChangeEvent) => setForm({ ...form, year: Number(e.target.value) as 1 | 2 | 3 | 4 })}>
              <MenuItem value={1}>1st Year</MenuItem>
              <MenuItem value={2}>2nd Year</MenuItem>
              <MenuItem value={3}>3rd Year</MenuItem>
              <MenuItem value={4}>4th Year</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth multiline minRows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? "Save Changes" : "Add Student"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Create `src/pages/admin/StudentProfile.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Paper, Typography, Stack, Chip, Grid } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import StatusChip from "@/components/StatusChip";
import EmptyState from "@/components/EmptyState";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getStudentByIdAsync } from "@/api/students";
import { getCourseById } from "@/demo-data/academics/courses";
import GradingIcon from "@mui/icons-material/Grading";
import EventNoteIcon from "@mui/icons-material/EventNote";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ClassIcon from "@mui/icons-material/Class";
import type { Student } from "@/types";

export default function StudentProfile() {
  const { id } = useParams();
  const { mode } = useColorMode();
  const [student, setStudent] = useState<Student | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    if (id) getStudentByIdAsync(id).then((data) => { if (live) { setStudent(data); setLoaded(true); } });
    return () => { live = false; };
  }, [id]);

  if (loaded && !student) {
    return <EmptyState title="Student not found" description={`No student with id "${id}".`} />;
  }
  if (!student) return null;

  const courses = student.courseIds.map((cid) => getCourseById(cid)).filter((c) => !!c);
  const completedCredits = courses.reduce((sum, c) => sum + (c?.credits ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="Students" title={student.name} breadcrumbs={[{ label: "Students", to: "/admin/students" }, { label: student.name }]} />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={4}>
          <Box><Typography variant="caption" color="text.secondary">Student ID</Typography><Typography variant="body1">{student.id}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Email</Typography><Typography variant="body1">{student.email}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Phone</Typography><Typography variant="body1">{student.phone}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Program</Typography><Typography variant="body1">{student.program}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Year / Semester</Typography><Typography variant="body1">Year {student.year} · Sem {student.semester}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Batch</Typography><Typography variant="body1">{student.batch}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Status</Typography><Box sx={{ mt: 0.5 }}><StatusChip status={student.status} /></Box></Box>
        </Stack>
      </Paper>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Personal Information</Typography>
            <Stack spacing={1.5}>
              <Box><Typography variant="caption" color="text.secondary">Enrollment Date</Typography><Typography variant="body2">{student.enrollmentDate}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Address</Typography><Typography variant="body2">{student.address}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Guardian Name</Typography><Typography variant="body2">{student.guardianName}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Guardian Contact</Typography><Typography variant="body2">{student.guardianContact}</Typography></Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Enrolled Courses</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {courses.map((c) => <Chip key={c!.id} size="small" label={c!.name} />)}
              {courses.length === 0 && <Typography variant="body2" color="text.secondary">No courses enrolled.</Typography>}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Academic Performance</Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Overall CGPA" icon={<GradingIcon />} color={getIconAccent(mode, "cgpa")} value={student.cgpa} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} value={`${student.attendancePct}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Completed Credits" icon={<MenuBookIcon />} color={getIconAccent(mode, "credits")} numericValue={completedCredits} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Active Courses" icon={<ClassIcon />} color={getIconAccent(mode, "active-courses")} numericValue={courses.length} />
        </Grid>
      </Grid>
    </>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/pages/admin/Students.tsx app/src/pages/admin/StudentProfile.tsx
git commit -m "Add Students and StudentProfile pages"
```

---

### Task 13: Courses and CourseProfile pages

**Files:**
- Create: `src/pages/admin/Courses.tsx`
- Create: `src/pages/admin/CourseProfile.tsx`

**Interfaces:**
- Consumes: `getCourses`, `addCourse`, `updateCourse`, `getCourseByIdAsync`, `getCourseLevel` (Task 5); `getFacultyById` (Task 3, sync); `getStudents` filtered by `courseIds` (Task 6, sync via `students` array — used only to compute an enrolled-count) `departmentSeeds` (Task 2); `PageHeader`, `DataTable`, default `StatusChip`, default `EmptyState` (Phase 0).
- Produces: default exports `Courses`, `CourseProfile` — routed at `/admin/courses` and `/admin/courses/:id` (Task 15).

- [ ] **Step 1: Create `src/pages/admin/Courses.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, IconButton, type SelectChangeEvent,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getCourses, addCourse, updateCourse, getCourseLevel } from "@/api/courses";
import { departmentSeeds } from "@/demo-data/academics/departmentSeeds";
import type { Course, CourseType } from "@/types";

const emptyForm = { id: "", name: "", credits: 3, departmentId: departmentSeeds[0].id, type: "core" as CourseType, description: "" };

export default function Courses() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Course[]>([]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => getCourses().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((c) =>
    (deptFilter === "all" || c.departmentId === deptFilter) &&
    (levelFilter === "all" || getCourseLevel(c) === levelFilter) &&
    (search === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Course) => { setEditingId(c.id); setForm({ id: c.id, name: c.name, credits: c.credits, departmentId: c.departmentId, type: c.type, description: c.description }); setDialogOpen(true); };

  const handleSave = () => {
    if (editingId) {
      updateCourse(editingId, { name: form.name, credits: form.credits, departmentId: form.departmentId, type: form.type, description: form.description }).then(load);
    } else {
      addCourse({
        id: form.id, name: form.name, credits: form.credits, departmentId: form.departmentId, type: form.type,
        status: "active", instructorFacultyId: "", description: form.description,
        learningOutcomes: [], schedule: [], avgAttendancePct: 0, passRatePct: 0,
      }).then(load);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <PageHeader eyebrow="Academics" title="Course & Curriculum Management" />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Department</InputLabel>
          <Select label="Department" value={deptFilter} onChange={(e: SelectChangeEvent) => setDeptFilter(e.target.value)}>
            <MenuItem value="all">All Departments</MenuItem>
            {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Level</InputLabel>
          <Select label="Level" value={levelFilter} onChange={(e: SelectChangeEvent) => setLevelFilter(e.target.value === "all" ? "all" : Number(e.target.value))}>
            <MenuItem value="all">All Levels</MenuItem>
            <MenuItem value={100}>100 Level</MenuItem>
            <MenuItem value={200}>200 Level</MenuItem>
            <MenuItem value={300}>300 Level</MenuItem>
            <MenuItem value={400}>400 Level</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={openAdd}>Add Course</Button>
      </Stack>

      <DataTable<Course>
        pagination
        columns={[
          { key: "id", label: "Course Code" },
          { key: "name", label: "Course Name" },
          { key: "credits", label: "Credits" },
          { key: "departmentId", label: "Department", render: (row) => departmentSeeds.find((d) => d.id === row.departmentId)?.name ?? row.departmentId },
          { key: "type", label: "Type", render: (row) => row.type.charAt(0).toUpperCase() + row.type.slice(1) },
          { key: "status", label: "Status", render: (row) => row.status.charAt(0).toUpperCase() + row.status.slice(1) },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/courses/${row.id}`); }}><VisibilityIcon fontSize="small" /></IconButton>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No courses found"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Course" : "Add Course"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Course Code" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} fullWidth disabled={!!editingId} />
          <TextField label="Credits" type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} fullWidth />
          <TextField label="Course Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select label="Department" value={form.departmentId} onChange={(e: SelectChangeEvent) => setForm({ ...form, departmentId: e.target.value })}>
              {departmentSeeds.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={form.type} onChange={(e: SelectChangeEvent) => setForm({ ...form, type: e.target.value as CourseType })}>
              <MenuItem value="core">Core</MenuItem>
              <MenuItem value="elective">Elective</MenuItem>
              <MenuItem value="lab">Lab</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline minRows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? "Save Changes" : "Add Course"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Create `src/pages/admin/CourseProfile.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Paper, Typography, Stack, Grid, List, ListItem, ListItemText } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { useColorMode } from "@/context/ColorModeContext";
import { getIconAccent } from "@/theme/chartPalette";
import { getCourseByIdAsync } from "@/api/courses";
import { getFacultyById } from "@/demo-data/people/faculty";
import { students } from "@/demo-data/people/students";
import EventNoteIcon from "@mui/icons-material/EventNote";
import GradingIcon from "@mui/icons-material/Grading";
import type { Course } from "@/types";

export default function CourseProfile() {
  const { id } = useParams();
  const { mode } = useColorMode();
  const [course, setCourse] = useState<Course | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    if (id) getCourseByIdAsync(id).then((data) => { if (live) { setCourse(data); setLoaded(true); } });
    return () => { live = false; };
  }, [id]);

  if (loaded && !course) {
    return <EmptyState title="Course not found" description={`No course with id "${id}".`} />;
  }
  if (!course) return null;

  const enrolledCount = students.filter((s) => s.courseIds.includes(course.id)).length;
  const instructor = getFacultyById(course.instructorFacultyId);

  return (
    <>
      <PageHeader eyebrow="Courses" title={`${course.name} - ${course.id}`} breadcrumbs={[{ label: "Courses", to: "/admin/courses" }, { label: course.id }]} />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={4}>
          <Box><Typography variant="caption" color="text.secondary">Course Code</Typography><Typography variant="body1">{course.id}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Department</Typography><Typography variant="body1">{course.departmentId}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Credits</Typography><Typography variant="body1">{course.credits} Credits</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Instructor</Typography><Typography variant="body1">{instructor?.name ?? "Unassigned"}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Enrolled Students</Typography><Typography variant="body1">{enrolledCount} Students</Typography></Box>
        </Stack>
      </Paper>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Course Description</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{course.description}</Typography>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Learning Outcomes</Typography>
            <List dense>
              {course.learningOutcomes.map((o, i) => (
                <ListItem key={i} sx={{ py: 0.25 }}><ListItemText primary={`• ${o}`} /></ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Schedule</Typography>
            <Stack spacing={1}>
              {course.schedule.map((s, i) => (
                <Typography key={i} variant="body2">{s.day}: {s.time} ({s.room})</Typography>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Course Statistics</Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Avg. Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} numericValue={course.avgAttendancePct} formatValue={(n) => `${n}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Pass Rate" icon={<GradingIcon />} color={getIconAccent(mode, "pass-rate")} numericValue={course.passRatePct} formatValue={(n) => `${n}%`} />
        </Grid>
      </Grid>
    </>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/pages/admin/Courses.tsx app/src/pages/admin/CourseProfile.tsx
git commit -m "Add Courses and CourseProfile pages"
```

---

### Task 14: Registration page

**Files:**
- Create: `src/pages/admin/Registration.tsx`

**Interfaces:**
- Consumes: `PageHeader` (Phase 0). No API/demo-data — this screen is pure settings-form state (matches the source, which is not backed by a table).
- Produces: default export `Registration` — routed at `/admin/registration` (Task 15).

- [ ] **Step 1: Create `src/pages/admin/Registration.tsx`**

```tsx
import { useState } from "react";
import {
  Box, Paper, Typography, Grid, TextField, MenuItem, Select, InputLabel, FormControl,
  Stack, Switch, Button, Snackbar, type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";

export default function Registration() {
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [term, setTerm] = useState("fall");
  const [startDateTime, setStartDateTime] = useState("2026-08-15T08:00");
  const [endDateTime, setEndDateTime] = useState("2026-08-25T23:59");
  const [maxCredits, setMaxCredits] = useState(18);
  const [gracePeriod, setGracePeriod] = useState(0);
  const [allowAddDrop, setAllowAddDrop] = useState(true);
  const [advisorApproval, setAdvisorApproval] = useState(false);
  const [lateRegistration, setLateRegistration] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Course Registration Control"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Draft saved.")}>Save Draft</Button>
            <Button variant="contained" onClick={() => setSnackbar("Registration window published.")}>Publish Window</Button>
          </Stack>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Configure registration windows, credit limits, add/drop deadlines, advisor approval, late-registration policy, and program eligibility rules.
      </Typography>

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Registration Window Settings</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Academic Year</InputLabel>
              <Select label="Academic Year" value={academicYear} onChange={(e: SelectChangeEvent) => setAcademicYear(e.target.value)}>
                <MenuItem value="2026-2027">2026 - 2027</MenuItem>
                <MenuItem value="2025-2026">2025 - 2026</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Term</InputLabel>
              <Select label="Term" value={term} onChange={(e: SelectChangeEvent) => setTerm(e.target.value)}>
                <MenuItem value="fall">Fall Semester</MenuItem>
                <MenuItem value="spring">Spring Semester</MenuItem>
                <MenuItem value="summer">Summer Term</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Start Date & Time" type="datetime-local" value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="End Date & Time" type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Max Credits Per Student" type="number" value={maxCredits} onChange={(e) => setMaxCredits(Number(e.target.value))} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Grace Period (Hours)" type="number" value={gracePeriod} onChange={(e) => setGracePeriod(Number(e.target.value))} fullWidth />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Rules & Policies</Typography>
        <Stack spacing={2.5} divider={<Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>Allow Add/Drop</Typography>
              <Typography variant="caption" color="text.secondary">Students can modify courses after initial registration</Typography>
            </Box>
            <Switch checked={allowAddDrop} onChange={(e) => setAllowAddDrop(e.target.checked)} />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>Advisor Approval</Typography>
              <Typography variant="caption" color="text.secondary">Require advisor sign-off before confirming schedule</Typography>
            </Box>
            <Switch checked={advisorApproval} onChange={(e) => setAdvisorApproval(e.target.checked)} />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>Late Registration</Typography>
              <Typography variant="caption" color="text.secondary">Allow registration after window close with fee</Typography>
            </Box>
            <Switch checked={lateRegistration} onChange={(e) => setLateRegistration(e.target.checked)} />
          </Stack>
        </Stack>
      </Paper>

      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/admin/Registration.tsx
git commit -m "Add Registration page"
```

---

### Task 15: Navigation and router wiring

**Files:**
- Modify: `src/components/navigation.tsx`
- Modify: `src/router.tsx`

**Interfaces:**
- Consumes: all 11 page default exports from Tasks 8–14.
- Produces: the admin sidebar showing all 7 sections; all 9 new routes reachable.

- [ ] **Step 1: Replace the `"admin"` case in `src/components/navigation.tsx`**

Add these imports alongside the existing `DashboardIcon` import:

```ts
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import GroupsIcon from "@mui/icons-material/Groups";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AssignmentIcon from "@mui/icons-material/Assignment";
```

Replace:

```tsx
    case "admin":
      return [{ label: "Dashboard", path: "/admin", icon: <DashboardIcon /> }];
```

with:

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

- [ ] **Step 2: Add the new lazy page imports to `src/router.tsx`**

Add directly below the existing `const AdminDashboard = lazy(...)` line:

```tsx
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminUserProfile = lazy(() => import("@/pages/admin/UserProfile"));
const AdminFaculty = lazy(() => import("@/pages/admin/Faculty"));
const AdminDepartments = lazy(() => import("@/pages/admin/Departments"));
const AdminDepartmentProfile = lazy(() => import("@/pages/admin/DepartmentProfile"));
const AdminStudents = lazy(() => import("@/pages/admin/Students"));
const AdminStudentProfile = lazy(() => import("@/pages/admin/StudentProfile"));
const AdminCourses = lazy(() => import("@/pages/admin/Courses"));
const AdminCourseProfile = lazy(() => import("@/pages/admin/CourseProfile"));
const AdminRegistration = lazy(() => import("@/pages/admin/Registration"));
```

- [ ] **Step 3: Add the new routes to the `admin` route's `children` array in `src/router.tsx`**

Replace:

```tsx
      { path: "admin", element: <AdminDashboard /> },
```

with:

```tsx
      { path: "admin", element: <AdminDashboard /> },
      { path: "admin/users", element: <AdminUsers /> },
      { path: "admin/users/:id", element: <AdminUserProfile /> },
      { path: "admin/faculty", element: <AdminFaculty /> },
      { path: "admin/departments", element: <AdminDepartments /> },
      { path: "admin/departments/:id", element: <AdminDepartmentProfile /> },
      { path: "admin/students", element: <AdminStudents /> },
      { path: "admin/students/:id", element: <AdminStudentProfile /> },
      { path: "admin/courses", element: <AdminCourses /> },
      { path: "admin/courses/:id", element: <AdminCourseProfile /> },
      { path: "admin/registration", element: <AdminRegistration /> },
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/navigation.tsx app/src/router.tsx
git commit -m "Wire Admin Academics-core navigation and routes"
```

---

### Task 16: End-to-end manual verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Run the linter**

Run: `npm run lint`
Expected: no new errors (the pre-existing `react-refresh/only-export-components` warning on `AuthContext.tsx` from Phase 0 is expected; no other warnings/errors should appear).

- [ ] **Step 2: Start the dev server**

Run: `npm run dev`
Expected: prints a local URL.

- [ ] **Step 3: Verify the Overview dashboard**

Log in as Admin. Confirm: "Total Students" reads exactly 500, "Faculty Members" reads exactly 60 (both real, count-up from generated data); the other 6 KPI cards show the static illustrative values (Open Tickets 42, Fee Collection ₹3.2 Cr, Avg Attendance 87.3%, Total Assets 1842, Hostel Occupancy 92%, Upcoming Exams 24); the Recent Activity table's category filter actually narrows the rows; clicking "Total Students"/"Faculty Members" navigates to their list pages.

- [ ] **Step 4: Verify Users**

Navigate to Users. Confirm all filters (Role/Department/Status) and search actually narrow the table; "Add User" appends a new row visible immediately; "Edit" pre-fills and updates a row; clicking the eye icon on a specific row navigates to `/admin/users/:id` showing *that* user's own name/email/department (not a fixed sample) — verify by opening two different rows and confirming the profile page shows different data each time.

- [ ] **Step 5: Verify Faculty**

Navigate to Faculty. Confirm the 4 KPI cards' counts match the filtered-out totals (Professors + Associate + Assistant + Lecturer counts sum to Total, allowing for Lecturers not having their own card, matching the source); filters/search work; "View" opens a dialog (not a page) showing that faculty member's own qualification/specialization/courses-teaching chips.

- [ ] **Step 6: Verify Departments**

Navigate to Departments. Confirm Faculty Count/Student Count columns show real computed numbers (not hardcoded); clicking "View" on two different departments navigates to two different `/admin/departments/:id` pages with different HOD/stats — confirming the source's duplicate/shadowed department-detail bug was not replicated.

- [ ] **Step 7: Verify Students**

Navigate to Students (500 rows, paginated). Confirm Program/Year filters and search work; "Add Student" appends a row; clicking "View" on a specific row navigates to that student's own `/admin/students/:id` with matching enrolled courses and academic performance numbers.

- [ ] **Step 8: Verify Courses**

Navigate to Courses (50 rows). Confirm Department/Level filters and search work; clicking "View" on a specific row navigates to that course's own `/admin/courses/:id` with matching instructor, schedule, and description.

- [ ] **Step 9: Verify Registration**

Navigate to Registration. Confirm both cards render (window settings + toggles), toggling a switch updates its visual state, and "Save Draft"/"Publish Window" show a confirmation snackbar.

- [ ] **Step 10: Verify dark mode**

Toggle dark mode and re-check Overview, one list page, and one detail page for readable contrast and correct dark surface colors.

- [ ] **Step 11: Stop the dev server, then commit**

If Steps 1–10 required any fixes, amend those specific files, then:

```bash
git add -A
git commit -m "Verify Phase 1a Admin Academics-core end-to-end"
```

(Skip this commit entirely if no fixes were needed.)
