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
      { path: "teacher", element: <TeacherDashboard /> },
      { path: "staff", element: <StaffDashboard /> },
      { path: "student", element: <StudentDashboard /> },
    ],
  },
]);
