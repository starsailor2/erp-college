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
import InventoryIcon from "@mui/icons-material/Inventory";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import HotelIcon from "@mui/icons-material/Hotel";
import EventIcon from "@mui/icons-material/Event";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptIcon from "@mui/icons-material/Receipt";
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
        { label: "Asset Master", path: "/admin/assets", icon: <InventoryIcon />, group: "Operations" },
        { label: "Maintenance Tickets", path: "/admin/tickets", icon: <ConfirmationNumberIcon />, group: "Operations" },
        { label: "Hostel Management", path: "/admin/hostel", icon: <HotelIcon />, group: "Operations" },
        { label: "Facility / Booking", path: "/admin/facility", icon: <EventIcon />, group: "Operations" },
        { label: "Library Management", path: "/admin/library", icon: <LocalLibraryIcon />, group: "Operations" },
        { label: "Fee Structure", path: "/admin/fees/structure", icon: <PaymentIcon />, group: "Finance" },
        { label: "Student Fee Ledger", path: "/admin/fees/ledger", icon: <AccountBalanceWalletIcon />, group: "Finance" },
        { label: "Payments & Waivers", path: "/admin/fees/payments", icon: <ReceiptIcon />, group: "Finance" },
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
