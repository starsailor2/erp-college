import type { Role } from "@/types";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import GroupsIcon from "@mui/icons-material/Groups";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ScheduleIcon from "@mui/icons-material/Schedule";
import GradingIcon from "@mui/icons-material/Grading";
import AssessmentIcon from "@mui/icons-material/Assessment";
import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  group?: string;
  children?: { label: string; path: string }[];
}

export function getNavItems(role: Role): NavItem[] {
  switch (role) {
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
    case "teacher":
      return [{ label: "Dashboard", path: "/teacher", icon: <DashboardIcon /> }];
    case "staff":
      return [{ label: "Dashboard", path: "/staff", icon: <DashboardIcon /> }];
    case "student":
      return [{ label: "Dashboard", path: "/student", icon: <DashboardIcon /> }];
  }
}
