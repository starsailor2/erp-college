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

// --- Admin / Campus Operations (Phase 1d) ---

export type AssetCondition = "excellent" | "good" | "fair" | "poor";
export type AssetStatus = "active" | "maintenance" | "retired";
export interface MaintenanceRecord {
  title: string;
  date: string;
}
export interface Asset {
  id: string; // "AST-2024-001"
  name: string; // e.g. "Dell Latitude 5420 Laptop"
  type: string; // e.g. "Projector", "Computer", "Furniture"
  location: string;
  condition: AssetCondition;
  status: AssetStatus;
  lastMaintenance: string;
  value: number;
  purchaseDate: string;
  maintenanceHistory: MaintenanceRecord[];
}

export type TicketPriority = "critical" | "high" | "medium" | "low";
export type TicketStatus = "open" | "in_progress" | "resolved";
export type SlaState = "on_track" | "breached" | "resolved";
export interface Ticket {
  id: string; // "REQ-2095"
  title: string;
  description: string;
  location: string;
  priority: TicketPriority;
  assignedTo: string | null;
  status: TicketStatus;
  createdLabel: string; // e.g. "10:42 AM", "Yesterday"
  slaState: SlaState;
  slaDetail: string; // e.g. "2h 15m overdue", "1h 30m remaining", "45m ahead"
  resolutionHours?: number; // set only once status is "resolved"
}

export interface HostelStats {
  totalBeds: number;
  occupied: number;
  available: number;
  maintenance: number;
}

export interface FacilityStats {
  todayBookings: number;
  auditoriumUtilizationPct: number;
  sportsUtilizationPct: number;
  pendingApprovals: number;
}

export type BookStatus = "available" | "issued" | "reserved";
export interface Book {
  id: string; // "BK001"
  title: string;
  author: string;
  isbn: string;
  category: string;
  status: BookStatus;
  availableCopies: number;
}

export type LibraryTransactionStatus = "active" | "overdue" | "returned";
export interface LibraryTransaction {
  id: string; // "LIB-1234"
  studentId: string;
  bookId: string;
  issueDate: string;
  dueDate: string;
  status: LibraryTransactionStatus;
}

// --- Admin / Communication & System (Phase 1e) ---

export type NoticeStatus = "published" | "scheduled" | "draft";
export interface Notice {
  id: string;
  title: string;
  status: NoticeStatus;
  audience: string;
  author: string;
  publishedDate: string | null;
}

export type DocumentSignatureStatus = "pending" | "in_progress" | "completed";
export type DocumentUrgency = "normal" | "urgent";
export interface DocumentSignature {
  id: string;
  title: string;
  docType: string;
  initiatedBy: string;
  date: string;
  status: DocumentSignatureStatus;
  urgency: DocumentUrgency;
  currentStage?: string;
  pendingWith?: string;
  progressCurrent?: number;
  progressTotal?: number;
  signaturesCollected?: number;
  signaturesTotal?: number;
}

export type AuditStatus = "success" | "failed";
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorEmail: string;
  action: string;
  module: string;
  ipAddress: string;
  status: AuditStatus;
}

export interface ServiceStatus {
  name: string;
  description: string;
  status: "running" | "degraded";
}
export interface SystemHealthMetrics {
  uptimePct: number;
  uptimeDetail: string;
  cpuPct: number;
  memoryPct: number;
  memoryDetail: string;
  diskPct: number;
  diskDetail: string;
  databaseHealthy: boolean;
  apiResponseMs: number;
  activeUsers: number;
  lastBackup: string;
  services: ServiceStatus[];
}

export interface SystemConfig {
  institutionName: string;
  institutionCode: string;
  email: string;
  phone: string;
  academicYear: string;
  currentTerm: string;
  minAttendancePct: number;
  passingGrade: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  twoFactorAuth: boolean;
  autoBackup: boolean;
}

export interface AppSettings {
  compactView: boolean;
  animations: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  collegeName: string;
  academicYear: string;
  semester: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  twoFactorAuth: boolean;
  sessionTimeout: boolean;
  loginAlerts: boolean;
  autoBackup: boolean;
  dataRetention: boolean;
}

export interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  actionsToday: number;
  totalActions: number;
  efficiencyPct: number;
}

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
export interface TeacherLeaveRequest {
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
  completionPct?: number;
}

// --- Teacher / HOD, Dean, Profile, Role-Switcher (Phase 2b) ---

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

// --- Staff / Operations (Phase 3) ---

export type StaffRole = "assigner" | "executor";

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cannot_complete";
export type TaskCategory = "maintenance" | "administrative" | "facilities" | "supplies" | "events" | "other";
export type TaskApprovalStatus = "pending" | "approved" | "rejected";

export interface OpsTask {
  id: string;
  title: string;
  description: string;
  staffInstructions: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  assigneeId: string | null;
  createdAt: string;
  dueDate: string;
  completedAt?: string;
  estimatedHours: number;
  approvalStatus?: TaskApprovalStatus;
  needsHelp: boolean;
  helpNeededReason?: string;
  cannotCompleteReason?: string;
  notes?: string;
  timeline: { time: string; action: string }[];
}

export interface OpsTeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  department: string;
  email: string;
  phone: string;
}

export interface OpsNotification {
  id: string;
  message: string;
  read: boolean;
  time: string;
  taskId: string | null;
}

export interface StaffProfile {
  name: string;
  email: string;
  department: string;
  phone: string;
}

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

export type StudentFeeStatus = "paid" | "pending" | "overdue";
export interface FeeSemesterRow {
  semester: number;
  year: string;
  totalFee: number;
  paid: number;
  dueDate: string;
  status: StudentFeeStatus;
}

export interface PaymentTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  mode: string;
  status: "success" | "pending" | "failed";
}

export interface StudentFeeLedgerEntry {
  date: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

// --- Student / Convocation, Fellowship, Placements, Hostel, Resources, Reports, Communication (Phase 4b) ---

export interface StudentScholarship {
  name: string;
  amount: number;
  eligibility: string;
  deadline: string;
  applied: boolean;
}

export type ScholarshipAppStatus = "pending" | "approved" | "rejected";
export interface ScholarshipApplication {
  name: string;
  appliedOn: string;
  status: ScholarshipAppStatus;
}

export interface PlacementDrive {
  company: string;
  role: string;
  ctc: string;
  date: string;
  eligibility: string;
}

export type PlacementAppStatus = "applied" | "shortlisted" | "rejected" | "selected";
export interface PlacementApplication {
  company: string;
  role: string;
  appliedOn: string;
  status: PlacementAppStatus;
}

export type HostelRequestType = "room_change" | "maintenance" | "leave" | "visitor_pass" | "lost_item";
export type HostelRequestStatus = "pending" | "in_progress" | "resolved";
export interface HostelRequest {
  id: string;
  type: HostelRequestType;
  details: string;
  submittedOn: string;
  status: HostelRequestStatus;
  timeline: { time: string; action: string }[];
}

export type ResourceBookingStatus = "confirmed" | "pending";
export interface ResourceBooking {
  id: string;
  resourceName: string;
  date: string;
  timeSlot: string;
  purpose: string;
  status: ResourceBookingStatus;
}

export type StudentNoticeCategory = "academic" | "hostel" | "placement" | "library" | "general";
export type StudentNoticeUrgency = "urgent" | "important" | "normal";
export interface StudentNotice {
  id: string;
  title: string;
  body: string;
  date: string;
  author: string;
  category: StudentNoticeCategory;
  urgency: StudentNoticeUrgency;
  read: boolean;
}

export interface StudentMessage {
  id: string;
  from: string;
  subject: string;
  category: string;
  timeAgo: string;
  body: string;
  read: boolean;
}
