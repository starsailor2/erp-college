import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

const Layout = lazy(() => import("@/components/Layout"));

const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
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
const AdminAttendance = lazy(() => import("@/pages/admin/Attendance"));
const AdminTimetable = lazy(() => import("@/pages/admin/Timetable"));
const AdminExams = lazy(() => import("@/pages/admin/Exams"));
const AdminResults = lazy(() => import("@/pages/admin/Results"));
const AdminAssets = lazy(() => import("@/pages/admin/Assets"));
const AdminAssetProfile = lazy(() => import("@/pages/admin/AssetProfile"));
const AdminTickets = lazy(() => import("@/pages/admin/Tickets"));
const AdminTicketProfile = lazy(() => import("@/pages/admin/TicketProfile"));
const AdminHostel = lazy(() => import("@/pages/admin/Hostel"));
const AdminFacility = lazy(() => import("@/pages/admin/Facility"));
const AdminLibrary = lazy(() => import("@/pages/admin/Library"));
const AdminFeeStructure = lazy(() => import("@/pages/admin/FeeStructure"));
const AdminFeeLedger = lazy(() => import("@/pages/admin/FeeLedger"));
const AdminPayments = lazy(() => import("@/pages/admin/Payments"));
const AdminNotices = lazy(() => import("@/pages/admin/Notices"));
const AdminDocumentSignatures = lazy(() => import("@/pages/admin/DocumentSignatures"));
const AdminAuditLogs = lazy(() => import("@/pages/admin/AuditLogs"));
const AdminSystemHealth = lazy(() => import("@/pages/admin/SystemHealth"));
const AdminConfigurations = lazy(() => import("@/pages/admin/Configurations"));
const AdminProfilePage = lazy(() => import("@/pages/admin/Profile"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const TeacherDashboard = lazy(() => import("@/pages/teacher/Dashboard"));
const StaffDashboard = lazy(() => import("@/pages/staff/Dashboard"));
const StudentDashboard = lazy(() => import("@/pages/student/Dashboard"));

const PortalSelection = lazy(() => import("@/pages/PortalSelection"));
const LoginPage = lazy(() => import("@/pages/Login"));

export const router = createBrowserRouter([
  { path: "/", element: <PortalSelection /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <Suspense fallback={null}>
        <Layout />
      </Suspense>
    ),
    children: [
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
      { path: "admin/attendance", element: <AdminAttendance /> },
      { path: "admin/timetable", element: <AdminTimetable /> },
      { path: "admin/exams", element: <AdminExams /> },
      { path: "admin/results", element: <AdminResults /> },
      { path: "admin/assets", element: <AdminAssets /> },
      { path: "admin/assets/:id", element: <AdminAssetProfile /> },
      { path: "admin/tickets", element: <AdminTickets /> },
      { path: "admin/tickets/:id", element: <AdminTicketProfile /> },
      { path: "admin/hostel", element: <AdminHostel /> },
      { path: "admin/facility", element: <AdminFacility /> },
      { path: "admin/library", element: <AdminLibrary /> },
      { path: "admin/fees/structure", element: <AdminFeeStructure /> },
      { path: "admin/fees/ledger", element: <AdminFeeLedger /> },
      { path: "admin/fees/payments", element: <AdminPayments /> },
      { path: "admin/notices", element: <AdminNotices /> },
      { path: "admin/documents", element: <AdminDocumentSignatures /> },
      { path: "admin/audit-logs", element: <AdminAuditLogs /> },
      { path: "admin/system-health", element: <AdminSystemHealth /> },
      { path: "admin/configurations", element: <AdminConfigurations /> },
      { path: "admin/profile", element: <AdminProfilePage /> },
      { path: "admin/settings", element: <AdminSettings /> },
      { path: "teacher", element: <TeacherDashboard /> },
      { path: "staff", element: <StaffDashboard /> },
      { path: "student", element: <StudentDashboard /> },
    ],
  },
]);
