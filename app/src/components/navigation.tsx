import type { Role } from "@/types";
import DashboardIcon from "@mui/icons-material/Dashboard";
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
      return [{ label: "Dashboard", path: "/admin", icon: <DashboardIcon /> }];
    case "teacher":
      return [{ label: "Dashboard", path: "/teacher", icon: <DashboardIcon /> }];
    case "staff":
      return [{ label: "Dashboard", path: "/staff", icon: <DashboardIcon /> }];
    case "student":
      return [{ label: "Dashboard", path: "/student", icon: <DashboardIcon /> }];
  }
}
