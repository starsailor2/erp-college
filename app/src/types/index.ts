export type Role = "admin" | "teacher" | "staff" | "student";

export interface User {
  id: string;
  name: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  postedBy: string;
  read: boolean;
  timestamp: string;
}

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
