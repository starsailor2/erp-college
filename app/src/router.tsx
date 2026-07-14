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
const AdminFeeStructure = lazy(() => import("@/pages/admin/FeeStructure"));
const AdminFeeLedger = lazy(() => import("@/pages/admin/FeeLedger"));
const AdminPayments = lazy(() => import("@/pages/admin/Payments"));
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
      { path: "admin/fees/structure", element: <AdminFeeStructure /> },
      { path: "admin/fees/ledger", element: <AdminFeeLedger /> },
      { path: "admin/fees/payments", element: <AdminPayments /> },
      { path: "teacher", element: <TeacherDashboard /> },
      { path: "staff", element: <StaffDashboard /> },
      { path: "student", element: <StudentDashboard /> },
    ],
  },
]);
