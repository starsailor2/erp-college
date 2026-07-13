import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

const Layout = lazy(() => import("@/components/Layout"));

const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
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
      { path: "teacher", element: <TeacherDashboard /> },
      { path: "staff", element: <StaffDashboard /> },
      { path: "student", element: <StudentDashboard /> },
    ],
  },
]);
