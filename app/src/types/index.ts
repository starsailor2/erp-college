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

// --- Admin / Finance (Phase 1c) ---

export interface FeeStructureItem {
  id: string; // "FEE-001"
  program: string; // matches Student.program, e.g. "B.Tech CSE"
  year: 1 | 2 | 3 | 4;
  tuitionFee: number;
  hostelFee: number;
  transportFee: number;
  otherCharges: number;
  total: number; // sum of the 4 fields above
}

export type FeeLedgerStatus = "paid" | "pending" | "overdue";
export interface FeeLedgerEntry {
  id: string;
  studentId: string;
  totalFee: number;
  paidAmount: number;
  balance: number; // totalFee - paidAmount
  status: FeeLedgerStatus;
}

export type PaymentMode = "online" | "cash" | "cheque" | "dd";
export type PaymentStatus = "verified" | "pending_clearance";
export interface Payment {
  id: string; // "REC-2026-1842" style receipt number
  date: string; // ISO date
  studentId: string;
  amount: number;
  mode: PaymentMode;
  status: PaymentStatus;
}
