import type { Role } from "@/types";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import GroupsIcon from "@mui/icons-material/Groups";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AssignmentIcon from "@mui/icons-material/Assignment";
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
        { label: "Users", path: "/admin/users", icon: <PeopleIcon /> },
        { label: "Faculty", path: "/admin/faculty", icon: <SchoolIcon /> },
        { label: "Departments", path: "/admin/departments", icon: <AccountBalanceIcon /> },
        { label: "Students", path: "/admin/students", icon: <GroupsIcon /> },
        { label: "Courses", path: "/admin/courses", icon: <MenuBookIcon /> },
        { label: "Registration", path: "/admin/registration", icon: <AssignmentIcon /> },
      ];
    case "teacher":
      return [{ label: "Dashboard", path: "/teacher", icon: <DashboardIcon /> }];
    case "staff":
      return [{ label: "Dashboard", path: "/staff", icon: <DashboardIcon /> }];
    case "student":
      return [{ label: "Dashboard", path: "/student", icon: <DashboardIcon /> }];
  }
}
